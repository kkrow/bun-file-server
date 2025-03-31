import { env } from "bun";
import db, { type UploadedFile } from "~/utils/database";

// Get root directory for file storage from environment variables
const { ROOT_DIR = "./uploads" } = env;

/**
 * Handles file deletion requests using a unique deletion URL
 * @param req - HTTP request containing the deletion URL
 * @returns Response indicating success or error
 */
export async function handleDeleteFile(req: Request) {
  // Extract deletion URL from request path
  const deletionUrl = req.url.split("/").pop();

  // Find file in database using deletion URL
  const file = db
    .query(`SELECT * FROM files WHERE deletionUrl = '${deletionUrl}'`)
    .get() as UploadedFile;

  // Return error if file not found
  if (!file) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  // Delete physical file from storage
  await Bun.file(`${ROOT_DIR}/${file.name}`).delete();

  // Remove file record from database
  db.run(`DELETE FROM files WHERE deletionUrl = '${deletionUrl}'`);

  // Return success response
  return Response.json({ success: true });
}
