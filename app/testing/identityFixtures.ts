import { migrateDatabase } from '../src/infrastructure/database/migrator';
import {
  IdentityRepository,
  type NewUserProfile,
} from '../src/infrastructure/database/repositories/identityRepository';
import type { SqlDatabase } from '../src/infrastructure/database/sqlDatabase';
import { randomUuid } from '../src/infrastructure/security/secureRandom';
import {
  CURRENT_VERIFIER_PARAMETERS,
  createSecretVerifier,
  type VerifierParameters,
} from '../src/services/authentication/secretVerifier';
import type { SecurityAnswerInput } from '../src/services/authentication/securityQuestionPolicy';
import {
  createNodeSqliteDatabase,
  nodePbkdf2Engine,
  nodeRandomBytes,
} from './nodeSqliteDatabase';

export const TEST_PARAMETERS: VerifierParameters = {
  ...CURRENT_VERIFIER_PARAMETERS,
  iterations: 1000,
};

export const DEFAULT_ANSWERS: SecurityAnswerInput[] = [
  { questionId: 'favorite-color', answer: 'Azul' },
  { questionId: 'first-pet', answer: 'Perro' },
  { questionId: 'favorite-sport', answer: 'Ajedrez' },
  { questionId: 'favorite-dish', answer: 'Ajiaco santafereño' },
  { questionId: 'favorite-music-genre', answer: 'Salsa' },
];

export async function createMigratedDatabase(): Promise<SqlDatabase> {
  const database = createNodeSqliteDatabase();
  await migrateDatabase(database, () => 1);
  return database;
}

export function profile(
  overrides: Partial<NewUserProfile> = {},
): NewUserProfile {
  return {
    documentTypeCode: 'CC',
    documentNumber: '1001',
    firstName: 'Ana',
    middleName: null,
    lastName: 'Rojas',
    secondLastName: null,
    phoneCountryCode: '+57',
    phoneNumber: '3001112233',
    email: 'ana@example.com',
    ...overrides,
  };
}

export async function createAccount(
  database: SqlDatabase,
  userProfile: NewUserProfile,
  password = 'Clave123!',
  answers: SecurityAnswerInput[] = DEFAULT_ANSWERS,
): Promise<string> {
  const deps = {
    engine: nodePbkdf2Engine,
    random: nodeRandomBytes,
    parameters: TEST_PARAMETERS,
  };
  const userId = randomUuid(nodeRandomBytes);
  const credential = await createSecretVerifier(password, 'nfc', deps);
  const securityAnswers: Array<{
    questionId: string;
    record: Awaited<ReturnType<typeof createSecretVerifier>>;
  }> = [];
  for (const answer of answers) {
    securityAnswers.push({
      questionId: answer.questionId,
      record: await createSecretVerifier(
        answer.answer,
        'free-text-folded',
        deps,
      ),
    });
  }
  await database.transaction(executor =>
    new IdentityRepository(executor).createAccount(
      { userId, profile: userProfile, credential, securityAnswers },
      1,
    ),
  );
  return userId;
}
