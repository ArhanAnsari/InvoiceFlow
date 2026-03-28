import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  businessesCollection: process.env.COLLECTION_BUSINESSES || "businesses",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  notificationsCollection:
    process.env.COLLECTION_NOTIFICATIONS || "notifications",
};

const parseBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
};

const getDb = () => {
  const client = new Client()
    .setEndpoint(ENV.endpoint)
    .setProject(ENV.projectId)
    .setKey(ENV.apiKey);

  return new Databases(client);
};

const dayDiff = (isoDate) => {
  const today = new Date();
  const due = new Date(isoDate);
  const t0 = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const d0 = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  return Math.round((d0 - t0) / (24 * 60 * 60 * 1000));
};

const getTemplate = (daysToDue, invoiceNumber, amount, currency) => {
  const value = `${currency}${Number(amount || 0).toFixed(2)}`;

  if (daysToDue === 7) {
    return {
      key: "due_d7",
      title: `Invoice ${invoiceNumber} due in 7 days`,
      body: `Friendly reminder: ${invoiceNumber} is due in 7 days for ${value}.`,
    };
  }

  if (daysToDue === 3) {
    return {
      key: "due_d3",
      title: `Invoice ${invoiceNumber} due in 3 days`,
      body: `Reminder: ${invoiceNumber} payment of ${value} is due in 3 days.`,
    };
  }

  if (daysToDue === 1) {
    return {
      key: "due_d1",
      title: `Invoice ${invoiceNumber} due tomorrow`,
      body: `Action needed: ${invoiceNumber} is due tomorrow for ${value}.`,
    };
  }

  if (daysToDue === 0) {
    return {
      key: "due_today",
      title: `Invoice ${invoiceNumber} due today`,
      body: `Today is the due date for ${invoiceNumber}. Pending amount: ${value}.`,
    };
  }

  if (daysToDue === -1) {
    return {
      key: "overdue_d1",
      title: `Invoice ${invoiceNumber} is overdue by 1 day`,
      body: `${invoiceNumber} is now overdue. Outstanding amount: ${value}.`,
    };
  }

  if (daysToDue <= -3) {
    return {
      key: "overdue_d3",
      title: `Invoice ${invoiceNumber} needs follow-up`,
      body: `${invoiceNumber} has been overdue for multiple days. Outstanding: ${value}.`,
    };
  }

  return null;
};

const reminderAlreadyExists = async (db, ownerId, title) => {
  const existing = await db.listDocuments(
    ENV.dbId,
    ENV.notificationsCollection,
    [
      Query.equal("userId", String(ownerId)),
      Query.equal("title", title),
      Query.limit(1),
    ],
  );
  return existing.total > 0;
};

const createReminderNotification = async (
  db,
  ownerId,
  businessId,
  template,
  invoice,
  channels,
) => {
  await db.createDocument(
    ENV.dbId,
    ENV.notificationsCollection,
    ID.unique(),
    {
      userId: String(ownerId),
      businessId,
      type: "reminder",
      title: template.title,
      body: template.body,
      data: JSON.stringify({
        invoiceId: invoice.$id,
        invoiceNumber: invoice.invoiceNumber,
        channels,
        templateKey: template.key,
      }),
      isRead: false,
    },
    [
      Permission.read(Role.user(String(ownerId))),
      Permission.update(Role.user(String(ownerId))),
      Permission.delete(Role.user(String(ownerId))),
    ],
  );
};

export default async ({ req, res, log, error }) => {
  try {
    const db = getDb();
    const body = parseBody(req);
    const businessIdFilter = String(body.businessId || "");
    const channels =
      Array.isArray(body.channels) && body.channels.length > 0
        ? body.channels
        : ["in_app", "email", "sms"];

    const businessQueries = [Query.equal("isActive", true), Query.limit(200)];
    if (businessIdFilter) {
      businessQueries.push(Query.equal("$id", businessIdFilter));
    }

    const businesses = await db.listDocuments(
      ENV.dbId,
      ENV.businessesCollection,
      businessQueries,
    );

    let remindersCreated = 0;

    for (const business of businesses.documents) {
      const invoices = await db.listDocuments(
        ENV.dbId,
        ENV.invoicesCollection,
        [Query.equal("businessId", String(business.$id)), Query.limit(1000)],
      );

      for (const invoice of invoices.documents) {
        if (!invoice.dueDate) continue;
        if (invoice.status === "paid" || invoice.status === "cancelled")
          continue;

        const diff = dayDiff(invoice.dueDate);
        const template = getTemplate(
          diff,
          String(invoice.invoiceNumber || invoice.$id),
          Number(invoice.balanceDue || invoice.totalAmount || 0),
          String(business.currencySymbol || "₹"),
        );

        if (!template) continue;

        const exists = await reminderAlreadyExists(
          db,
          business.ownerId,
          template.title,
        );
        if (exists) continue;

        if (channels.includes("in_app")) {
          await createReminderNotification(
            db,
            business.ownerId,
            business.$id,
            template,
            invoice,
            channels,
          );
          remindersCreated += 1;
        }

        if (channels.includes("email")) {
          log(`Email reminder queued (implement provider): ${template.title}`);
        }

        if (channels.includes("sms")) {
          log(`SMS reminder queued (implement provider): ${template.title}`);
        }
      }
    }

    return res.json(
      {
        ok: true,
        remindersCreated,
        channels,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
