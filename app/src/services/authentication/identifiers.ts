// Normalización de los identificadores de acceso (A-ID1 a A-ID4).

const DOCUMENT_SEPARATORS = /[\s.-]/g;
const PHONE_SEPARATORS = /^[\d\s().-]+$/;
const E164_INPUT = /^\+[\d\s().-]+$/;

export const E164_MAX_DIGITS = 15;

export function normalizeEmail(email: string): string {
  return email.normalize('NFC').trim().toLowerCase();
}

export function normalizeDocumentNumber(documentNumber: string): string {
  return documentNumber
    .normalize('NFC')
    .trim()
    .replace(DOCUMENT_SEPARATORS, '')
    .toUpperCase();
}

export function phoneDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export function isPhoneNumberInput(text: string): boolean {
  return PHONE_SEPARATORS.test(text) && phoneDigits(text).length > 0;
}

export function toE164(countryCode: string, nationalNumber: string): string {
  return `${countryCode}${phoneDigits(nationalNumber)}`;
}

export type LoginIdentifier =
  | { kind: 'email'; email: string }
  | { kind: 'e164'; phone: string }
  | {
      kind: 'document_or_phone';
      document: string;
      nationalNumber: string | null;
    }
  | { kind: 'empty' };

export function classifyLoginIdentifier(identifier: string): LoginIdentifier {
  const trimmed = identifier.trim();
  if (trimmed.length === 0) {
    return { kind: 'empty' };
  }
  if (trimmed.includes('@')) {
    return { kind: 'email', email: normalizeEmail(trimmed) };
  }
  if (trimmed.startsWith('+')) {
    return E164_INPUT.test(trimmed)
      ? { kind: 'e164', phone: `+${phoneDigits(trimmed)}` }
      : { kind: 'empty' };
  }
  return {
    kind: 'document_or_phone',
    document: normalizeDocumentNumber(trimmed),
    nationalNumber: isPhoneNumberInput(trimmed) ? phoneDigits(trimmed) : null,
  };
}
