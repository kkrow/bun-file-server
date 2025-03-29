import { validateUser } from "~/utils/authorize-user";
import { EXPIRY_TIME } from "~/utils/constants";
import db, { type UploadedFile } from "~/utils/database";
import { humanReadableSize } from "~/utils/human-filesize";

export async function handleList(req: Request) {
  const valid = await validateUser(req, "admin");
  if (!valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const files = db
    .query(`SELECT * FROM files`)
    .all()
    .map((item) => {
      const file = item as UploadedFile;
      return {
        ...file,
        size: humanReadableSize(file.size),
      };
    });
  return Response.json(
    { files },
    {
      status: 200,
      headers:
        typeof valid === "string"
          ? {
              "Set-Cookie": `token=${valid}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${EXPIRY_TIME}`,
            }
          : undefined,
    },
  );
}
