import db, { type ShortUrl } from "~/utils/database";

export async function handleGetFullUrl(req: Request) {
  const short = req.url.split("/").pop();
  const url = db
    .query(`SELECT * FROM urls WHERE short = '${short}'`)
    .get() as ShortUrl;
  if (!url) {
    return Response.json({ error: "URL not found" }, { status: 404 });
  }
  db.run(`UPDATE urls SET views = views + 1 WHERE short = '${short}'`);
  return Response.redirect(url.url);
}
