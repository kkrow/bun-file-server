import { env } from "bun";

export const JWT_ALGORITHM = "HS256";
export const JWT_TYPE = "JWT";
export const JWT_EXPIRY_DAYS = Number(env.JWT_EXPIRY_DAYS) || 30;
export const EXPIRY_TIME =
  Math.floor(Date.now() / 1000) + JWT_EXPIRY_DAYS * 24 * 60 * 60;
export const baseUrl = `${env.HTTPS ? "https" : "http"}://${env.DOMAIN}`;
export const chars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_~";
