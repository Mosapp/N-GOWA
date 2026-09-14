import crypto from "node:crypto";

export function generateRecoveryToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashRecoveryToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
