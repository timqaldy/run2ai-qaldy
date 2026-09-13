export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return digits;
  if (digits.length === 10 && digits.startsWith("7")) return `7${digits}`;
  return digits;
}

export function isValidPhone(input: string): boolean {
  return /^\d{10,15}$/.test(normalizePhone(input));
}

export function whatsappLink(phone: string, message?: string) {
  const base = `https://wa.me/${normalizePhone(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
