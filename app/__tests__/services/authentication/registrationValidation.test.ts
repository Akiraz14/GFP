import { CALLING_CODES } from '../../../src/services/authentication/accountRegistration';
import {
  COUNTRY_CALLING_CODES,
  DEFAULT_PHONE_REGION,
  countryLabel,
  flagEmoji,
} from '../../../src/services/authentication/countryCallingCodes';
import {
  unmetPasswordRequirements,
  validateNewPassword,
} from '../../../src/services/authentication/passwordPolicy';
import {
  documentNumberError,
  emailError,
  isDigitsOnlyDocumentType,
  isValidDocumentNumber,
  isValidEmail,
  isValidPersonName,
  isValidPhone,
  maxPhoneDigits,
  personNameError,
  phoneNumberError,
  validateContact,
  validateIdentification,
} from '../../../src/services/authentication/registrationValidation';

const ACTIVE_TYPES = ['CC', 'CE', 'PA', 'PPT'];

describe('names (HU1-CA04, E03-D7)', () => {
  test.each(['Ana', 'José María', 'Íñigo', 'Zoë', 'Nuñez', '  Ana  '])(
    'accepts %p',
    name => expect(isValidPersonName(name, true)).toBe(true),
  );

  test.each([
    'Ana2',
    "O'Connor",
    'Ana-María',
    'Ana  María',
    'Ana.',
    'Ana_',
    '@na',
    'a'.repeat(51),
  ])('rejects %p', name => expect(isValidPersonName(name, true)).toBe(false));

  test('optional names may be empty but required names may not', () => {
    expect(isValidPersonName('   ', false)).toBe(true);
    expect(isValidPersonName('', true)).toBe(false);
    expect(isValidPersonName('a'.repeat(50), true)).toBe(true);
  });
});

describe('documents (HU1-CA01, A-ID3, E03-D4)', () => {
  test.each(['1020304050', '1.020.304.050', 'AB123456', 'ab 123-456', '0012'])(
    'accepts %p as letters and digits (PA)',
    value => expect(isValidDocumentNumber(value, 'PA')).toBe(true),
  );

  test.each(['', '  ', '12#4', '12/4', '+573001', '1'.repeat(31)])(
    'rejects %p for every type',
    value => {
      for (const code of ACTIVE_TYPES) {
        expect(isValidDocumentNumber(value, code)).toBe(false);
      }
    },
  );

  test.each(['1020304050', '1.020.304.050', '1 020 304-050', '0012345'])(
    'accepts %p as a CC: digits only after A-ID3 (E03-V06, partial)',
    value => expect(isValidDocumentNumber(value, 'CC')).toBe(true),
  );

  test.each(['AB123456', '12A45', 'ab 123-456', '١٢٣٤', '１２３４', 'Ⅻ'])(
    'rejects %p as a CC: letters and non-ASCII digits (E03-V06, partial)',
    value => expect(isValidDocumentNumber(value, 'CC')).toBe(false),
  );

  test('the rule follows the selected type', () => {
    expect(isValidDocumentNumber('AB123456', 'PA')).toBe(true);
    expect(isValidDocumentNumber('AB123456', 'CC')).toBe(false);
    for (const code of ['CC', 'CE', 'PPT']) {
      expect(isDigitsOnlyDocumentType(code)).toBe(true);
    }
    for (const code of ['PA', '', 'constructor', '__proto__']) {
      expect(isDigitsOnlyDocumentType(code)).toBe(false);
    }
    expect(isValidDocumentNumber('AB1', 'toString')).toBe(true);
  });

  test('leading zeros are kept and not transformed (A-ID3)', () => {
    const base = {
      documentTypeCode: 'CC',
      firstName: 'Ana',
      middleName: '',
      lastName: 'Rojas',
      secondLastName: '',
    };
    expect(
      validateIdentification(
        { ...base, documentNumber: '0012345' },
        ACTIVE_TYPES,
      ),
    ).toEqual({});
    expect(
      validateIdentification(
        { ...base, documentNumber: '0012A45' },
        ACTIVE_TYPES,
      ),
    ).toEqual({ documentNumber: 'document_digits_only' });
  });

  test('only active document types are accepted (E03-V11)', () => {
    const base = {
      documentNumber: '1001',
      firstName: 'Ana',
      middleName: '',
      lastName: 'Rojas',
      secondLastName: '',
    };
    expect(
      validateIdentification({ ...base, documentTypeCode: 'CC' }, ACTIVE_TYPES),
    ).toEqual({});
    for (const documentTypeCode of ['NIT', 'TI']) {
      expect(
        validateIdentification({ ...base, documentTypeCode }, ACTIVE_TYPES),
      ).toEqual({ documentTypeCode: 'not_in_list' });
    }
    expect(
      validateIdentification({ ...base, documentTypeCode: '' }, ACTIVE_TYPES),
    ).toEqual({ documentTypeCode: 'required' });
  });
});

describe('email (HU1-CA09)', () => {
  test.each(['ana@example.com', ' ana.rojas@mail.example.co ', 'a+b@x.co'])(
    'accepts %p',
    email => expect(isValidEmail(email)).toBe(true),
  );

  test.each([
    '',
    'ana',
    'ana@',
    '@example.com',
    'ana@example',
    'ana@@example.com',
    'ana @example.com',
    'ana@example..com',
    'ana@.com',
  ])('rejects %p (shown with «Verificar correo»)', email => {
    expect(isValidEmail(email)).toBe(false);
    expect(
      validateContact(
        {
          phoneCountryCode: '+57',
          phoneNumber: '3001112233',
          email,
          password: 'Clave123!',
        },
        CALLING_CODES,
      ),
    ).toEqual({ email: email === '' ? 'required' : 'email_format' });
  });
});

describe('phone (HU1-CA08, E03-D2, E03-D8, A-ID2)', () => {
  test('the calling code list is the static E.164 catalog with Colombia first selected', () => {
    expect(COUNTRY_CALLING_CODES.length).toBeGreaterThan(190);
    expect(
      COUNTRY_CALLING_CODES.find(c => c.regionCode === DEFAULT_PHONE_REGION),
    ).toEqual({ regionCode: 'CO', name: 'Colombia', callingCode: '+57' });
    expect(new Set(COUNTRY_CALLING_CODES.map(c => c.regionCode)).size).toBe(
      COUNTRY_CALLING_CODES.length,
    );
    for (const country of COUNTRY_CALLING_CODES) {
      expect(country.callingCode).toMatch(/^\+[1-9]\d{0,2}$/);
    }
  });

  test.each(['3001112233', '300 111 2233', '(300) 111-2233', '300.111.2233'])(
    'accepts %p',
    phone => expect(isValidPhone('+57', phone, CALLING_CODES)).toBe(true),
  );

  test('rejects a missing, malformed, too long or unknown-country phone', () => {
    expect(isValidPhone('+57', '', CALLING_CODES)).toBe(false);
    expect(isValidPhone('+57', '300abc', CALLING_CODES)).toBe(false);
    expect(isValidPhone('+57', '+573001112233', CALLING_CODES)).toBe(false);
    expect(isValidPhone('+57', '1234567890123', CALLING_CODES)).toBe(true);
    expect(isValidPhone('+57', '12345678901234', CALLING_CODES)).toBe(false);
    expect(isValidPhone('+999', '3001112233', CALLING_CODES)).toBe(false);
  });
});

describe('password (HU1-CA05, HU1-CA07)', () => {
  test.each([
    ['Clave123!', {}],
    ['Clave123', { password: 'password_policy' }],
    ['clave!!!', { password: 'password_policy' }],
    ['12345678!', { password: 'password_policy' }],
    ['Cl4ve!', { password: 'password_policy' }],
    [' Clave123!', { password: 'password_policy' }],
  ])('validates %p', (password, expected) => {
    expect(
      validateContact(
        {
          phoneCountryCode: '+57',
          phoneNumber: '3001112233',
          email: 'ana@example.com',
          password,
        },
        CALLING_CODES,
      ),
    ).toEqual(expected);
  });
});

describe('specific error reasons (HU1-CA13, 2026-10-26)', () => {
  test('names: required, characters and length', () => {
    expect(personNameError('', true)).toBe('required');
    expect(personNameError('', false)).toBeNull();
    expect(personNameError('Ana2', true)).toBe('name_characters');
    expect(personNameError('Ana  María', true)).toBe('name_characters');
    expect(personNameError('a'.repeat(51), true)).toBe('too_long');
    expect(personNameError(' José María ', true)).toBeNull();
  });

  test('documents: required, digits only for CC, characters and length', () => {
    expect(documentNumberError('  ', 'CC')).toBe('required');
    expect(documentNumberError('12A4', 'CC')).toBe('document_digits_only');
    expect(documentNumberError('12#4', 'PA')).toBe('document_characters');
    expect(documentNumberError('12#4', 'CE')).toBe('document_digits_only');
    expect(documentNumberError('1'.repeat(31), 'CC')).toBe('too_long');
    expect(documentNumberError('A'.repeat(31), 'PA')).toBe('too_long');
    expect(documentNumberError('1.020.304.050', 'CC')).toBeNull();
  });

  test('phone: required, characters and maximum digits for the calling code', () => {
    expect(phoneNumberError('+57', '')).toBe('required');
    expect(phoneNumberError('+57', '300abc')).toBe('phone_characters');
    expect(maxPhoneDigits('+57')).toBe(13);
    expect(maxPhoneDigits('+1')).toBe(14);
    expect(phoneNumberError('+57', '1'.repeat(13))).toBeNull();
    expect(phoneNumberError('+57', '1'.repeat(14))).toBe('phone_too_long');
    expect(phoneNumberError('+1', '1'.repeat(14))).toBeNull();
  });

  test('email: required, length and format', () => {
    expect(emailError(' ')).toBe('required');
    expect(emailError(`${'a'.repeat(250)}@x.co`)).toBe('too_long');
    expect(emailError('ana@example')).toBe('email_format');
    expect(emailError('ana@example.com')).toBeNull();
  });
});

describe('country flags (B, 2026-10-26)', () => {
  test('each entry has a valid ISO 3166-1 alpha-2 code and its own flag', () => {
    const flags = new Set<string>();
    for (const country of COUNTRY_CALLING_CODES) {
      expect(country.regionCode).toMatch(/^[A-Z]{2}$/);
      const flag = flagEmoji(country.regionCode);
      expect(Array.from(flag)).toHaveLength(2);
      for (const symbol of Array.from(flag)) {
        const codePoint = symbol.codePointAt(0)!;
        expect(codePoint).toBeGreaterThanOrEqual(0x1f1e6);
        expect(codePoint).toBeLessThanOrEqual(0x1f1ff);
      }
      flags.add(flag);
      expect(countryLabel(country)).toBe(
        `${flag} ${country.name} (${country.callingCode})`,
      );
    }
    expect(flags.size).toBe(COUNTRY_CALLING_CODES.length);
  });

  test('shared calling codes keep a distinct flag per country', () => {
    const byRegion = (code: string) =>
      COUNTRY_CALLING_CODES.find(country => country.regionCode === code)!;
    expect(flagEmoji('CO')).toBe('🇨🇴');
    expect(countryLabel(byRegion('CO'))).toBe('🇨🇴 Colombia (+57)');
    expect(byRegion('US').callingCode).toBe(byRegion('CA').callingCode);
    expect(countryLabel(byRegion('US'))).toBe('🇺🇸 Estados Unidos (+1)');
    expect(countryLabel(byRegion('CA'))).toBe('🇨🇦 Canadá (+1)');
    expect(byRegion('RU').callingCode).toBe(byRegion('KZ').callingCode);
    expect(flagEmoji('RU')).not.toBe(flagEmoji('KZ'));
    expect(flagEmoji('co')).toBe('');
    expect(flagEmoji('COL')).toBe('');
  });
});

describe('password requirements share the policy rules (C, 2026-10-26)', () => {
  test.each([
    ['', ['length', 'letter', 'number', 'symbol']],
    ['abc1', ['length', 'symbol']],
    ['Clave123!', []],
    [' Clave123!', ['no_outer_whitespace']],
    ['x'.repeat(129) + '1!', ['length']],
  ])('unmet requirements of %p', (password, expected) => {
    expect(unmetPasswordRequirements(validateNewPassword(password))).toEqual(
      expected,
    );
  });
});

describe('document rules by type (E03-V06, 2026-10-27)', () => {
  test('CC: digits only, any length up to the technical limit (Resolución 3571 de 2003)', () => {
    expect(documentNumberError('1020304050', 'CC')).toBeNull();
    expect(documentNumberError('79.123.456', 'CC')).toBeNull();
    expect(documentNumberError('1234', 'CC')).toBeNull();
    expect(documentNumberError('10203040X', 'CC')).toBe('document_digits_only');
  });

  test('PA: the number is defined by each issuing State, so the common rule applies (OACI Doc 9303)', () => {
    expect(documentNumberError('ab123456', 'PA')).toBeNull();
    expect(documentNumberError('AT-123 456', 'PA')).toBeNull();
    expect(documentNumberError('L898902C3', 'PA')).toBeNull();
    expect(documentNumberError('ÑA12345', 'PA')).toBeNull();
    expect(documentNumberError('12#4', 'PA')).toBe('document_characters');
    expect(documentNumberError('12/4', 'PA')).toBe('document_characters');
  });

  test('CE and PPT: digits only without a fixed length (Circular 24 de 2019, Resolución 572 de 2022)', () => {
    for (const code of ['CE', 'PPT']) {
      expect(documentNumberError('123456', code)).toBeNull();
      expect(documentNumberError('1234567', code)).toBeNull();
      expect(documentNumberError('12345678', code)).toBeNull();
      expect(documentNumberError('1.234.567', code)).toBeNull();
      expect(documentNumberError('0012345', code)).toBeNull();
      expect(documentNumberError('E123456', code)).toBe('document_digits_only');
      expect(documentNumberError('ÑA12345', code)).toBe('document_digits_only');
      expect(documentNumberError('12#4', code)).toBe('document_digits_only');
    }
  });

  test('no fixed length is imposed beyond the technical limit of 30', () => {
    for (const code of ['CC', 'CE', 'PA', 'PPT']) {
      expect(documentNumberError('1', code)).toBeNull();
      expect(documentNumberError('1'.repeat(30), code)).toBeNull();
      expect(documentNumberError('1'.repeat(31), code)).toBe('too_long');
    }
  });
});
