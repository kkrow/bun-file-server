import { validateUser } from "~/utils/authorize-user";
import { baseUrl } from "~/utils/constants";
import db from "~/utils/database";
import { generateRandomName } from "~/utils/generate-random-name";

/**
 * Handles URL shortening requests
 * Creates a short URL that redirects to the original URL
 * @param req - HTTP request containing the URL to shorten
 * @returns Response with shortened URL details or error
 */
export async function handleShorten(req: Request) {
  // Validate user authentication
  const valid = await validateUser(req, "user");
  if (!valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract URL and optional custom short code from form data
  const formData = await req.formData();
  const url = formData.get("url");
  // Use provided short code or generate a random one
  const short = formData.get("short") ?? (await generateRandomName("", true));

  // Validate URL presence
  if (!url) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url as string);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  // Generate deletion URL and save to database
  const date = Date.now();
  const deletionUrl = await generateRandomName("", true);
  try {
    db.run(
      `INSERT INTO urls (url, deletionUrl, short, views, date) VALUES ('${url}', '${deletionUrl}', '${short}', 0, ${date})`
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) {
      return Response.json(
        { error: "Short URL already exists" },
        { status: 400 }
      );
    }
    return Response.json({ error: "Failed to shorten URL" }, { status: 400 });
  }

  // Return shortened URL details
  return Response.json({
    filename: short,
    url: `${baseUrl}/u/${short}`,
    date,
    deletionUrl: `${baseUrl}/api/delete-url/${deletionUrl}`,
  });
}
