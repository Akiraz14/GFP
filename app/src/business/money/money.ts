// Montos de la aplicación (D-01, I-04): se guardan en centavos enteros y se muestran con el
// formato colombiano «$1.250.000,00». El formato se calcula aquí, sin depender del soporte
// de idiomas del motor de JavaScript.

// 999.999.999.999,99: doce dígitos enteros y dos decimales (I-04).
export const MAX_AMOUNT_CENTS = 99_999_999_999_999;

const DIGITS_ONLY = /^\d+$/;

function splitAmount(
  text: string,
): { integer: string; fraction: string } | null {
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // Con ambos separadores, el último es el decimal y el otro agrupa miles.
    const decimalAt = Math.max(lastComma, lastDot);
    const grouping = lastComma > lastDot ? '.' : ',';
    const integer = text.slice(0, decimalAt);
    if (integer.includes(text[decimalAt])) {
      return null;
    }
    const groups = integer.split(grouping);
    if (!groups.slice(1).every(group => group.length === 3)) {
      return null;
    }
    const fraction = text.slice(decimalAt + 1);
    return fraction.length === 0
      ? null
      : { integer: groups.join(''), fraction };
  }
  if (lastComma >= 0) {
    // Solo comas: una coma es el separador decimal colombiano.
    const parts = text.split(',');
    return parts.length === 2 && parts[1].length > 0
      ? { integer: parts[0], fraction: parts[1] }
      : null;
  }
  if (lastDot >= 0) {
    const parts = text.split('.');
    // Un único punto seguido de uno o dos dígitos se lee como decimal («45.50»); en otro
    // caso los puntos agrupan miles («45.500», «1.250.000»).
    if (parts.length === 2 && parts[1].length >= 1 && parts[1].length <= 2) {
      return { integer: parts[0], fraction: parts[1] };
    }
    const grouped = parts.slice(1).every(part => part.length === 3);
    return grouped ? { integer: parts.join(''), fraction: '' } : null;
  }
  return { integer: text, fraction: '' };
}

// Convierte lo que escribe el usuario en centavos. Devuelve null si el texto no es un monto
// positivo, mayor que cero, con máximo dos decimales y dentro del máximo (HU4-CA05).
export function parseAmountInput(raw: string): number | null {
  const text = raw.replace(/[\s$]/g, '');
  if (text.length === 0) {
    return null;
  }
  const parts = splitAmount(text);
  if (parts === null) {
    return null;
  }
  const { integer, fraction } = parts;
  if (
    !DIGITS_ONLY.test(integer) ||
    (fraction.length > 0 && !DIGITS_ONLY.test(fraction)) ||
    fraction.length > 2 ||
    integer.length > 15
  ) {
    return null;
  }
  const cents = Number(integer) * 100 + Number(fraction.padEnd(2, '0') || '0');
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) {
    return null;
  }
  return cents;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// «$1.250.000,00» (HU6-CA02, D-01). Un valor negativo se muestra «-$1.250,00».
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(Math.trunc(cents));
  const integer = Math.floor(absolute / 100).toString();
  const fraction = (absolute % 100).toString().padStart(2, '0');
  return `${sign}$${groupThousands(integer)},${fraction}`;
}

// Valor del campo «Monto» al editar un movimiento: «1250000,50».
export function amountInputFromCents(cents: number): string {
  const integer = Math.floor(cents / 100).toString();
  const fraction = (cents % 100).toString().padStart(2, '0');
  return `${integer},${fraction}`;
}
