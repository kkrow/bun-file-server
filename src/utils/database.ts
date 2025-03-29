import { Database } from "bun:sqlite";

const db = new Database("./db.sqlite");

db.run(
  `CREATE TABLE IF NOT EXISTS files (
    name TEXT NOT NULL PRIMARY KEY UNIQUE,
    deletionUrl TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    size INTEGER NOT NULL,
    date INTEGER NOT NULL
  )`,
);

db.run(
  `CREATE TABLE IF NOT EXISTS urls (
    short TEXT NOT NULL PRIMARY KEY UNIQUE,
    deletionUrl TEXT,
    url TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    date INTEGER NOT NULL
  )`,
);

export type UploadedFile = {
  name: string;
  views: number;
  size: number;
  date: number;
};

export type ShortUrl = {
  short: string;
  url: string;
  views: number;
  date: number;
};

export default db;
