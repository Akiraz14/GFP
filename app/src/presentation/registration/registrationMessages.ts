import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  unmetPasswordRequirements,
  validateNewPassword,
  type PasswordRequirement,
} from '../../services/authentication/passwordPolicy';
import {
  DOCUMENT_NORMALIZED_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  maxPhoneDigits,
  type FieldError,
  type RegistrationField,
} from '../../services/authentication/registrationValidation';
import {
  SECURITY_ANSWER_MAX_LENGTH,
  SECURITY_ANSWER_MIN_LENGTH,
  type SecurityAnswerViolation,
  type SecurityQuestionSlotViolation,
} from '../../services/authentication/securityQuestionPolicy';
import { REGISTRATION_TEXTS as TEXTS } from './registrationTexts';

export const PASSWORD_REQUIREMENT_TEXTS: Readonly<
  Record<PasswordRequirement, string>
> = {
  length: `Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`,
  letter: 'Al menos una letra',
  number: 'Al menos un número',
  symbol: 'Al menos un símbolo, por ejemplo ! # $ %',
  no_outer_whitespace: 'Sin espacios al inicio ni al final',
};

const NAME_CHARACTERS =
  'Usa solo letras, sin números ni símbolos. Separa las palabras con un solo espacio.';

type MessageContext = {
  callingCode: string;
  documentTypeCode: string;
  password: string;
};

const DIGITS_ONLY_DOCUMENT_NAMES: Readonly<Record<string, string>> = {
  CC: 'la cédula de ciudadanía',
  CE: 'la cédula de extranjería',
  PPT: 'el permiso por protección temporal',
};

function withPrefix(prefix: string, detail: string): string {
  return `${prefix}. ${detail}`;
}

function passwordDetail(password: string): string {
  const violations = validateNewPassword(password);
  if (violations.includes('invalid_characters')) {
    return 'La contraseña contiene caracteres no permitidos.';
  }
  const unmet = unmetPasswordRequirements(violations).map(requirement =>
    PASSWORD_REQUIREMENT_TEXTS[requirement].toLowerCase(),
  );
  return `A la contraseña le falta: ${unmet.join('; ')}.`;
}

function requiredDetail(field: RegistrationField): string {
  switch (field) {
    case 'documentTypeCode':
      return 'Selecciona el tipo de documento.';
    case 'documentNumber':
      return 'Ingresa el número de documento.';
    case 'firstName':
      return 'Ingresa tu primer nombre.';
    case 'lastName':
      return 'Ingresa tu primer apellido.';
    case 'phoneCountryCode':
      return 'Selecciona el código de país.';
    case 'phoneNumber':
      return 'Ingresa tu número celular.';
    case 'email':
      return 'Ingresa tu correo electrónico.';
    default:
      return 'Completa este campo.';
  }
}

function tooLongDetail(field: RegistrationField): string {
  switch (field) {
    case 'documentNumber':
      return `El documento admite máximo ${DOCUMENT_NORMALIZED_MAX_LENGTH} letras o números.`;
    case 'email':
      return `El correo admite máximo ${EMAIL_MAX_LENGTH} caracteres.`;
    default:
      return `Escribe máximo ${NAME_MAX_LENGTH} caracteres.`;
  }
}

function fieldDetail(
  field: RegistrationField,
  error: FieldError,
  context: MessageContext,
): string {
  switch (error) {
    case 'required':
      return requiredDetail(field);
    case 'not_in_list':
      return field === 'phoneCountryCode'
        ? 'Selecciona un código de país de la lista.'
        : 'Selecciona un tipo de documento de la lista.';
    case 'too_long':
      return tooLongDetail(field);
    case 'name_characters':
      return NAME_CHARACTERS;
    case 'document_digits_only':
      return `Para ${
        DIGITS_ONLY_DOCUMENT_NAMES[context.documentTypeCode] ?? 'este documento'
      }, ingresa solo números.`;
    case 'document_characters':
      return 'Usa solo letras y números. Puedes separarlos con espacios, puntos o guiones.';
    case 'phone_characters':
      return 'Ingresa un número celular válido para el indicativo seleccionado: solo números, sin el indicativo.';
    case 'phone_too_long':
      return `Ingresa un número celular válido para el indicativo seleccionado: con ${
        context.callingCode
      } admite máximo ${maxPhoneDigits(context.callingCode)} dígitos.`;
    case 'email_format':
      return 'Ingresa un correo válido, por ejemplo nombre@dominio.com.';
    case 'password_policy':
      return passwordDetail(context.password);
  }
}

export function fieldErrorMessage(
  field: RegistrationField,
  error: FieldError,
  context: MessageContext,
): string {
  const prefix =
    field === 'email' ? TEXTS.messages.emailError : TEXTS.messages.fieldError;
  return withPrefix(prefix, fieldDetail(field, error, context));
}

export function questionErrorMessage(
  violation: SecurityQuestionSlotViolation,
): string {
  return withPrefix(
    TEXTS.messages.fieldError,
    violation === 'required'
      ? 'Selecciona una pregunta.'
      : 'Elige una pregunta distinta y no similar a las demás.',
  );
}

export function answerErrorMessage(violation: SecurityAnswerViolation): string {
  const details: Record<SecurityAnswerViolation, string> = {
    required: 'Ingresa la respuesta.',
    too_short: `Ingresa una respuesta de al menos ${SECURITY_ANSWER_MIN_LENGTH} caracteres.`,
    too_long: `La respuesta admite máximo ${SECURITY_ANSWER_MAX_LENGTH} caracteres.`,
    invalid_characters: 'La respuesta contiene caracteres no permitidos.',
  };
  return withPrefix(TEXTS.messages.fieldError, details[violation]);
}
