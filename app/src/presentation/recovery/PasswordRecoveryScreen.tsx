import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LOGIN_IDENTIFIER_MAX_LENGTH } from '../../services/authentication/accountLogin';
import {
  validateRecoveryIdentifier,
  type RecoveryCompletionResult,
  type RecoveryGateway,
} from '../../services/authentication/accountRecovery';
import {
  PASSWORD_MAX_LENGTH,
  validateNewPassword,
} from '../../services/authentication/passwordPolicy';
import {
  SECURITY_ANSWER_MAX_LENGTH,
  type SecurityQuestion,
} from '../../services/authentication/securityQuestionPolicy';
import { ActionButton } from '../components/ActionButton';
import { FormScrollView } from '../components/FormScrollView';
import { MessageDialog } from '../components/MessageDialog';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { lockMinutes } from '../login/loginTexts';
import { ROUTES, type RouteName } from '../navigation/routes';
import { PasswordRequirements } from '../registration/PasswordRequirements';
import { RECOVERY_TEXTS as TEXTS } from './recoveryTexts';

type PasswordRecoveryScreenProps = {
  gateway: RecoveryGateway;
  onNavigate: (route: RouteName) => void;
};

type Dialog = { message: string; onClose: () => void };

type Challenge = { questions: SecurityQuestion[] };

type AnswerErrors = [boolean, boolean];

const NO_ANSWER_ERRORS: AnswerErrors = [false, false];

function completionMessage(result: RecoveryCompletionResult): string {
  switch (result.status) {
    case 'locked':
      return TEXTS.messages.lockedFor(lockMinutes(result.retryAfterMs));
    case 'challenge_expired':
      return TEXTS.messages.challengeExpired;
    case 'failed':
      return TEXTS.messages.failed;
    case 'password_updated':
      return TEXTS.messages.passwordUpdated;
    default:
      return TEXTS.messages.invalidData;
  }
}

export function PasswordRecoveryScreen({
  gateway,
  onNavigate,
}: PasswordRecoveryScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answers, setAnswers] = useState<[string, string]>(['', '']);
  const [answerErrors, setAnswerErrors] =
    useState<AnswerErrors>(NO_ANSWER_ERRORS);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirmationError, setConfirmationError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const mounted = useRef(true);
  const submitting = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!submitting.current) {
          onNavigate(ROUTES.login);
        }
        return true;
      },
    );
    return () => subscription.remove();
  }, [onNavigate]);

  function clearSecrets() {
    setAnswers(['', '']);
    setNewPassword('');
    setConfirmation('');
  }

  function backToIdentifier() {
    clearSecrets();
    setAnswerErrors(NO_ANSWER_ERRORS);
    setPasswordError(false);
    setConfirmationError(false);
    setChallenge(null);
  }

  function showDialog(message: string, onClose: () => void = () => {}) {
    setDialog({ message, onClose });
  }

  async function run<T>(task: () => Promise<T>): Promise<T | null> {
    if (submitting.current) {
      return null;
    }
    submitting.current = true;
    setBusy(true);
    try {
      return await task();
    } finally {
      submitting.current = false;
      if (mounted.current) {
        setBusy(false);
      }
    }
  }

  async function handleStart() {
    const localError = validateRecoveryIdentifier(identifier);
    if (localError !== null) {
      setIdentifierError(
        localError === 'required'
          ? TEXTS.messages.identifierRequired
          : TEXTS.messages.invalidIdentifier,
      );
      return;
    }
    setIdentifierError(null);
    const outcome = await run(async () => {
      const result = await gateway.start(identifier);
      if (result.status !== 'challenge') {
        return { result, questions: null };
      }
      const catalog = await gateway.listSecurityQuestions();
      const questions = result.questionIds.map(id =>
        catalog.find(question => question.id === id),
      );
      return {
        result,
        questions: questions.every(question => question !== undefined)
          ? (questions as SecurityQuestion[])
          : null,
      };
    }).catch(() => ({
      result: { status: 'failed' as const },
      questions: null,
    }));
    if (outcome === null || !mounted.current) {
      return;
    }
    const { result, questions } = outcome;
    switch (result.status) {
      case 'challenge':
        if (questions === null) {
          showDialog(TEXTS.messages.failed);
          return;
        }
        backToIdentifier();
        setChallenge({ questions });
        return;
      case 'invalid_identifier':
        setIdentifierError(TEXTS.messages.invalidIdentifier);
        return;
      case 'phone_country_code_required':
        setIdentifierError(TEXTS.messages.phoneCountryCodeRequired);
        return;
      case 'locked':
        showDialog(TEXTS.messages.lockedFor(lockMinutes(result.retryAfterMs)));
        return;
      default:
        showDialog(TEXTS.messages.failed);
    }
  }

  async function handleUpdate() {
    if (challenge === null) {
      return;
    }
    const missing: AnswerErrors = [
      answers[0].trim().length === 0,
      answers[1].trim().length === 0,
    ];
    const weak = validateNewPassword(newPassword).length > 0;
    const mismatch = newPassword !== confirmation;
    setAnswerErrors(missing);
    setPasswordError(weak);
    setConfirmationError(!weak && mismatch);
    if (missing[0] || missing[1] || weak || mismatch) {
      showDialog(TEXTS.messages.invalidData);
      return;
    }
    const result = await run(() =>
      gateway.complete(
        identifier,
        challenge.questions.map((question, index) => ({
          questionId: question.id,
          answer: answers[index],
        })),
        newPassword,
        confirmation,
      ),
    ).catch((): RecoveryCompletionResult => ({ status: 'failed' }));
    if (result === null || !mounted.current) {
      return;
    }
    const message = completionMessage(result);
    if (result.status === 'password_updated') {
      backToIdentifier();
      setIdentifier('');
      showDialog(message, () => onNavigate(ROUTES.login));
      return;
    }
    clearSecrets();
    if (result.status === 'locked' || result.status === 'challenge_expired') {
      showDialog(message, backToIdentifier);
      return;
    }
    showDialog(message);
  }

  return (
    <View style={styles.screen} testID="recovery-screen">
      <FormScrollView contentStyle={styles.content} testID="recovery-scroll">
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.screenTitle}
        </Text>
        <TextField
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
          editable={!busy && challenge === null}
          error={identifierError}
          helper={<Text style={styles.helper}>{TEXTS.identifierHelp}</Text>}
          label={TEXTS.labels.identifier}
          maxLength={LOGIN_IDENTIFIER_MAX_LENGTH}
          onChangeText={value => {
            setIdentifier(value);
            setIdentifierError(null);
          }}
          onSubmitEditing={() => {
            handleStart();
          }}
          returnKeyType="next"
          submitBehavior="blurAndSubmit"
          testID="recovery-identifier"
          textContentType="username"
          value={identifier}
        />
        {challenge === null ? (
          <View style={styles.buttonRow}>
            <ActionButton
              disabled={busy}
              label={TEXTS.buttons.start}
              onPress={() => {
                handleStart();
              }}
              testID="recovery-start"
              variant="primary"
            />
          </View>
        ) : (
          <View testID="recovery-challenge">
            <Text style={styles.subtitle}>{TEXTS.questionsTitle}</Text>
            {challenge.questions.map((question, index) => (
              <TextField
                autoCorrect={false}
                editable={!busy}
                error={
                  answerErrors[index] ? TEXTS.messages.answerRequired : null
                }
                key={question.id}
                label={question.prompt}
                maxLength={SECURITY_ANSWER_MAX_LENGTH}
                onChangeText={value => {
                  setAnswers(current =>
                    index === 0 ? [value, current[1]] : [current[0], value],
                  );
                  setAnswerErrors(current =>
                    index === 0 ? [false, current[1]] : [current[0], false],
                  );
                }}
                testID={`recovery-answer-${index}`}
                value={answers[index]}
              />
            ))}
            <TextField
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              editable={!busy}
              error={passwordError ? TEXTS.messages.invalidData : null}
              helper={
                <PasswordRequirements
                  password={newPassword}
                  testID="recovery-password-requirements"
                />
              }
              label={TEXTS.labels.newPassword}
              maxLength={PASSWORD_MAX_LENGTH}
              onChangeText={value => {
                setNewPassword(value);
                setPasswordError(false);
                setConfirmationError(false);
              }}
              secureTextEntry
              testID="recovery-new-password"
              textContentType="newPassword"
              value={newPassword}
            />
            <TextField
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              editable={!busy}
              error={
                confirmationError ? TEXTS.messages.confirmationMismatch : null
              }
              label={TEXTS.labels.confirmation}
              maxLength={PASSWORD_MAX_LENGTH}
              onChangeText={value => {
                setConfirmation(value);
                setConfirmationError(false);
              }}
              secureTextEntry
              testID="recovery-confirmation"
              textContentType="newPassword"
              value={confirmation}
            />
            <View style={styles.buttonRow}>
              <ActionButton
                disabled={busy}
                label={TEXTS.buttons.update}
                onPress={() => {
                  handleUpdate();
                }}
                testID="recovery-update"
                variant="primary"
              />
            </View>
          </View>
        )}
        {busy && (
          <View style={styles.progress} testID="recovery-progress">
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.progressText}>{TEXTS.messages.verifying}</Text>
          </View>
        )}
      </FormScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => {
                setDialog(null);
                dialog.onClose();
              },
              testID: 'dialog-accept',
            },
          ]}
          message={dialog.message}
          onRequestClose={() => {
            setDialog(null);
            dialog.onClose();
          }}
          testID="dialog-recovery"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  helper: { color: COLORS.mutedText, fontSize: 14, marginTop: 4 },
  progress: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  progressText: { color: COLORS.text, fontSize: 16, marginLeft: 10 },
  buttonRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: -4 },
});
