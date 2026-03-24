import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  subscriptionsCollection:
    process.env.COLLECTION_SUBSCRIPTIONS || "subscriptions",
  strictReceiptValidation: process.env.STRICT_RECEIPT_VALIDATION === "true",
  appleSharedSecret: process.env.APPLE_SHARED_SECRET || "",
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

const inferPlanType = (productId) => {
  const value = String(productId || "").toLowerCase();
  if (value.includes("enterprise")) return "enterprise";
  if (value.includes("pro")) return "pro";
  return "free";
};

const verifyReceipt = async ({ platform, receipt }) => {
  if (!ENV.strictReceiptValidation) {
    return { validated: Boolean(receipt), provider: "bypass" };
  }

  if (platform === "ios") {
    if (!ENV.appleSharedSecret) {
      return {
        validated: false,
        provider: "apple",
        reason: "missing_shared_secret",
      };
    }

    const response = await fetch("https://buy.itunes.apple.com/verifyReceipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receipt,
        password: ENV.appleSharedSecret,
        "exclude-old-transactions": true,
      }),
    });

    const payload = await response.json();
    return {
      validated: payload?.status === 0,
      provider: "apple",
      statusCode: payload?.status,
    };
  }

  if (platform === "android") {
    // Google Play validation requires service account + Android Publisher API.
    // This function keeps strict mode deterministic until credentials are wired.
    return {
      validated: false,
      provider: "google_play",
      reason: "not_implemented",
    };
  }

  return { validated: false, provider: "unknown_platform" };
};

export default async ({ req, res, error }) => {
  try {
    const db = getDb();
    const body = parseJsonBody(req);

    const userId = String(body.userId || "");
    const businessId = String(body.businessId || "");
    const platform = String(body.platform || "").toLowerCase();
    const productId = String(body.productId || "");
    const receipt = String(body.receipt || "");

    if (!userId || !businessId || !platform || !productId || !receipt) {
      return res.json(
        {
          ok: false,
          error:
            "Missing required fields: userId, businessId, platform, productId, receipt",
        },
        400,
      );
    }

    const verification = await verifyReceipt({ platform, receipt });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setUTCDate(endDate.getUTCDate() + 30);

    const payload = {
      userId,
      businessId,
      planType: inferPlanType(productId),
      status: verification.validated ? "active" : "trial",
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      platform,
      storeProductId: productId,
      storeTransactionId: verification.validated ? receipt.slice(0, 255) : null,
      autoRenew: true,
    };

    const existing = await db.listDocuments(
      ENV.dbId,
      ENV.subscriptionsCollection,
      [Query.equal("businessId", businessId), Query.limit(1)],
    );

    let document;
    if (existing.documents.length > 0) {
      document = await db.updateDocument(
        ENV.dbId,
        ENV.subscriptionsCollection,
        existing.documents[0].$id,
        payload,
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
        ],
      );
    } else {
      document = await db.createDocument(
        ENV.dbId,
        ENV.subscriptionsCollection,
        ID.unique(),
        payload,
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
        ],
      );
    }

    return res.json(
      {
        ok: true,
        subscriptionId: document.$id,
        verification,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
