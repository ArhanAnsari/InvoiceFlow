import { Query } from "appwrite";
import { COLLECTIONS, DB_ID, databases } from "./appwrite";
import { runBackupCreator } from "./functionsService";

export const triggerBackup = async (businessId: string, userId: string) => {
  const { data, execution } = await runBackupCreator(businessId, userId);
  return { data, execution };
};

export const listBackups = (businessId: string) =>
  databases.listDocuments(DB_ID, COLLECTIONS.BACKUPS, [
    Query.equal("businessId", businessId),
    Query.orderDesc("createdAt"),
    Query.limit(50),
  ]);
