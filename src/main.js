import { Client, Databases, Query, Storage } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  notificationsCollection:
    process.env.COLLECTION_NOTIFICATIONS || "notifications",
  backupsCollection: process.env.COLLECTION_BACKUPS || "backups",
  backupsBucket: process.env.BUCKET_BACKUPS || "backups",
  backupsRetentionDays: Number(process.env.BACKUPS_RETENTION_DAYS || 90),
  readNotificationsRetentionDays: Number(
    process.env.NOTIFICATIONS_RETENTION_DAYS || 30,
  ),
};

const getClients = () => {
  const client = new Client()
    .setEndpoint(ENV.endpoint)
    .setProject(ENV.projectId)
    .setKey(ENV.apiKey);

  return {
    db: new Databases(client),
    storage: new Storage(client),
  };
};

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
};

export default async ({ res, log, error }) => {
  try {
    const { db, storage } = getClients();

    const backupsCutoff = isoDaysAgo(ENV.backupsRetentionDays);
    const notificationsCutoff = isoDaysAgo(ENV.readNotificationsRetentionDays);

    const backupsResp = await db.listDocuments(
      ENV.dbId,
      ENV.backupsCollection,
      [Query.lessThan("createdAt", backupsCutoff), Query.limit(500)],
    );

    let backupsDeleted = 0;
    let backupFilesDeleted = 0;

    for (const backup of backupsResp.documents) {
      try {
        if (backup.fileId) {
          try {
            await storage.deleteFile(ENV.backupsBucket, String(backup.fileId));
            backupFilesDeleted += 1;
          } catch (fileError) {
            log(
              `Failed to delete backup file ${backup.fileId}: ${fileError.message}`,
            );
          }
        }

        await db.deleteDocument(ENV.dbId, ENV.backupsCollection, backup.$id);
        backupsDeleted += 1;
      } catch (backupError) {
        log(
          `Failed to delete backup doc ${backup.$id}: ${backupError.message}`,
        );
      }
    }

    const notificationsResp = await db.listDocuments(
      ENV.dbId,
      ENV.notificationsCollection,
      [
        Query.equal("isRead", true),
        Query.lessThan("createdAt", notificationsCutoff),
        Query.limit(1000),
      ],
    );

    let notificationsDeleted = 0;

    for (const notification of notificationsResp.documents) {
      try {
        await db.deleteDocument(
          ENV.dbId,
          ENV.notificationsCollection,
          notification.$id,
        );
        notificationsDeleted += 1;
      } catch (notificationError) {
        log(
          `Failed to delete notification ${notification.$id}: ${notificationError.message}`,
        );
      }
    }

    return res.json(
      {
        ok: true,
        retention: {
          backupsDays: ENV.backupsRetentionDays,
          notificationsDays: ENV.readNotificationsRetentionDays,
        },
        deleted: {
          backups: backupsDeleted,
          backupFiles: backupFilesDeleted,
          notifications: notificationsDeleted,
        },
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
