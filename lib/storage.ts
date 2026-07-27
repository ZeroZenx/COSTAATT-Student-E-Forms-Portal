import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { AttachmentRecord } from "./types";

const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
let cachedS3Client: S3Client | null = null;
let cachedS3Key = "";

function maxFileSize() {
  return Number(process.env.UPLOAD_MAX_MB || 8) * 1024 * 1024;
}

function hasS3Config() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

export function attachmentStorageMode() {
  return hasS3Config() ? "s3" : "local";
}

function s3Client() {
  const clientKey = JSON.stringify([
    process.env.S3_ENDPOINT,
    process.env.S3_REGION,
    process.env.S3_ACCESS_KEY_ID,
    process.env.S3_SECRET_ACCESS_KEY
  ]);
  if (cachedS3Client && cachedS3Key === clientKey) return cachedS3Client;

  cachedS3Key = clientKey;
  cachedS3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ""
    },
    forcePathStyle: Boolean(process.env.S3_ENDPOINT)
  });
  return cachedS3Client;
}

export async function storeAttachment(file: File): Promise<AttachmentRecord> {
  if (!file || file.size === 0) throw new Error("A course approval attachment is required.");
  if (file.size > maxFileSize()) throw new Error(`Attachment must be ${process.env.UPLOAD_MAX_MB || 8} MB or smaller.`);
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Attachment must be a PDF, PNG, or JPG file.");
  if (!hasExpectedFileExtension(file.name, file.type)) {
    throw new Error("Attachment filename extension does not match its PDF, PNG, or JPG file type.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedFileSignature(bytes, file.type)) {
    throw new Error("Attachment contents do not match the selected PDF, PNG, or JPG file type.");
  }
  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `submissions/${id}/${safeName}`;

  if (hasS3Config()) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        Body: bytes,
        ContentType: file.type,
        CacheControl: "private, no-store"
      })
    );
  } else {
    const uploadRoot = path.join(process.cwd(), "uploads");
    const outputPath = path.join(uploadRoot, storageKey);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, bytes);
  }

  return {
    id,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    storageKey
  };
}

export async function loadAttachment(attachment: AttachmentRecord) {
  if (hasS3Config()) {
    const response = await s3Client().send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: attachment.storageKey
      })
    );
    const chunks: Buffer[] = [];
    const body = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of body) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  return readFile(localAttachmentPath(attachment.storageKey));
}

function localAttachmentPath(storageKey: string) {
  const uploadRoot = path.resolve(process.cwd(), "uploads");
  const resolved = path.resolve(uploadRoot, storageKey);
  if (resolved !== uploadRoot && !resolved.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error("Invalid attachment storage key.");
  }
  return resolved;
}

function hasExpectedFileSignature(bytes: Buffer, contentType: string) {
  if (contentType === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  if (contentType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

function hasExpectedFileExtension(fileName: string, contentType: string) {
  const extension = path.extname(fileName).toLowerCase();
  if (contentType === "application/pdf") return extension === ".pdf";
  if (contentType === "image/png") return extension === ".png";
  if (contentType === "image/jpeg") return extension === ".jpg" || extension === ".jpeg";
  return false;
}
