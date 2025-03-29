import db from "~/utils/database";

export async function handleDeleteUrl(req: Request) {
  const delUrl = req.url.split("/").pop();
  const url = db
    .query(`SELECT * FROM urls WHERE deletionUrl = '${delUrl}'`)
    .get();
  if (!url) {
    return Response.json({ error: "URL not found" }, { status: 404 });
  }
  db.run(`DELETE FROM urls WHERE deletionUrl = '${delUrl}'`);
  return Response.json({ success: true });
}
