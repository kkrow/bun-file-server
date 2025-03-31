import db from "~/utils/database";

/**
 * Handles shortened URL deletion requests using a unique deletion URL
 * @param req - HTTP request containing the deletion URL
 * @returns Response indicating success or error
 */
export async function handleDeleteUrl(req: Request) {
  // Extract deletion URL from request path
  const delUrl = req.url.split("/").pop();

  // Find URL record in database using deletion URL
  const url = db
    .query(`SELECT * FROM urls WHERE deletionUrl = '${delUrl}'`)
    .get();

  // Return error if URL not found
  if (!url) {
    return Response.json({ error: "URL not found" }, { status: 404 });
  }

  // Remove URL record from database
  db.run(`DELETE FROM urls WHERE deletionUrl = '${delUrl}'`);

  // Return success response
  return Response.json({ success: true });
}
