import { ID, Query } from "react-native-appwrite";
import { create } from "zustand";
import { databases } from "../services/appwrite";
import db, { addToSyncQueue } from "../services/database";
import { syncEngine } from "../services/sync";

const DATABASE_ID = "invoiceflow_db";
const INVOICES_COLLECTION_ID = "invoices";

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  $id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  items: InvoiceItem[];
  status: "paid" | "unpaid" | "overdue";
  createdAt: string;
  updatedAt: string;
  syncStatus: "synced" | "pending" | "error";
}

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: (businessId: string) => Promise<void>;
  createInvoice: (
    invoice: Omit<Invoice, "$id" | "createdAt" | "updatedAt" | "syncStatus">,
  ) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice["status"]) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  fetchInvoices: async (businessId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Try fetching from local SQLite first
      const localInvoices = await db.getAllAsync<any>(
        "SELECT * FROM invoices WHERE businessId = ? ORDER BY date DESC",
        [businessId],
      );

      const parsedLocalInvoices = localInvoices.map((inv) => ({
        ...inv,
        items: JSON.parse(inv.detailsJson || "[]"),
      }));

      if (parsedLocalInvoices.length > 0) {
        set({ invoices: parsedLocalInvoices, isLoading: false });
      }

      // 2. Fetch from Appwrite in background to sync
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          INVOICES_COLLECTION_ID,
          [Query.equal("businessId", businessId), Query.orderDesc("date")],
        );

        const remoteInvoices = response.documents.map((doc) => ({
          ...doc,
          items: JSON.parse(doc.detailsJson || "[]"),
        })) as unknown as Invoice[];

        // Update local DB with remote data
        for (const invoice of remoteInvoices) {
          await db.runAsync(
            `INSERT OR REPLACE INTO invoices ($id, businessId, customerId, customerName, invoiceNumber, date, totalAmount, detailsJson, status, $createdAt, $updatedAt, isSynced)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              invoice.$id,
              invoice.businessId,
              invoice.customerId,
              invoice.customerName,
              invoice.invoiceNumber,
              invoice.date,
              invoice.totalAmount,
              JSON.stringify(invoice.items),
              invoice.status,
              invoice.createdAt,
              invoice.updatedAt,
            ],
          );
        }

        // Update state with fresh data
        set({ invoices: remoteInvoices, isLoading: false });
      } catch (remoteError) {
        console.log(
          "Could not fetch remote invoices, using local data",
          remoteError,
        );
        if (parsedLocalInvoices.length === 0) {
          set({ isLoading: false });
        }
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null });
    try {
      const tempId = ID.unique();
      const now = new Date().toISOString();

      const newInvoice: Invoice = {
        ...invoiceData,
        $id: tempId,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      };

      // Prepare for storage (stringify items)
      const detailsJson = JSON.stringify(newInvoice.items);

      // 1. Save locally
      await db.runAsync(
        `INSERT INTO invoices ($id, businessId, customerId, customerName, invoiceNumber, date, totalAmount, detailsJson, status, $createdAt, $updatedAt, isSynced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          newInvoice.$id,
          newInvoice.businessId,
          newInvoice.customerId,
          newInvoice.customerName,
          newInvoice.invoiceNumber,
          newInvoice.date,
          newInvoice.totalAmount,
          detailsJson,
          newInvoice.status,
          newInvoice.createdAt,
          newInvoice.updatedAt,
        ],
      );

      // Update UI immediately
      set((state) => ({
        invoices: [newInvoice, ...state.invoices],
        isLoading: false,
      }));

      // 2. Queue for sync
      // We need to flatten the object for Appwrite optimization if needed,
      // but for now we sync the whole object knowing the backend expects detailsJson
      const syncPayload = {
        ...newInvoice,
        detailsJson, // Override the array with string string for backend
      };

      await addToSyncQueue("invoices", newInvoice.$id, "create", syncPayload);
      syncEngine.pushChanges(); // Trigger sync
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateInvoiceStatus: async (id, status) => {
    // Implementation pending
  },
}));
