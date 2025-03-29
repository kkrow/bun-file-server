import { env } from "bun";
import { createJWT, verifyJWT } from "./jwt";

const { ADMINS, USERS } = env;

interface UserCredentials {
  username: string;
  password: string;
}

function parseCredentials(credentialsString: string): UserCredentials[] {
  if (!credentialsString) return [];
  return credentialsString.split(",").map((cred) => {
    const [username, password] = cred.split(":");
    return { username, password };
  });
}

function getTokenFromCookie(cookie: string | null): string | null {
  if (!cookie) return null;
  const tokenMatch = cookie.match(/token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

export async function validateUser(
  req: Request,
  type: "admin" | "user",
): Promise<boolean | string> {
  // Проверка JWT токена из cookie
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const token = getTokenFromCookie(cookie);
    if (token && ADMINS) {
      const decoded = verifyJWT(token);
      if (decoded) {
        return true;
      }
    }
  }

  // Проверка администратора
  if (type === "admin") {
    const password = req.headers.get("x-admin-password");
    if (!password || !ADMINS) return false;

    const admins = parseCredentials(ADMINS);
    const admin = admins.find((a) => a.password === password);

    if (!admin) return false;

    return createJWT(admin.username, admin.password);
  }

  // Проверка обычного пользователя
  if (type === "user") {
    const request = req.clone();
    const formData = await request.formData();
    const password = formData.get("password")?.toString();

    if (!password || !USERS) return false;

    const users = parseCredentials(USERS);
    return users.some((u) => u.password === password);
  }

  return false;
}
