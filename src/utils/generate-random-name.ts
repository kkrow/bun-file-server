import { env } from "bun";
import { chars } from "./constants";

// Get filename length from environment variables, default to 8 characters
const { FILENAME_LENGTH = "8" } = env;

/**
 * Generates a random name for files or URLs
 * @param originalName - Original filename (for preserving extension)
 * @param url - Whether this is for a URL (no extension needed)
 * @returns Random name with optional extension
 */
export async function generateRandomName(
  originalName: string,
  url = false,
): Promise<string> {
  // Extract file extension if present
  const extension = originalName.includes(".")
    ? "." + originalName.split(".").pop()
    : "";

  // Get desired length from environment variable
  const length = parseInt(FILENAME_LENGTH, 10);

  // Generate random string using characters from constants
  let randomName = "";
  for (let i = 0; i < length; i++) {
    randomName += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // For files, check if name already exists and generate new one if needed
  if (!url && (await Bun.file(randomName).exists())) {
    return generateRandomName(originalName);
  }

  // For URLs, return just the random name without extension
  if (url) return randomName;

  // For files, return random name with original extension
  return `${randomName}${extension}`;
}
