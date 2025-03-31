import { env } from "bun";
import { createJWT, verifyJWT } from "./jwt";

// Get environment variables for admin and user credentials
const { ADMINS, USERS } = env;

// Define the structure for user credentials
interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Parses a string of credentials in format "username:password,username:password"
 * into an array of UserCredentials objects
 * @param credentialsString - String containing comma-separated credentials
 * @returns Array of valid UserCredentials objects
 */
function parseCredentials(credentialsString: string): UserCredentials[] {
  if (!credentialsString) return [];
  return (
    credentialsString
      .split(",")
      .map((cred) => {
        const [username, password] = cred.split(":");
        // Skip invalid credentials where username or password is missing
        if (!username || !password) return { username: "", password: "" };
        return { username, password };
      })
      // Filter out any invalid credentials
      .filter((cred) => cred.username && cred.password)
  );
}

/**
 * Extracts JWT token from cookie string
 * @param cookie - Cookie string from request headers
 * @returns JWT token if found, null otherwise
 */
function getTokenFromCookie(cookie: string | null): string | null {
  if (!cookie) return null;
  // Extract token value from cookie string using regex
  const tokenMatch = cookie.match(/token=([^;]+)/);
  return tokenMatch?.[1] ?? null;
}

/**
 * Validates user authentication based on request and user type
 * @param req - HTTP request object
 * @param type - Type of user to validate ("admin" or "user")
 * @returns true if admin with valid JWT, JWT string if admin login successful,
 *         true if user password matches, false otherwise
 */
export async function validateUser(
  req: Request,
  type: "admin" | "user",
): Promise<boolean | string> {
  // First try to validate using JWT token from cookie
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const token = getTokenFromCookie(cookie);
    // If token exists and admin credentials are configured
    if (token && ADMINS) {
      const decoded = verifyJWT(token);
      if (decoded) {
        return true;
      }
    }
  }

  // Handle admin authentication
  if (type === "admin") {
    const password = req.headers.get("x-admin-password");
    // Check if password exists and admin credentials are configured
    if (!password || !ADMINS) return false;

    const admins = parseCredentials(ADMINS);
    const admin = admins.find((a) => a.password === password);

    if (!admin) return false;

    // Create and return new JWT token for successful admin login
    return createJWT(admin.username, admin.password);
  }

  // Handle regular user authentication
  if (type === "user") {
    // Clone request to read form data without consuming the original request
    const request = req.clone();
    const formData = await request.formData();
    const password = formData.get("password")?.toString();

    // Check if password exists and user credentials are configured
    if (!password || !USERS) return false;

    const users = parseCredentials(USERS);
    // Return true if any user's password matches
    return users.some((u) => u.password === password);
  }

  return false;
}
