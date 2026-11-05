import { parseDisplayDate } from '../business/dates/localDate';

// Extracción de Monto, Fecha y Comercio del texto del OCR (HU7-CA03). Regla del plan de
// evaluación: ante la duda, el campo queda vacío; nunca se adivina. Tomado de
// daniela888-li/GFP (6ec6d3c), con la fecha validada por `localDate`.

export type ReceiptData = {
  amountCents: number | null;
  // DD/MM/AAAA
  date: string | null;
  merchant: string | null;
};

const MONTHS: Record<string, string> = {
  ene: '01',
  feb: '02',
  mar: '03',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dic: '12',
};

const NOT_MERCHANT =
  /factura|fecha|total|subtotal|nit\b|hola|detalle|monto|valor|recibo|comprobante|tiquete|ticket|caja|cajero|direcci|tel[eé]f|cliente|iva\b/i;

export type RecognizedLine = {
  text: string;
  frame?: { top: number; left: number; height: number };
};

// El OCR entrega las columnas de una factura por separado: «FECHA DOCUMENTO:» en un bloque y su
// valor en otro. Une las líneas que están a la misma altura y las ordena de izquierda a derecha.
export function rowsFromLines(lines: readonly RecognizedLine[]): string {
  const placed = lines.filter(line => line.frame !== undefined);
  if (placed.length === 0) {
    return lines.map(line => line.text).join('\n');
  }
  const sorted = [...placed].sort(
    (a, b) => a.frame!.top - b.frame!.top || a.frame!.left - b.frame!.left,
  );
  const rows: { center: number; height: number; items: RecognizedLine[] }[] =
    [];
  for (const line of sorted) {
    const { top, height } = line.frame!;
    const center = top + height / 2;
    const row = rows.find(
      candidate =>
        Math.abs(candidate.center - center) <
        Math.min(candidate.height, height) * 0.6,
    );
    if (row === undefined) {
      rows.push({ center, height, items: [line] });
    } else {
      row.items.push(line);
    }
  }
  return rows
    .map(row =>
      [...row.items]
        .sort((a, b) => a.frame!.left - b.frame!.left)
        .map(line => line.text)
        .join(' '),
    )
    .join('\n');
}

// «45.500», «45,500», «1.234,50», «1,234.50», «45500» y «45.50». Tres dígitos tras el último
// separador son miles; uno o dos, decimales.
export function parseReceiptNumber(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d[\d.,]*$/.test(value)) {
    return null;
  }
  const separator = Math.max(value.lastIndexOf('.'), value.lastIndexOf(','));
  const tail = separator < 0 ? '' : value.slice(separator + 1);
  const hasDecimals = separator >= 0 && tail.length >= 1 && tail.length <= 2;
  const whole = (hasDecimals ? value.slice(0, separator) : value).replace(
    /[.,]/g,
    '',
  );
  if (whole.length === 0 || whole.length > 12) {
    return null;
  }
  const cents =
    Number(whole) * 100 + (hasDecimals ? Number(tail.padEnd(2, '0')) : 0);
  return cents > 0 ? cents : null;
}

function amountIn(line: string): number | null {
  const matches = line.replace(/%/g, ' ').match(/\d[\d.,]*\d|\d/g) ?? [];
  const last = matches[matches.length - 1];
  return last === undefined ? null : parseReceiptNumber(last);
}

function isTotalLine(line: string): boolean {
  return (
    /\btotal\b/i.test(line) &&
    !/sub\s*-?\s*total|total\s+(iva|inc|impuestos?|items?|art[ií]culos?|descuentos?|cargos?)/i.test(
      line,
    )
  );
}

function amountAt(lines: readonly string[], index: number): number | null {
  return (
    amountIn(lines[index]) ??
    (/^[$\s\d.,]+$/.test(lines[index + 1] ?? '')
      ? amountIn(lines[index + 1])
      : null)
  );
}

const AMOUNT_LABEL =
  /^\W*(monto|valor|importe|pagaste|pagado|compra por)\b(?!\s+(unitario|base|iva|inc|impuestos?|descuentos?|cuota))/i;

// Orden de confianza: total rotulado (en la misma línea o, si la etiqueta quedó sola, en la
// siguiente), «Monto» o «Valor» al inicio de la línea y, por último, un único valor con «$».
// «SUBTOTAL» y «TOTAL IVA» no cuentan. Con varios valores sin rótulo, el campo queda vacío.
function extractAmount(lines: readonly string[]): number | null {
  const indexes = lines.flatMap((line, index) =>
    isTotalLine(line) ? [index] : [],
  );
  const preferred = indexes.filter(index =>
    /pagar|neto|factura/i.test(lines[index]),
  );
  const labeled = lines.flatMap((line, index) =>
    AMOUNT_LABEL.test(line) ? [index] : [],
  );
  for (const index of [
    ...preferred.reverse(),
    ...indexes.reverse(),
    ...labeled,
  ]) {
    const amount = amountAt(lines, index);
    if (amount !== null) {
      return amount;
    }
  }
  const withSign = new Set(
    lines.flatMap(line =>
      [...line.matchAll(/\$\s*(\d[\d.,]*\d|\d)/g)]
        .map(match => parseReceiptNumber(match[1]))
        .filter(value => value !== null),
    ),
  );
  return withSign.size === 1 ? [...withSign][0] : null;
}

function pad(value: string): string {
  return value.padStart(2, '0');
}

function fullYear(value: string): string {
  return value.length === 2 ? `20${value}` : value;
}

function datesIn(line: string): string[] {
  const found: string[] = [];
  for (const match of line.matchAll(
    /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/g,
  )) {
    found.push(`${pad(match[1])}/${pad(match[2])}/${fullYear(match[3])}`);
  }
  for (const match of line.matchAll(
    /\b(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\b/g,
  )) {
    found.push(`${pad(match[3])}/${pad(match[2])}/${match[1]}`);
  }
  for (const match of line.matchAll(
    /\b(\d{1,2})(?:\s+de\s+|[\s/.-]+)([a-záéíóú]{3,})\.?(?:\s+de\s+|[\s/.,-]+)(\d{4})\b/gi,
  )) {
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      found.push(`${pad(match[1])}/${month}/${match[3]}`);
    }
  }
  return found;
}

function validDate(value: string, today: string): boolean {
  const iso = parseDisplayDate(value);
  return iso !== null && iso <= today;
}

const NOT_INVOICE_DATE = /resoluci|autoriza|habilitaci|vigencia|venc/i;

// Fecha rotulada: lo que sigue a «Fecha», salvo «Fecha de vencimiento». Si la etiqueta quedó
// sola, mira la línea siguiente.
function labeledDates(lines: readonly string[]): string[] {
  return lines.flatMap((line, index) => {
    const match = /fecha(?!\s*(de\s*)?venc)/i.exec(line);
    if (match === null || /resoluci|autoriza/i.test(line)) {
      return [];
    }
    const after = line.slice(match.index).split(/venc/i)[0];
    const own = datesIn(after);
    return own.length > 0 ? own : datesIn(lines[index + 1] ?? '');
  });
}

function extractDate(lines: readonly string[], today: string): string | null {
  const labeled = labeledDates(lines).filter(value => validDate(value, today));
  if (labeled.length > 0) {
    return labeled[0];
  }
  const all = new Set(
    lines
      .filter(line => !NOT_INVOICE_DATE.test(line))
      .flatMap(datesIn)
      .filter(value => validDate(value, today)),
  );
  return all.size === 1 ? [...all][0] : null;
}

function extractMerchant(lines: readonly string[]): string | null {
  const line = lines.find(
    candidate =>
      (candidate.match(/\p{L}/gu) ?? []).length >= 3 &&
      !NOT_MERCHANT.test(candidate) &&
      datesIn(candidate).length === 0,
  );
  return line === undefined ? null : line.slice(0, 250);
}

export function extractReceiptData(text: string, today: string): ReceiptData {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0);
  return {
    amountCents: extractAmount(lines),
    date: extractDate(lines, today),
    merchant: extractMerchant(lines),
  };
}
