import { Query } from "appwrite";
import { COLLECTIONS, DB_ID, databases } from "./appwrite";

export const listNotificationsForUser = async (
  userId: string,
  businessId?: string,
) => {
  const queries = [
    Query.equal("userId", userId),
    Query.orderDesc("createdAt"),
    Query.limit(100),
  ];

  if (businessId) {
    queries.push(Query.equal("businessId", businessId));
  }

  return databases.listDocuments(DB_ID, COLLECTIONS.NOTIFICATIONS, queries);
};

export const markNotificationRead = (notificationId: string) =>
  databases.updateDocument(DB_ID, COLLECTIONS.NOTIFICATIONS, notificationId, {
    isRead: true,
    readAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
