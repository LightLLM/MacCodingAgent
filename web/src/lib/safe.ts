export function clampText(value: string, max = 20_000): string {
  return value.length > max ? value.slice(0, max) : value;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
