import db, { type ShortUrl } from "~/utils/database";

/**
 * Handles requests to get the full URL from a shortened URL
 * Increments view counter and redirects to the original URL
 * @param req - HTTP request containing the shortened URL
 * @returns Redirect response to the original URL or error
 */
export async function handleGetFullUrl(req: Request) {
  // Extract shortened URL code from request path
  const short = req.url.split("/").pop();

  // Find URL record in database using short code
  const url = db
    .query(`SELECT * FROM urls WHERE short = '${short}'`)
    .get() as ShortUrl;

  // Return error if URL not found
  if (!url) {
    return Response.json({ error: "URL not found" }, { status: 404 });
  }

  // Increment view counter for the URL
  db.run(`UPDATE urls SET views = views + 1 WHERE short = '${short}'`);

  // Redirect to the original URL
  return Response.redirect(url.url);
}
