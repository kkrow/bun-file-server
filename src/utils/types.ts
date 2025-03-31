/**
 * Interface defining the structure of a JWT payload
 * Contains the actual data stored in the token
 */
export interface JWTPayload {
  username: string; // Admin username
  exp: number; // Token expiration timestamp
}

/**
 * Interface defining the structure of a JWT header
 * Contains metadata about the token
 */
export interface JWTHeader {
  alg: string; // Algorithm used for signing (e.g., "HS256")
  typ: string; // Token type (always "JWT")
}
