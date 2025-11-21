/**
 * JWT Helper utilities for decoding and parsing JWT tokens
 */

export interface JWTHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  [key: string]: unknown;
}

export interface JWTPayload {
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
  [key: string]: unknown;
}

export interface JWTParts {
  header: string;
  payload: string;
  signature: string;
}

/**
 * Decode a base64url encoded string
 */
export const base64UrlDecode = (str: string): string => {
  try {
    // Replace characters and add padding
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error('Invalid base64url string');
      }
      base64 += '='.repeat(4 - pad);
    }
    // Decode base64
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (error) {
    throw new Error('Failed to decode base64url string');
  }
};

/**
 * Split JWT token into its three parts
 */
export const splitJWT = (token: string): JWTParts | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  return {
    header: parts[0],
    payload: parts[1],
    signature: parts[2],
  };
};

/**
 * Decode JWT header
 */
export const decodeJWTHeader = (token: string): JWTHeader | null => {
  try {
    const parts = splitJWT(token);
    if (!parts) return null;
    
    const decoded = base64UrlDecode(parts.header);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT payload
 */
export const decodeJWTPayload = (token: string): JWTPayload | null => {
  try {
    const parts = splitJWT(token);
    if (!parts) return null;
    
    const decoded = base64UrlDecode(parts.payload);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

/**
 * Get JWT signature (base64url encoded)
 */
export const getJWTSignature = (token: string): string | null => {
  const parts = splitJWT(token);
  return parts ? parts.signature : null;
};

/**
 * Validate JWT structure (basic format check)
 */
export const isValidJWTStructure = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Check if JWT is expired
 */
export const isJWTExpired = (payload: JWTPayload | null): boolean => {
  if (!payload || !payload.exp || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 < Date.now();
};

/**
 * Format timestamp to human-readable date
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Calculate time remaining until expiration
 */
export const getTimeUntilExpiry = (exp: number): string => {
  const now = Date.now();
  const expiryTime = exp * 1000;
  
  if (expiryTime < now) {
    return 'Expired';
  }
  
  const diff = expiryTime - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};
