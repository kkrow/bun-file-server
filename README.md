# bun-file-server

## Features:

- File Upload:
  - ShareX compatibility
  - Support for files of any size
  - Automatic random name generation
  - Upload progress tracking
  - Drag-and-drop

- File Management:
  - File listing
  - Deletion via special URLs
  - View tracking
  - Partial download support

- URL Shortening:
  - ShareX compatibility
  - Short link creation
  - Custom short URLs
  - Deletion via special links
  - View tracking

- Administrative Features:
  - Statistics viewing
  - File management
  - System monitoring

- Technical Features:
  - Simple stateless user authentication
  - SQLite for metadata storage
  - HTTPS support

## Preview

https://github.com/user-attachments/assets/c03c7993-4938-42c0-b370-d3598f0d728d

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To build and run:

```bash
bun run build
./bun-file-server
```

This project was created using `bun init` in bun v1.2.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
