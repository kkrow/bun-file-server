export const getUri = (req: Request) => {
  return new URL(req.url).pathname;
};
