export const base64UrlEncode = (data: string): string => {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const base64UrlDecode = (data: string): string => {
  return Buffer.from(data, "base64").toString("utf-8");
};
