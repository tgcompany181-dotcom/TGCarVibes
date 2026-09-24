export const money = (n: number) =>
  '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const km = (n: number | null) => (n == null ? '—' : n.toLocaleString('en-AU') + ' km');

/** Normalise an Australian mobile ("0412 558 203", "+61 412…") to "61412558203". */
export function toIntlPhone(input: string): string | null {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('0')) d = '61' + d.slice(1);
  else if (d.length === 9 && d.startsWith('4')) d = '61' + d;
  return /^61\d{9}$/.test(d) ? d : null;
}

/** "61412558203" → "0412 558 203" */
export function displayPhone(intl: string): string {
  const local = intl.startsWith('61') ? '0' + intl.slice(2) : intl;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}

export const whatsappLink = (intlPhone: string, text?: string) =>
  `https://wa.me/${intlPhone}` + (text ? `?text=${encodeURIComponent(text)}` : '');

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
