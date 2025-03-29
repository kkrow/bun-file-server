import { env } from "bun";
import { EXPIRY_TIME, JWT_ALGORITHM, JWT_TYPE } from "./constants";
import { base64UrlDecode, base64UrlEncode } from "./encoding";
import type { JWTHeader, JWTPayload } from "./types";

const createSignature = (
  header: string,
  payload: string,
  secret: string,
): string => {
  return new Bun.CryptoHasher("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const createJWT = (username: string, password: string): string => {
  const header: JWTHeader = {
    alg: JWT_ALGORITHM,
    typ: JWT_TYPE,
  };

  const payload: JWTPayload = {
    username,
    exp: EXPIRY_TIME,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(encodedHeader, encodedPayload, password);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const verifyJWT = (token: string): JWTPayload | false => {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      return false;
    }

    const header: JWTHeader = JSON.parse(base64UrlDecode(encodedHeader));
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Проверка алгоритма
    if (header.alg !== JWT_ALGORITHM) {
      return false;
    }

    // Проверка срока действия
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    // Проверка подписи
    const { ADMINS } = env;
    if (ADMINS) {
      const admins = ADMINS.split(",");
      const isValidAdmin = admins.some((admin) => {
        const [adminUsername, adminPassword] = admin.split(":");
        const expectedSignature = createSignature(
          encodedHeader,
          encodedPayload,
          adminPassword || "",
        );
        return (
          expectedSignature === signature && adminUsername === payload.username
        );
      });

      if (!isValidAdmin) {
        return false;
      }
    }

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return false;
  }
};

export { createJWT, verifyJWT };
