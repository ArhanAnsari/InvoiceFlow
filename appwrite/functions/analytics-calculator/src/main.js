import { Client, Databases, Query } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY,
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  businessesCollection: process.env.COLLECTION_BUSINESSES || "businesses",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  invoiceItemsCollection:
    process.env.COLLECTION_INVOICE_ITEMS || "invoice_items",
};

const getDb = () => {
  const client = new Client()
    .setEndpoint(ENV.endpoint)
    .setProject(ENV.projectId)
    .setKey(ENV.apiKey);

  return new Databases(client);
};

const parseJsonBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
};

const getThirtyDaysAgo = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const listInvoices = async (db, businessId, fromIso) => {
  try {
    return await db.listDocuments(ENV.dbId, ENV.invoicesCollection, [
      Query.equal("businessId", businessId),
      Query.greaterThanEqual("date", fromIso),
      Query.limit(5000),
    ]);
  } catch {
    return await db.listDocuments(ENV.dbId, ENV.invoicesCollection, [
      Query.equal("businessId", businessId),
      Query.greaterThanEqual("invoiceDate", fromIso),
      Query.limit(5000),
    ]);
  }
};

const computeAnalyticsForBusiness = async (db, businessId, fromIso) => {
  const invoicesResp = await listInvoices(db, businessId, fromIso);
  const itemsResp = await db.listDocuments(
    ENV.dbId,
    ENV.invoiceItemsCollection,
    [Query.equal("businessId", businessId), Query.limit(5000)],
  );

  const revenueByDay = {};
  const customerRevenue = {};

  for (const invoice of invoicesResp.documents) {
    const rawDate = invoice.date || invoice.invoiceDate || invoice.$createdAt;
    const day = String(rawDate).slice(0, 10);
    const total = Number(invoice.totalAmount || 0);
    revenueByDay[day] = (revenueByDay[day] || 0) + total;

    const customerId = String(invoice.customerId || "unknown");
    const customerName = String(invoice.customerName || "Unknown");
    const existing = customerRevenue[customerId] || {
      customerId,
      customerName,
      amount: 0,
    };
    existing.amount += total;
    customerRevenue[customerId] = existing;
  }

  const productMap = {};
  for (const item of itemsResp.documents) {
    const productId = String(item.productId || "unknown");
    const productName = String(item.productName || "Unknown");
    const quantity = Number(item.quantity || 0);
    const existing = productMap[productId] || {
      productId,
      productName,
      quantity: 0,
    };
    existing.quantity += quantity;
    productMap[productId] = existing;
  }

  const topCustomers = Object.values(customerRevenue)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const revenueTrend = Object.entries(revenueByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, revenue]) => ({ date, revenue }));

  const totalRevenue = invoicesResp.documents.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    windowStart: fromIso,
    invoiceCount: invoicesResp.total,
    totalRevenue,
    topCustomers,
    topProducts,
    revenueTrend,
  };
};

export default async ({ req, res, log, error }) => {
  try {
    const db = getDb();
    const body = parseJsonBody(req);
    const businessId = body.businessId || req?.query?.businessId;
    const fromIso = getThirtyDaysAgo();

    if (businessId) {
      const analytics = await computeAnalyticsForBusiness(
        db,
        businessId,
        fromIso,
      );
      return res.json({ ok: true, analytics }, 200);
    }

    const businesses = await db.listDocuments(
      ENV.dbId,
      ENV.businessesCollection,
      [Query.equal("isActive", true), Query.limit(500)],
    );

    const results = [];
    for (const business of businesses.documents) {
      try {
        const analytics = await computeAnalyticsForBusiness(
          db,
          business.$id,
          fromIso,
        );
        results.push(analytics);
      } catch (innerError) {
        log(
          `Analytics failed for business ${business.$id}: ${innerError.message}`,
        );
      }
    }

    return res.json(
      {
        ok: true,
        processedBusinesses: results.length,
        analytics: results,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
