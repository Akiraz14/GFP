import { hasInvalidCodeUnits, normalizeSecret } from './secretNormalization';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordViolation =
  | 'too_short'
  | 'too_long'
  | 'missing_letter'
  | 'missing_number'
  | 'missing_symbol'
  | 'outer_whitespace'
  | 'invalid_characters';

const LETTER = /\p{L}/u;
const NUMBER = /\p{Nd}/u;
const SYMBOL = /[^\p{L}\p{M}\p{Nd}\s]/u;

export function codePointLength(text: string): number {
  return Array.from(text).length;
}

export function validateNewPassword(password: string): PasswordViolation[] {
  if (hasInvalidCodeUnits(password)) {
    return ['invalid_characters'];
  }
  const normalized = normalizeSecret(password);
  const violations: PasswordViolation[] = [];
  const length = codePointLength(normalized);
  if (length < PASSWORD_MIN_LENGTH) {
    violations.push('too_short');
  }
  if (length > PASSWORD_MAX_LENGTH) {
    violations.push('too_long');
  }
  if (!LETTER.test(normalized)) {
    violations.push('missing_letter');
  }
  if (!NUMBER.test(normalized)) {
    violations.push('missing_number');
  }
  if (!SYMBOL.test(normalized)) {
    violations.push('missing_symbol');
  }
  if (normalized !== normalized.trim()) {
    violations.push('outer_whitespace');
  }
  return violations;
}

export function isVerifiableCandidate(password: string): boolean {
  return (
    !hasInvalidCodeUnits(password) &&
    codePointLength(password) <= PASSWORD_MAX_LENGTH * 4
  );
}
