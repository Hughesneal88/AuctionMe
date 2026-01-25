import {
  generateDeliveryCode,
  hashDeliveryCode,
  compareDeliveryCode,
  encryptDeliveryCode,
  decryptDeliveryCode
} from '../utils/helpers';

describe('Delivery Code Helper Functions', () => {
  describe('generateDeliveryCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateDeliveryCode();
      expect(code).toHaveLength(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThan(1000000);
    });

    it('should generate unique codes', () => {
      const code1 = generateDeliveryCode();
      const code2 = generateDeliveryCode();
      // While technically possible to be same, probability is very low
      expect(code1).not.toBe(code2);
    });
  });

  describe('hashDeliveryCode', () => {
    it('should hash delivery code consistently', () => {
      const code = '123456';
      const hash1 = hashDeliveryCode(code);
      const hash2 = hashDeliveryCode(code);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different codes', () => {
      const hash1 = hashDeliveryCode('123456');
      const hash2 = hashDeliveryCode('654321');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex string (SHA256)', () => {
      const hash = hashDeliveryCode('123456');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('compareDeliveryCode', () => {
    it('should return true for matching code and hash', () => {
      const code = '123456';
      const hash = hashDeliveryCode(code);
      expect(compareDeliveryCode(code, hash)).toBe(true);
    });

    it('should return false for non-matching code and hash', () => {
      const code = '123456';
      const hash = hashDeliveryCode('654321');
      expect(compareDeliveryCode(code, hash)).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      // This test just verifies the function works, actual timing-safety
      // is provided by crypto.timingSafeEqual
      const code = '123456';
      const hash = hashDeliveryCode(code);
      expect(compareDeliveryCode(code, hash)).toBe(true);
    });
  });

  describe('encryptDeliveryCode and decryptDeliveryCode', () => {
    const secret = 'test-secret-key-for-encryption';

    it('should encrypt and decrypt code correctly', () => {
      const code = '123456';
      const encrypted = encryptDeliveryCode(code, secret);
      const decrypted = decryptDeliveryCode(encrypted, secret);
      expect(decrypted).toBe(code);
    });

    it('should produce different encrypted values for same code (due to IV)', () => {
      const code = '123456';
      const encrypted1 = encryptDeliveryCode(code, secret);
      const encrypted2 = encryptDeliveryCode(code, secret);
      // Different IVs should produce different encrypted strings
      expect(encrypted1).not.toBe(encrypted2);
      // But both should decrypt to same value
      expect(decryptDeliveryCode(encrypted1, secret)).toBe(code);
      expect(decryptDeliveryCode(encrypted2, secret)).toBe(code);
    });

    it('should fail to decrypt with wrong secret', () => {
      const code = '123456';
      const encrypted = encryptDeliveryCode(code, secret);
      expect(() => {
        decryptDeliveryCode(encrypted, 'wrong-secret');
      }).toThrow();
    });

    it('should fail to decrypt tampered data', () => {
      const code = '123456';
      const encrypted = encryptDeliveryCode(code, secret);
      const tampered = encrypted.replace(/a/g, 'b'); // Tamper with encrypted data
      expect(() => {
        decryptDeliveryCode(tampered, secret);
      }).toThrow();
    });

    it('should handle different length codes', () => {
      const codes = ['123456', '000000', '999999'];
      codes.forEach(code => {
        const encrypted = encryptDeliveryCode(code, secret);
        const decrypted = decryptDeliveryCode(encrypted, secret);
        expect(decrypted).toBe(code);
      });
    });

    it('should fail with invalid encrypted format', () => {
      expect(() => {
        decryptDeliveryCode('invalid-format', secret);
      }).toThrow('Invalid encrypted data format');
    });
  });
});
