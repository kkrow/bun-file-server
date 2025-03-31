import { $, env } from "bun";
import { mkdir } from "node:fs/promises";
import { resolve } from "path";

const getAbsolutePath = (path: string): string => {
  return resolve(process.cwd(), path);
};

export const cleanUncompletedUploads = async () => {
  const uploadsDir = getAbsolutePath(env.ROOT_DIR || "uploads");
  const pathExists = await Bun.file(uploadsDir).exists();
  if (!pathExists) await mkdir(uploadsDir, { recursive: true });
  await $`find ${uploadsDir}/* -name "temp_*" -mtime +1 -delete`
    .quiet()
    .catch(() => {});
  return uploadsDir;
};
