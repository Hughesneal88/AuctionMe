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
