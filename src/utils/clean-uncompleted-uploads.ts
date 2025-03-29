import { $, env } from "bun";

export const cleanUncompletedUploads = async () => {
  const uploadsDir = env.ROOT_DIR || "/uploads";
  await $`find ${uploadsDir}/* -name "temp_*" -mtime +1 -delete`;
};
