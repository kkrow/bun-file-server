import { env } from "bun";
import { chars } from "./constants";

const { FILENAME_LENGTH = "8" } = env;

export async function generateRandomName(
  originalName: string,
  url = false,
): Promise<string> {
  const extension = originalName.includes(".")
    ? "." + originalName.split(".").pop()
    : "";
  const length = parseInt(FILENAME_LENGTH, 10);
  let randomName = "";
  for (let i = 0; i < length; i++) {
    randomName += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!url && (await Bun.file(randomName).exists())) {
    return generateRandomName(originalName);
  }
  if (url) return randomName;

  return `${randomName}${extension}`;
}
