import { env } from "bun";
import { getUri } from "../utils/get-uri";

const toBoolean = (value: string | undefined) => value === "true";

const publicDir = toBoolean(env.DEV)
  ? `${process.cwd()}/public`
  : `${process.cwd()}/dist`;

export async function handlePublic(req: Request) {
  const uri = getUri(req);
  const filePath = uri.replace("/public/", "");
  // If path is empty or ends with /, use index.html
  const finalPath =
    !filePath || filePath.endsWith("/") ? "index.html" : filePath;
  const fullPath = `${publicDir}/${finalPath}`;
  const file = Bun.file(fullPath);

  if (!(await file.exists())) {
    return new Response("File not found", { status: 404 });
  }
  return new Response(file);
}
