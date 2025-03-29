import { env } from "bun";
import db, { type UploadedFile } from "~/utils/database";

const { ROOT_DIR } = env;

export async function handleDeleteFile(req: Request) {
  const deletionUrl = req.url.split("/").pop();
  const file = db
    .query(`SELECT * FROM files WHERE deletionUrl = '${deletionUrl}'`)
    .get() as UploadedFile;
  if (!file) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
  await Bun.file(`${ROOT_DIR}/${file.name}`).delete();
  db.run(`DELETE FROM files WHERE deletionUrl = '${deletionUrl}'`);
  return Response.json({ success: true });
}
