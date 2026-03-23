import { createHash, randomBytes } from "node:crypto";

export function generateUploadToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashUploadToken(token: string, pepper: string): string {
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}
