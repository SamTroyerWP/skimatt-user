/**
 * Normalize phone numbers to a consistent +E.164-ish form (digits with leading +).
 * Keeps lookups/sign-in reliable across signup and login flows.
 */
export function normalizePhoneNumber(value) {
  if (value == null) return '';
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  return `+${digits}`;
}
