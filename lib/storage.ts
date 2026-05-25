import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { AttachmentRecord } from "./types";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

function hasS3Config() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

export function attachmentStorageMode() {
  return hasS3Config() ? "s3" : "local";
}

function s3Client() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ""
    },
    forcePathStyle: Boolean(process.env.S3_ENDPOINT)
  });
}

export async function storeAttachment(file: File): Promise<AttachmentRecord> {
  if (!file || file.size === 0) throw new Error("A course approval attachment is required.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Attachment must be 8 MB or smaller.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Attachment must be a PDF, PNG, or JPG file.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `submissions/${id}/${safeName}`;

  if (hasS3Config()) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        Body: bytes,
        ContentType: file.type
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

  return readFile(path.join(process.cwd(), "uploads", attachment.storageKey));
}
