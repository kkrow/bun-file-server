import { env } from "bun";
import { EXPIRY_TIME, JWT_ALGORITHM, JWT_TYPE } from "./constants";
import { base64UrlDecode, base64UrlEncode } from "./encoding";
import type { JWTHeader, JWTPayload } from "./types";

/**
 * Creates a JWT signature using SHA-256 hashing
 * @param header - Base64URL encoded header
 * @param payload - Base64URL encoded payload
 * @param secret - Secret key (admin password) for signing
 * @returns Base64URL encoded signature
 */
const createSignature = (
  header: string,
  payload: string,
  secret: string,
): string => {
  return (
    new Bun.CryptoHasher("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64")
      // Convert base64 to base64url by replacing special characters
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  );
};

/**
 * Creates a new JWT token for admin authentication
 * @param username - Admin username
 * @param password - Admin password (used as secret key)
 * @returns JWT token string in format "header.payload.signature"
 */
const createJWT = (username: string, password: string): string => {
  // Create JWT header with algorithm and type
  const header: JWTHeader = {
    alg: JWT_ALGORITHM,
    typ: JWT_TYPE,
  };

  // Create JWT payload with username and expiration time
  const payload: JWTPayload = {
    username,
    exp: EXPIRY_TIME,
  };

  // Encode header and payload in base64url format
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create signature using admin password as secret key
  const signature = createSignature(encodedHeader, encodedPayload, password);

  // Combine all parts to create the final JWT
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * Verifies a JWT token's validity and authenticity
 * @param token - JWT token string to verify
 * @returns Decoded payload if valid, false if invalid
 */
const verifyJWT = (token: string): JWTPayload | false => {
  try {
    // Split token into its three parts
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    // Check if all parts are present
    if (!encodedHeader || !encodedPayload || !signature) {
      return false;
    }

    // Decode header and payload
    const header: JWTHeader = JSON.parse(base64UrlDecode(encodedHeader));
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Verify the algorithm used matches our expected algorithm
    if (header.alg !== JWT_ALGORITHM) {
      return false;
    }

    // Check if token has expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    // Verify signature against all possible admin credentials
    const { ADMINS } = env;
    if (ADMINS) {
      const admins = ADMINS.split(",");
      const isValidAdmin = admins.some((admin) => {
        const [adminUsername, adminPassword] = admin.split(":");
        // Create expected signature using admin's password
        const expectedSignature = createSignature(
          encodedHeader,
          encodedPayload,
          adminPassword || "",
        );
        // Check if signature matches and username is correct
        return (
          expectedSignature === signature && adminUsername === payload.username
        );
      });

      if (!isValidAdmin) {
        return false;
      }
    }

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return false;
  }
};

export { createJWT, verifyJWT };
