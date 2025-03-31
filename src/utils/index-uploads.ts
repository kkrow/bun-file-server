import { env } from "bun";
import { mkdir, readdir } from "node:fs/promises";
import db from "./database";

const dir = env.ROOT_DIR || "uploads";

const indexUploads = async () => {
  const pathExists = await Bun.file(dir).exists();
  if (!pathExists) await mkdir(dir, { recursive: true });
  const files = await readdir(dir);
  if (files.length === 0) return;
  const dbFiles = db.query(`SELECT name FROM files`).all() as {
    name: string;
  }[];

  for (const file of files) {
    if (!dbFiles.find((f) => f.name === file)) {
      const stat = await Bun.file(`${dir}/${file}`).stat();
      db.run(
        `INSERT INTO files (name, views, size, date) VALUES ('${file}', 0, ${stat.size}, ${stat.mtimeMs})`
      );
    }
  }
  // Remove files from db that are not in the directory
  for (const file of dbFiles) {
    if (!files.find((f) => f === file.name)) {
      db.run(`DELETE FROM files WHERE name = '${file.name}'`);
    }
  }
};

export default indexUploads;
