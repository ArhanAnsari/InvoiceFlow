import { create } from "zustand";
import { COLLECTIONS, DB_ID, ID, Query, databases } from "../services/appwrite";
import db, { addToSyncQueue } from "../services/database";
import { syncEngine } from "../services/sync";

const DATABASE_ID = DB_ID;
const INVOICES_COLLECTION_ID = COLLECTIONS.INVOICES;

export interface InvoiceItem {
  productId: string;
  name?: string;
  productName?: string;
  hsnCode?: string;
  quantity: number;
  price: number;
  taxRate: number;
  taxAmount?: number;
  total?: number;
  totalPrice?: number;
  unit?: string;
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
  status: "paid" | "unpaid" | "partial" | "overdue" | "cancelled";
  createdAt: string;
  updatedAt: string;
  syncStatus: "synced" | "pending" | "error";
}

const parseInvoiceItems = (items: unknown): InvoiceItem[] => {
  if (Array.isArray(items)) return items as InvoiceItem[];
  if (typeof items !== "string") return [];

  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? (parsed as InvoiceItem[]) : [];
  } catch {
    return [];
  }
};

const normalizeInvoiceItemForCollection = (item: InvoiceItem) => {
  const quantity = Number(item.quantity ?? 0);
  const price = Number(item.price ?? 0);
  const taxRate = Number(item.taxRate ?? 0);
  const taxAmount = Number(
    item.taxAmount ?? (quantity * price * taxRate) / 100,
  );
  const totalPrice = Number(
    item.totalPrice ?? item.total ?? quantity * price + taxAmount,
  );

  return {
    productId: item.productId,
    productName: item.productName ?? item.name ?? "",
    hsnCode: item.hsnCode ?? undefined,
    quantity,
    unit: item.unit ?? "pcs",
    price,
    taxRate,
    taxAmount,
    totalPrice,
  };
};

const normalizeInvoice = (raw: any): Invoice => {
  const now = new Date().toISOString();
  return {
    $id: raw?.$id ?? raw?.id,
    businessId: raw?.businessId,
    customerId: raw?.customerId,
    customerName: raw?.customerName ?? "",
    invoiceNumber: raw?.invoiceNumber ?? "",
    date: raw?.date ?? raw?.invoiceDate ?? raw?.$createdAt ?? now,
    totalAmount: Number(raw?.totalAmount ?? 0),
    items: parseInvoiceItems(raw?.items),
    status: (raw?.status ?? "unpaid") as Invoice["status"],
    createdAt: raw?.createdAt ?? raw?.$createdAt ?? now,
    updatedAt: raw?.updatedAt ?? raw?.$updatedAt ?? now,
    syncStatus:
      raw?.syncStatus ??
      (raw?.isSynced === 1 || raw?.isSynced === true ? "synced" : "pending"),
  };
};

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

      const parsedLocalInvoices = localInvoices.map(normalizeInvoice);

      if (parsedLocalInvoices.length > 0) {
        set({ invoices: parsedLocalInvoices, isLoading: false });
      }

      // 2. Fetch from Appwrite in background to sync
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          INVOICES_COLLECTION_ID,
          [
            Query.equal("businessId", businessId),
            Query.orderDesc("$createdAt"),
          ],
        );

        const remoteInvoices = response.documents.map(normalizeInvoice);

        // Update local DB with remote data
        for (const invoice of remoteInvoices) {
          await db.runAsync(
            'INSERT OR REPLACE INTO invoices ("$id", businessId, customerId, customerName, invoiceNumber, date, totalAmount, status, items, "$createdAt", "$updatedAt", isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [
              invoice.$id,
              invoice.businessId,
              invoice.customerId,
              invoice.customerName,
              invoice.invoiceNumber,
              invoice.date,
              invoice.totalAmount,
              invoice.status,
              JSON.stringify(invoice.items),
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
      if (!invoiceData.businessId) {
        throw new Error("Business context is required to create an invoice.");
      }

      const tempId = ID.unique();
      const now = new Date().toISOString();
      const items = parseInvoiceItems((invoiceData as any).items);
      const invoiceDate =
        (invoiceData as any).date ?? (invoiceData as any).invoiceDate ?? now;
      const invoiceNumber =
        (invoiceData as any).invoiceNumber ??
        `INV-${Date.now().toString().slice(-6)}`;
      const totalAmount = Number((invoiceData as any).totalAmount ?? 0);
      const status = ((invoiceData as any).status ??
        "unpaid") as Invoice["status"];

      const newInvoice = normalizeInvoice({
        ...invoiceData,
        $id: tempId,
        date: invoiceDate,
        invoiceNumber,
        totalAmount,
        status,
        items,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      });

      // 1. Save locally
      await db.runAsync(
        'INSERT INTO invoices ("$id", businessId, customerId, customerName, invoiceNumber, date, totalAmount, status, items, "$createdAt", "$updatedAt", isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
        [
          newInvoice.$id,
          newInvoice.businessId,
          newInvoice.customerId,
          newInvoice.customerName,
          newInvoice.invoiceNumber,
          newInvoice.date,
          newInvoice.totalAmount,
          newInvoice.status,
          JSON.stringify(newInvoice.items),
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
      const syncPayload = {
        businessId: newInvoice.businessId,
        customerId: newInvoice.customerId,
        customerName: newInvoice.customerName,
        invoiceNumber: newInvoice.invoiceNumber,
        invoiceDate,
        dueDate: (invoiceData as any).dueDate ?? undefined,
        items: JSON.stringify(newInvoice.items),
        subTotal: Number((invoiceData as any).subTotal ?? 0),
        discountType: (invoiceData as any).discountType ?? "none",
        discountValue: Number((invoiceData as any).discountValue ?? 0),
        discountAmount: Number((invoiceData as any).discountAmount ?? 0),
        totalTax: Number((invoiceData as any).totalTax ?? 0),
        totalAmount: newInvoice.totalAmount,
        paidAmount: Number((invoiceData as any).paidAmount ?? 0),
        balanceDue: Number(
          (invoiceData as any).balanceDue ?? newInvoice.totalAmount,
        ),
        status: newInvoice.status,
        notes: (invoiceData as any).notes ?? undefined,
      };

      await addToSyncQueue(
        INVOICES_COLLECTION_ID,
        newInvoice.$id,
        "create",
        syncPayload,
      );

      for (const item of newInvoice.items) {
        const normalizedItem = normalizeInvoiceItemForCollection(item);

        await addToSyncQueue(COLLECTIONS.INVOICE_ITEMS, ID.unique(), "create", {
          invoiceId: newInvoice.$id,
          businessId: newInvoice.businessId,
          productId: normalizedItem.productId,
          productName: normalizedItem.productName,
          hsnCode: normalizedItem.hsnCode,
          quantity: normalizedItem.quantity,
          unit: normalizedItem.unit,
          price: normalizedItem.price,
          taxRate: normalizedItem.taxRate,
          taxAmount: normalizedItem.taxAmount,
          totalPrice: normalizedItem.totalPrice,
          createdAt: now,
        });
      }

      syncEngine.pushChanges(); // Trigger sync
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const existing = get().invoices.find((invoice) => invoice.$id === id);
      if (!existing) {
        throw new Error("Invoice not found.");
      }

      const updatedAt = new Date().toISOString();
      const updatedInvoice: Invoice = {
        ...existing,
        status,
        updatedAt,
        syncStatus: "pending",
      };

      await db.runAsync(
        'UPDATE invoices SET status = ?, "$updatedAt" = ?, isSynced = 0 WHERE "$id" = ?',
        [status, updatedAt, id],
      );

      set((state) => ({
        invoices: state.invoices.map((invoice) =>
          invoice.$id === id ? updatedInvoice : invoice,
        ),
        isLoading: false,
      }));

      await addToSyncQueue(INVOICES_COLLECTION_ID, id, "update", {
        status,
        updatedAt,
      });

      syncEngine.pushChanges();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
