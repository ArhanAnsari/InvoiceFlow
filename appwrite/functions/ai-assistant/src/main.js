import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Client, Databases, Query } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY,
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  customersCollection: process.env.COLLECTION_CUSTOMERS || "customers",
  productsCollection: process.env.COLLECTION_PRODUCTS || "products",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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

const getDb = () => {
  const client = new Client()
    .setEndpoint(ENV.endpoint)
    .setProject(ENV.projectId)
    .setKey(ENV.apiKey);

  return new Databases(client);
};

const listData = async (db, businessId) => {
  const [customers, products, invoices] = await Promise.all([
    db.listDocuments(ENV.dbId, ENV.customersCollection, [
      Query.equal("businessId", businessId),
      Query.limit(50),
      Query.orderDesc("$createdAt"),
    ]),
    db.listDocuments(ENV.dbId, ENV.productsCollection, [
      Query.equal("businessId", businessId),
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ]),
    db.listDocuments(ENV.dbId, ENV.invoicesCollection, [
      Query.equal("businessId", businessId),
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ]),
  ]);

  return { customers, products, invoices };
};

const buildCompactContext = ({ customers, products, invoices }) => {
  const unpaid = invoices.documents.filter((i) => i.status === "unpaid");
  const paid = invoices.documents.filter((i) => i.status === "paid");

  const totalRevenue = invoices.documents.reduce(
    (sum, i) => sum + Number(i.totalAmount || 0),
    0,
  );

  const lowStockProducts = products.documents
    .filter((p) => Number(p.stock || 0) <= Number(p.lowStockThreshold || 5))
    .slice(0, 20)
    .map((p) => ({
      name: p.name,
      stock: Number(p.stock || 0),
      lowStockThreshold: Number(p.lowStockThreshold || 5),
    }));

  return {
    customerCount: customers.total,
    productCount: products.total,
    invoiceCount: invoices.total,
    unpaidCount: unpaid.length,
    paidCount: paid.length,
    totalRevenue,
    unpaidInvoices: unpaid.slice(0, 20).map((i) => ({
      invoiceNumber: i.invoiceNumber,
      customerName: i.customerName,
      dueDate: i.dueDate,
      balanceDue: Number(i.balanceDue || i.totalAmount || 0),
    })),
    lowStockProducts,
  };
};

export default async ({ req, res, log, error }) => {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return res.json(
        {
          ok: false,
          error: "Missing GOOGLE_GENERATIVE_AI_API_KEY in function env.",
        },
        500,
      );
    }

    const body = parseJsonBody(req);
    const businessId = String(body.businessId || "");
    const prompt = String(body.prompt || "").trim();
    const mode = String(body.mode || "insights");

    if (!businessId || !prompt) {
      return res.json(
        {
          ok: false,
          error: "businessId and prompt are required.",
        },
        400,
      );
    }

    const db = getDb();
    const rawData = await listData(db, businessId);
    const context = buildCompactContext(rawData);

    const system =
      "You are InvoiceFlow AI copilot for small businesses. Give practical, concise advice. Prefer bullet points. Never fabricate missing records. If data is limited, state assumptions.";

    const { text } = await generateText({
      model: google(ENV.geminiModel),
      system,
      prompt: `Mode: ${mode}\nBusiness context: ${JSON.stringify(context)}\n\nUser request: ${prompt}`,
      maxTokens: 800,
    });

    return res.json(
      {
        ok: true,
        answer: text,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    log(err.stack || "no-stack");
    return res.json({ ok: false, error: err.message }, 500);
  }
};
