import { Client, Databases, ID, Permission, Role } from "node-appwrite";
import crypto from "node:crypto";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  businessesCollection: process.env.COLLECTION_BUSINESSES || "businesses",
  notificationsCollection:
    process.env.COLLECTION_NOTIFICATIONS || "notifications",
  paymentTokenSecret:
    process.env.PUBLIC_PAYMENT_TOKEN_SECRET || "invoiceflow-dev-secret",
  paymentLinkBase:
    process.env.PUBLIC_PAYMENT_PAGE_BASE || "https://invoiceflow.app/pay",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  phonepeSaltKey: process.env.PHONEPE_SALT_KEY || "",
  paytmMerchantKey: process.env.PAYTM_MERCHANT_KEY || "",
};

const getDb = () => {
  const client = new Client()
    .setEndpoint(ENV.endpoint)
    .setProject(ENV.projectId)
    .setKey(ENV.apiKey);

  return new Databases(client);
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

const parseQuery = (req) => {
  if (req?.query && typeof req.query === "object") return req.query;
  const queryString = String(req?.queryString || "");
  const params = new URLSearchParams(queryString);
  return Object.fromEntries(params.entries());
};

const base64Url = (obj) =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");

const signToken = (payload) => {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(header);
  const encodedPayload = base64Url(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", ENV.paymentTokenSecret)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
};

const verifyToken = (token) => {
  try {
    const [encodedHeader, encodedPayload, signature] = String(
      token || "",
    ).split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
      return { ok: false, error: "Invalid token format" };
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expected = crypto
      .createHmac("sha256", ENV.paymentTokenSecret)
      .update(signingInput)
      .digest("base64url");

    if (expected !== signature) {
      return { ok: false, error: "Signature mismatch" };
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (!payload?.exp || Date.now() > payload.exp) {
      return { ok: false, error: "Token expired" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, error: "Token parse failed" };
  }
};

const verifyProviderSignature = ({ provider, payload, signature, rawBody }) => {
  if (provider === "razorpay") {
    if (!ENV.razorpayWebhookSecret) return true;
    const digest = crypto
      .createHmac("sha256", ENV.razorpayWebhookSecret)
      .update(rawBody || JSON.stringify(payload || {}))
      .digest("hex");
    return digest === signature;
  }

  if (provider === "phonepe") {
    if (!ENV.phonepeSaltKey) return true;
    const digest = crypto
      .createHash("sha256")
      .update((rawBody || JSON.stringify(payload || {})) + ENV.phonepeSaltKey)
      .digest("hex");
    return digest === signature;
  }

  if (provider === "paytm") {
    if (!ENV.paytmMerchantKey) return true;
    const digest = crypto
      .createHmac("sha256", ENV.paytmMerchantKey)
      .update(rawBody || JSON.stringify(payload || {}))
      .digest("hex");
    return digest === signature;
  }

  return false;
};

const toAmount = (provider, payload) => {
  const value = Number(
    payload?.amount || payload?.txnAmount || payload?.data?.amount || 0,
  );
  if (provider === "razorpay") return value / 100;
  if (provider === "phonepe") return value / 100;
  return value;
};

const extractInvoiceId = (payload) =>
  payload?.invoiceId ||
  payload?.notes?.invoiceId ||
  payload?.orderMeta?.invoiceId ||
  payload?.body?.invoiceId ||
  "";

const createNotification = async (
  db,
  { ownerId, businessId, invoice, amount, provider },
) => {
  if (!ownerId) return;

  await db.createDocument(
    ENV.dbId,
    ENV.notificationsCollection,
    ID.unique(),
    {
      userId: String(ownerId),
      businessId,
      type: "payment_received",
      title: "Payment auto-verified",
      body: `Payment of ${Number(amount || 0).toFixed(2)} received for invoice ${invoice.invoiceNumber}`,
      data: JSON.stringify({
        invoiceId: invoice.$id,
        invoiceNumber: invoice.invoiceNumber,
        provider,
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

const createLink = async ({ req, res, db }) => {
  const body = parseBody(req);
  const invoiceId = String(body.invoiceId || "");
  const businessId = String(body.businessId || "");
  const expiresInMinutes = Math.max(
    10,
    Number(body.expiresInMinutes || 60 * 24 * 7),
  );

  if (!invoiceId || !businessId) {
    return res.json(
      { ok: false, error: "invoiceId and businessId are required" },
      400,
    );
  }

  const token = signToken({
    invoiceId,
    businessId,
    exp: Date.now() + expiresInMinutes * 60 * 1000,
  });

  const link = `${ENV.paymentLinkBase}?token=${encodeURIComponent(token)}`;
  return res.json({ ok: true, token, link }, 200);
};

const getInvoiceForPublicPage = async ({ req, res, db }) => {
  const query = parseQuery(req);
  const token = String(query.token || "");

  const verified = verifyToken(token);
  if (!verified.ok) {
    return res.json({ ok: false, error: verified.error }, 401);
  }

  const { invoiceId, businessId } = verified.payload;

  const [invoice, business] = await Promise.all([
    db.getDocument(ENV.dbId, ENV.invoicesCollection, invoiceId),
    db.getDocument(ENV.dbId, ENV.businessesCollection, businessId),
  ]);

  return res.json(
    {
      ok: true,
      invoice: {
        $id: invoice.$id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalAmount: Number(invoice.totalAmount || 0),
        paidAmount: Number(invoice.paidAmount || 0),
        balanceDue: Number(invoice.balanceDue || invoice.totalAmount || 0),
        status: invoice.status,
        dueDate: invoice.dueDate,
        upiId: business.upiId || business.vpa || business.upiVpa || "",
        businessName: business.name,
      },
      business: {
        $id: business.$id,
        name: business.name,
        currencySymbol: business.currencySymbol || "₹",
      },
    },
    200,
  );
};

const verifyWebhook = async ({ req, res, db, log }) => {
  const body = parseBody(req);
  const provider = String(body.provider || "").toLowerCase();
  const payload = body.payload || {};
  const signature = String(
    body.signature || req?.headers?.["x-signature"] || "",
  );
  const rawBody =
    typeof req.body === "string"
      ? req.body
      : JSON.stringify(body.payload || {});

  if (!["razorpay", "phonepe", "paytm"].includes(provider)) {
    return res.json({ ok: false, error: "Unsupported provider" }, 400);
  }

  const signatureOk = verifyProviderSignature({
    provider,
    payload,
    signature,
    rawBody,
  });

  if (!signatureOk) {
    return res.json(
      { ok: false, verified: false, error: "Signature verification failed" },
      401,
    );
  }

  const invoiceId = String(extractInvoiceId(payload));
  if (!invoiceId) {
    return res.json(
      { ok: false, verified: false, error: "invoiceId missing in payload" },
      400,
    );
  }

  const invoice = await db.getDocument(
    ENV.dbId,
    ENV.invoicesCollection,
    invoiceId,
  );
  const amountPaid =
    toAmount(provider, payload) ||
    Number(invoice.balanceDue || invoice.totalAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const nextPaidAmount = Math.min(
    totalAmount,
    Number(invoice.paidAmount || 0) + amountPaid,
  );
  const nextBalance = Math.max(0, totalAmount - nextPaidAmount);
  const nextStatus =
    nextBalance <= 0 ? "paid" : nextPaidAmount > 0 ? "partial" : "unpaid";

  const updated = await db.updateDocument(
    ENV.dbId,
    ENV.invoicesCollection,
    invoiceId,
    {
      paidAmount: nextPaidAmount,
      balanceDue: nextBalance,
      status: nextStatus,
      paymentMethod: provider,
      paymentDate: new Date().toISOString(),
    },
  );

  try {
    const business = await db.getDocument(
      ENV.dbId,
      ENV.businessesCollection,
      String(updated.businessId),
    );
    await createNotification(db, {
      ownerId: business.ownerId,
      businessId: String(updated.businessId),
      invoice: updated,
      amount: amountPaid,
      provider,
    });
  } catch (notificationError) {
    log(`Notification failed: ${notificationError.message}`);
  }

  return res.json(
    {
      ok: true,
      verified: true,
      invoiceId,
      status: nextStatus,
      balanceDue: nextBalance,
    },
    200,
  );
};

export default async ({ req, res, log, error }) => {
  try {
    const db = getDb();
    const path = String(req?.path || "/");

    if (path.includes("/create-link")) {
      return await createLink({ req, res, db });
    }

    if (path.includes("/invoice")) {
      return await getInvoiceForPublicPage({ req, res, db });
    }

    if (path.includes("/verify-webhook")) {
      return await verifyWebhook({ req, res, db, log });
    }

    return res.json(
      {
        ok: true,
        routes: ["/create-link", "/invoice?token=...", "/verify-webhook"],
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
