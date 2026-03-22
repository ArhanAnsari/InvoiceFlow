import { COLLECTIONS, DB_ID, Query, databases } from "./appwrite";
import { runMonthlyReportGenerator } from "./functionsService";

export const triggerMonthlyReportGeneration = () => runMonthlyReportGenerator();

export const listMonthlyReports = (businessId: string, limit = 24) =>
  databases.listDocuments(DB_ID, COLLECTIONS.MONTHLY_REPORTS, [
    Query.equal("businessId", businessId),
    Query.orderDesc("month"),
    Query.limit(limit),
  ]);
