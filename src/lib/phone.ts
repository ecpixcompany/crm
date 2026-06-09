export function normalizePhone(raw: string | null | undefined, defaultCountry = "+57"): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) return null;

  if (hasPlus) return `+${digits}`;

  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;

  return `${defaultCountry}${digits}`;
}
