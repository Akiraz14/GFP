import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
  validateSecurityAnswerSlots,
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

// Bug 38: the first step holds every personal and access field, in the order of the HU1
// prototype, so the keyboard «next» key walks through all of them.
const ACCOUNT_TEXT_FIELDS = [
  'documentNumber',
  'firstName',
  'middleName',
  'lastName',
  'secondLastName',
  'phoneNumber',
  'email',
  'password',
] as const satisfies readonly TextFieldName[];

// Bug 39: delay before focusing an answer after its question list closes, so the
// keyboard opens once the selector modal has finished its fade animation.
export const ANSWER_FOCUS_DELAY_MS = 250;

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

function hasSlotErrors(slots: readonly SecurityAnswerSlotError[]): boolean {
  return slots.some(slot => slot.question !== null || slot.answer !== null);
}

function firstStepWithErrors(errors: RegistrationErrors): Step {
  if (Object.keys(errors.fields).length > 0) {
    return 1;
  }
  return hasSlotErrors(errors.securityAnswers) ? 2 : 3;
}

const MASKED_SECRET = '••••••••';

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

  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFocus === null) {
      return;
    }
    const timer = setTimeout(() => {
      inputRefs.current.get(pendingFocus)?.focus();
      setPendingFocus(null);
    }, ANSWER_FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pendingFocus]);

  function goToStep(next: Step) {
    Keyboard.dismiss();
    setPendingFocus(null);
    setStep(next);
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
    goToStep(1);
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
    if (step === 2) {
      const errors = validateSecurityAnswerSlots(
        data.securityAnswers,
        catalog.questions,
      );
      setSlotErrors(errors);
      if (!hasSlotErrors(errors)) {
        goToStep(3);
      }
      return;
    }
    const input = toInput(data);
    const errors = {
      ...validateIdentification(input, activeDocumentTypeCodes),
      ...validateContact(input, CALLING_CODES),
    };
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
      goToStep(2);
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
      goToStep(firstStepWithErrors(errors));
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
      goToStep(firstStepWithErrors(result.errors));
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
      goToStep(1);
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

  function sectionHeader(title: string, testID: string) {
    return (
      <Text accessibilityRole="header" style={styles.section} testID={testID}>
        {title}
      </Text>
    );
  }

  function renderAccount() {
    return (
      <>
        {sectionHeader(
          TEXTS.sections.identification,
          'registration-section-identification',
        )}
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
          {...navigationProps(ACCOUNT_TEXT_FIELDS, 'documentNumber')}
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
        {sectionHeader(
          TEXTS.sections.personal,
          'registration-section-personal',
        )}
        {NAME_FIELDS.map(field => (
          <TextField
            {...navigationProps(ACCOUNT_TEXT_FIELDS, field)}
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
        {sectionHeader(TEXTS.sections.access, 'registration-section-access')}
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
          {...navigationProps(ACCOUNT_TEXT_FIELDS, 'phoneNumber')}
          editable={!disabled}
          error={fieldMessage('phoneNumber')}
          keyboardType="phone-pad"
          label={TEXTS.labels.phoneNumber}
          onChangeText={value => updateText('phoneNumber', value)}
          testID="registration-phoneNumber"
          value={data.phoneNumber}
        />
        <TextField
          {...navigationProps(ACCOUNT_TEXT_FIELDS, 'email')}
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
          {...navigationProps(ACCOUNT_TEXT_FIELDS, 'password')}
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

  // Bug 39: choosing a question moves the focus to its own answer; «next» on an answer
  // only jumps to the following answer when that slot already has its question, so the
  // keyboard never lands in a field whose question the user has not seen yet.
  function answerNavigationProps(index: number) {
    const name = `answer-${index}`;
    const nextReady =
      index + 1 < data.securityAnswers.length &&
      data.securityAnswers[index + 1].questionId !== '';
    return {
      ref: inputRef(name),
      returnKeyType: nextReady ? ('next' as const) : ('done' as const),
      submitBehavior: nextReady
        ? ('submit' as const)
        : ('blurAndSubmit' as const),
      onSubmitEditing: () => {
        if (nextReady) {
          inputRefs.current.get(`answer-${index + 1}`)?.focus();
        }
      },
    };
  }

  function renderSecurityQuestions() {
    return data.securityAnswers.map((slot, index) => (
      <View key={index} style={styles.slot}>
        <SelectField
          disabled={disabled}
          error={questionMessage(slotErrors[index]?.question ?? null)}
          label={TEXTS.labels.securityQuestion(index + 1)}
          onChange={value => {
            updateSlot(index, { questionId: value });
            setPendingFocus(`answer-${index}`);
          }}
          options={questionOptions(index)}
          placeholder={TEXTS.selectPlaceholder}
          testID={`registration-question-${index}`}
          value={slot.questionId}
        />
        <TextField
          {...answerNavigationProps(index)}
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

  function summaryRow(label: string, value: string, testID: string) {
    return (
      <View key={testID} style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue} testID={testID}>
          {value}
        </Text>
      </View>
    );
  }

  // Bug 38: read-only review before «Registrar», as in the third screen of the prototype.
  // Secrets are never shown: the password and the answers appear masked.
  function renderConfirmation() {
    const documentType =
      catalog.documentTypes.find(type => type.code === data.documentTypeCode)
        ?.name ?? data.documentTypeCode;
    const fullName = [
      data.firstName,
      data.middleName,
      data.lastName,
      data.secondLastName,
    ]
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .join(' ');
    return (
      <View style={styles.summary} testID="registration-summary">
        {sectionHeader(
          TEXTS.sections.identification,
          'registration-summary-identification',
        )}
        {summaryRow(
          TEXTS.summary.document,
          `${documentType} ${data.documentNumber.trim()}`,
          'registration-summary-document',
        )}
        {summaryRow(
          TEXTS.summary.fullName,
          fullName,
          'registration-summary-name',
        )}
        {sectionHeader(TEXTS.sections.access, 'registration-summary-access')}
        {summaryRow(
          TEXTS.labels.phoneNumber,
          `${callingCodeOf(data.phoneRegion)} ${data.phoneNumber.trim()}`,
          'registration-summary-phone',
        )}
        {summaryRow(
          TEXTS.labels.email,
          data.email.trim(),
          'registration-summary-email',
        )}
        {summaryRow(
          TEXTS.labels.password,
          MASKED_SECRET,
          'registration-summary-password',
        )}
        {sectionHeader(TEXTS.stepTitles[1], 'registration-summary-security')}
        {data.securityAnswers.map((slot, index) =>
          summaryRow(
            TEXTS.labels.securityQuestion(index + 1),
            catalog.questions.find(question => question.id === slot.questionId)
              ?.prompt ?? '',
            `registration-summary-question-${index}`,
          ),
        )}
        <Text style={styles.summaryNote}>{TEXTS.summary.note}</Text>
      </View>
    );
  }

  function renderProgress() {
    return (
      <View
        importantForAccessibility="no-hide-descendants"
        style={styles.progressBar}
      >
        {([1, 2, 3] as const).map(index => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index <= step && styles.progressSegmentDone,
            ]}
            testID={`registration-progress-${index}${
              index <= step ? '-done' : ''
            }`}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="registration-wizard">
      <FormScrollView
        contentStyle={styles.content}
        key={step}
        testID="registration-scroll"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.screenTitle}
        </Text>
        <Text style={styles.stepIndicator} testID="registration-step">
          {TEXTS.stepIndicator(step)}
        </Text>
        {renderProgress()}
        <Text style={styles.stepTitle}>{TEXTS.stepTitles[step - 1]}</Text>
        {step === 1 && renderAccount()}
        {step === 2 && renderSecurityQuestions()}
        {step === 3 && renderConfirmation()}
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
              onPress={() => goToStep((step - 1) as Step)}
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
        {step === 3 && (
          <View style={styles.buttonRow}>
            <ActionButton
              disabled={disabled}
              label={TEXTS.buttons.edit}
              onPress={() => goToStep(1)}
              testID="registration-edit"
            />
          </View>
        )}
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
  progressBar: { flexDirection: 'row', marginTop: 8 },
  progressSegment: {
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    flex: 1,
    height: 4,
    marginHorizontal: 2,
  },
  progressSegmentDone: { backgroundColor: COLORS.primary },
  section: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  summary: { marginBottom: 8 },
  summaryRow: {
    borderBottomColor: COLORS.secondary,
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 8,
  },
  summaryLabel: { color: COLORS.mutedText, fontSize: 14 },
  summaryValue: { color: COLORS.text, fontSize: 16, marginTop: 2 },
  summaryNote: { color: COLORS.mutedText, fontSize: 14, marginTop: 4 },
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
