// src/services/database.ts
import * as SQLite from "expo-sqlite";
import { SyncQueueItem } from "../types";

const db = SQLite.openDatabaseSync("invoiceflow.db");

export const initDatabase = () => {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      
      -- Businesses Table
      CREATE TABLE IF NOT EXISTS businesses (
        "$id" TEXT PRIMARY KEY,
        ownerId TEXT NOT NULL,
        name TEXT NOT NULL,
        gstin TEXT,
        address TEXT,
        logoFileId TEXT,
        planType TEXT DEFAULT 'free',
        "$createdAt" TEXT,
        "$updatedAt" TEXT
      );

      -- Customers Table
      CREATE TABLE IF NOT EXISTS customers (
        "$id" TEXT PRIMARY KEY,
        businessId TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        balance REAL DEFAULT 0,
        "$createdAt" TEXT,
        "$updatedAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Products Table
      CREATE TABLE IF NOT EXISTS products (
        "$id" TEXT PRIMARY KEY,
        businessId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        taxRate REAL DEFAULT 0,
        unit TEXT,
        sku TEXT,
        "$createdAt" TEXT,
        "$updatedAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Invoices Table
      CREATE TABLE IF NOT EXISTS invoices (
        "$id" TEXT PRIMARY KEY,
        businessId TEXT NOT NULL,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        invoiceNumber TEXT NOT NULL,
        date TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT DEFAULT 'unpaid',
        items TEXT, -- JSON String
        pdfUrl TEXT,
        "$createdAt" TEXT,
        "$updatedAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Sync Queue Table
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection TEXT NOT NULL,
        documentId TEXT NOT NULL,
        operation TEXT NOT NULL, -- 'create', 'update', 'delete'
        payload TEXT, -- JSON content
        createdAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    console.log("Local Database Initialized");
  } catch (error) {
    console.error("Failed to init local database", error);
  }
};

// Generic Helpers
export const runQuery = async <T>(
  query: string,
  params: any[] = [],
): Promise<T[]> => {
  // Expo SQLite Sync API is preferred for simpler logic, calling execSync or runSync
  // But for async operations, we can use runAsync / getAllAsync
  try {
    const result = await db.getAllAsync(query, params);
    return result as T[];
  } catch (e) {
    console.error("DB Error", e);
    return [];
  }
};

export const addToSyncQueue = async (
  collection: string,
  documentId: string,
  operation: "create" | "update" | "delete",
  payload: any,
) => {
  await db.runAsync(
    "INSERT INTO sync_queue (collection, documentId, operation, payload) VALUES (?, ?, ?, ?)",
    [collection, documentId, operation, JSON.stringify(payload)],
  );
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const result = await db.getAllAsync(
    "SELECT * FROM sync_queue ORDER BY createdAt ASC",
  );
  return result as SyncQueueItem[];
};

export const cleanupSyncQueue = async (ids: number[]) => {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(
    `DELETE FROM sync_queue WHERE id IN (${placeholders})`,
    ids,
  );
};

export default db;
