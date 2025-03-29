import { validateUser } from "~/utils/authorize-user";
import { baseUrl } from "~/utils/constants";
import db from "~/utils/database";
import { generateRandomName } from "~/utils/generate-random-name";

export async function handleShorten(req: Request) {
  const valid = await validateUser(req, "user");
  if (!valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await req.formData();
  const url = formData.get("url");
  const short = formData.get("short") ?? (await generateRandomName("", true));
  if (!url) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    new URL(url as string);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }
  const date = Date.now();
  const deletionUrl = await generateRandomName("", true);
  db.run(
    `INSERT INTO urls (url, deletionUrl, short, views, date) VALUES ('${url}', '${deletionUrl}', '${short}', 0, ${date})`,
  );
  return Response.json({
    filename: short,
    url: `${baseUrl}/u/${short}`,
    date,
    deletionUrl: `${baseUrl}/api/delete-url/${deletionUrl}`,
  });
}
