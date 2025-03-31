import { Database } from "bun:sqlite";

// Initialize SQLite database
const db = new Database("./db.sqlite");

/**
 * Create files table if it doesn't exist
 * Stores information about uploaded files:
 * - name: Unique filename
 * - deletionUrl: URL for file deletion
 * - views: Number of times file was accessed
 * - size: File size in bytes
 * - date: Upload timestamp
 */
db.run(
  `CREATE TABLE IF NOT EXISTS files (
    name TEXT NOT NULL PRIMARY KEY UNIQUE,
    deletionUrl TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    size INTEGER NOT NULL,
    date INTEGER NOT NULL
  )`,
);

/**
 * Create urls table if it doesn't exist
 * Stores information about shortened URLs:
 * - short: Unique short code
 * - deletionUrl: URL for deletion
 * - url: Original URL
 * - views: Number of times URL was accessed
 * - date: Creation timestamp
 */
db.run(
  `CREATE TABLE IF NOT EXISTS urls (
    short TEXT NOT NULL PRIMARY KEY UNIQUE,
    deletionUrl TEXT,
    url TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    date INTEGER NOT NULL
  )`,
);

/**
 * Type definition for uploaded file records
 */
export type UploadedFile = {
  name: string; // Filename
  views: number; // Number of views
  size: number; // File size in bytes
  date: number; // Upload timestamp
};

/**
 * Type definition for shortened URL records
 */
export type ShortUrl = {
  short: string; // Short code
  url: string; // Original URL
  views: number; // Number of views
  date: number; // Creation timestamp
};

export default db;
