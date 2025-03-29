import { env } from "bun";
import { createWriteStream } from "fs";
import { validateUser } from "~/utils/authorize-user";
import { baseUrl } from "~/utils/constants";
import db from "~/utils/database";
import { generateRandomName } from "~/utils/generate-random-name";
import { humanReadableSize } from "~/utils/human-filesize";

const { ROOT_DIR } = env;

interface UploadResult {
  success: boolean;
  name?: string;
  url?: string;
  deletionUrl?: string;
  date?: number;
  size?: string;
  error?: string;
}

async function cleanupResources(
  reader: ReadableStreamDefaultReader | null,
  writeStream: ReturnType<typeof createWriteStream> | null,
) {
  if (reader) {
    reader.releaseLock();
    reader = null;
  }
  if (writeStream) {
    writeStream.end();
    writeStream = null;
  }
  Bun.gc(true);
}

async function processFileChunk(
  buffer: Buffer<ArrayBuffer>,
  boundary: string,
  writeStream: ReturnType<typeof createWriteStream>,
  isWritingFile: boolean,
  headerFound: boolean,
  options: { randomizeName: boolean },
): Promise<{
  buffer: Buffer<ArrayBuffer>;
  isWritingFile: boolean;
  headerFound: boolean;
  bytesWritten: number;
  options: { randomizeName: boolean };
}> {
  let bytesWritten = 0;
  let newBuffer = Buffer.from(buffer) as Buffer<ArrayBuffer>;

  if (!headerFound) {
    const headerEnd = newBuffer.indexOf("\r\n\r\n");
    if (headerEnd !== -1) {
      const header = newBuffer.slice(0, headerEnd).toString();
      if (header.includes('name="randomizeName"')) {
        options.randomizeName = true;
      }
      isWritingFile = true;
      headerFound = true;
      newBuffer = newBuffer.slice(headerEnd + 4) as Buffer<ArrayBuffer>;
    }
  }

  if (isWritingFile) {
    const boundaryPos = newBuffer.indexOf(boundary);
    if (boundaryPos !== -1) {
      const chunk = newBuffer.slice(0, boundaryPos - 2);
      writeStream.write(chunk);
      bytesWritten += chunk.length;

      newBuffer = newBuffer.slice(
        boundaryPos + boundary.length,
      ) as Buffer<ArrayBuffer>;
      isWritingFile = false;
      headerFound = false;
    } else {
      const chunk = newBuffer.slice(0, newBuffer.length - 100);
      if (chunk.length > 0) {
        writeStream.write(chunk);
        bytesWritten += chunk.length;
      }
      newBuffer = newBuffer.slice(
        newBuffer.length - 100,
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

async function handleFileUpload(
  req: Request,
  boundary: string,
  fileName: string,
): Promise<UploadResult> {
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
    writeStream = createWriteStream(tempPath);
    const stream = req.body as ReadableStream;
    reader = stream.getReader();

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
        options,
      );

      buffer = result.buffer;
      isWritingFile = result.isWritingFile;
      headerFound = result.headerFound;
      bytesRead += result.bytesWritten;
      options = result.options;
    }

    if (buffer.length > 0) {
      writeStream.write(buffer);
      bytesRead += buffer.length;
    }

    await new Promise<void>((resolve, reject) => {
      writeStream?.end((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    buffer = Buffer.alloc(0) as Buffer<ArrayBuffer>;

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

    Bun.gc(true);
    const date = Date.now();
    const deletionUrl = await generateRandomName("", true);
    db.run(
      `INSERT INTO files (name, deletionUrl, size, date, views) VALUES ('${finalFileName}', '${deletionUrl}', ${bytesRead}, ${date}, 0)`,
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
    await cleanupResources(reader, writeStream);
    buffer = Buffer.alloc(0) as Buffer<ArrayBuffer>;
    Bun.gc(true);
  }
}

export async function handleUpload(req: Request): Promise<Response> {
  Bun.gc(true);
  const valid = await validateUser(req, "user");
  if (!valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    return new Response("Invalid content type", { status: 400 });
  }

  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    return new Response("Invalid multipart boundary", { status: 400 });
  }

  const fileName = req.headers.get("x-file-name");
  if (!fileName) {
    return new Response("No filename provided", { status: 400 });
  }

  try {
    const result = await handleFileUpload(req, boundary, fileName);
    return Response.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to save file",
      },
      { status: 500 },
    );
  }
}
