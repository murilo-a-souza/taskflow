import crypto from 'crypto';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export class AuthService {
  /**
   * Hashes a password using PBKDF2/scrypt with a unique random salt
   */
  public hashPassword(password: string): { salt: string; hash: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { salt, hash };
  }

  /**
   * Securely verifies a candidate password against a stored hash and salt
   */
  public verifyPassword(password: string, salt: string, storedHash: string): boolean {
    try {
      const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashBuffer = Buffer.from(calculatedHash, 'hex');
      const storedBuffer = Buffer.from(storedHash, 'hex');
      if (hashBuffer.length !== storedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(hashBuffer, storedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Creates a signed JWT token valid for 7 days
   */
  public generateToken(user: { id: string; email: string; name: string }): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${dataToSign}.${signature}`;
  }

  /**
   * Verifies and decodes a signed JWT token
   */
  public verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToSign = `${encodedHeader}.${encodedPayload}`;

      const expectedSignature = crypto
        .createHmac('sha256', config.jwtSecret)
        .update(dataToSign)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const sigBuf = Buffer.from(signature);
      const expectedBuf = Buffer.from(expectedSignature);

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const payloadJson = base64UrlDecode(encodedPayload);
      const payload: TokenPayload = JSON.parse(payloadJson);

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();

