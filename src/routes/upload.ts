import { env } from "bun";
import { createWriteStream } from "fs";
import { validateUser } from "~/utils/authorize-user";
import { baseUrl } from "~/utils/constants";
import db from "~/utils/database";
import { generateRandomName } from "~/utils/generate-random-name";
import { humanReadableSize } from "~/utils/human-filesize";

// Get root directory for file storage from environment variables
const { ROOT_DIR = "uploads" } = env;

/**
 * Interface defining the structure of the upload response
 */
interface UploadResult {
  success: boolean;
  name?: string; // Final filename
  url?: string; // URL to access the file
  deletionUrl?: string; // URL to delete the file
  date?: number; // Upload timestamp
  size?: string; // Human-readable file size
  error?: string; // Error message if upload failed
}

/**
 * Cleans up resources used during file upload
 * @param reader - Stream reader for reading the request body
 * @param writeStream - File write stream
 */
async function cleanupResources(
  reader: ReadableStreamDefaultReader | null,
  writeStream: ReturnType<typeof createWriteStream> | null
) {
  if (reader) {
    reader.releaseLock();
    reader = null;
  }
  if (writeStream) {
    writeStream.end();
    writeStream = null;
  }
  // Force garbage collection to free up memory
  Bun.gc(true);
}

/**
 * Processes a chunk of the uploaded file
 * @param buffer - Current buffer containing file data
 * @param boundary - Multipart form boundary
 * @param writeStream - Stream to write file data
 * @param isWritingFile - Whether we're currently writing file content
 * @param headerFound - Whether we've found the file header
 * @param options - Upload options (e.g., randomizeName)
 * @returns Processed buffer and updated state
 */
async function processFileChunk(
  buffer: Buffer<ArrayBuffer>,
  boundary: string,
  writeStream: ReturnType<typeof createWriteStream>,
  isWritingFile: boolean,
  headerFound: boolean,
  options: { randomizeName: boolean }
): Promise<{
  buffer: Buffer<ArrayBuffer>;
  isWritingFile: boolean;
  headerFound: boolean;
  bytesWritten: number;
  options: { randomizeName: boolean };
}> {
  let bytesWritten = 0;
  let newBuffer = Buffer.from(buffer) as Buffer<ArrayBuffer>;

  // Process file header if not found yet
  if (!headerFound) {
    const headerEnd = newBuffer.indexOf("\r\n\r\n");
    if (headerEnd !== -1) {
      const header = newBuffer.slice(0, headerEnd).toString();
      // Check if filename should be randomized
      if (header.includes('name="randomizeName"')) {
        options.randomizeName = true;
      }
      isWritingFile = true;
      headerFound = true;
      newBuffer = newBuffer.slice(headerEnd + 4) as Buffer<ArrayBuffer>;
    }
  }

  // Write file content if we're in the file section
  if (isWritingFile) {
    const boundaryPos = newBuffer.indexOf(boundary);
    if (boundaryPos !== -1) {
      // Write chunk up to boundary
      const chunk = newBuffer.slice(0, boundaryPos - 2);
      writeStream.write(chunk);
      bytesWritten += chunk.length;

      // Move buffer past boundary
      newBuffer = newBuffer.slice(
        boundaryPos + boundary.length
      ) as Buffer<ArrayBuffer>;
      isWritingFile = false;
      headerFound = false;
    } else {
      // Write most of the buffer, keeping some for boundary detection
      const chunk = newBuffer.slice(0, newBuffer.length - 100);
      if (chunk.length > 0) {
        writeStream.write(chunk);
        bytesWritten += chunk.length;
      }
      newBuffer = newBuffer.slice(
        newBuffer.length - 100
      ) as Buffer<ArrayBuffer>;
    }
  }

  return {
    buffer: newBuffer,
    isWritingFile,
    headerFound,
    bytesWritten,
    options,
  };
}

/**
 * Handles the complete file upload process
 * @param req - HTTP request containing the file
 * @param boundary - Multipart form boundary
 * @param fileName - Original filename
 * @returns Upload result with file details
 */
async function handleFileUpload(
  req: Request,
  boundary: string,
  fileName: string
): Promise<UploadResult> {
  // Create temporary and final file paths
  const tempPath = `${ROOT_DIR}/temp_${Date.now()}_${fileName}`;
  const finalPath = `${ROOT_DIR}/${fileName}`;

  let writeStream: ReturnType<typeof createWriteStream> | null = null;
  let reader: ReadableStreamDefaultReader | null = null;
  let buffer = Buffer.alloc(0) as Buffer<ArrayBuffer>;
  let isWritingFile = false;
  let headerFound = false;
  let bytesRead = 0;
  let options = { randomizeName: true };

  try {
    // Set up file writing stream
    writeStream = createWriteStream(tempPath);
    const stream = req.body as ReadableStream;
    reader = stream.getReader();

    // Process the file stream chunk by chunk
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer = Buffer.concat([buffer, value]) as Buffer<ArrayBuffer>;
      const result = await processFileChunk(
        buffer,
        boundary,
        writeStream,
        isWritingFile,
        headerFound,
        options
      );

      buffer = result.buffer;
      isWritingFile = result.isWritingFile;
      headerFound = result.headerFound;
      bytesRead += result.bytesWritten;
      options = result.options;
    }

    // Write any remaining buffer content
    if (buffer.length > 0) {
      writeStream.write(buffer);
      bytesRead += buffer.length;
    }

    // Wait for write stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream?.end((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    buffer = Buffer.alloc(0) as Buffer<ArrayBuffer>;

    // Handle final file placement
    let finalFileName = fileName;
    if (options.randomizeName) {
      finalFileName = await generateRandomName(fileName);
      const newFinalPath = `${ROOT_DIR}/${finalFileName}`;
      await Bun.write(newFinalPath, Bun.file(tempPath));
      await Bun.file(tempPath).delete();
    } else {
      await Bun.write(finalPath, Bun.file(tempPath));
      await Bun.file(tempPath).delete();
    }

    // Clean up and prepare response
    Bun.gc(true);
    const date = Date.now();
    const deletionUrl = await generateRandomName("", true);

    // Save file metadata to database
    db.run(
      `INSERT INTO files (name, deletionUrl, size, date, views) VALUES ('${finalFileName}', '${deletionUrl}', ${bytesRead}, ${date}, 0)`
    );

    return {
      success: true,
      name: finalFileName,
      url: `${baseUrl}/${finalFileName}`,
      deletionUrl: `${baseUrl}/api/delete-file/${deletionUrl}`,
      date: date,
      size: humanReadableSize(bytesRead),
    };
  } finally {
    // Clean up resources
    await cleanupResources(reader, writeStream);
    buffer = Buffer.alloc(0) as Buffer<ArrayBuffer>;
    Bun.gc(true);
  }
}

/**
 * Main upload handler that validates the request and initiates file upload
 * @param req - HTTP request containing the file
 * @returns Response with upload result or error
 */
export async function handleUpload(req: Request): Promise<Response> {
  // Clean up memory before processing
  Bun.gc(true);

  // Validate user authentication
  const valid = await validateUser(req, "user");
  if (!valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate content type
  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    return new Response("Invalid content type", { status: 400 });
  }

  // Extract and validate multipart boundary
  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    return new Response("Invalid multipart boundary", { status: 400 });
  }

  // Validate filename
  const fileName = req.headers.get("x-file-name");
  if (!fileName) {
    return new Response("No filename provided", { status: 400 });
  }

  try {
    // Process the file upload
    const result = await handleFileUpload(req, boundary, fileName);
    return Response.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to save file",
      },
      { status: 500 }
    );
  }
}
