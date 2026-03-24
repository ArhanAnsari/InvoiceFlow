import { create } from "zustand";
import { COLLECTIONS, DB_ID, ID, Query, databases } from "../services/appwrite";
import db, { addToSyncQueue } from "../services/database";
import { syncEngine } from "../services/sync";

const DATABASE_ID = DB_ID;
const PRODUCTS_COLLECTION_ID = COLLECTIONS.PRODUCTS;

export interface Product {
  $id: string;
  name: string;
  description?: string;
  price: number;
  hsnCode?: string;
  taxRate: number;
  stock?: number;
  lowStockThreshold?: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: "synced" | "pending" | "error";
}

const normalizeProduct = (raw: any): Product => {
  const now = new Date().toISOString();
  return {
    $id: raw?.$id ?? raw?.id,
    name: raw?.name ?? "",
    description: raw?.description ?? undefined,
    price: Number(raw?.price ?? 0),
    hsnCode: raw?.hsnCode ?? undefined,
    taxRate: Number(raw?.taxRate ?? 0),
    stock: Number(raw?.stock ?? 0),
    lowStockThreshold: Number(raw?.lowStockThreshold ?? 5),
    businessId: raw?.businessId,
    createdAt: raw?.$createdAt ?? raw?.createdAt ?? now,
    updatedAt: raw?.$updatedAt ?? raw?.updatedAt ?? now,
    syncStatus:
      raw?.syncStatus ??
      (raw?.isSynced === 1 || raw?.isSynced === true ? "synced" : "pending"),
  };
};

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
        'SELECT * FROM products WHERE businessId = ? ORDER BY "$createdAt" DESC',
        [businessId],
      );
      const normalizedLocalProducts = localProducts.map(normalizeProduct);

      if (normalizedLocalProducts.length > 0) {
        set({ products: normalizedLocalProducts, isLoading: false });
      }

      // 2. Fetch from Appwrite in background to sync
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          [
            Query.equal("businessId", businessId),
            Query.orderDesc("$createdAt"),
          ],
        );

        const remoteProducts = response.documents.map(normalizeProduct);

        // Update local DB with remote data
        for (const product of remoteProducts) {
          await db.runAsync(
            'INSERT OR REPLACE INTO products ("$id", businessId, name, price, stock, lowStockThreshold, taxRate, unit, sku, "$createdAt", "$updatedAt", isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [
              product.$id,
              product.businessId,
              product.name,
              product.price,
              0,
              product.lowStockThreshold ?? 5,
              product.taxRate,
              "pcs",
              null,
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
        if (normalizedLocalProducts.length === 0) {
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
      if (!productData.businessId) {
        throw new Error("Business context is required to add a product.");
      }

      const tempId = ID.unique();
      const now = new Date().toISOString();

      const newProduct = normalizeProduct({
        ...productData,
        $id: tempId,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      });

      const stock = Number((productData as any).stock ?? 0);
      const unit = (productData as any).unit ?? "pcs";
      const sku = (productData as any).sku ?? null;
      const lowStockThreshold = Number(
        (productData as any).lowStockThreshold ?? 5,
      );

      // 1. Save locally
      await db.runAsync(
        'INSERT INTO products ("$id", businessId, name, price, stock, lowStockThreshold, taxRate, unit, sku, "$createdAt", "$updatedAt", isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
        [
          newProduct.$id,
          newProduct.businessId,
          newProduct.name,
          newProduct.price,
          stock,
          lowStockThreshold,
          newProduct.taxRate,
          unit,
          sku,
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
      const syncPayload = {
        businessId: newProduct.businessId,
        name: newProduct.name,
        description: (productData as any).description ?? undefined,
        price: newProduct.price,
        taxRate: newProduct.taxRate,
        stock,
        lowStockThreshold,
        unit,
        sku,
        hsnCode: (productData as any).hsnCode ?? undefined,
        isService: (productData as any).isService ?? false,
        isActive: (productData as any).isActive ?? true,
      };

      await addToSyncQueue(
        PRODUCTS_COLLECTION_ID,
        newProduct.$id,
        "create",
        syncPayload,
      );
      syncEngine.pushChanges(); // Trigger sync
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const existing = get().products.find((product) => product.$id === id);
      if (!existing) {
        throw new Error("Product not found.");
      }

      const updatedAt = new Date().toISOString();
      const updatedProduct = normalizeProduct({
        ...existing,
        ...updates,
        $id: id,
        updatedAt,
        syncStatus: "pending",
      });

      const nextStock = Number((updates as any).stock ?? existing.stock ?? 0);
      const nextUnit = String((updates as any).unit ?? "pcs");
      const nextSku = (updates as any).sku ?? null;
      const nextLowStockThreshold = Number(
        (updates as any).lowStockThreshold ?? existing.lowStockThreshold ?? 5,
      );

      await db.runAsync(
        'UPDATE products SET name = ?, price = ?, stock = ?, lowStockThreshold = ?, taxRate = ?, unit = ?, sku = ?, "$updatedAt" = ?, isSynced = 0 WHERE "$id" = ?',
        [
          updatedProduct.name,
          updatedProduct.price,
          nextStock,
          nextLowStockThreshold,
          updatedProduct.taxRate,
          nextUnit,
          nextSku,
          updatedAt,
          id,
        ],
      );

      set((state) => ({
        products: state.products.map((product) =>
          product.$id === id ? updatedProduct : product,
        ),
        isLoading: false,
      }));

      const syncPayload = {
        name: updatedProduct.name,
        description: updatedProduct.description ?? undefined,
        price: updatedProduct.price,
        taxRate: updatedProduct.taxRate,
        stock: nextStock,
        lowStockThreshold: nextLowStockThreshold,
        unit: nextUnit,
        sku: nextSku ?? undefined,
        hsnCode: updatedProduct.hsnCode ?? undefined,
      };

      await addToSyncQueue(PRODUCTS_COLLECTION_ID, id, "update", syncPayload);
      syncEngine.pushChanges();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.runAsync('DELETE FROM products WHERE "$id" = ?', [id]);

      set((state) => ({
        products: state.products.filter((product) => product.$id !== id),
        isLoading: false,
      }));

      await addToSyncQueue(PRODUCTS_COLLECTION_ID, id, "delete", {});
      syncEngine.pushChanges();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
