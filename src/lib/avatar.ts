const AVATAR_COLORS = [
  '#0f172a',
  '#475569',
  '#0891b2',
  '#7c3aed',
  '#db2777',
] as const;

function safe(input: string | null | undefined): string {
  return (input ?? '').trim();
}

function firstCharOr(input: string | null | undefined, fallback: string): string {
  const c = safe(input).charAt(0);
  return c || fallback;
}

export function getInitials(n: string | null | undefined): string;
export function getInitials(n: string | null | undefined, a: string | null | undefined): string;
export function getInitials(n: string | null | undefined, a?: string | null): string {
  const isTwoArg = arguments.length >= 2;
  if (!isTwoArg) {
    return (
      safe(n)
        .split(/\s+/)
        .map((word) => word.charAt(0))
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'
    );
  }
  const first = firstCharOr(n, '?');
  const second = firstCharOr(a, '?');
  return (first + second).toUpperCase();
}

export function getAvatarColor(nombre: string | null | undefined): string {
  const value = safe(nombre);
  if (!value) return AVATAR_COLORS[0];
  return AVATAR_COLORS[value.charCodeAt(0) % AVATAR_COLORS.length];
}
