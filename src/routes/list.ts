import { validateUser } from "~/utils/authorize-user";
import { EXPIRY_TIME } from "~/utils/constants";
import db, { type UploadedFile } from "~/utils/database";
import { humanReadableSize } from "~/utils/human-filesize";

/**
 * Handles requests to list all uploaded files
 * Only accessible by admin users
 * @param req - HTTP request
 * @returns Response with list of files or error
 */
export async function handleList(req: Request) {
  // Validate admin authentication
  const valid = await validateUser(req, "admin");
  if (!valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Query all files from database and format their sizes
  const files = db
    .query(`SELECT * FROM files`)
    .all()
    .map((item) => {
      const file = item as UploadedFile;
      return {
        ...file,
        // Convert file size to human-readable format (e.g., "1.5 MB")
        size: humanReadableSize(file.size),
      };
    });

  // Return file list with optional JWT cookie for admin authentication
  return Response.json(
    { files },
    {
      status: 200,
      headers:
        // If valid is a string (JWT token), set it as a cookie
        typeof valid === "string"
          ? {
              "Set-Cookie": `token=${valid}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${EXPIRY_TIME}`,
            }
          : undefined,
    },
  );
}
