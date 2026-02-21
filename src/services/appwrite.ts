// src/services/appwrite.ts
import { Account, Client, Databases, ID, Query, Storage } from "appwrite";

// Config
export const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || "invoiceflow";
export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID || "invoiceflow_db";

export const COLLECTIONS = {
  BUSINESSES: "businesses",
  CUSTOMERS: "customers",
  PRODUCTS: "products",
  INVOICES: "invoices",
};

const client = new Client();

client.setEndpoint(APPWRITE_ENDPOINT)
.setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, Query };
export default client;
