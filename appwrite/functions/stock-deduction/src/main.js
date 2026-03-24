import { Client, Databases, ID, Permission, Role } from "node-appwrite";

const ENV = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "699988ac001cd0857f48",
  apiKey: process.env.APPWRITE_API_KEY || "",
  dbId: process.env.APPWRITE_DB_ID || "invoiceflow_db",
  productsCollection: process.env.COLLECTION_PRODUCTS || "products",
  notificationsCollection:
    process.env.COLLECTION_NOTIFICATIONS || "notifications",
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

const parseItems = (invoice) => {
  if (Array.isArray(invoice.items)) return invoice.items;

  if (typeof invoice.items === "string") {
    try {
      const parsed = JSON.parse(invoice.items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (typeof invoice.detailsJson === "string") {
    try {
      const parsed = JSON.parse(invoice.detailsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

export default async ({ req, res, log, error }) => {
  try {
    const db = getDb();
    const invoice = parseJsonBody(req);
    const items = parseItems(invoice);

    if (!invoice.businessId || items.length === 0) {
      return res.json(
        { ok: false, error: "Invalid invoice payload or missing items" },
        400,
      );
    }

    let updatedProducts = 0;
    let notificationsCreated = 0;

    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Number(item.quantity || 0);
      if (!productId || quantity <= 0) continue;

      try {
        const product = await db.getDocument(
          ENV.dbId,
          ENV.productsCollection,
          productId,
        );

        const currentStock = Number(product.stock || 0);
        const newStock = Math.max(0, currentStock - quantity);

        await db.updateDocument(ENV.dbId, ENV.productsCollection, productId, {
          stock: newStock,
        });

        updatedProducts += 1;

        const threshold = Number(product.lowStockThreshold || 0);
        if (newStock <= threshold) {
          const userId = String(invoice.staffId || invoice.ownerId || "");
          if (userId) {
            await db.createDocument(
              ENV.dbId,
              ENV.notificationsCollection,
              ID.unique(),
              {
                userId,
                businessId: invoice.businessId,
                type: "low_stock",
                title: "Low Stock Alert",
                body: `${product.name} is running low (${newStock} ${product.unit || "pcs"} left)`,
                isRead: false,
              },
              [
                Permission.read(Role.user(userId)),
                Permission.write(Role.user(userId)),
              ],
            );

            notificationsCreated += 1;
          }
        }
      } catch (innerError) {
        log(
          `Stock update skipped for product ${productId}: ${innerError.message}`,
        );
      }
    }

    return res.json(
      {
        ok: true,
        businessId: invoice.businessId,
        updatedProducts,
        notificationsCreated,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
