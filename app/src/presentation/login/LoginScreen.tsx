import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import {
  LOGIN_IDENTIFIER_MAX_LENGTH,
  validateLoginInput,
  type LoginFieldError,
  type LoginFieldErrors,
  type LoginGateway,
  type LoginResult,
} from '../../services/authentication/accountLogin';
import { PASSWORD_MAX_LENGTH } from '../../services/authentication/passwordPolicy';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { FormScrollView } from '../components/FormScrollView';
import { MessageDialog } from '../components/MessageDialog';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { SecurityNote } from '../components/SecurityNote';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { ROUTES, type RouteName } from '../navigation/routes';
import { LOGIN_TEXTS as TEXTS, lockMinutes } from './loginTexts';

type LoginScreenProps = {
  gateway: LoginGateway;
  onAuthenticated: (session: UserSession) => void;
  onNavigate: (route: RouteName) => void;
};

function identifierMessage(error: LoginFieldError | undefined): string | null {
  if (error === 'required') {
    return TEXTS.messages.identifierRequired;
  }
  return error === 'identifier_format' ? TEXTS.messages.identifierFormat : null;
}

function dialogMessage(result: LoginResult): string | null {
  switch (result.status) {
    case 'invalid_credentials':
      return result.lockedForMs === null
        ? TEXTS.messages.invalidCredentials
        : `${TEXTS.messages.invalidCredentials}.\n${TEXTS.messages.lockedFor(
            lockMinutes(result.lockedForMs),
          )}`;
    case 'locked':
      return TEXTS.messages.lockedFor(lockMinutes(result.retryAfterMs));
    case 'failed':
      return TEXTS.messages.failed;
    default:
      return null;
  }
}

export function LoginScreen({
  gateway,
  onAuthenticated,
  onNavigate,
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [phoneHint, setPhoneHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const mounted = useRef(true);
  const submitting = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleLogin() {
    if (submitting.current) {
      return;
    }
    const localErrors = validateLoginInput(identifier, password);
    setErrors(localErrors);
    setPhoneHint(false);
    if (Object.keys(localErrors).length > 0) {
      return;
    }
    submitting.current = true;
    setBusy(true);
    const result = await gateway.login(identifier, password);
    submitting.current = false;
    if (!mounted.current) {
      return;
    }
    setBusy(false);
    if (result.status === 'authenticated') {
      setIdentifier('');
      setPassword('');
      onAuthenticated(result.session);
      return;
    }
    setPassword('');
    if (result.status === 'invalid_input') {
      setErrors(result.errors);
    } else if (result.status === 'phone_country_code_required') {
      setPhoneHint(true);
    } else {
      setDialog(dialogMessage(result));
    }
  }

  const identifierError = phoneHint
    ? TEXTS.messages.phoneCountryCodeRequired
    : identifierMessage(errors.identifier);

  return (
    <View style={styles.screen} testID="login-screen">
      <FormScrollView contentStyle={styles.content} testID="login-scroll">
        <ScreenHeader
          subtitle={TEXTS.subtitle}
          testID="login"
          title={TEXTS.screenTitle}
        />
        <SectionCard
          icon="lock"
          testID="login-section-credentials"
          title={TEXTS.sectionTitle}
        >
          <TextField
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            editable={!busy}
            error={identifierError}
            label={TEXTS.labels.identifier}
            maxLength={LOGIN_IDENTIFIER_MAX_LENGTH}
            onChangeText={value => {
              setIdentifier(value);
              setPhoneHint(false);
              setErrors(current => ({ ...current, identifier: undefined }));
            }}
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder={TEXTS.identifierPlaceholder}
            required
            returnKeyType="next"
            submitBehavior="submit"
            testID="login-identifier"
            textContentType="username"
            value={identifier}
          />
          <TextField
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            editable={!busy}
            error={
              errors.password === 'required'
                ? TEXTS.messages.passwordRequired
                : null
            }
            label={TEXTS.labels.password}
            maxLength={PASSWORD_MAX_LENGTH}
            onChangeText={value => {
              setPassword(value);
              setErrors(current => ({ ...current, password: undefined }));
            }}
            onSubmitEditing={() => {
              handleLogin();
            }}
            placeholder={TEXTS.passwordPlaceholder}
            ref={passwordRef}
            required
            returnKeyType="go"
            secureToggle
            submitBehavior="blurAndSubmit"
            testID="login-password"
            textContentType="password"
            value={password}
          />
          <Pressable
            accessibilityRole="link"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => onNavigate(ROUTES.passwordRecovery)}
            style={styles.link}
            testID="login-forgot-password"
          >
            <Text style={styles.linkText}>{TEXTS.links.forgotPassword}</Text>
          </Pressable>
        </SectionCard>
        {busy && (
          <View style={styles.progress} testID="login-progress">
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.progressText}>{TEXTS.messages.signingIn}</Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <ActionButton
            disabled={busy}
            label={TEXTS.buttons.login}
            onPress={() => {
              handleLogin();
            }}
            icon="user"
            testID="login-submit"
            variant="primary"
          />
        </View>
        <View style={styles.buttonRow}>
          <ActionButton
            disabled={busy}
            label={TEXTS.buttons.register}
            icon="idCard"
            onPress={() => onNavigate(ROUTES.register)}
            testID="login-register"
          />
        </View>
        <SecurityNote />
      </FormScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => setDialog(null),
              testID: 'dialog-accept',
            },
          ]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
          testID="dialog-login"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  progress: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  progressText: { color: COLORS.text, fontSize: 16, marginLeft: 10 },
  buttonRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: -4 },
  link: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    marginTop: -10,
    minHeight: 40,
    paddingHorizontal: 4,
  },
  linkText: { color: COLORS.primary, fontSize: 15 },
});
