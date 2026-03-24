import {
  COLLECTIONS,
  DB_ID,
  ID,
  Permission,
  Query,
  Role,
  client,
  databases,
} from "./appwrite";

export interface Notification {
  $id: string;
  userId: string;
  businessId: string;
  type:
    | "payment_received"
    | "low_stock"
    | "invoice_due"
    | "invoice_paid"
    | "reminder"
    | "system";
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  readAt?: string;
  $createdAt: string;
  $updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 📬 LIST & FETCH
// ─────────────────────────────────────────────────────────────────────

export const listNotificationsForUser = async (
  userId: string,
  businessId?: string,
) => {
  const queries = [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ];

  if (businessId) {
    queries.push(Query.equal("businessId", businessId));
  }

  return databases.listDocuments(DB_ID, COLLECTIONS.NOTIFICATIONS, queries);
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const result = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.NOTIFICATIONS,
      [Query.equal("userId", userId), Query.equal("isRead", false)],
    );
    return result.total;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
};

// ─────────────────────────────────────────────────────────────────────
// ✅ MARK AS READ
// ─────────────────────────────────────────────────────────────────────

export const markNotificationRead = async (notificationId: string) => {
  try {
    const result = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.NOTIFICATIONS,
      notificationId,
      {
        isRead: true,
        readAt: new Date().toISOString(),
      },
    );
    return result;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  try {
    const notifications = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.NOTIFICATIONS,
      [Query.equal("userId", userId), Query.equal("isRead", false)],
    );

    const updatePromises = notifications.documents.map((notif: any) =>
      markNotificationRead(notif.$id),
    );

    await Promise.all(updatePromises);
    console.log(`✅ Marked ${updatePromises.length} notifications as read`);
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 🔔 CREATE NOTIFICATION (Admin/Function)
// ─────────────────────────────────────────────────────────────────────

export const createNotification = async (
  userId: string,
  businessId: string,
  type: Notification["type"],
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
  try {
    const notificationData = {
      userId,
      businessId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : undefined,
      isRead: false,
    };

    const result = await databases.createDocument(
      DB_ID,
      COLLECTIONS.NOTIFICATIONS,
      ID.unique(),
      notificationData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    );

    console.log("✅ Notification created:", result.$id);
    return result;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────
// 📡 REALTIME LISTENER
// ─────────────────────────────────────────────────────────────────────

let realtimeUnsubscribe: (() => void) | null = null;

export const subscribeToNotifications = (
  userId: string,
  callback: (notification: Notification) => void,
) => {
  if (realtimeUnsubscribe) {
    console.warn("Already subscribed to notifications, unsubscribing first");
    realtimeUnsubscribe();
  }

  const channel = `databases.${DB_ID}.collections.${COLLECTIONS.NOTIFICATIONS}.documents`;

  console.log("📡 Subscribing to notification channel:", channel);

  try {
    realtimeUnsubscribe = client.subscribe(channel, (response: any) => {
      try {
        const event = response.events[0];

        // Only process events for this user
        if (response.payload?.userId === userId) {
          if (
            event.includes("databases.documents.create") ||
            event.includes("databases.documents.update")
          ) {
            const notification = response.payload as Notification;
            console.log("🔔 New notification:", notification.title);
            callback(notification);
          }
        }
      } catch (err) {
        console.error("Error processing notification event:", err);
      }
    });

    console.log("✅ Realtime subscription established");
    return realtimeUnsubscribe;
  } catch (error) {
    console.error("Failed to subscribe to notifications:", error);
    return () => {};
  }
};

export const unsubscribeFromNotifications = () => {
  if (realtimeUnsubscribe) {
    realtimeUnsubscribe();
    realtimeUnsubscribe = null;
    console.log("Unsubscribed from notifications");
  }
};

// ─────────────────────────────────────────────────────────────────────
// 🗑️ DELETE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────

export const deleteNotification = async (notificationId: string) => {
  try {
    await databases.deleteDocument(
      DB_ID,
      COLLECTIONS.NOTIFICATIONS,
      notificationId,
    );
    console.log("✅ Notification deleted");
  } catch (error) {
    console.error("Failed to delete notification:", error);
    throw error;
  }
};

export const deleteAllReadNotifications = async (userId: string) => {
  try {
    const notifications = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.NOTIFICATIONS,
      [Query.equal("userId", userId), Query.equal("isRead", true)],
    );

    const deletePromises = notifications.documents.map((notif: any) =>
      deleteNotification(notif.$id),
    );

    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${deletePromises.length} read notifications`);
  } catch (error) {
    console.error("Failed to delete read notifications:", error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 🎯 TRIGGER NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * Trigger a low stock notification
 */
export const notifyLowStock = async (
  userId: string,
  businessId: string,
  productName: string,
  currentStock: number,
  threshold: number,
) => {
  await createNotification(
    userId,
    businessId,
    "low_stock",
    "⚠️ Low Stock Alert",
    `${productName} has only ${currentStock} units (threshold: ${threshold})`,
    {
      type: "low_stock",
      productName,
    },
  );
};

/**
 * Trigger an invoice due notification
 */
export const notifyInvoiceDue = async (
  userId: string,
  businessId: string,
  invoiceNumber: string,
  customerName: string,
) => {
  await createNotification(
    userId,
    businessId,
    "invoice_due",
    "📋 Invoice Due",
    `Invoice ${invoiceNumber} from ${customerName} is due`,
    {
      type: "invoice_due",
      invoiceNumber,
    },
  );
};

/**
 * Trigger a payment received notification
 */
export const notifyPaymentReceived = async (
  userId: string,
  businessId: string,
  invoiceNumber: string,
  amount: number,
) => {
  await createNotification(
    userId,
    businessId,
    "payment_received",
    "💰 Payment Received",
    `Payment of ₹${amount.toFixed(2)} received for invoice ${invoiceNumber}`,
    {
      type: "payment_received",
      invoiceNumber,
      amount: amount.toString(),
    },
  );
};

/**
 * Trigger a general reminder notification
 */
export const notifyReminder = async (
  userId: string,
  businessId: string,
  message: string,
  data?: Record<string, string>,
) => {
  await createNotification(
    userId,
    businessId,
    "reminder",
    "🔔 Reminder",
    message,
    data,
  );
};
