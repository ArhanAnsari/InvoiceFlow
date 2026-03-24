import { create } from "zustand";
import { COLLECTIONS, DB_ID, ID, Query, databases } from "../services/appwrite";
import db, { addToSyncQueue } from "../services/database";
import { syncEngine } from "../services/sync";

const DATABASE_ID = DB_ID;
const CUSTOMERS_COLLECTION_ID = COLLECTIONS.CUSTOMERS;

export interface Customer {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: "synced" | "pending" | "error";
}

const normalizeCustomer = (raw: any): Customer => {
  const now = new Date().toISOString();
  return {
    $id: raw?.$id ?? raw?.id,
    name: raw?.name ?? "",
    email: raw?.email ?? undefined,
    phone: raw?.phone ?? undefined,
    address: raw?.address ?? undefined,
    gstin: raw?.gstin ?? undefined,
    businessId: raw?.businessId,
    createdAt: raw?.$createdAt ?? raw?.createdAt ?? now,
    updatedAt: raw?.$updatedAt ?? raw?.updatedAt ?? now,
    syncStatus:
      raw?.syncStatus ??
      (raw?.isSynced === 1 || raw?.isSynced === true ? "synced" : "pending"),
  };
};

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  fetchCustomers: (businessId: string) => Promise<void>;
  addCustomer: (
    customer: Omit<Customer, "$id" | "createdAt" | "updatedAt" | "syncStatus">,
  ) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  fetchCustomers: async (businessId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Try fetching from local SQLite first
      const localCustomers = await db.getAllAsync<Customer>(
        'SELECT * FROM customers WHERE businessId = ? ORDER BY "$createdAt" DESC',
        [businessId],
      );
      const normalizedLocalCustomers = localCustomers.map(normalizeCustomer);

      if (normalizedLocalCustomers.length > 0) {
        set({ customers: normalizedLocalCustomers, isLoading: false });
      }

      // 2. Fetch from Appwrite in background to sync
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMERS_COLLECTION_ID,
          [
            Query.equal("businessId", businessId),
            Query.orderDesc("$createdAt"),
          ],
        );

        const remoteCustomers = response.documents.map(normalizeCustomer);

        // Update local DB with remote data
        for (const customer of remoteCustomers) {
          await db.runAsync(
            'INSERT OR REPLACE INTO customers ("$id", businessId, name, phone, email, address, balance, "$createdAt", "$updatedAt", isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [
              customer.$id,
              customer.businessId,
              customer.name,
              customer.phone || null,
              customer.email || null,
              customer.address || null,
              0,
              customer.createdAt,
              customer.updatedAt,
            ],
          );
        }

        // Update state with fresh data
        set({ customers: remoteCustomers, isLoading: false });
      } catch (remoteError) {
        console.log(
          "Could not fetch remote customers, using local data",
          remoteError,
        );
        if (normalizedLocalCustomers.length === 0) {
          set({ isLoading: false }); // No local and no remote
        }
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    set({ isLoading: true, error: null });
    try {
      if (!customerData.businessId) {
        throw new Error("Business context is required to add a customer.");
      }

      const tempId = ID.unique();
      const now = new Date().toISOString();

      const newCustomer = normalizeCustomer({
        ...customerData,
        $id: tempId,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      });

      // 1. Save locally
      await db.runAsync(
        'INSERT INTO customers ("$id", businessId, name, phone, email, address, balance, "$createdAt", "$updatedAt", isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
        [
          newCustomer.$id,
          newCustomer.businessId,
          newCustomer.name,
          newCustomer.phone || null,
          newCustomer.email || null,
          newCustomer.address || null,
          0,
          newCustomer.createdAt,
          newCustomer.updatedAt,
        ],
      );

      // Update UI immediately
      set((state) => ({
        customers: [newCustomer, ...state.customers],
        isLoading: false,
      }));

      // 2. Queue for sync
      const syncPayload = {
        businessId: newCustomer.businessId,
        name: newCustomer.name,
        email: newCustomer.email ?? undefined,
        phone: newCustomer.phone ?? undefined,
        address: newCustomer.address ?? undefined,
        gstin: newCustomer.gstin ?? undefined,
        balance: 0,
        totalPurchases: 0,
        totalInvoices: 0,
        isActive: true,
      };

      await addToSyncQueue(
        CUSTOMERS_COLLECTION_ID,
        newCustomer.$id,
        "create",
        syncPayload,
      );
      syncEngine.pushChanges(); // Trigger sync
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateCustomer: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const existing = get().customers.find((customer) => customer.$id === id);
      if (!existing) {
        throw new Error("Customer not found.");
      }

      const updatedAt = new Date().toISOString();
      const updatedCustomer = normalizeCustomer({
        ...existing,
        ...updates,
        $id: id,
        updatedAt,
        syncStatus: "pending",
      });

      await db.runAsync(
        'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, "$updatedAt" = ?, isSynced = 0 WHERE "$id" = ?',
        [
          updatedCustomer.name,
          updatedCustomer.phone ?? null,
          updatedCustomer.email ?? null,
          updatedCustomer.address ?? null,
          updatedAt,
          id,
        ],
      );

      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.$id === id ? updatedCustomer : customer,
        ),
        isLoading: false,
      }));

      const syncPayload = {
        name: updatedCustomer.name,
        phone: updatedCustomer.phone ?? undefined,
        email: updatedCustomer.email ?? undefined,
        address: updatedCustomer.address ?? undefined,
        gstin: updatedCustomer.gstin ?? undefined,
      };

      await addToSyncQueue(CUSTOMERS_COLLECTION_ID, id, "update", syncPayload);
      syncEngine.pushChanges();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.runAsync('DELETE FROM customers WHERE "$id" = ?', [id]);

      set((state) => ({
        customers: state.customers.filter((customer) => customer.$id !== id),
        isLoading: false,
      }));

      await addToSyncQueue(CUSTOMERS_COLLECTION_ID, id, "delete", {});
      syncEngine.pushChanges();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
