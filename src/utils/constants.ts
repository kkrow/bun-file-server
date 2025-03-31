import { env } from "bun";

// JWT (JSON Web Token) related constants
export const JWT_ALGORITHM = "HS256"; // HMAC with SHA-256 algorithm
export const JWT_TYPE = "JWT"; // Token type identifier

// JWT expiration settings
export const JWT_EXPIRY_DAYS = Number(env.JWT_EXPIRY_DAYS) || 30; // Default to 30 days if not set
export const EXPIRY_TIME =
  Math.floor(Date.now() / 1000) + JWT_EXPIRY_DAYS * 24 * 60 * 60; // Unix timestamp for expiration

// Base URL for the application
export const baseUrl = `${env.HTTPS === "true" ? "https" : "http"}://${env.DOMAIN || "localhost:3000"}`;

// Characters used for generating random names and URLs
// Includes lowercase, uppercase, numbers, and URL-safe special characters
export const chars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_~";
