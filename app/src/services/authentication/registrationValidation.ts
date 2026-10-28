import { codePointLength, validateNewPassword } from './passwordPolicy';
import {
  E164_MAX_DIGITS,
  isPhoneNumberInput,
  normalizeDocumentNumber,
  phoneDigits,
} from './identifiers';
import {
  REGISTRATION_QUESTION_COUNT,
  validateSecurityAnswerSlots,
  type SecurityAnswerInput,
  type SecurityAnswerSlotError,
  type SecurityQuestion,
} from './securityQuestionPolicy';

export const NAME_MAX_LENGTH = 50;
export const DOCUMENT_INPUT_MAX_LENGTH = 60;
export const EMAIL_MAX_LENGTH = 254;

const PERSON_NAME = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u;
export const DOCUMENT_NORMALIZED_MAX_LENGTH = 30;

const NORMALIZED_DOCUMENT = /^[\p{L}\p{Nd}]+$/u;
const DIGITS_ONLY_DOCUMENT = /^[0-9]+$/;
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;

// Reglas de caracteres por tipo, indexadas por `document_types.code` (E03-D4, E03-V06): CC, CE
// y PPT solo dígitos; PA letras y dígitos (regla común). Sin longitud fija: rige el límite
// técnico. Fuentes y alcance en docs/decisiones-etapa-03.md, E03-D4.
const DOCUMENT_NUMBER_RULES: ReadonlyMap<string, RegExp> = new Map([
  ['CC', DIGITS_ONLY_DOCUMENT],
  ['CE', DIGITS_ONLY_DOCUMENT],
  ['PPT', DIGITS_ONLY_DOCUMENT],
]);

export function isDigitsOnlyDocumentType(documentTypeCode: string): boolean {
  return DOCUMENT_NUMBER_RULES.get(documentTypeCode) === DIGITS_ONLY_DOCUMENT;
}

export type IdentificationData = {
  documentTypeCode: string;
  documentNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
};

export type ContactData = {
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  password: string;
};

export type RegistrationInput = IdentificationData &
  ContactData & {
    securityAnswers: SecurityAnswerInput[];
  };

export type RegistrationField = keyof IdentificationData | keyof ContactData;

export type FieldError =
  | 'required'
  | 'not_in_list'
  | 'too_long'
  | 'name_characters'
  | 'document_digits_only'
  | 'document_characters'
  | 'phone_characters'
  | 'phone_too_long'
  | 'email_format'
  | 'password_policy';

export type FieldErrors = Partial<Record<RegistrationField, FieldError>>;

export type RegistrationErrors = {
  fields: FieldErrors;
  securityAnswers: SecurityAnswerSlotError[];
  securityAnswerCountValid: boolean;
};

export type RegistrationRules = {
  activeDocumentTypeCodes: readonly string[];
  callingCodes: readonly string[];
  securityQuestions: readonly SecurityQuestion[];
};

export function normalizePersonName(name: string): string {
  return name.normalize('NFC').trim();
}

export function personNameError(
  name: string,
  required: boolean,
): FieldError | null {
  const normalized = normalizePersonName(name);
  if (normalized.length === 0) {
    return required ? 'required' : null;
  }
  if (codePointLength(normalized) > NAME_MAX_LENGTH) {
    return 'too_long';
  }
  return PERSON_NAME.test(normalized) ? null : 'name_characters';
}

export function isValidPersonName(name: string, required: boolean): boolean {
  return personNameError(name, required) === null;
}

export function documentNumberError(
  documentNumber: string,
  documentTypeCode: string,
): FieldError | null {
  const original = documentNumber.normalize('NFC').trim();
  if (original.length === 0) {
    return 'required';
  }
  const normalized = normalizeDocumentNumber(documentNumber);
  const rule =
    DOCUMENT_NUMBER_RULES.get(documentTypeCode) ?? NORMALIZED_DOCUMENT;
  if (!rule.test(normalized)) {
    return rule === DIGITS_ONLY_DOCUMENT
      ? 'document_digits_only'
      : 'document_characters';
  }
  return codePointLength(original) > DOCUMENT_INPUT_MAX_LENGTH ||
    codePointLength(normalized) > DOCUMENT_NORMALIZED_MAX_LENGTH
    ? 'too_long'
    : null;
}

export function isValidDocumentNumber(
  documentNumber: string,
  documentTypeCode: string,
): boolean {
  return documentNumberError(documentNumber, documentTypeCode) === null;
}

export function emailError(email: string): FieldError | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'required';
  }
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return 'too_long';
  }
  return EMAIL.test(trimmed) ? null : 'email_format';
}

export function isValidEmail(email: string): boolean {
  return emailError(email) === null;
}

export function maxPhoneDigits(callingCode: string): number {
  return E164_MAX_DIGITS - phoneDigits(callingCode).length;
}

export function phoneNumberError(
  callingCode: string,
  phoneNumber: string,
): FieldError | null {
  const trimmed = phoneNumber.trim();
  if (trimmed.length === 0) {
    return 'required';
  }
  if (!isPhoneNumberInput(trimmed)) {
    return 'phone_characters';
  }
  return phoneDigits(trimmed).length > maxPhoneDigits(callingCode)
    ? 'phone_too_long'
    : null;
}

export function isValidPhone(
  callingCode: string,
  phoneNumber: string,
  callingCodes: readonly string[],
): boolean {
  return (
    callingCodes.includes(callingCode) &&
    phoneNumberError(callingCode, phoneNumber) === null
  );
}

function assign(
  errors: FieldErrors,
  field: RegistrationField,
  error: FieldError | null,
) {
  if (error !== null) {
    errors[field] = error;
  }
}

export function validateIdentification(
  data: IdentificationData,
  activeDocumentTypeCodes: readonly string[],
): FieldErrors {
  const errors: FieldErrors = {};
  if (!activeDocumentTypeCodes.includes(data.documentTypeCode)) {
    errors.documentTypeCode =
      data.documentTypeCode === '' ? 'required' : 'not_in_list';
  }
  assign(
    errors,
    'documentNumber',
    documentNumberError(data.documentNumber, data.documentTypeCode),
  );
  assign(errors, 'firstName', personNameError(data.firstName, true));
  assign(errors, 'middleName', personNameError(data.middleName, false));
  assign(errors, 'lastName', personNameError(data.lastName, true));
  assign(errors, 'secondLastName', personNameError(data.secondLastName, false));
  return errors;
}

export function validateContact(
  data: ContactData,
  callingCodes: readonly string[],
): FieldErrors {
  const errors: FieldErrors = {};
  if (!callingCodes.includes(data.phoneCountryCode)) {
    errors.phoneCountryCode =
      data.phoneCountryCode === '' ? 'required' : 'not_in_list';
  }
  assign(
    errors,
    'phoneNumber',
    phoneNumberError(data.phoneCountryCode, data.phoneNumber),
  );
  assign(errors, 'email', emailError(data.email));
  if (validateNewPassword(data.password).length > 0) {
    errors.password = 'password_policy';
  }
  return errors;
}

export function validateRegistration(
  input: RegistrationInput,
  rules: RegistrationRules,
): RegistrationErrors {
  return {
    fields: {
      ...validateIdentification(input, rules.activeDocumentTypeCodes),
      ...validateContact(input, rules.callingCodes),
    },
    securityAnswers: validateSecurityAnswerSlots(
      input.securityAnswers,
      rules.securityQuestions,
    ),
    securityAnswerCountValid:
      input.securityAnswers.length === REGISTRATION_QUESTION_COUNT,
  };
}

export function hasRegistrationErrors(errors: RegistrationErrors): boolean {
  return (
    Object.keys(errors.fields).length > 0 ||
    !errors.securityAnswerCountValid ||
    errors.securityAnswers.some(slot => slot.question || slot.answer)
  );
}
