import { env, serve } from "bun";
import { handleDeleteFile } from "./routes/delete-file";
import { handleDeleteUrl } from "./routes/delete-url";
import { handleFiles } from "./routes/files";
import { handleGetFullUrl } from "./routes/get-full-url";
import { handleList } from "./routes/list";
import { handlePublic } from "./routes/public";
import { handleShorten } from "./routes/shorten";
import { handleUpload } from "./routes/upload";
import { cleanUncompletedUploads } from "./utils/clean-uncompleted-uploads";
import indexUploads from "./utils/index-uploads";

// Get server configuration from environment variables
const { PORT = 3000, ADDRESS = "0.0.0.0" } = env;

/**
 * Initialize the server by:
 * 1. Indexing existing uploads to track them
 * 2. Cleaning up any incomplete uploads
 */
indexUploads();
cleanUncompletedUploads();

/**
 * Set up periodic maintenance tasks:
 * - Index uploads every hour to keep track of new files
 * - Clean up incomplete uploads to free up space
 */
setInterval(
  () => {
    indexUploads();
    cleanUncompletedUploads();
  },
  1000 * 60 * 60 // Run every hour
);

/**
 * Configure and start the HTTP server with the following routes:
 * - "/" -> Redirects to "/public/" for the main interface
 * - "/:file" -> Handles direct file access
 * - "/api/upload" -> Handles file uploads
 * - "/api/delete-file/:deletionUrl" -> Handles file deletion
 * - "/api/list" -> Lists available files
 * - "/api/shorten" -> Creates shortened URLs
 * - "/api/delete-url/:deletionUrl" -> Handles URL deletion
 * - "/u/:short" -> Redirects shortened URLs to full URLs
 * - "/public/*" -> Serves static files from the public directory
 */
const server = serve({
  port: PORT,
  hostname: ADDRESS,
  maxRequestBodySize: Infinity, // Allow unlimited file uploads
  routes: {
    "/": Response.redirect("/public/"),
    "/:file": handleFiles,
    "/api/upload": handleUpload,
    "/api/delete-file/:deletionUrl": handleDeleteFile,
    "/api/list": handleList,
    "/api/shorten": handleShorten,
    "/api/delete-url/:deletionUrl": handleDeleteUrl,
    "/u/:short": handleGetFullUrl,
    "/public/*": handlePublic,
  },
});

// Log server startup information
console.debug(`Listening on ${server.hostname}:${server.port}`);
