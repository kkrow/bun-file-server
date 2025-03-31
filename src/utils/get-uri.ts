/**
 * Extracts the pathname from a request URL
 * @param req - HTTP request object
 * @returns Pathname portion of the URL (e.g., "/files/example.txt")
 */
export const getUri = (req: Request) => {
  return new URL(req.url).pathname;
};
