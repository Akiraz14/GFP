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

// Máscara del campo «Monto» (E-COR-D3, reemplaza la de Bug 40): los dígitos son pesos
// enteros («45500» → «45.500») y los decimales empiezan solo cuando el usuario escribe un
// separador decimal, «,» o «.» («45500,50» → «45.500,50»). La pantalla siempre agrupa los
// miles con «.» y separa los decimales con «,» (D-01), y el texto se lee con
// `parseAmountInput()`. Admite 12 dígitos enteros y 2 decimales (MAX_AMOUNT_CENTS).
export const MAX_AMOUNT_INTEGER_DIGITS = 12;
const MAX_AMOUNT_DECIMALS = 2;

type AmountParts = { integer: string; decimals: string | null };

function formatAmountParts({ integer, decimals }: AmountParts): string {
  const trimmed = integer.replace(/^0+(?=\d)/, '');
  if (decimals === null) {
    return trimmed === '' ? '' : groupThousands(trimmed);
  }
  return `${groupThousands(trimmed === '' ? '0' : trimmed)},${decimals}`;
}

function digitsOf(text: string): string {
  return text.replace(/\D/g, '');
}

function partsAt(text: string, decimalAt: number | null): AmountParts {
  const integer = digitsOf(
    decimalAt === null ? text : text.slice(0, decimalAt),
  ).slice(0, MAX_AMOUNT_INTEGER_DIGITS);
  const decimals =
    decimalAt === null
      ? null
      : digitsOf(text.slice(decimalAt + 1)).slice(0, MAX_AMOUNT_DECIMALS);
  return { integer, decimals };
}

// Lectura de un texto completo (pegado, precarga o edición de varios caracteres). Con «,» y
// «.» a la vez, el último es el decimal; con solo comas, la última; con solo puntos, el último
// es decimal si lo siguen uno o dos dígitos o nada, y en otro caso los puntos agrupan miles
// (la misma regla de E07-D5 en `parseAmountInput`).
export function maskAmountInput(raw: string): string {
  const text = raw.replace(/[^\d,.]/g, '');
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let decimalAt: number | null = null;
  if (lastComma >= 0 && lastDot >= 0) {
    decimalAt = Math.max(lastComma, lastDot);
  } else if (lastComma >= 0) {
    decimalAt = lastComma;
  } else if (lastDot >= 0 && text.length - lastDot - 1 <= MAX_AMOUNT_DECIMALS) {
    decimalAt = lastDot;
  }
  return formatAmountParts(partsAt(text, decimalAt));
}

function significantCount(text: string, end: number): number {
  return text.slice(0, end).replace(/[^\d,]/g, '').length;
}

function caretAfter(text: string, count: number): number {
  if (count <= 0) {
    return 0;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/[\d,]/.test(text[index])) {
      seen += 1;
      if (seen === count) {
        return index + 1;
      }
    }
  }
  return text.length;
}

export type AmountEdit = { text: string; caret: number };

// Aplica una edición del usuario sobre el valor que ya mostraba el campo. `previous` siempre
// está formateado, así que en él los puntos agrupan miles y la coma es el decimal. Un «,» o
// «.» que el usuario inserta abre los decimales en esa posición; si ya hay decimales, se
// ignora. El cursor queda después del mismo dígito que tenía a su izquierda.
export function applyAmountEdit(previous: string, raw: string): AmountEdit {
  let prefix = 0;
  while (
    prefix < previous.length &&
    prefix < raw.length &&
    previous[prefix] === raw[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < raw.length - prefix &&
    previous[previous.length - 1 - suffix] === raw[raw.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const inserted = raw.slice(prefix, raw.length - suffix);
  const removed = previous.slice(prefix, previous.length - suffix);
  const editEnd = raw.length - suffix;

  let text: string;
  if (removed.length === 0 && (inserted === ',' || inserted === '.')) {
    if (previous.includes(',')) {
      return { text: previous, caret: prefix };
    }
    const opened = formatAmountParts(partsAt(raw, prefix));
    return { text: opened, caret: opened.indexOf(',') + 1 };
  } else if (removed.length + inserted.length > 0 && inserted.length <= 1) {
    const comma = raw.indexOf(',');
    text = formatAmountParts(partsAt(raw, comma >= 0 ? comma : null));
  } else {
    text = maskAmountInput(raw);
  }
  return { text, caret: caretAfter(text, significantCount(raw, editEnd)) };
}

// Texto listo para `parseAmountInput()`: quita la coma final de «45.500,».
export function amountInputForParsing(text: string): string {
  return text.replace(/,$/, '');
}

// Valor del campo «Monto» al editar un movimiento o al precargarlo desde HU7: «1.250.000» o
// «1.250.000,50».
export function amountInputFromCents(cents: number): string {
  const absolute = Math.abs(Math.trunc(cents));
  const integer = Math.floor(absolute / 100).toString();
  const fraction = absolute % 100;
  return formatAmountParts({
    integer,
    decimals: fraction === 0 ? null : fraction.toString().padStart(2, '0'),
  });
}
