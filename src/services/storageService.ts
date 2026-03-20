import { Models } from "appwrite";
import { BUCKETS, ID, storage } from "./appwrite";

export const uploadBusinessAsset = (
  file: File,
  permissions?: string[],
): Promise<Models.File> =>
  storage.createFile(BUCKETS.BUSINESS_ASSETS, ID.unique(), file, permissions);

export const uploadInvoicePdf = (
  file: File,
  permissions?: string[],
): Promise<Models.File> =>
  storage.createFile(BUCKETS.INVOICE_PDFS, ID.unique(), file, permissions);

export const getFilePreviewUrl = (
  bucketId: string,
  fileId: string,
  width = 200,
  height = 200,
) => storage.getFilePreview(bucketId, fileId, width, height);

export const getFileViewUrl = (bucketId: string, fileId: string) =>
  storage.getFileView(bucketId, fileId);
