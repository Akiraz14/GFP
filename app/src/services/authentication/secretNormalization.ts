export const SECRET_NORMALIZATION_FORM = 'NFC';

export class UnicodeNormalizationUnavailableError extends Error {
  constructor() {
    super('String.prototype.normalize does not provide a working NFC');
    this.name = 'UnicodeNormalizationUnavailableError';
  }
}

const COMBINING_MARK = /\p{M}/gu;
const WHITESPACE_RUN = /\s+/gu;

export function assertNormalizationAvailable(): void {
  const decomposed = 'n\u0303';
  if (
    typeof decomposed.normalize !== 'function' ||
    decomposed.normalize('NFC') !== '\u00f1'
  ) {
    throw new UnicodeNormalizationUnavailableError();
  }
}

export function hasInvalidCodeUnits(text: string): boolean {
  for (let index = 0; index < text.length; index++) {
    const unit = text.charCodeAt(index);
    if (unit <= 0x1f || (unit >= 0x7f && unit <= 0x9f)) {
      return true;
    }
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true;
      }
      index++;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

export function normalizeSecret(secret: string): string {
  assertNormalizationAvailable();
  return secret.normalize(SECRET_NORMALIZATION_FORM);
}

export function normalizeFreeTextAnswer(answer: string): string {
  assertNormalizationAvailable();
  return answer
    .normalize('NFD')
    .replace(COMBINING_MARK, '')
    .toLowerCase()
    .replace(WHITESPACE_RUN, ' ')
    .trim()
    .normalize(SECRET_NORMALIZATION_FORM);
}
