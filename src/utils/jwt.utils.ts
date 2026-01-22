import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};

export const generateVerificationToken = (): string => {
  // Use cryptographically secure random token
  const randomToken = crypto.randomBytes(32).toString('hex');
  return jwt.sign(
    { token: randomToken },
    config.jwt.secret,
    { expiresIn: '24h' } as SignOptions
  );
};
