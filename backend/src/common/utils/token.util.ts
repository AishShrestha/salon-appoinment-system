import * as crypto from 'crypto';

/**
 * Generate a secure random verification token
 * @returns Hex string token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate token expiry date (24 hours from now)
 * @returns Date object for token expiry
 */
export function generateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Check if token has expired
 * @param expiryDate - Token expiry date
 * @returns True if token is expired
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}
