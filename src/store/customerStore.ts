import { ID, Query } from "react-native-appwrite";
import { create } from "zustand";
import { databases } from "../services/appwrite";
import db, { addToSyncQueue } from "../services/database";
import { syncEngine } from "../services/sync";

const DATABASE_ID = "invoiceflow_db";
const CUSTOMERS_COLLECTION_ID = "customers";

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
        "SELECT * FROM customers WHERE businessId = ? ORDER BY createdAt DESC",
        [businessId],
      );

      if (localCustomers.length > 0) {
        set({ customers: localCustomers, isLoading: false });
      }

      // 2. Fetch from Appwrite in background to sync
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMERS_COLLECTION_ID,
          [Query.equal("businessId", businessId), Query.orderDesc("createdAt")],
        );

        const remoteCustomers = response.documents as unknown as Customer[];

        // Update local DB with remote data
        for (const customer of remoteCustomers) {
          await db.runAsync(
            `INSERT OR REPLACE INTO customers (id, name, email, phone, address, gstin, businessId, createdAt, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              customer.$id,
              customer.name,
              customer.email || null,
              customer.phone || null,
              customer.address || null,
              customer.gstin || null,
              customer.businessId,
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
        if (localCustomers.length === 0) {
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
      const tempId = ID.unique();
      const now = new Date().toISOString();

      const newCustomer: Customer = {
        ...customerData,
        $id: tempId,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      };

      // 1. Save locally
      await db.runAsync(
        `INSERT INTO customers (id, name, email, phone, address, gstin, businessId, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          newCustomer.$id,
          newCustomer.name,
          newCustomer.email || null,
          newCustomer.phone || null,
          newCustomer.address || null,
          newCustomer.gstin || null,
          newCustomer.businessId,
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
      await addToSyncQueue("customers", newCustomer.$id, "create", newCustomer);
      syncEngine.pushChanges(); // Trigger sync
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateCustomer: async (id, updates) => {
    // Implementation for update
  },

  deleteCustomer: async (id) => {
    // Implementation for delete
  },
}));
