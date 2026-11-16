import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function encryptionKey() {
  const encodedKey = process.env.FREQUENT_FLYER_VERIFICATION_KEY;
  if (!encodedKey) {
    const error = new Error("Frequent Flyer verification encryption is not configured.");
    error.code = "VERIFICATION_ENCRYPTION_NOT_CONFIGURED";
    throw error;
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) {
    const error = new Error("FREQUENT_FLYER_VERIFICATION_KEY must be a base64-encoded 32-byte key.");
    error.code = "VERIFICATION_ENCRYPTION_MISCONFIGURED";
    throw error;
  }
  return key;
}

export function encryptFrequentFlyerEvidence(evidence) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(evidence), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return ["v1", iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptFrequentFlyerEvidence(value) {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext] = String(value || "").split(".");
  if (version !== "v1" || !encodedIv || !encodedAuthTag || !encodedCiphertext) {
    throw new Error("Frequent Flyer verification evidence is invalid or uses an unsupported format.");
  }

  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(encodedIv, "base64"));
  decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext);
}
