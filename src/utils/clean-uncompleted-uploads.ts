import { $, env } from "bun";
import { resolve } from "path";

const getAbsolutePath = (path: string): string => {
  return resolve(process.cwd(), path);
};

export const cleanUncompletedUploads = async () => {
  const uploadsDir = getAbsolutePath(env.ROOT_DIR || "/uploads");
  await $`find ${uploadsDir}/* -name "temp_*" -mtime +1 -delete`;
  return uploadsDir;
};
