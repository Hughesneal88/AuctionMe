import crypto from 'crypto';

/**
 * Generate a unique transaction ID
 */
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(6).toString('hex');
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Generate a unique escrow ID
 */
export const generateEscrowId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(6).toString('hex');
  return `ESC-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Generate a 6-digit delivery confirmation code
 */
export const generateDeliveryCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Verify webhook signature for security
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Hash delivery code for secure storage
 */
export const hashDeliveryCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Compare delivery code with hash
 */
export const compareDeliveryCode = (code: string, hash: string): boolean => {
  const codeHash = hashDeliveryCode(code);
  return crypto.timingSafeEqual(
    Buffer.from(codeHash),
    Buffer.from(hash)
  );
};

/**
 * Encrypt delivery code for secure storage (allows buyer retrieval)
 * Uses AES-256-GCM encryption
 */
export const encryptDeliveryCode = (code: string, secret: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret.padEnd(32, '0').substring(0, 32)), iv);
  
  let encrypted = cipher.update(code, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt delivery code
 */
export const decryptDeliveryCode = (encryptedData: string, secret: string): string => {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret.padEnd(32, '0').substring(0, 32)), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
