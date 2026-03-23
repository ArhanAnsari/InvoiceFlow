import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  businessesCollection: process.env.COLLECTION_BUSINESSES || "businesses",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  reportsCollection:
    process.env.COLLECTION_MONTHLY_REPORTS || "monthly_reports",
};

const getDb = () => {
  const client = new Client()
    .setEndpoint(ENV.endpoint)
    .setProject(ENV.projectId)
    .setKey(ENV.apiKey);

  return new Databases(client);
};

const getPreviousMonthWindow = () => {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999),
  );

  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const listInvoices = async (db, businessId, startIso, endIso, log) => {
  const baseQueries = [
    Query.equal("businessId", businessId),
    Query.greaterThanEqual("date", startIso),
    Query.lessThanEqual("date", endIso),
    Query.limit(1000),
  ];

  try {
    return await db.listDocuments(
      ENV.dbId,
      ENV.invoicesCollection,
      baseQueries,
    );
  } catch (error) {
    log(`Fallback to invoiceDate for business ${businessId}: ${error.message}`);
    return await db.listDocuments(ENV.dbId, ENV.invoicesCollection, [
      Query.equal("businessId", businessId),
      Query.greaterThanEqual("invoiceDate", startIso),
      Query.lessThanEqual("invoiceDate", endIso),
      Query.limit(1000),
    ]);
  }
};

export default async ({ res, log, error }) => {
  try {
    const db = getDb();
    const { startIso, endIso } = getPreviousMonthWindow();

    const businesses = await db.listDocuments(
      ENV.dbId,
      ENV.businessesCollection,
      [Query.equal("isActive", true), Query.limit(500)],
    );

    let reportsCreated = 0;

    for (const business of businesses.documents) {
      try {
        const invoices = await listInvoices(
          db,
          business.$id,
          startIso,
          endIso,
          log,
        );

        const totals = invoices.documents.reduce(
          (acc, invoice) => {
            const totalAmount = Number(invoice.totalAmount || 0);
            const totalTax = Number(invoice.totalTax || 0);
            acc.totalRevenue += totalAmount;
            acc.totalTax += totalTax;
            if (invoice.status === "paid") acc.paidCount += 1;
            if (invoice.status === "unpaid") acc.unpaidCount += 1;
            return acc;
          },
          {
            totalRevenue: 0,
            totalTax: 0,
            paidCount: 0,
            unpaidCount: 0,
          },
        );

        await db.createDocument(
          ENV.dbId,
          ENV.reportsCollection,
          ID.unique(),
          {
            businessId: business.$id,
            month: startIso.slice(0, 7),
            totalInvoices: invoices.total,
            totalRevenue: totals.totalRevenue,
            totalTax: totals.totalTax,
            paidCount: totals.paidCount,
            unpaidCount: totals.unpaidCount,
            createdAt: new Date().toISOString(),
          },
          [
            Permission.read(Role.user(String(business.ownerId || ""))),
            Permission.write(Role.user(String(business.ownerId || ""))),
          ],
        );

        reportsCreated += 1;
      } catch (innerError) {
        log(`Skipping business ${business.$id}: ${innerError.message}`);
      }
    }

    return res.json(
      {
        ok: true,
        timeWindow: { from: startIso, to: endIso },
        businessesProcessed: businesses.total,
        reportsCreated,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
