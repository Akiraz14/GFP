import { IdentityRepository } from '../../infrastructure/database/repositories/identityRepository';
import type { SqlDatabase } from '../../infrastructure/database/sqlDatabase';
import type { Pbkdf2Engine } from '../../infrastructure/security/pbkdf2Engine';
import {
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import { serializedByDatabase } from '../databaseQueue';
import type { SessionManager, UserSession } from '../session/sessionManager';
import {
  EMPTY_THROTTLE_STATE,
  LOGIN_THROTTLE_POLICY,
  isLocked,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  type ThrottlePolicy,
} from './attemptThrottle';
import { emailError } from './registrationValidation';
import {
  CURRENT_VERIFIER_PARAMETERS,
  DERIVED_KEY_BYTES,
  SALT_BYTES,
  createSecretVerifier,
  needsRehash,
  verifySecret,
  type SecretVerifierRecord,
  type VerifierParameters,
} from './secretVerifier';

// Inicio de sesión de HU2 (E04-D1 a E04-D6, `decisiones-etapa-04.md`). El bloqueo es único
// para el dispositivo: cuenta todos los intentos fallidos, exista o no el identificador.
export const LOGIN_THROTTLE_SUBJECT = 'device';
export const LOGIN_IDENTIFIER_MAX_LENGTH = 254;

export type LoginField = 'identifier' | 'password';
export type LoginFieldError = 'required' | 'identifier_format';
export type LoginFieldErrors = Partial<Record<LoginField, LoginFieldError>>;

export type LoginResult =
  | { status: 'authenticated'; session: UserSession }
  | { status: 'invalid_input'; errors: LoginFieldErrors }
  | { status: 'invalid_credentials'; lockedForMs: number | null }
  | { status: 'phone_country_code_required' }
  | { status: 'locked'; retryAfterMs: number }
  | { status: 'failed' };

export interface LoginGateway {
  login(identifier: string, password: string): Promise<LoginResult>;
}

export function validateLoginInput(
  identifier: string,
  password: string,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmed = identifier.trim();
  if (trimmed.length === 0) {
    errors.identifier = 'required';
  } else if (trimmed.includes('@') && emailError(trimmed) !== null) {
    errors.identifier = 'identifier_format';
  }
  if (password.length === 0) {
    errors.password = 'required';
  }
  return errors;
}

export type AccountLoginDependencies = {
  database: SqlDatabase;
  engine: Pbkdf2Engine;
  sessions: SessionManager;
  random?: RandomBytesSource;
  now?: () => number;
  policy?: ThrottlePolicy;
  parameters?: VerifierParameters;
};

export class AccountLoginService implements LoginGateway {
  private readonly random: RandomBytesSource;
  private readonly now: () => number;
  private readonly policy: ThrottlePolicy;
  private readonly parameters: VerifierParameters;

  constructor(private readonly dependencies: AccountLoginDependencies) {
    this.random = dependencies.random ?? secureRandomBytes;
    this.now = dependencies.now ?? Date.now;
    this.policy = dependencies.policy ?? LOGIN_THROTTLE_POLICY;
    this.parameters = dependencies.parameters ?? CURRENT_VERIFIER_PARAMETERS;
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    const errors = validateLoginInput(identifier, password);
    if (Object.keys(errors).length > 0) {
      return { status: 'invalid_input', errors };
    }
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.authenticate(identifier, password),
      );
    } catch {
      return { status: 'failed' };
    }
  }

  // Registro señuelo con los mismos parámetros que una credencial real: un identificador
  // inexistente cuesta la misma derivación que una contraseña incorrecta.
  private decoyRecord(): SecretVerifierRecord {
    return {
      ...this.parameters,
      normalization: 'nfc',
      salt: this.random(SALT_BYTES),
      verifier: new Uint8Array(DERIVED_KEY_BYTES),
    };
  }

  private async authenticate(
    identifier: string,
    password: string,
  ): Promise<LoginResult> {
    const { database, engine, sessions } = this.dependencies;
    const repository = new IdentityRepository(database);
    const now = this.now();
    const state =
      (await repository.getThrottle('login', LOGIN_THROTTLE_SUBJECT)) ??
      EMPTY_THROTTLE_STATE;
    if (isLocked(state, now)) {
      return { status: 'locked', retryAfterMs: remainingLockMs(state, now) };
    }
    const lookup = await repository.lookupIdentifier(identifier);
    if (lookup.status === 'phone_country_code_required') {
      return { status: 'phone_country_code_required' };
    }
    const userId = lookup.status === 'found' ? lookup.userId : null;
    const record =
      userId === null ? null : await repository.getCredential(userId);
    const verified = await verifySecret(
      password,
      record ?? this.decoyRecord(),
      engine,
    );
    if (userId === null || record === null || !verified) {
      const next = registerFailure(state, this.policy, now);
      await repository.saveThrottle('login', LOGIN_THROTTLE_SUBJECT, next);
      return {
        status: 'invalid_credentials',
        lockedForMs: isLocked(next, now) ? remainingLockMs(next, now) : null,
      };
    }
    const rehashed = needsRehash(record, this.parameters)
      ? await createSecretVerifier(password, 'nfc', {
          engine,
          random: this.random,
          parameters: this.parameters,
        })
      : null;
    await database.transaction(async executor => {
      const transactional = new IdentityRepository(executor);
      await transactional.saveThrottle(
        'login',
        LOGIN_THROTTLE_SUBJECT,
        registerSuccess(),
      );
      if (rehashed !== null) {
        await transactional.replaceCredential(userId, rehashed, now);
      }
    });
    return { status: 'authenticated', session: sessions.start(userId) };
  }
}
