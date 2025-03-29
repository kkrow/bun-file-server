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

const { PORT, ADDRESS } = env;

indexUploads();
cleanUncompletedUploads();

setInterval(
  () => {
    indexUploads();
    cleanUncompletedUploads();
  },
  1000 * 60 * 60,
);

const server = serve({
  port: PORT,
  hostname: ADDRESS,
  maxRequestBodySize: Infinity,
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

console.debug(`Listening on localhost:${server.port}`);
