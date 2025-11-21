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

/**
 * Convert string to ArrayBuffer for Web Crypto API
 */
const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

/**
 * Convert base64url to Uint8Array
 */
const base64UrlToUint8Array = (base64url: string): Uint8Array => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binaryString = atob(paddedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Verify JWT signature using HMAC algorithms (HS256, HS384, HS512)
 */
export const verifyJWTSignature = async (
  token: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const parts = splitJWT(token);
    if (!parts) {
      return { valid: false, error: 'Invalid JWT structure' };
    }

    const header = decodeJWTHeader(token);
    if (!header || !header.alg) {
      return { valid: false, error: 'Missing algorithm in header' };
    }

    // Map algorithm names to Web Crypto API algorithm names
    const algorithmMap: Record<string, string> = {
      'HS256': 'SHA-256',
      'HS384': 'SHA-384',
      'HS512': 'SHA-512',
    };

    const algorithm = algorithmMap[header.alg as string];
    if (!algorithm) {
      return { valid: false, error: `Unsupported algorithm: ${header.alg}. Only HMAC algorithms (HS256, HS384, HS512) are supported for browser-based verification.` };
    }

    // Import the secret key
    const keyData = stringToArrayBuffer(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign', 'verify']
    );

    // Create the signature input (header.payload)
    const signatureInput = `${parts.header}.${parts.payload}`;
    const signatureInputBuffer = stringToArrayBuffer(signatureInput);

    // Decode the signature from the token
    const tokenSignature = base64UrlToUint8Array(parts.signature);

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      tokenSignature,
      signatureInputBuffer
    );

    return { valid: isValid };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
};
