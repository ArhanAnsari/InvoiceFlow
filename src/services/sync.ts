// src/services/sync.ts
import NetInfo from "@react-native-community/netinfo";
import { COLLECTIONS, DB_ID, Query, client, databases } from "./appwrite";
import db, { cleanupSyncQueue, getSyncQueue } from "./database";

export const syncService = {
  // 1. PUSH: Send local offline changes to Appwrite
  pushChanges: async () => {
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    const processedIds: number[] = [];

    for (const item of queue) {
      try {
        const payload = JSON.parse(item.payload);

        if (item.operation === "create") {
          // Create in Appwrite
          await databases.createDocument(
            DB_ID,
            item.collection,
            item.documentId, // Use the same ID generated locally
            payload,
          );
        } else if (item.operation === "update") {
          await databases.updateDocument(
            DB_ID,
            item.collection,
            item.documentId,
            payload,
          );
        } else if (item.operation === "delete") {
          await databases.deleteDocument(
            DB_ID,
            item.collection,
            item.documentId,
          );
        }

        processedIds.push(item.id);
      } catch (error) {
        console.error(`Sync failed for item ${item.id}`, error);
        // If error is "Document already exists" or 409, we might want to mark as synced or ignore
        // For now, allow retry or specific error handling
      }
    }

    // Cleanup processed items
    if (processedIds.length > 0) {
      await cleanupSyncQueue(processedIds);
    }
  },

  // 2. PULL: Fetch remote changes
  pullChanges: async (businessId: string) => {
    // In a real app, store 'lastSyncTimestamp' in AsyncStorage/MMKV
    // For MVP, we just fetch recent items or all items

    try {
      // Example: Sync Customers
      const customers = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CUSTOMERS,
        [Query.equal("businessId", businessId), Query.limit(100)],
      );

      for (const doc of customers.documents) {
        // Upsert into local SQLite
        await db.runAsync(
          `INSERT OR REPLACE INTO customers 
                    ("$id", businessId, name, phone, email, address, balance, "$createdAt", "$updatedAt", isSynced) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,

          [
            doc.$id,
            doc.businessId,
            doc.name,
            doc.phone,
            doc.email,
            doc.address,
            doc.balance,
            doc.$createdAt,
            doc.$updatedAt,
          ],
        );
      }

      // Sync Products
      const products = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PRODUCTS,
        [Query.equal("businessId", businessId), Query.limit(100)],
      );

      for (const doc of products.documents) {
        await db.runAsync(
          `INSERT OR REPLACE INTO products
                     ("$id", businessId, name, price, stock, taxRate, unit, sku, "$createdAt", "$updatedAt", isSynced)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            doc.$id,
            doc.businessId,
            doc.name,
            doc.price,
            doc.stock,
            doc.taxRate,
            doc.unit,
            doc.sku,
            doc.$createdAt,
            doc.$updatedAt,
          ],
        );
      }
    } catch (error) {
      console.error("Pull Sync failed", error);
    }
  },

  // 3. LISTEN: Appwrite Realtime (Optional for MVP, good for multi-device)
  subscribe: (businessId: string) => {
    const channels = [
      `databases.${DB_ID}.collections.${COLLECTIONS.CUSTOMERS}.documents`,
      `databases.${DB_ID}.collections.${COLLECTIONS.PRODUCTS}.documents`,
      `databases.${DB_ID}.collections.${COLLECTIONS.INVOICES}.documents`,
    ];

    try {
      return client.subscribe(channels, async (response: any) => {
        const payload = response?.payload;
        if (!payload?.businessId) return;
        if (payload.businessId !== businessId) return;

        try {
          await syncService.pullChanges(businessId);
        } catch (syncError) {
          console.error("Realtime sync pull failed", syncError);
        }
      });
    } catch (err) {
      console.warn("Realtime sync subscription failed:", err);
      // Return a no-op so callers can always safely call `unsubscribe()`.
      return () => {};
    }
  },
};

export const syncEngine = syncService;

// Auto-trigger sync when online
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    syncService.pushChanges();
  }
});
