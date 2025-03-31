/**
 * Encodes a string to base64url format
 * Base64url is a URL-safe variant of base64 that uses - and _ instead of + and /
 * @param data - String to encode
 * @returns Base64url encoded string
 */
export const base64UrlEncode = (data: string): string => {
  return (
    Buffer.from(data)
      .toString("base64")
      // Convert base64 to base64url by replacing special characters
      .replace(/\+/g, "-") // Replace + with -
      .replace(/\//g, "_") // Replace / with _
      .replace(/=+$/, "")
  ); // Remove padding = characters
};

/**
 * Decodes a base64url string back to its original form
 * @param data - Base64url encoded string
 * @returns Decoded string
 */
export const base64UrlDecode = (data: string): string => {
  return Buffer.from(data, "base64").toString("utf-8");
};
