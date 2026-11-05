// Fechas sin hora (I-06): se guardan como `AAAA-MM-DD` en la fecha local del dispositivo y
// se escriben y muestran como `DD/MM/AAAA`.

export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isoDateFromParts(
  year: number,
  month: number,
  day: number,
): IsoDate {
  return `${year.toString().padStart(4, '0')}-${pad(month)}-${pad(day)}`;
}

export function isoDateFromDate(date: Date): IsoDate {
  return isoDateFromParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

// Fecha local de hoy (HU4-CA03).
export function todayIso(now: number = Date.now()): IsoDate {
  return isoDateFromDate(new Date(now));
}

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  return (
    match !== null &&
    isRealDate(Number(match[1]), Number(match[2]), Number(match[3]))
  );
}

// Medianoche local de la fecha, para el selector nativo.
export function dateFromIso(value: IsoDate): Date {
  const match = ISO_DATE.exec(value);
  if (match === null) {
    throw new Error(`invalid ISO date: ${value}`);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// «24/10/2026» → «2026-10-24». Devuelve null si el texto no es una fecha real.
export function parseDisplayDate(raw: string): IsoDate | null {
  const match = DISPLAY_DATE.exec(raw.trim());
  if (match === null) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return isRealDate(year, month, day)
    ? isoDateFromParts(year, month, day)
    : null;
}

export function formatDisplayDate(value: IsoDate): string {
  const match = ISO_DATE.exec(value);
  return match === null ? value : `${match[3]}/${match[2]}/${match[1]}`;
}

// Las fechas ISO se comparan como texto.
export function isAfter(value: IsoDate, reference: IsoDate): boolean {
  return value > reference;
}
