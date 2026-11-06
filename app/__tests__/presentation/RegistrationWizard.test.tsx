import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { readInteger } from '../../src/infrastructure/database/sqlDatabase';
import { RegistrationWizard } from '../../src/presentation/registration/RegistrationWizard';
import {
  AccountRegistrationService,
  type RegistrationGateway,
  type RegistrationResult,
} from '../../src/services/authentication/accountRegistration';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../testing/nodeSqliteDatabase';
import {
  createMigratedDatabase,
  TEST_PARAMETERS,
} from '../../testing/identityFixtures';

// A13 (E-COR-D1): the field shows only its concrete message, without the generic prefix.
const FIELD_ERROR = /^(?!Error en los campos ingresados)\S/;
const fieldError = (detail: string) => detail;

jest.setTimeout(20_000);

async function setup(
  override: (
    service: AccountRegistrationService,
  ) => Partial<RegistrationGateway> = () => ({}),
) {
  const database = await createMigratedDatabase();
  const service = new AccountRegistrationService({
    database,
    engine: nodePbkdf2Engine,
    random: nodeRandomBytes,
    parameters: TEST_PARAMETERS,
  });
  const gateway: RegistrationGateway = {
    listDocumentTypes: () => service.listDocumentTypes(),
    listSecurityQuestions: () => service.listSecurityQuestions(),
    checkAvailability: identifiers => service.checkAvailability(identifiers),
    register: input => service.register(input),
    ...override(service),
  };
  const onNavigate = jest.fn();
  await render(
    <RegistrationWizard gateway={gateway} onNavigate={onNavigate} />,
  );
  await screen.findByText('Paso 1 de 3');
  return { database, service, onNavigate };
}

async function type(testID: string, text: string) {
  await fireEvent.changeText(screen.getByTestId(testID), text);
}

async function select(field: string, value: string) {
  await fireEvent.press(screen.getByTestId(`registration-${field}`));
  await fireEvent.press(
    screen.getByTestId(`registration-${field}-option-${value}`),
  );
}

async function press(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function fillIdentification(document = '1.020.304.050') {
  await select('documentTypeCode', 'CC');
  await type('registration-documentNumber', document);
  await type('registration-firstName', 'Ana');
  await type('registration-lastName', 'Peña');
}

async function fillContact(email = 'ana@example.com', phone = '3001112233') {
  await type('registration-phoneNumber', phone);
  await type('registration-email', email);
  await type('registration-password', 'Clave123!');
}

const ANSWERS: Array<[string, string]> = [
  ['favorite-color', 'Azul'],
  ['first-pet', 'Perro'],
  ['favorite-sport', 'Ajedrez'],
  ['favorite-dish', 'Ajiaco'],
  ['school-transport', 'Caminando'],
];

async function fillSecurityQuestions() {
  for (const [index, [questionId, answer]] of ANSWERS.entries()) {
    await select(`question-${index}`, questionId);
    await type(`registration-answer-${index}`, answer);
  }
}

async function goToSecurityStep() {
  await fillIdentification();
  await fillContact();
  await press('registration-next');
  await screen.findByText('Paso 2 de 3');
}

async function goToConfirmation() {
  await goToSecurityStep();
  await fillSecurityQuestions();
  await press('registration-next');
  await screen.findByText('Paso 3 de 3');
}

async function countUsers(
  database: Awaited<ReturnType<typeof createMigratedDatabase>>,
) {
  const result = await database.execute('SELECT count(*) AS total FROM users');
  return readInteger(result.rows[0], 'total');
}

describe('registration wizard (HU1, E03-D1)', () => {
  test('shows the step, its title and the document types of the master table (E03-W01, HU1-CA02, HU1-CA03, E03-V11)', async () => {
    await setup();
    expect(screen.getByText('Registro de Usuario')).toBeTruthy();
    expect(screen.getByText('Datos personales y de acceso')).toBeTruthy();
    await press('registration-documentTypeCode');
    for (const code of ['CC', 'CE', 'PA', 'PPT']) {
      expect(
        screen.getByTestId(`registration-documentTypeCode-option-${code}`),
      ).toBeTruthy();
    }
    expect(
      screen.queryByTestId('registration-documentTypeCode-option-NIT'),
    ).toBeNull();
    expect(screen.getByText('Cédula de ciudadanía')).toBeTruthy();
  });

  test('validates the current step and shows the error next to each field (HU1-CA01, HU1-CA13, E03-W02)', async () => {
    await setup();
    await press('registration-next');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    for (const [field, detail] of [
      ['documentTypeCode', 'Selecciona el tipo de documento.'],
      ['documentNumber', 'Ingresa el número de documento.'],
      ['firstName', 'Ingresa tu primer nombre.'],
      ['lastName', 'Ingresa tu primer apellido.'],
    ]) {
      expect(
        screen.getByTestId(`registration-${field}-error`),
      ).toHaveTextContent(fieldError(detail));
    }
    expect(screen.queryByTestId('registration-middleName-error')).toBeNull();
    expect(
      screen.queryByTestId('registration-secondLastName-error'),
    ).toBeNull();
  });

  test('rejects names with numbers or symbols (HU1-CA04)', async () => {
    await setup();
    await fillIdentification();
    await type('registration-firstName', 'Ana2');
    await type('registration-secondLastName', 'Ruiz-Díaz');
    await press('registration-next');
    const nameRule = fieldError(
      'Usa solo letras, sin números ni símbolos. Separa las palabras con un solo espacio.',
    );
    expect(
      screen.getByTestId('registration-firstName-error'),
    ).toHaveTextContent(nameRule);
    expect(
      screen.getByTestId('registration-secondLastName-error'),
    ).toHaveTextContent(nameRule);
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    await type('registration-firstName', 'Ana');
    expect(screen.queryByTestId('registration-firstName-error')).toBeNull();
    await type('registration-secondLastName', 'Ruiz 2');
    expect(
      screen.getByTestId('registration-secondLastName-error'),
    ).toHaveTextContent(nameRule);
  });

  test('keeps the data when going back and forward (E03-W03, E03-W04)', async () => {
    await setup();
    await goToSecurityStep();
    expect(screen.getByText('Preguntas de seguridad')).toBeTruthy();
    await select('question-0', 'favorite-color');
    await type('registration-answer-0', 'Azul');
    await press('registration-back');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    expect(
      screen.getByTestId('registration-documentNumber'),
    ).toHaveDisplayValue('1.020.304.050');
    expect(screen.getByTestId('registration-lastName')).toHaveDisplayValue(
      'Peña',
    );
    expect(screen.getByTestId('registration-email')).toHaveDisplayValue(
      'ana@example.com',
    );
    await press('registration-next');
    await screen.findByText('Paso 2 de 3');
    expect(screen.getByTestId('registration-answer-0')).toHaveDisplayValue(
      'Azul',
    );
    expect(screen.getByTestId('registration-question-0')).toHaveTextContent(
      '¿Cuál es tu color favorito?',
    );
  });

  test('validates email, phone, country code and password in step 1 (HU1-CA05, HU1-CA07, HU1-CA08, HU1-CA09)', async () => {
    await setup();
    await fillIdentification();
    expect(
      screen.getByTestId('registration-phoneCountryCode'),
    ).toHaveTextContent('🇨🇴 Colombia (+57)');
    await type('registration-phoneNumber', '300abc');
    await type('registration-email', 'ana@example');
    await type('registration-password', 'Clave123');
    await press('registration-next');
    expect(screen.getByTestId('registration-email-error')).toHaveTextContent(
      'Verificar correo. Ingresa un correo válido, por ejemplo nombre@dominio.com.',
    );
    expect(
      screen.getByTestId('registration-phoneNumber-error'),
    ).toHaveTextContent(
      fieldError(
        'Ingresa un número celular válido para el indicativo seleccionado: solo números, sin el indicativo.',
      ),
    );
    expect(screen.getByTestId('registration-password-error')).toHaveTextContent(
      fieldError(
        'A la contraseña le falta: al menos un símbolo, por ejemplo ! # $ %.',
      ),
    );
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    await select('phoneCountryCode', 'MX');
    expect(
      screen.getByTestId('registration-phoneCountryCode'),
    ).toHaveTextContent('🇲🇽 México (+52)');
  });

  test('warns that the user is already registered when step 1 ends (HU1-CA14, A-W3, E03-W09)', async () => {
    const { service } = await setup();
    await service.register({
      documentTypeCode: 'CE',
      documentNumber: '555',
      firstName: 'Luis',
      middleName: '',
      lastName: 'Gómez',
      secondLastName: '',
      phoneCountryCode: '+57',
      phoneNumber: '3009999999',
      email: 'ana@example.com',
      password: 'Clave123!',
      securityAnswers: ANSWERS.map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    });
    await fillIdentification();
    await fillContact('ANA@example.com');
    await press('registration-next');
    expect(
      await screen.findByText('El usuario se encuentra registrado'),
    ).toBeTruthy();
    await press('dialog-accept');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
  });

  test('offers the questions of the database and hides similar ones (HU1-CA10, HU1-CA11)', async () => {
    await setup();
    await goToSecurityStep();
    await press('registration-question-0');
    expect(screen.getByText('¿Cuál es tu fruta favorita?')).toBeTruthy();
    await press('registration-question-0-option-favorite-dish');
    await press('registration-question-1');
    expect(
      screen.queryByTestId('registration-question-1-option-favorite-fruit'),
    ).toBeNull();
    expect(
      screen.queryByTestId('registration-question-1-option-favorite-dish'),
    ).toBeNull();
    expect(
      screen.getByTestId('registration-question-1-option-favorite-color'),
    ).toBeTruthy();
  });

  test('requires valid written answers of 2 to 100 code points (E03-D5, E03-V10)', async () => {
    const { database } = await setup();
    await goToSecurityStep();
    await fillSecurityQuestions();
    await type('registration-answer-2', ' T ');
    await type('registration-answer-3', '');
    await press('registration-next');
    expect(screen.getByText('Paso 2 de 3')).toBeTruthy();
    expect(screen.getByTestId('registration-answer-2-error')).toHaveTextContent(
      fieldError('Ingresa una respuesta de al menos 2 caracteres.'),
    );
    expect(screen.getByTestId('registration-answer-3-error')).toHaveTextContent(
      fieldError('Ingresa la respuesta.'),
    );
    expect(await countUsers(database)).toBe(0);
    await type('registration-answer-2', 'Te');
    expect(screen.queryByTestId('registration-answer-2-error')).toBeNull();
    await type('registration-answer-3', 'Té');
    await press('registration-next');
    await screen.findByText('Paso 3 de 3');
    await press('registration-register');
    expect(await screen.findByText('El registro fue exitoso')).toBeTruthy();
    expect(await countUsers(database)).toBe(1);
  });

  test('registers, informs, clears and goes to login (HU1-CA15, HU1-CA16, HU1-CA17, A-W4, E03-W10)', async () => {
    const { database, onNavigate } = await setup();
    await goToConfirmation();
    await press('registration-register');
    expect(await screen.findByText('El registro fue exitoso')).toBeTruthy();
    expect(await countUsers(database)).toBe(1);
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    expect(
      screen.getByTestId('registration-documentNumber'),
    ).toHaveDisplayValue('');
    expect(onNavigate).not.toHaveBeenCalled();
    await press('dialog-accept');
    expect(onNavigate).toHaveBeenCalledWith('login');
  });

  test('shows «Registrando…» and blocks a second submission (A-W8, E03-V08)', async () => {
    let finish: (result: RegistrationResult) => void = () => undefined;
    const register = jest.fn(
      () =>
        new Promise<RegistrationResult>(resolve => {
          finish = resolve;
        }),
    );
    await setup(() => ({ register }));
    await goToConfirmation();
    await press('registration-register');
    expect(screen.getByText('Registrando…')).toBeTruthy();
    for (const button of [
      'registration-register',
      'registration-back',
      'registration-clear',
      'registration-cancel',
    ]) {
      expect(screen.getByTestId(button)).toBeDisabled();
    }
    await press('registration-register');
    expect(register).toHaveBeenCalledTimes(1);
    finish({ status: 'registered' });
    expect(await screen.findByText('El registro fue exitoso')).toBeTruthy();
  });

  test('a technical failure keeps non-sensitive fields and discards secrets (A-W7, E03-V07)', async () => {
    const { database } = await setup(() => ({
      register: async () => ({ status: 'failed' }),
    }));
    await goToConfirmation();
    await press('registration-register');
    expect(
      await screen.findByText(
        'No fue posible completar el registro. Intenta de nuevo',
      ),
    ).toBeTruthy();
    await press('dialog-accept');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    expect(screen.getByTestId('registration-email')).toHaveDisplayValue(
      'ana@example.com',
    );
    expect(screen.getByTestId('registration-password')).toHaveDisplayValue('');
    await type('registration-password', 'Clave123!');
    await press('registration-next');
    await screen.findByText('Paso 2 de 3');
    expect(screen.getByTestId('registration-answer-0')).toHaveDisplayValue('');
    expect(screen.getByTestId('registration-question-0')).toHaveTextContent(
      '¿Cuál es tu color favorito?',
    );
    expect(await countUsers(database)).toBe(0);
  });

  test('server-side rejection returns to the first step with errors (E03-W05, E03-V11)', async () => {
    await setup(() => ({
      register: async input => ({
        status: 'invalid',
        errors: {
          fields: { documentTypeCode: 'not_in_list' },
          securityAnswers: input.securityAnswers.map(() => ({
            question: null,
            answer: null,
          })),
          securityAnswerCountValid: true,
        },
      }),
    }));
    await goToConfirmation();
    await press('registration-register');
    await screen.findByText('Paso 1 de 3');
    expect(
      screen.getByTestId('registration-documentTypeCode-error'),
    ).toHaveTextContent(
      fieldError('Selecciona un tipo de documento de la lista.'),
    );
  });

  test('«Limpiar» asks for confirmation and clears all steps (HU1-CA19, A-W2, E03-W07)', async () => {
    await setup();
    await press('registration-clear');
    expect(screen.queryByTestId('dialog-clear')).toBeNull();
    await fillIdentification();
    await type('registration-email', 'ana@example.com');
    await press('registration-clear');
    expect(
      screen.getByText('¿Deseas borrar todos los datos ingresados?'),
    ).toBeTruthy();
    await press('dialog-cancel');
    expect(screen.getByTestId('registration-email')).toHaveDisplayValue(
      'ana@example.com',
    );
    await press('registration-clear');
    await press('dialog-confirm-clear');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    expect(
      screen.getByTestId('registration-documentNumber'),
    ).toHaveDisplayValue('');
    expect(screen.getByTestId('registration-email')).toHaveDisplayValue('');
  });

  test('«Cancelar» clears the form and goes to login without confirmation (HU1-CA18)', async () => {
    const { onNavigate } = await setup();
    await fillIdentification();
    await press('registration-cancel');
    expect(screen.queryByTestId('dialog-clear')).toBeNull();
    expect(onNavigate).toHaveBeenCalledWith('login');
    expect(
      screen.getByTestId('registration-documentNumber'),
    ).toHaveDisplayValue('');
  });
});

const HIDDEN = { includeHiddenElements: true };

describe('registration form usability (HU1 corrections, 2026-10-26)', () => {
  test('a CC only accepts digits and the rule changes with the type (E03-V06, partial)', async () => {
    await setup();
    await fillIdentification('12A45');
    expect(
      screen.getByTestId('registration-documentNumber').props.keyboardType,
    ).toBe('numeric');
    await press('registration-next');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    expect(
      screen.getByTestId('registration-documentNumber-error'),
    ).toHaveTextContent(FIELD_ERROR);
    expect(
      screen.getByTestId('registration-documentNumber'),
    ).toHaveDisplayValue('12A45');

    await select('documentTypeCode', 'PA');
    expect(
      screen.queryByTestId('registration-documentNumber-error'),
    ).toBeNull();
    expect(
      screen.getByTestId('registration-documentNumber').props.keyboardType,
    ).toBe('default');

    await select('documentTypeCode', 'CC');
    expect(
      screen.getByTestId('registration-documentNumber-error'),
    ).toHaveTextContent(FIELD_ERROR);

    await type('registration-documentNumber', '0012345');
    await fillContact();
    await press('registration-next');
    expect(await screen.findByText('Paso 2 de 3')).toBeTruthy();
  });

  test('text fields use the same frame, without the Android underline, and the phone keeps its keypad', async () => {
    await setup();
    await fillIdentification();
    const phone = screen.getByTestId('registration-phoneNumber');
    const email = screen.getByTestId('registration-email');
    expect(phone.props.keyboardType).toBe('phone-pad');
    expect(phone.props.underlineColorAndroid).toBe('transparent');
    expect(email.props.underlineColorAndroid).toBe('transparent');
    expect(phone.props.style).toEqual(email.props.style);
    await fireEvent(phone, 'focus');
    expect(phone).toHaveStyle({ borderWidth: 2 });
    await fireEvent(phone, 'blur');
    expect(phone).toHaveStyle({ borderWidth: 1 });
    await press('registration-next');
    expect(screen.getByTestId('registration-phoneNumber')).toHaveStyle({
      borderColor: '#B3261E',
    });
  });

  test('every selector shows a drop-down indicator hidden from accessibility', async () => {
    await setup();
    const indicator = screen.getByTestId(
      'registration-documentTypeCode-indicator',
      HIDDEN,
    );
    expect(indicator.props.importantForAccessibility).toBe(
      'no-hide-descendants',
    );
    expect(indicator.props.pointerEvents).toBe('none');
    expect(
      screen.getByTestId('registration-phoneCountryCode-indicator', HIDDEN),
    ).toBeTruthy();
    expect(screen.getByText('🇨🇴 Colombia (+57)')).toBeTruthy();
    await goToSecurityStep();
    for (let index = 0; index < 5; index++) {
      expect(
        screen.getByTestId(`registration-question-${index}-indicator`, HIDDEN),
      ).toBeTruthy();
    }
  });

  test('the keyboard moves to the next field without closing (returnKeyType)', async () => {
    await setup();
    const order = [
      'documentNumber',
      'firstName',
      'middleName',
      'lastName',
      'secondLastName',
      'phoneNumber',
      'email',
      'password',
    ];
    for (const [index, field] of order.entries()) {
      const input = screen.getByTestId(`registration-${field}`);
      const last = index === order.length - 1;
      expect(input.props.returnKeyType).toBe(last ? 'done' : 'next');
      expect(input.props.submitBehavior).toBe(
        last ? 'blurAndSubmit' : 'submit',
      );
    }
  });
});

describe('validation messages, password help and flags (HU1, second round 2026-10-26)', () => {
  test('shows every password requirement before any error and marks them as they are met', async () => {
    await setup();
    await fillIdentification();
    expect(screen.getByText('La contraseña debe tener:')).toBeTruthy();
    for (const text of [
      '• Entre 8 y 128 caracteres',
      '• Al menos una letra',
      '• Al menos un número',
      '• Al menos un símbolo, por ejemplo ! # $ %',
      '• Sin espacios al inicio ni al final',
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.queryByTestId('registration-password-error')).toBeNull();
    await type('registration-password', 'abc1');
    expect(screen.getByText('✓ Al menos una letra')).toBeTruthy();
    expect(screen.getByText('✓ Al menos un número')).toBeTruthy();
    expect(screen.getByText('• Entre 8 y 128 caracteres')).toBeTruthy();
    expect(
      screen.getByText('• Al menos un símbolo, por ejemplo ! # $ %'),
    ).toBeTruthy();
    await press('registration-next');
    expect(screen.getByTestId('registration-password-error')).toHaveTextContent(
      fieldError(
        'A la contraseña le falta: entre 8 y 128 caracteres; al menos un símbolo, por ejemplo ! # $ %.',
      ),
    );
    await type('registration-password', 'abcdefg1');
    expect(screen.getByTestId('registration-password-error')).toHaveTextContent(
      fieldError(
        'A la contraseña le falta: al menos un símbolo, por ejemplo ! # $ %.',
      ),
    );
    await type('registration-password', 'abcdefg1!');
    expect(screen.queryByTestId('registration-password-error')).toBeNull();
    for (const requirement of [
      'length',
      'letter',
      'number',
      'symbol',
      'no_outer_whitespace',
    ]) {
      expect(
        screen.getByTestId(
          `registration-password-requirements-${requirement}-met`,
        ),
      ).toBeTruthy();
    }
  });

  test('messages explain the phone, email and document problems and update with the value', async () => {
    await setup();
    await select('documentTypeCode', 'PA');
    await type('registration-documentNumber', 'AB#1');
    await type('registration-firstName', 'Ana');
    await type('registration-lastName', 'Rojas');
    await press('registration-next');
    expect(
      screen.getByTestId('registration-documentNumber-error'),
    ).toHaveTextContent(
      fieldError(
        'Usa solo letras y números. Puedes separarlos con espacios, puntos o guiones.',
      ),
    );
    await type('registration-documentNumber', 'AB1');
    expect(
      screen.queryByTestId('registration-documentNumber-error'),
    ).toBeNull();
    await type('registration-phoneNumber', '1'.repeat(14));
    await press('registration-next');
    expect(
      screen.getByTestId('registration-phoneNumber-error'),
    ).toHaveTextContent(
      fieldError(
        'Ingresa un número celular válido para el indicativo seleccionado: con +57 admite máximo 13 dígitos.',
      ),
    );
    await select('phoneCountryCode', 'US');
    expect(screen.queryByTestId('registration-phoneNumber-error')).toBeNull();
    expect(screen.getByTestId('registration-email-error')).toHaveTextContent(
      'Ingresa tu correo electrónico.',
    );
    await type('registration-email', 'ana');
    expect(screen.getByTestId('registration-email-error')).toHaveTextContent(
      'Verificar correo. Ingresa un correo válido, por ejemplo nombre@dominio.com.',
    );
    await type('registration-email', 'ana@example.com');
    expect(screen.queryByTestId('registration-email-error')).toBeNull();
  });

  test('CE and PPT accept digits only, with a numeric keyboard and a message for their type (E03-V06)', async () => {
    await setup();
    for (const [code, name] of [
      ['CE', 'la cédula de extranjería'],
      ['PPT', 'el permiso por protección temporal'],
    ]) {
      await select('documentTypeCode', code);
      await type('registration-documentNumber', 'E123');
      await type('registration-firstName', 'Ana');
      await type('registration-lastName', 'Rojas');
      expect(
        screen.getByTestId('registration-documentNumber').props.keyboardType,
      ).toBe('numeric');
      await press('registration-next');
      expect(
        screen.getByTestId('registration-documentNumber-error'),
      ).toHaveTextContent(fieldError(`Para ${name}, ingresa solo números.`));
    }
    await type('registration-documentNumber', '1234567');
    expect(
      screen.queryByTestId('registration-documentNumber-error'),
    ).toBeNull();
    await select('documentTypeCode', 'PA');
    expect(
      screen.getByTestId('registration-documentNumber').props.keyboardType,
    ).toBe('default');
  });

  test('the country list shows flag, name and calling code chosen by country, not by prefix', async () => {
    await setup();
    await fillIdentification();
    await press('registration-phoneCountryCode');
    expect(screen.getByText('🇺🇸 Estados Unidos (+1)')).toBeTruthy();
    expect(screen.getByText('🇨🇦 Canadá (+1)')).toBeTruthy();
    expect(screen.getByText('🇷🇺 Rusia (+7)')).toBeTruthy();
    expect(screen.getByText('🇰🇿 Kazajistán (+7)')).toBeTruthy();
    await press('registration-phoneCountryCode-option-CA');
    expect(
      screen.getByTestId('registration-phoneCountryCode'),
    ).toHaveTextContent('🇨🇦 Canadá (+1)');
  });
});

describe('Bug 38: registration sequence of the HU1 prototype', () => {
  test('step 1 groups identification, personal information and access credentials', async () => {
    await setup();
    for (const [testID, title] of [
      ['registration-section-identification', 'Identificación Oficial'],
      ['registration-section-personal', 'Información Personal'],
      ['registration-section-access', 'Credenciales de Acceso'],
    ]) {
      expect(screen.getByTestId(testID)).toHaveTextContent(title);
    }
    for (const field of [
      'documentNumber',
      'firstName',
      'lastName',
      'phoneNumber',
      'email',
      'password',
    ]) {
      expect(screen.getByTestId(`registration-${field}`)).toBeTruthy();
    }
    expect(screen.queryByTestId('registration-question-0')).toBeNull();
    expect(screen.queryByTestId('registration-back')).toBeNull();
    expect(
      screen.getByTestId('registration-progress-1-done', HIDDEN),
    ).toBeTruthy();
    expect(screen.getByTestId('registration-progress-2', HIDDEN)).toBeTruthy();
    expect(screen.getByTestId('registration-progress-3', HIDDEN)).toBeTruthy();
  });

  test('step 2 validates the questions before the confirmation', async () => {
    await setup();
    await goToSecurityStep();
    expect(
      screen.getByTestId('registration-progress-2-done', HIDDEN),
    ).toBeTruthy();
    expect(screen.queryByTestId('registration-email')).toBeNull();
    await press('registration-next');
    expect(screen.getByText('Paso 2 de 3')).toBeTruthy();
    expect(
      screen.getByTestId('registration-question-0-error'),
    ).toHaveTextContent(FIELD_ERROR);
    expect(screen.getByTestId('registration-answer-0-error')).toHaveTextContent(
      fieldError('Ingresa la respuesta.'),
    );
    expect(screen.queryByTestId('registration-register')).toBeNull();
  });

  test('step 3 shows a boxed read-only review with the answers and a masked password (A11, A12), and «Editar datos» returns to step 1', async () => {
    const { database } = await setup();
    await goToConfirmation();
    expect(screen.getByText('Confirmación de datos')).toBeTruthy();
    expect(
      screen.getByTestId('registration-progress-3-done', HIDDEN),
    ).toBeTruthy();
    expect(
      screen.getByTestId('registration-summary-document'),
    ).toHaveTextContent('Cédula de ciudadanía 1.020.304.050');
    expect(screen.getByTestId('registration-summary-name')).toHaveTextContent(
      'Ana Peña',
    );
    expect(screen.getByTestId('registration-summary-phone')).toHaveTextContent(
      '+57 3001112233',
    );
    expect(screen.getByTestId('registration-summary-email')).toHaveTextContent(
      'ana@example.com',
    );
    expect(
      screen.getByTestId('registration-summary-password'),
    ).toHaveTextContent('••••••••');
    expect(
      screen.getByTestId('registration-summary-question-0'),
    ).toHaveTextContent('¿Cuál es tu color favorito?');
    expect(screen.queryByText('Clave123!')).toBeNull();
    for (const [index, [, answer]] of ANSWERS.entries()) {
      expect(
        screen.getByTestId(`registration-summary-answer-${index}`),
      ).toHaveTextContent(answer);
    }
    expect(screen.queryByTestId('registration-answer-0')).toBeNull();
    expect(await countUsers(database)).toBe(0);

    await press('registration-back');
    expect(screen.getByText('Paso 2 de 3')).toBeTruthy();
    await press('registration-next');
    await screen.findByText('Paso 3 de 3');
    await press('registration-edit');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
    expect(screen.getByTestId('registration-email')).toHaveDisplayValue(
      'ana@example.com',
    );
  });
});

describe('Bug 39: focus of the security answers', () => {
  const focus = TextInput.prototype.focus as jest.Mock;
  const focusedFields = () =>
    focus.mock.contexts.map(
      context => (context as { props: { testID: string } }).props.testID,
    );

  beforeEach(() => focus.mockClear());

  test('choosing a question focuses its own answer once the list closes', async () => {
    await setup();
    await goToSecurityStep();
    focus.mockClear();
    jest.useFakeTimers();
    try {
      await select('question-2', 'favorite-sport');
      expect(focusedFields()).toEqual([]);
      await act(() => jest.advanceTimersByTime(250));
      expect(focusedFields()).toEqual(['registration-answer-2']);
    } finally {
      jest.useRealTimers();
    }
  });

  test('«next» on an answer only moves to an answer whose question is chosen', async () => {
    await setup();
    await goToSecurityStep();
    const answer0 = () => screen.getByTestId('registration-answer-0');
    expect(answer0().props.returnKeyType).toBe('done');
    expect(answer0().props.submitBehavior).toBe('blurAndSubmit');
    await select('question-1', 'first-pet');
    expect(answer0().props.returnKeyType).toBe('next');
    focus.mockClear();
    await fireEvent(answer0(), 'submitEditing');
    expect(focusedFields()).toEqual(['registration-answer-1']);
    expect(
      screen.getByTestId('registration-answer-4').props.returnKeyType,
    ).toBe('done');
  });
});

describe('E-COR: registration fidelity to the HU1 mockups (A1-A13)', () => {
  test('A1, A2, A4, A5, A10: centred header with back and help, intro card and SQLCipher note', async () => {
    const { onNavigate } = await setup();
    expect(screen.getByTestId('registration-title')).toHaveTextContent(
      'Registro de Usuario',
    );
    expect(screen.getByTestId('registration-title')).toHaveStyle({
      textAlign: 'center',
    });
    expect(screen.getByTestId('registration-step-title')).toHaveStyle({
      textAlign: 'center',
    });
    expect(screen.getByTestId('registration-intro')).toHaveTextContent(
      'Únete a GFPIngresa tus datos personales y de seguridad para configurar una cuenta completamente protegida. Los campos marcados con (*) son obligatorios.',
    );
    expect(screen.getByTestId('security-note')).toHaveTextContent(
      'Datos encriptados con SQLCipher',
    );
    await press('registration-help-button');
    expect(screen.getByTestId('dialog-help')).toBeTruthy();
    await press('dialog-accept');
    await press('registration-back-button');
    expect(onNavigate).toHaveBeenCalledWith('login');
  });

  test('A1: back goes to the previous step from step 2', async () => {
    await setup();
    await goToSecurityStep();
    await press('registration-back-button');
    expect(screen.getByText('Paso 1 de 3')).toBeTruthy();
  });

  test('A6, A8, A9: grouped sections, required marks, placeholders and a red «Cancelar»', async () => {
    await setup();
    for (const section of ['identification', 'personal', 'access']) {
      expect(
        screen.getByTestId(`registration-section-${section}-card`),
      ).toBeTruthy();
    }
    expect(screen.getAllByText(' *').length).toBeGreaterThanOrEqual(8);
    expect(screen.getAllByText('(opcional)')).toHaveLength(2);
    const placeholders: Array<[string, string]> = [
      ['documentNumber', 'Ej. 10203040 o 900.123.456-7'],
      ['middleName', 'Ingresa tu segundo nombre (si aplica)'],
      ['secondLastName', 'Ingresa tu segundo apellido (si aplica)'],
      ['email', 'carlos.mendoza@email.com'],
      ['password', 'Crea una contraseña segura'],
    ];
    for (const [field, placeholder] of placeholders) {
      expect(
        screen.getByTestId(`registration-${field}`).props.placeholder,
      ).toBe(placeholder);
    }
    expect(screen.getByTestId('registration-cancel')).toHaveStyle({
      backgroundColor: '#FDECEA',
    });
    expect(screen.getByText('Cancelar')).toHaveStyle({ color: '#B3261E' });
  });

  test('the password can be shown and hidden', async () => {
    await setup();
    const password = () => screen.getByTestId('registration-password');
    expect(password().props.secureTextEntry).toBe(true);
    await press('registration-password-visibility');
    expect(password().props.secureTextEntry).toBe(false);
    await press('registration-password-visibility');
    expect(password().props.secureTextEntry).toBe(true);
  });

  test('A7: each question and its answer are grouped with their texts', async () => {
    await setup();
    await goToSecurityStep();
    const slot = within(screen.getByTestId('registration-slot-0'));
    expect(slot.getByText('PREGUNTA DE SEGURIDAD 1')).toBeTruthy();
    expect(slot.getByText('Obligatorio *')).toBeTruthy();
    expect(slot.getAllByText('Selecciona una pregunta').length).toBeGreaterThan(
      0,
    );
    expect(slot.getByText('Tu respuesta')).toBeTruthy();
    expect(screen.getByTestId('registration-answer-0').props.placeholder).toBe(
      'Escribe la respuesta secreta aquí',
    );
    expect(screen.getByLabelText('Respuesta 1')).toBeTruthy();
    expect(screen.getByLabelText('Pregunta de seguridad 1')).toBeTruthy();
  });

  test('A13: messages show only the concrete cause', async () => {
    await setup();
    await press('registration-next');
    expect(
      screen.getByTestId('registration-documentNumber-error'),
    ).toHaveTextContent('Ingresa el número de documento.');
    expect(screen.queryByText(/Error en los campos ingresados/)).toBeNull();
  });
});
