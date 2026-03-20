import { Models } from "appwrite";
import { COLLECTIONS, DB_ID, client } from "./appwrite";

type RealtimePayload = Models.Document & {
  businessId?: string;
  userId?: string;
};

const hasWriteEvent = (events: string[]) =>
  events.some(
    (event) => event.endsWith(".create") || event.endsWith(".update"),
  );

export const subscribeToInvoices = (
  businessId: string,
  onUpdate: (invoice: RealtimePayload) => void,
) => {
  const channel = `databases.${DB_ID}.collections.${COLLECTIONS.INVOICES}.documents`;

  return client.subscribe(channel, (response: any) => {
    const payload = response.payload as RealtimePayload;

    if (payload.businessId !== businessId) return;
    if (!hasWriteEvent(response.events || [])) return;

    onUpdate(payload);
  });
};

export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notification: RealtimePayload) => void,
) => {
  const channel = `databases.${DB_ID}.collections.${COLLECTIONS.NOTIFICATIONS}.documents`;

  return client.subscribe(channel, (response: any) => {
    const payload = response.payload as RealtimePayload;

    if (payload.userId !== userId) return;
    if (!hasWriteEvent(response.events || [])) return;

    onUpdate(payload);
  });
};
