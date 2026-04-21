const SAFE_DEFAULT = '/portal';

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value) return SAFE_DEFAULT;

  try {
    const trimmed = value.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return SAFE_DEFAULT;
    if (/[:\s]/.test(trimmed)) return SAFE_DEFAULT;

    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith('//') || decoded.includes('://')) return SAFE_DEFAULT;

    return trimmed;
  } catch {
    return SAFE_DEFAULT;
  }
}
