import { env } from "bun";
import db from "~/utils/database";
import { getUri } from "../utils/get-uri";

const { ROOT_DIR } = env;

export async function handleFiles(req: Request) {
  const filePath = getUri(req).replace("/", "");
  const file = Bun.file(`${ROOT_DIR}/${filePath}`);
  if (!(await file.exists())) {
    return new Response("File not found", { status: 404 });
  }
  db.run(`UPDATE files SET views = views + 1 WHERE name = '${filePath}'`);
  const [start = 0, end = Infinity] = req?.headers
    ?.get("Range")
    ?.split("=")
    ?.at(-1)
    ?.split("-")
    ?.map(Number) ?? [0, Infinity];

  return new Response(file.slice(start, end));
}
