import type { Subscription } from "../types";
import { COLLECTIONS, DB_ID, Query, databases } from "./appwrite";
import { runSubscriptionValidator } from "./functionsService";

export const getSubscriptionByBusinessId = async (
  businessId: string,
): Promise<Subscription | null> => {
  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.SUBSCRIPTIONS,
    [Query.equal("businessId", businessId), Query.limit(1)],
  );

  return (response.documents[0] as Subscription) || null;
};

export const validateAndSyncSubscription = async (input: {
  userId: string;
  businessId: string;
  platform: "ios" | "android" | "web";
  productId: string;
  receipt: string;
}) => {
  const { data, execution } = await runSubscriptionValidator(input);
  return { data, execution };
};
