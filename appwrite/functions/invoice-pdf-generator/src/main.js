import {
    Client,
    Databases,
    ID,
    InputFile,
    Query,
    Storage,
} from "node-appwrite";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  businessesCollection: process.env.COLLECTION_BUSINESSES || "businesses",
  invoiceItemsCollection:
    process.env.COLLECTION_INVOICE_ITEMS || "invoice_items",
  invoicePdfBucket: process.env.BUCKET_INVOICE_PDFS || "invoice_pdfs",
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

const toItems = (invoice, fallbackItems) => {
  if (Array.isArray(fallbackItems) && fallbackItems.length > 0)
    return fallbackItems;
  if (Array.isArray(invoice.items)) return invoice.items;
  if (typeof invoice.items === "string") {
    try {
      const parsed = JSON.parse(invoice.items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const buildPdfBuffer = async ({ invoice, business, items, paymentLink }) => {
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const currency = String(business.currencySymbol || "₹");

  doc
    .fontSize(20)
    .text(String(business.name || "InvoiceFlow"), { align: "left" });
  doc.moveDown(0.3);
  doc
    .fontSize(12)
    .fillColor("#222")
    .text(`Invoice #${invoice.invoiceNumber || invoice.$id}`);
  doc.text(`Customer: ${invoice.customerName || "Customer"}`);
  doc.text(
    `Date: ${new Date(invoice.invoiceDate || invoice.date || invoice.$createdAt || Date.now()).toLocaleDateString("en-IN")}`,
  );
  if (invoice.dueDate) {
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}`,
    );
  }

  doc.moveDown(0.8);
  doc.fontSize(12).fillColor("#000").text("Items", { underline: true });
  doc.moveDown(0.4);

  for (const item of items) {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const lineTotal = Number(item.totalPrice || item.total || qty * price);
    doc
      .fontSize(10)
      .fillColor("#333")
      .text(
        `${item.productName || item.name || "Item"} (${qty} x ${currency}${price.toFixed(2)})`,
        {
          continued: true,
        },
      )
      .text(`  ${currency}${lineTotal.toFixed(2)}`, { align: "right" });
  }

  doc.moveDown(0.8);
  doc
    .fontSize(12)
    .fillColor("#000")
    .text(`Total: ${currency}${Number(invoice.totalAmount || 0).toFixed(2)}`);
  doc.text(`Paid: ${currency}${Number(invoice.paidAmount || 0).toFixed(2)}`);
  doc.text(
    `Balance Due: ${currency}${Number(invoice.balanceDue || invoice.totalAmount || 0).toFixed(2)}`,
  );

  if (paymentLink) {
    doc.moveDown(1);
    doc.fontSize(12).fillColor("#0f5ed7").text("Pay Now", {
      link: paymentLink,
      underline: true,
    });

    const qrDataUrl = await QRCode.toDataURL(paymentLink, {
      margin: 1,
      width: 180,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    doc.image(qrBuffer, doc.page.width - 220, doc.y - 20, {
      width: 150,
      height: 150,
    });

    doc.moveDown(8);
    doc
      .fontSize(9)
      .fillColor("#555")
      .text("Scan QR or tap Pay Now link to complete payment.");
  }

  doc.end();

  return await new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
};

export default async ({ req, res, error, log }) => {
  try {
    const body = parseBody(req);
    const invoiceId = String(body.invoiceId || "");
    const businessId = String(body.businessId || "");
    const paymentLink = String(body.paymentLink || "");

    if (!invoiceId || !businessId) {
      return res.json(
        { ok: false, error: "invoiceId and businessId are required" },
        400,
      );
    }

    const { db, storage } = getClients();

    const [invoice, business, invoiceItems] = await Promise.all([
      db.getDocument(ENV.dbId, ENV.invoicesCollection, invoiceId),
      db.getDocument(ENV.dbId, ENV.businessesCollection, businessId),
      db
        .listDocuments(ENV.dbId, ENV.invoiceItemsCollection, [
          Query.equal("invoiceId", invoiceId),
          Query.limit(500),
        ])
        .catch(() => ({ documents: [] })),
    ]);

    const items = toItems(invoice, invoiceItems.documents || []);
    const pdfBuffer = await buildPdfBuffer({
      invoice,
      business,
      items,
      paymentLink,
    });

    const safeInvoiceNumber = String(invoice.invoiceNumber || invoice.$id)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40);

    const file = await storage.createFile(
      ENV.invoicePdfBucket,
      ID.unique(),
      InputFile.fromBuffer(pdfBuffer, `${safeInvoiceNumber}.pdf`),
    );

    await db.updateDocument(ENV.dbId, ENV.invoicesCollection, invoiceId, {
      pdfFileId: file.$id,
    });

    return res.json(
      {
        ok: true,
        fileId: file.$id,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    log(err.stack || "no-stack");
    return res.json({ ok: false, error: err.message }, 500);
  }
};
