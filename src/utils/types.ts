export interface JWTPayload {
  username: string;
  exp: number;
}

export interface JWTHeader {
  alg: string;
  typ: string;
}
