import { Query } from "appwrite";
import { COLLECTIONS, DB_ID, databases } from "./appwrite";

export const listInvoiceItemsByInvoice = (invoiceId: string) =>
  databases.listDocuments(DB_ID, COLLECTIONS.INVOICE_ITEMS, [
    Query.equal("invoiceId", invoiceId),
    Query.limit(1000),
  ]);

export const listInvoiceItemsByBusiness = (businessId: string) =>
  databases.listDocuments(DB_ID, COLLECTIONS.INVOICE_ITEMS, [
    Query.equal("businessId", businessId),
    Query.limit(5000),
  ]);
