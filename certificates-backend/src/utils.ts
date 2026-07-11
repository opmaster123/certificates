/**
 * Derives a deterministic 10-character certificate number from a ULID.
 * E.g., "KH" + last 8 characters of the ULID (random Base32 part).
 */
export function deriveCertificateNumber(ulidStr: string): string {
  if (!ulidStr || ulidStr.length < 8) {
    return `KH${ulidStr || ''}`;
  }
  return `KH${ulidStr.slice(-8).toUpperCase()}`;
}

