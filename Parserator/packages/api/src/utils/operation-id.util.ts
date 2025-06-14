/**
 * Generates a unique operation ID for tracking.
 * @param prefix - An optional prefix for the ID (e.g., 'parse', 'arch', 'ext').
 * @returns A unique operation ID string.
 */
export function generateOperationId(prefix: string = 'op'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}
