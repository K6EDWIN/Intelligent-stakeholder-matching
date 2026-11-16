import crypto from "crypto";

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashPasswordResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
export const PASSWORD_RESET_COOLDOWN_MS = 2 * 60 * 1000;

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}
