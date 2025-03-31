import { env } from "bun";
import db from "~/utils/database";
import { getUri } from "../utils/get-uri";

// Get root directory for file storage from environment variables
const { ROOT_DIR = "./uploads" } = env;

/**
 * Handles file requests with support for range requests (partial downloads)
 * @param req - HTTP request containing file path and optional range header
 * @returns Response with file content or appropriate error
 */
export async function handleFiles(req: Request) {
  // Extract file path from request URI
  const filePath = getUri(req).replace("/", "");
  const file = Bun.file(`${ROOT_DIR}/${filePath}`);

  // Check if file exists
  if (!(await file.exists())) {
    return new Response("File not found", { status: 404 });
  }

  // Check if this is a range request
  const rangeHeader = req.headers.get("range");
  if (!rangeHeader) {
    // For full file requests, increment view counter and return entire file
    db.run(`UPDATE files SET views = views + 1 WHERE name = '${filePath}'`);
    return new Response(file);
  }

  // Handle range request for partial file download
  const fileSize = file.size;
  const parts = rangeHeader.replace(/bytes=/, "").split("-");

  // Validate range header format
  if (parts.length < 1 || !parts[0]) {
    return new Response("Invalid Range header", { status: 400 });
  }

  // Parse range start and end positions
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunkSize = end - start + 1;

  // Read file content and extract requested range
  const fileStream = await file.arrayBuffer();
  const chunk = fileStream.slice(start, end + 1);

  // Return partial content with appropriate headers
  return new Response(chunk, {
    status: 206, // Partial Content
    headers: {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize.toString(),
    },
  });
}
