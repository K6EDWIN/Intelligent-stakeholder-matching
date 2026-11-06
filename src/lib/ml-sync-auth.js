import { createHmac, timingSafeEqual } from "node:crypto";

export function isAuthorizedMlSyncRequest(request) {
  const expected = process.env.ML_COLAB_SYNC_TOKEN || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

// Stable, keyed pseudonyms let the NCF model learn per-member embeddings
// without exporting database user IDs to the Colab runtime.
export function getMlUserKey(userId) {
  const secret = process.env.ML_COLAB_USER_SALT || process.env.ML_COLAB_SYNC_TOKEN || "";
  if (!secret || !userId) return null;
  return createHmac("sha256", secret).update(String(userId)).digest("hex");
}
