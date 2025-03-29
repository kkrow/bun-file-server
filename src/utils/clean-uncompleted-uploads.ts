import { $, env } from "bun";
import { cwd } from "node:process";

export const cleanUncompletedUploads = async () => {
  const uploadsDir = cwd() + (env.ROOT_DIR || "/uploads");
  await $`find ${uploadsDir}/* -name "temp_*" -mtime +1 -delete`;
};
