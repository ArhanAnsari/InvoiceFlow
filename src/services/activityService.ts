import { COLLECTIONS, DB_ID, Query, databases } from "./appwrite";

export type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "invoice" | "staff" | "backup" | "notification";
  timestamp: string;
};

export const listBusinessActivity = async (businessId: string) => {
  const [invoices, staff, backups, notifications] = await Promise.allSettled([
    databases.listDocuments(DB_ID, COLLECTIONS.INVOICES, [
      Query.equal("businessId", businessId),
      Query.orderDesc("$createdAt"),
      Query.limit(25),
    ]),
    databases.listDocuments(DB_ID, COLLECTIONS.STAFF_ROLES, [
      Query.equal("businessId", businessId),
      Query.orderDesc("$createdAt"),
      Query.limit(25),
    ]),
    databases.listDocuments(DB_ID, COLLECTIONS.BACKUPS, [
      Query.equal("businessId", businessId),
      Query.orderDesc("$createdAt"),
      Query.limit(25),
    ]),
    databases.listDocuments(DB_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal("businessId", businessId),
      Query.orderDesc("$createdAt"),
      Query.limit(25),
    ]),
  ]);

  const items: ActivityItem[] = [];

  if (invoices.status === "fulfilled") {
    for (const inv of invoices.value.documents) {
      items.push({
        id: `inv_${inv.$id}`,
        title: `Invoice ${inv.invoiceNumber}`,
        subtitle: `${inv.customerName} • ${String(inv.status).toUpperCase()}`,
        type: "invoice",
        timestamp: inv.$updatedAt || inv.$createdAt,
      });
    }
  }

  if (staff.status === "fulfilled") {
    for (const role of staff.value.documents) {
      items.push({
        id: `staff_${role.$id}`,
        title: `Staff ${role.role}`,
        subtitle: `${role.inviteEmail || role.userId} • ${role.inviteStatus}`,
        type: "staff",
        timestamp: role.$updatedAt || role.$createdAt,
      });
    }
  }

  if (backups.status === "fulfilled") {
    for (const backup of backups.value.documents) {
      items.push({
        id: `backup_${backup.$id}`,
        title: `Backup ${backup.status}`,
        subtitle: `${backup.fileName || "backup"} • ${backup.type || "manual"}`,
        type: "backup",
        timestamp: backup.$updatedAt || backup.$createdAt,
      });
    }
  }

  if (notifications.status === "fulfilled") {
    for (const note of notifications.value.documents) {
      items.push({
        id: `note_${note.$id}`,
        title: note.title,
        subtitle: note.body,
        type: "notification",
        timestamp: note.$updatedAt || note.$createdAt,
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
};
