/**
 * Converts a number of bytes into a human-readable string
 * Automatically selects appropriate unit (bytes, KB, MB, GB, TB)
 * @param bytes - Number of bytes to format
 * @returns Formatted string with size and unit (e.g., "1.5 MB")
 */
export function humanReadableSize(bytes: number): string {
  // Define available units in order of size
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let index = 0;
  let size = bytes;

  // Convert to larger units while size is >= 1024 and we have more units
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  // Return formatted string with 2 decimal places
  return `${size.toFixed(2)} ${units[index]}`;
}
