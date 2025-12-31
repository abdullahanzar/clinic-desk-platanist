/**
 * Generate a receipt number in format: RCP-YYYY-NNNN
 * This is a simple sequential generator
 */
export function generateReceiptNumber(year: number, sequence: number): string {
  const paddedSequence = sequence.toString().padStart(4, "0");
  return `RCP-${year}-${paddedSequence}`;
}

/**
 * Extract year and sequence from a receipt number
 */
export function parseReceiptNumber(receiptNumber: string): { year: number; sequence: number } | null {
  const match = receiptNumber.match(/^RCP-(\d{4})-(\d+)$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}
