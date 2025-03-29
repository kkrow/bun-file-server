import { getUri } from "../utils/get-uri";

const publicDir = `${process.cwd()}/public`;

export async function handlePublic(req: Request) {
  const uri = getUri(req);
  const filePath = uri.replace("/public/", "");
  // Если путь пустой или заканчивается на /, используем index.html
  const finalPath =
    !filePath || filePath.endsWith("/") ? "index.html" : filePath;
  const fullPath = `${publicDir}/${finalPath}`;
  const file = Bun.file(fullPath);

  if (!(await file.exists())) {
    return new Response("File not found", { status: 404 });
  }
  return new Response(file);
}
