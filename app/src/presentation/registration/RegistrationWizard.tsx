import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import type { DocumentType } from '../../infrastructure/database/repositories/identityRepository';
import {
  CALLING_CODES,
  type AvailabilityResult,
  type RegistrationGateway,
  type RegistrationResult,
} from '../../services/authentication/accountRegistration';
import {
  COUNTRY_CALLING_CODES,
  DEFAULT_PHONE_REGION,
  countryLabel,
} from '../../services/authentication/countryCallingCodes';
import {
  hasRegistrationErrors,
  documentNumberError,
  isDigitsOnlyDocumentType,
  validateContact,
  validateIdentification,
  validateRegistration,
  type FieldError,
  type FieldErrors,
  type RegistrationErrors,
  type RegistrationField,
  type RegistrationInput,
} from '../../services/authentication/registrationValidation';
import {
  REGISTRATION_QUESTION_COUNT,
  securityAnswerViolation,
  type SecurityAnswerSlotError,
  type SecurityQuestion,
} from '../../services/authentication/securityQuestionPolicy';
import { ActionButton } from '../components/ActionButton';
import { FormScrollView } from '../components/FormScrollView';
import { MessageDialog } from '../components/MessageDialog';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { ROUTES, type RouteName } from '../navigation/routes';
import { PasswordRequirements } from './PasswordRequirements';
import {
  answerErrorMessage,
  fieldErrorMessage,
  questionErrorMessage,
} from './registrationMessages';
import { REGISTRATION_TEXTS as TEXTS } from './registrationTexts';

type Step = 1 | 2 | 3;

type SecuritySlot = { questionId: string; answer: string };

type WizardData = {
  documentTypeCode: string;
  documentNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  phoneRegion: string;
  phoneNumber: string;
  email: string;
  password: string;
  securityAnswers: SecuritySlot[];
};

type TextFieldName = Exclude<
  RegistrationField,
  'documentTypeCode' | 'phoneCountryCode'
>;

const IDENTIFICATION_TEXT_FIELDS = [
  'documentNumber',
  'firstName',
  'middleName',
  'lastName',
  'secondLastName',
] as const satisfies readonly TextFieldName[];

const CONTACT_TEXT_FIELDS = [
  'phoneNumber',
  'email',
  'password',
] as const satisfies readonly TextFieldName[];

const NAME_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'secondLastName',
] as const satisfies readonly TextFieldName[];

type Dialog =
  | 'already_registered'
  | 'registered'
  | 'failed'
  | 'confirm_clear'
  | null;

type Busy = 'idle' | 'checking' | 'registering';

type Catalog = {
  documentTypes: DocumentType[];
  questions: SecurityQuestion[];
};

const EMPTY_SLOTS: SecurityAnswerSlotError[] = Array.from(
  { length: REGISTRATION_QUESTION_COUNT },
  () => ({ question: null, answer: null }),
);

function emptyData(): WizardData {
  return {
    documentTypeCode: '',
    documentNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    phoneRegion: DEFAULT_PHONE_REGION,
    phoneNumber: '',
    email: '',
    password: '',
    securityAnswers: Array.from(
      { length: REGISTRATION_QUESTION_COUNT },
      () => ({
        questionId: '',
        answer: '',
      }),
    ),
  };
}

const IDENTIFICATION_FIELDS: readonly RegistrationField[] = [
  'documentTypeCode',
  'documentNumber',
  'firstName',
  'middleName',
  'lastName',
  'secondLastName',
];

function callingCodeOf(region: string): string {
  return (
    COUNTRY_CALLING_CODES.find(country => country.regionCode === region)
      ?.callingCode ?? ''
  );
}

function toInput(data: WizardData): RegistrationInput {
  return {
    documentTypeCode: data.documentTypeCode,
    documentNumber: data.documentNumber,
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    secondLastName: data.secondLastName,
    phoneCountryCode: callingCodeOf(data.phoneRegion),
    phoneNumber: data.phoneNumber,
    email: data.email,
    password: data.password,
    securityAnswers: data.securityAnswers.map(slot => ({ ...slot })),
  };
}

function hasEnteredData(data: WizardData): boolean {
  const { phoneRegion, securityAnswers, ...texts } = data;
  return (
    phoneRegion !== DEFAULT_PHONE_REGION ||
    Object.values(texts).some(value => value.length > 0) ||
    securityAnswers.some(slot => slot.questionId !== '' || slot.answer !== '')
  );
}

function firstStepWithErrors(errors: RegistrationErrors): Step {
  const fields = Object.keys(errors.fields) as RegistrationField[];
  if (fields.some(field => IDENTIFICATION_FIELDS.includes(field))) {
    return 1;
  }
  return fields.length > 0 ? 2 : 3;
}

const COUNTRY_OPTIONS = COUNTRY_CALLING_CODES.map(country => ({
  value: country.regionCode,
  label: countryLabel(country),
}));

type RegistrationWizardProps = {
  gateway: RegistrationGateway;
  onNavigate: (route: RouteName) => void;
};

export function RegistrationWizard({
  gateway,
  onNavigate,
}: RegistrationWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>(emptyData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [slotErrors, setSlotErrors] =
    useState<SecurityAnswerSlotError[]>(EMPTY_SLOTS);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState<Busy>('idle');
  const [catalog, setCatalog] = useState<Catalog>({
    documentTypes: [],
    questions: [],
  });
  const inputRefs = useRef(new Map<string, TextInputInstance | null>());

  function inputRef(name: string) {
    return (input: TextInputInstance | null) => {
      inputRefs.current.set(name, input);
    };
  }

  function focusNext(order: readonly string[], current: string) {
    const next = order[order.indexOf(current) + 1];
    if (next !== undefined) {
      inputRefs.current.get(next)?.focus();
    }
  }

  function navigationProps(order: readonly string[], name: string) {
    const isLast = order.indexOf(name) === order.length - 1;
    return {
      ref: inputRef(name),
      returnKeyType: isLast ? ('done' as const) : ('next' as const),
      submitBehavior: isLast ? ('blurAndSubmit' as const) : ('submit' as const),
      onSubmitEditing: () => focusNext(order, name),
    };
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      gateway.listDocumentTypes(),
      gateway.listSecurityQuestions(),
    ]).then(
      ([documentTypes, questions]) =>
        active && setCatalog({ documentTypes, questions }),
      () => active && setDialog('failed'),
    );
    return () => {
      active = false;
    };
  }, [gateway]);

  const documentTypeOptions = useMemo(
    () =>
      catalog.documentTypes.map(type => ({
        value: type.code,
        label: type.name,
      })),
    [catalog.documentTypes],
  );
  const activeDocumentTypeCodes = useMemo(
    () => catalog.documentTypes.map(type => type.code),
    [catalog.documentTypes],
  );

  const disabled = busy !== 'idle';
  const digitsOnlyDocument = isDigitsOnlyDocumentType(data.documentTypeCode);

  function resetWizard() {
    setData(emptyData());
    setFieldErrors({});
    setSlotErrors(EMPTY_SLOTS);
    setStep(1);
  }

  function fieldMessage(field: RegistrationField): string | null {
    const error = fieldErrors[field];
    if (error === undefined) {
      return null;
    }
    return fieldErrorMessage(field, error, {
      callingCode: callingCodeOf(data.phoneRegion),
      documentTypeCode: data.documentTypeCode,
      password: data.password,
    });
  }

  function currentFieldError(
    field: RegistrationField,
    next: WizardData,
  ): FieldError | null {
    const errors = IDENTIFICATION_FIELDS.includes(field)
      ? validateIdentification(next, activeDocumentTypeCodes)
      : validateContact(toInput(next), CALLING_CODES);
    return errors[field] ?? null;
  }

  function setFieldError(field: RegistrationField, error: FieldError | null) {
    setFieldErrors(current => {
      if (current[field] === (error ?? undefined)) {
        return current;
      }
      const next = { ...current };
      if (error === null) {
        delete next[field];
      } else {
        next[field] = error;
      }
      return next;
    });
  }

  function refreshShownError(field: RegistrationField, next: WizardData) {
    if (fieldErrors[field] !== undefined) {
      setFieldError(field, currentFieldError(field, next));
    }
  }

  function clearFieldError(field: RegistrationField) {
    setFieldErrors(current => {
      if (current[field] === undefined) {
        return current;
      }
      const rest = { ...current };
      delete rest[field];
      return rest;
    });
  }

  function revalidateDocumentNumber(documentTypeCode: string) {
    if (data.documentNumber.length === 0) {
      return;
    }
    setFieldError(
      'documentNumber',
      documentNumberError(data.documentNumber, documentTypeCode),
    );
  }

  function updateText(field: TextFieldName, value: string) {
    setData(current => ({ ...current, [field]: value }));
    refreshShownError(field, { ...data, [field]: value });
  }

  function updateSlot(index: number, change: Partial<SecuritySlot>) {
    setData(current => ({
      ...current,
      securityAnswers: current.securityAnswers.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...change } : slot,
      ),
    }));
    setSlotErrors(current =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              question: change.questionId === undefined ? slot.question : null,
              answer:
                change.answer === undefined || slot.answer === null
                  ? slot.answer
                  : securityAnswerViolation(change.answer),
            }
          : slot,
      ),
    );
  }

  async function handleNext() {
    if (step === 1) {
      const errors = validateIdentification(data, activeDocumentTypeCodes);
      setFieldErrors(errors);
      if (Object.keys(errors).length === 0) {
        setStep(2);
      }
      return;
    }
    const input = toInput(data);
    const errors = validateContact(input, CALLING_CODES);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setBusy('checking');
    const availability = await gateway
      .checkAvailability(input)
      .catch((): AvailabilityResult => 'failed');
    setBusy('idle');
    if (availability === 'available') {
      setStep(3);
    } else {
      setDialog(
        availability === 'already_registered' ? 'already_registered' : 'failed',
      );
    }
  }

  async function handleRegister() {
    const input = toInput(data);
    const errors = validateRegistration(input, {
      activeDocumentTypeCodes,
      callingCodes: CALLING_CODES,
      securityQuestions: catalog.questions,
    });
    if (hasRegistrationErrors(errors)) {
      setFieldErrors(errors.fields);
      setSlotErrors(errors.securityAnswers);
      setStep(firstStepWithErrors(errors));
      return;
    }
    setBusy('registering');
    const result = await gateway
      .register(input)
      .catch((): RegistrationResult => ({ status: 'failed' }));
    setBusy('idle');
    if (result.status === 'registered') {
      resetWizard();
      setDialog('registered');
    } else if (result.status === 'invalid') {
      setFieldErrors(result.errors.fields);
      setSlotErrors(result.errors.securityAnswers);
      setStep(firstStepWithErrors(result.errors));
    } else if (result.status === 'already_registered') {
      setDialog('already_registered');
    } else {
      setData(current => ({
        ...current,
        password: '',
        securityAnswers: current.securityAnswers.map(slot => ({
          questionId: slot.questionId,
          answer: '',
        })),
      }));
      setDialog('failed');
    }
  }

  function handleClear() {
    if (hasEnteredData(data)) {
      setDialog('confirm_clear');
    } else {
      resetWizard();
    }
  }

  function handleCancel() {
    resetWizard();
    onNavigate(ROUTES.login);
  }

  function questionMessage(
    violation: SecurityAnswerSlotError['question'],
  ): string | null {
    return violation === null ? null : questionErrorMessage(violation);
  }

  function answerMessage(
    violation: SecurityAnswerSlotError['answer'],
  ): string | null {
    return violation === null ? null : answerErrorMessage(violation);
  }

  function questionOptions(index: number) {
    const usedGroups = new Set(
      data.securityAnswers
        .filter((slot, slotIndex) => slotIndex !== index && slot.questionId)
        .map(
          slot =>
            catalog.questions.find(question => question.id === slot.questionId)
              ?.similarityGroup,
        ),
    );
    return catalog.questions
      .filter(question => !usedGroups.has(question.similarityGroup))
      .map(question => ({ value: question.id, label: question.prompt }));
  }

  function renderIdentification() {
    return (
      <>
        <SelectField
          disabled={disabled}
          error={fieldMessage('documentTypeCode')}
          label={TEXTS.labels.documentTypeCode}
          onChange={value => {
            setData(current => ({ ...current, documentTypeCode: value }));
            clearFieldError('documentTypeCode');
            revalidateDocumentNumber(value);
          }}
          options={documentTypeOptions}
          placeholder={TEXTS.selectPlaceholder}
          testID="registration-documentTypeCode"
          value={data.documentTypeCode}
        />
        <TextField
          {...navigationProps(IDENTIFICATION_TEXT_FIELDS, 'documentNumber')}
          autoCapitalize={digitsOnlyDocument ? 'none' : 'characters'}
          autoCorrect={false}
          editable={!disabled}
          error={fieldMessage('documentNumber')}
          keyboardType={digitsOnlyDocument ? 'numeric' : 'default'}
          label={TEXTS.labels.documentNumber}
          onChangeText={value => updateText('documentNumber', value)}
          testID="registration-documentNumber"
          value={data.documentNumber}
        />
        {NAME_FIELDS.map(field => (
          <TextField
            {...navigationProps(IDENTIFICATION_TEXT_FIELDS, field)}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!disabled}
            error={fieldMessage(field)}
            key={field}
            label={TEXTS.labels[field]}
            onChangeText={value => updateText(field, value)}
            testID={`registration-${field}`}
            value={data[field]}
          />
        ))}
      </>
    );
  }

  function renderContact() {
    return (
      <>
        <SelectField
          disabled={disabled}
          error={fieldMessage('phoneCountryCode')}
          label={TEXTS.labels.phoneCountryCode}
          onChange={value => {
            setData(current => ({ ...current, phoneRegion: value }));
            clearFieldError('phoneCountryCode');
            refreshShownError('phoneNumber', { ...data, phoneRegion: value });
          }}
          options={COUNTRY_OPTIONS}
          placeholder={TEXTS.selectPlaceholder}
          testID="registration-phoneCountryCode"
          value={data.phoneRegion}
        />
        <TextField
          {...navigationProps(CONTACT_TEXT_FIELDS, 'phoneNumber')}
          editable={!disabled}
          error={fieldMessage('phoneNumber')}
          keyboardType="phone-pad"
          label={TEXTS.labels.phoneNumber}
          onChangeText={value => updateText('phoneNumber', value)}
          testID="registration-phoneNumber"
          value={data.phoneNumber}
        />
        <TextField
          {...navigationProps(CONTACT_TEXT_FIELDS, 'email')}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!disabled}
          error={fieldMessage('email')}
          keyboardType="email-address"
          label={TEXTS.labels.email}
          onChangeText={value => updateText('email', value)}
          testID="registration-email"
          value={data.email}
        />
        <TextField
          {...navigationProps(CONTACT_TEXT_FIELDS, 'password')}
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          editable={!disabled}
          error={fieldMessage('password')}
          helper={
            <PasswordRequirements
              password={data.password}
              testID="registration-password-requirements"
            />
          }
          label={TEXTS.labels.password}
          onChangeText={value => updateText('password', value)}
          secureTextEntry
          testID="registration-password"
          value={data.password}
        />
      </>
    );
  }

  function renderSecurityQuestions() {
    const answerOrder = data.securityAnswers.map(
      (_slot, index) => `answer-${index}`,
    );
    return data.securityAnswers.map((slot, index) => (
      <View key={index} style={styles.slot}>
        <SelectField
          disabled={disabled}
          error={questionMessage(slotErrors[index]?.question ?? null)}
          label={TEXTS.labels.securityQuestion(index + 1)}
          onChange={value => updateSlot(index, { questionId: value })}
          options={questionOptions(index)}
          placeholder={TEXTS.selectPlaceholder}
          testID={`registration-question-${index}`}
          value={slot.questionId}
        />
        <TextField
          {...navigationProps(answerOrder, `answer-${index}`)}
          autoCorrect={false}
          editable={!disabled}
          error={answerMessage(slotErrors[index]?.answer ?? null)}
          label={TEXTS.labels.securityAnswer(index + 1)}
          onChangeText={value => updateSlot(index, { answer: value })}
          testID={`registration-answer-${index}`}
          value={slot.answer}
        />
      </View>
    ));
  }

  return (
    <View style={styles.screen} testID="registration-wizard">
      <FormScrollView
        contentStyle={styles.content}
        testID="registration-scroll"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.screenTitle}
        </Text>
        <Text style={styles.stepIndicator} testID="registration-step">
          {TEXTS.stepIndicator(step)}
        </Text>
        <Text style={styles.stepTitle}>{TEXTS.stepTitles[step - 1]}</Text>
        {step === 1 && renderIdentification()}
        {step === 2 && renderContact()}
        {step === 3 && renderSecurityQuestions()}
        {busy === 'registering' && (
          <View style={styles.progress} testID="registration-progress">
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.progressText}>
              {TEXTS.messages.registering}
            </Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          {step > 1 && (
            <ActionButton
              disabled={disabled}
              label={TEXTS.buttons.back}
              onPress={() => setStep((step - 1) as Step)}
              testID="registration-back"
            />
          )}
          {step < 3 ? (
            <ActionButton
              disabled={disabled}
              label={TEXTS.buttons.next}
              onPress={() => {
                handleNext();
              }}
              testID="registration-next"
              variant="primary"
            />
          ) : (
            <ActionButton
              disabled={disabled}
              label={TEXTS.buttons.register}
              onPress={() => {
                handleRegister();
              }}
              testID="registration-register"
              variant="primary"
            />
          )}
        </View>
        <View style={styles.buttonRow}>
          <ActionButton
            disabled={disabled}
            label={TEXTS.buttons.clear}
            onPress={handleClear}
            testID="registration-clear"
          />
          <ActionButton
            disabled={disabled}
            label={TEXTS.buttons.cancel}
            onPress={handleCancel}
            testID="registration-cancel"
          />
        </View>
      </FormScrollView>
      {dialog === 'confirm_clear' && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.cancel,
              onPress: () => setDialog(null),
              testID: 'dialog-cancel',
              variant: 'secondary',
            },
            {
              label: TEXTS.buttons.confirmClear,
              onPress: () => {
                setDialog(null);
                resetWizard();
              },
              testID: 'dialog-confirm-clear',
            },
          ]}
          message={TEXTS.messages.clearConfirmation}
          onRequestClose={() => setDialog(null)}
          testID="dialog-clear"
        />
      )}
      {dialog === 'registered' && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => {
                setDialog(null);
                onNavigate(ROUTES.login);
              },
              testID: 'dialog-accept',
            },
          ]}
          message={TEXTS.messages.registered}
          onRequestClose={() => {
            setDialog(null);
            onNavigate(ROUTES.login);
          }}
          testID="dialog-registered"
        />
      )}
      {(dialog === 'already_registered' || dialog === 'failed') && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => setDialog(null),
              testID: 'dialog-accept',
            },
          ]}
          message={
            dialog === 'failed'
              ? TEXTS.messages.registrationFailed
              : TEXTS.messages.alreadyRegistered
          }
          onRequestClose={() => setDialog(null)}
          testID={`dialog-${dialog}`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  stepIndicator: { color: COLORS.mutedText, fontSize: 15, marginTop: 6 },
  stepTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 4,
  },
  slot: { marginBottom: 8 },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressText: { color: COLORS.text, fontSize: 16, marginLeft: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 8 },
});
