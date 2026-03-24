// src/services/sync.ts
import NetInfo from "@react-native-community/netinfo";
import { COLLECTIONS, DB_ID, Query, client, databases } from "./appwrite";
import db, { cleanupSyncQueue, getSyncQueue } from "./database";

const ALLOWED_PAYLOAD_FIELDS: Record<string, Set<string>> = {
  [COLLECTIONS.CUSTOMERS]: new Set([
    "businessId",
    "name",
    "phone",
    "email",
    "gstin",
    "address",
    "city",
    "state",
    "pincode",
    "balance",
    "totalPurchases",
    "totalInvoices",
    "tags",
    "notes",
    "isActive",
  ]),
  [COLLECTIONS.PRODUCTS]: new Set([
    "businessId",
    "name",
    "description",
    "sku",
    "barcode",
    "category",
    "unit",
    "price",
    "costPrice",
    "mrp",
    "taxRate",
    "hsnCode",
    "stock",
    "lowStockThreshold",
    "imageFileId",
    "isService",
    "isActive",
  ]),
  [COLLECTIONS.INVOICES]: new Set([
    "businessId",
    "customerId",
    "customerName",
    "customerPhone",
    "customerGstin",
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "items",
    "subTotal",
    "discountType",
    "discountValue",
    "discountAmount",
    "cgstAmount",
    "sgstAmount",
    "igstAmount",
    "totalTax",
    "totalAmount",
    "paidAmount",
    "balanceDue",
    "status",
    "paymentMethod",
    "paymentDate",
    "notes",
    "termsConditions",
    "pdfFileId",
    "isRecurring",
    "recurringInterval",
    "staffId",
  ]),
  [COLLECTIONS.INVOICE_ITEMS]: new Set([
    "invoiceId",
    "businessId",
    "productId",
    "productName",
    "hsnCode",
    "quantity",
    "unit",
    "price",
    "taxRate",
    "taxAmount",
    "totalPrice",
  ]),
};

const sanitizePayloadForCollection = (
  collection: string,
  operation: "create" | "update" | "delete",
  payload: any,
) => {
  const source = payload && typeof payload === "object" ? { ...payload } : {};

  // Appwrite system timestamps are read-only and must never be sent in write payloads.
  delete source.createdAt;
  delete source.updatedAt;
  delete source.$createdAt;
  delete source.$updatedAt;

  // Backward compatibility: map local invoice date field to schema field.
  if (
    collection === COLLECTIONS.INVOICES &&
    !source.invoiceDate &&
    source.date
  ) {
    source.invoiceDate = source.date;
  }
  delete source.date;

  const allowed = ALLOWED_PAYLOAD_FIELDS[collection];
  const filtered: Record<string, any> = {};

  if (allowed) {
    for (const key of Object.keys(source)) {
      if (allowed.has(key) && source[key] !== undefined) {
        filtered[key] = source[key];
      }
    }
  } else {
    Object.assign(filtered, source);
  }

  const ensureNumber = (key: string, fallback: number) => {
    if (filtered[key] !== undefined || operation === "create") {
      filtered[key] = Number(filtered[key] ?? fallback);
    }
  };

  if (collection === COLLECTIONS.CUSTOMERS) {
    ensureNumber("balance", 0);
    ensureNumber("totalPurchases", 0);
    ensureNumber("totalInvoices", 0);
    if (filtered.isActive !== undefined || operation === "create") {
      filtered.isActive =
        filtered.isActive !== undefined ? Boolean(filtered.isActive) : true;
    }
  }

  if (collection === COLLECTIONS.PRODUCTS) {
    ensureNumber("price", 0);
    ensureNumber("taxRate", 0);
    ensureNumber("stock", 0);
    ensureNumber("lowStockThreshold", 5);
    if (filtered.unit === undefined && operation === "create") {
      filtered.unit = "pcs";
    }
    if (filtered.isActive !== undefined || operation === "create") {
      filtered.isActive =
        filtered.isActive !== undefined ? Boolean(filtered.isActive) : true;
    }
    if (filtered.isService !== undefined || operation === "create") {
      filtered.isService =
        filtered.isService !== undefined ? Boolean(filtered.isService) : false;
    }
  }

  if (collection === COLLECTIONS.INVOICES) {
    ensureNumber("subTotal", 0);
    ensureNumber("discountValue", 0);
    ensureNumber("discountAmount", 0);
    ensureNumber("cgstAmount", 0);
    ensureNumber("sgstAmount", 0);
    ensureNumber("igstAmount", 0);
    ensureNumber("totalTax", 0);
    ensureNumber("totalAmount", 0);
    ensureNumber("paidAmount", 0);
    ensureNumber("balanceDue", filtered.totalAmount ?? 0);
    if (filtered.discountType === undefined && operation === "create") {
      filtered.discountType = "none";
    }
    if (filtered.status === undefined && operation === "create") {
      filtered.status = "unpaid";
    }
    if (filtered.isRecurring !== undefined || operation === "create") {
      filtered.isRecurring =
        filtered.isRecurring !== undefined
          ? Boolean(filtered.isRecurring)
          : false;
    }
  }

  if (collection === COLLECTIONS.INVOICE_ITEMS) {
    ensureNumber("quantity", 0);
    ensureNumber("price", 0);
    ensureNumber("taxRate", 0);
    ensureNumber("taxAmount", 0);
    ensureNumber("totalPrice", 0);
    if (filtered.unit === undefined && operation === "create") {
      filtered.unit = "pcs";
    }
  }

  return filtered;
};

export const syncService = {
  // 1. PUSH: Send local offline changes to Appwrite
  pushChanges: async () => {
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    const processedIds: number[] = [];

    for (const item of queue) {
      try {
        const rawPayload = JSON.parse(item.payload);
        const payload = sanitizePayloadForCollection(
          item.collection,
          item.operation,
          rawPayload,
        );

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

        // Also mark as synced in local DB based on collection type
        if (item.operation === "create") {
          try {
            if (item.collection === COLLECTIONS.INVOICES) {
              await db.runAsync(
                "UPDATE invoices SET isSynced = 1 WHERE $id = ?",
                [item.documentId],
              );
            } else if (item.collection === COLLECTIONS.INVOICE_ITEMS) {
              await db.runAsync(
                "UPDATE invoice_items SET isSynced = 1 WHERE $id = ?",
                [item.documentId],
              );
            } else if (item.collection === COLLECTIONS.CUSTOMERS) {
              await db.runAsync(
                "UPDATE customers SET isSynced = 1 WHERE $id = ?",
                [item.documentId],
              );
            } else if (item.collection === COLLECTIONS.PRODUCTS) {
              await db.runAsync(
                "UPDATE products SET isSynced = 1 WHERE $id = ?",
                [item.documentId],
              );
            }
          } catch (localDbError) {
            console.warn(
              "Failed to update sync status in local DB:",
              localDbError,
            );
          }
        }
      } catch (error: any) {
        console.error(`Sync failed for item ${item.id}`, error);
        // If error is "Document already exists" (409), mark as synced anyway
        if (error?.code === 409 || error?.message?.includes("already exists")) {
          processedIds.push(item.id);
        }
        // If error is about missing required fields, remove from queue to prevent infinite retries
        else if (
          error?.message?.includes("Missing required attribute") ||
          error?.message?.includes("Invalid document structure")
        ) {
          console.warn(
            `Removing problematic sync item ${item.id} from queue:`,
            error.message,
          );
          processedIds.push(item.id); // Remove the problematic item
        }
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
      // Sync Customers
      const customers = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CUSTOMERS,
        [Query.equal("businessId", businessId), Query.limit(100)],
      );

      for (const doc of customers.documents) {
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
                     ("$id", businessId, name, price, stock, lowStockThreshold, taxRate, unit, sku, "$createdAt", "$updatedAt", isSynced)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            doc.$id,
            doc.businessId,
            doc.name,
            doc.price,
            doc.stock,
            doc.lowStockThreshold ?? 5,
            doc.taxRate,
            doc.unit,
            doc.sku,
            doc.$createdAt,
            doc.$updatedAt,
          ],
        );
      }

      // Sync Invoices
      try {
        const invoices = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.INVOICES,
          [Query.equal("businessId", businessId), Query.limit(100)],
        );

        for (const doc of invoices.documents) {
          await db.runAsync(
            `INSERT OR REPLACE INTO invoices
                       ("$id", businessId, customerId, customerName, invoiceNumber, date, totalAmount, status, items, "$createdAt", "$updatedAt", isSynced)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              doc.$id,
              doc.businessId,
              doc.customerId,
              doc.customerName,
              doc.invoiceNumber,
              doc.invoiceDate || doc.$createdAt,
              doc.totalAmount,
              doc.status,
              doc.items ? JSON.stringify(doc.items) : "[]",
              doc.$createdAt,
              doc.$updatedAt,
            ],
          );
        }
      } catch (invoiceError) {
        console.warn("Failed to sync invoices:", invoiceError);
      }

      // Sync Invoice Items (if table exists)
      try {
        const invoiceItems = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.INVOICE_ITEMS,
          [Query.equal("businessId", businessId), Query.limit(500)],
        );

        for (const doc of invoiceItems.documents) {
          await db.runAsync(
            `INSERT OR REPLACE INTO invoice_items
                       ("$id", invoiceId, businessId, productId, productName, quantity, unit, price, taxRate, taxAmount, totalPrice, "$createdAt", isSynced)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              doc.$id,
              doc.invoiceId,
              doc.businessId,
              doc.productId,
              doc.productName,
              doc.quantity,
              doc.unit,
              doc.price,
              doc.taxRate,
              doc.taxAmount,
              doc.totalPrice,
              doc.$createdAt,
            ],
          );
        }
      } catch (itemError) {
        console.warn("Failed to sync invoice items:", itemError);
      }

      // Note: Subscriptions, Staff Roles, and Notifications typically don't need syncing
      // to local SQLite in the current implementation as they're primarily server-side
      // But we log if there are issues trying to sync them
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
