import JSZip from "jszip";
import {
    Client,
    Databases,
    ID,
    InputFile,
    Permission,
    Query,
    Role,
    Storage,
} from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  customersCollection: process.env.COLLECTION_CUSTOMERS || "customers",
  productsCollection: process.env.COLLECTION_PRODUCTS || "products",
  invoicesCollection: process.env.COLLECTION_INVOICES || "invoices",
  backupsCollection: process.env.COLLECTION_BACKUPS || "backups",
  backupsBucket: process.env.BUCKET_BACKUPS || "backups",
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

const parseJsonBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === "object") return req.body;

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
};

const listByBusiness = (db, collectionId, businessId) =>
  db.listDocuments(ENV.dbId, collectionId, [
    Query.equal("businessId", businessId),
    Query.limit(5000),
  ]);

export default async ({ req, res, error }) => {
  try {
    const { db, storage } = getClients();
    const body = parseJsonBody(req);

    const businessId = String(body.businessId || "");
    const userId = String(body.userId || "");

    if (!businessId || !userId) {
      return res.json(
        { ok: false, error: "Missing required fields: businessId and userId" },
        400,
      );
    }

    const [customers, products, invoices] = await Promise.all([
      listByBusiness(db, ENV.customersCollection, businessId),
      listByBusiness(db, ENV.productsCollection, businessId),
      listByBusiness(db, ENV.invoicesCollection, businessId),
    ]);

    const snapshot = {
      exportedAt: new Date().toISOString(),
      businessId,
      userId,
      counts: {
        customers: customers.total,
        products: products.total,
        invoices: invoices.total,
      },
      customers: customers.documents,
      products: products.documents,
      invoices: invoices.documents,
    };

    const zip = new JSZip();
    zip.file("backup.json", JSON.stringify(snapshot, null, 2));

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const fileName = `backup_${businessId}_${Date.now()}.zip`;
    const upload = await storage.createFile(
      ENV.backupsBucket,
      ID.unique(),
      InputFile.fromBuffer(zipBuffer, fileName, "application/zip"),
    );

    const backupDoc = await db.createDocument(
      ENV.dbId,
      ENV.backupsCollection,
      ID.unique(),
      {
        businessId,
        userId,
        fileId: upload.$id,
        fileName,
        fileSizeBytes: Number(upload.sizeOriginal || zipBuffer.length),
        status: "completed",
        type: "manual",
        recordCounts: JSON.stringify(snapshot.counts),
      },
      [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))],
    );

    return res.json(
      {
        ok: true,
        backupId: backupDoc.$id,
        fileId: upload.$id,
        fileName,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
