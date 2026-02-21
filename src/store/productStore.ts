import { ID, Query } from "react-native-appwrite";
import { create } from "zustand";
import { databases } from "../services/appwrite";
import db, { addToSyncQueue } from "../services/database";
import { syncEngine } from "../services/sync";

const DATABASE_ID = "invoiceflow_db";
const PRODUCTS_COLLECTION_ID = "products";

export interface Product {
  $id: string;
  name: string;
  description?: string;
  price: number;
  hsnCode?: string;
  taxRate: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: "synced" | "pending" | "error";
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: (businessId: string) => Promise<void>;
  addProduct: (
    product: Omit<Product, "$id" | "createdAt" | "updatedAt" | "syncStatus">,
  ) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async (businessId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Try fetching from local SQLite first
      const localProducts = await db.getAllAsync<Product>(
        "SELECT * FROM products WHERE businessId = ? ORDER BY createdAt DESC",
        [businessId],
      );

      if (localProducts.length > 0) {
        set({ products: localProducts, isLoading: false });
      }

      // 2. Fetch from Appwrite in background to sync
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          [Query.equal("businessId", businessId), Query.orderDesc("createdAt")],
        );

        const remoteProducts = response.documents as unknown as Product[];

        // Update local DB with remote data
        for (const product of remoteProducts) {
          await db.runAsync(
            `INSERT OR REPLACE INTO products (id, name, description, price, hsnCode, taxRate, businessId, createdAt, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              product.$id,
              product.name,
              product.description || null,
              product.price,
              product.hsnCode || null,
              product.taxRate,
              product.businessId,
              product.createdAt,
              product.updatedAt,
            ],
          );
        }

        // Update state with fresh data
        set({ products: remoteProducts, isLoading: false });
      } catch (remoteError) {
        console.log(
          "Could not fetch remote products, using local data",
          remoteError,
        );
        if (localProducts.length === 0) {
          set({ isLoading: false }); // No local and no remote
        }
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const tempId = ID.unique();
      const now = new Date().toISOString();

      const newProduct: Product = {
        ...productData,
        $id: tempId,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      };

      // 1. Save locally
      await db.runAsync(
        `INSERT INTO products (id, name, description, price, hsnCode, taxRate, businessId, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          newProduct.$id,
          newProduct.name,
          newProduct.description || null,
          newProduct.price,
          newProduct.hsnCode || null,
          newProduct.taxRate,
          newProduct.businessId,
          newProduct.createdAt,
          newProduct.updatedAt,
        ],
      );

      // Update UI immediately
      set((state) => ({
        products: [newProduct, ...state.products],
        isLoading: false,
      }));

      // 2. Queue for sync
      await addToSyncQueue("products", newProduct.$id, "create", newProduct);
      syncEngine.pushChanges(); // Trigger sync
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateProduct: async (id, updates) => {
    // Implementation for update
  },

  deleteProduct: async (id) => {
    // Implementation for delete
  },
}));
