import {
  AccountAlreadyRegisteredError,
  IdentityRepository,
  InactiveDocumentTypeError,
  type DocumentType,
  type RegistrationIdentifiers,
} from '../../infrastructure/database/repositories/identityRepository';
import type { SqlDatabase } from '../../infrastructure/database/sqlDatabase';
import type { Pbkdf2Engine } from '../../infrastructure/security/pbkdf2Engine';
import {
  randomUuid,
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import { serializedByDatabase } from '../databaseQueue';
import { COUNTRY_CALLING_CODES } from './countryCallingCodes';
import {
  hasRegistrationErrors,
  normalizePersonName,
  validateRegistration,
  type RegistrationErrors,
  type RegistrationInput,
} from './registrationValidation';
import {
  createSecretVerifier,
  type VerifierParameters,
} from './secretVerifier';
import type { SecurityQuestion } from './securityQuestionPolicy';

export type RegistrationResult =
  | { status: 'registered' }
  | { status: 'invalid'; errors: RegistrationErrors }
  | { status: 'already_registered' }
  | { status: 'failed' };

export type AvailabilityResult = 'available' | 'already_registered' | 'failed';

export interface RegistrationGateway {
  listDocumentTypes(): Promise<DocumentType[]>;
  listSecurityQuestions(): Promise<SecurityQuestion[]>;
  checkAvailability(
    identifiers: RegistrationIdentifiers,
  ): Promise<AvailabilityResult>;
  register(input: RegistrationInput): Promise<RegistrationResult>;
}

export type AccountRegistrationDependencies = {
  database: SqlDatabase;
  engine: Pbkdf2Engine;
  random?: RandomBytesSource;
  now?: () => number;
  parameters?: VerifierParameters;
};

export const CALLING_CODES = [
  ...new Set(COUNTRY_CALLING_CODES.map(country => country.callingCode)),
];

function optionalName(name: string): string | null {
  const normalized = normalizePersonName(name);
  return normalized.length === 0 ? null : normalized;
}

export class AccountRegistrationService implements RegistrationGateway {
  private readonly random: RandomBytesSource;
  private readonly now: () => number;

  constructor(private readonly dependencies: AccountRegistrationDependencies) {
    this.random = dependencies.random ?? secureRandomBytes;
    this.now = dependencies.now ?? Date.now;
  }

  private repository(): IdentityRepository {
    return new IdentityRepository(this.dependencies.database);
  }

  listDocumentTypes(): Promise<DocumentType[]> {
    return this.repository().listActiveDocumentTypes();
  }

  listSecurityQuestions(): Promise<SecurityQuestion[]> {
    return this.repository().getSecurityQuestionCatalog();
  }

  async checkAvailability(
    identifiers: RegistrationIdentifiers,
  ): Promise<AvailabilityResult> {
    try {
      return (await this.repository().isAlreadyRegistered(identifiers))
        ? 'already_registered'
        : 'available';
    } catch {
      return 'failed';
    }
  }

  register(input: RegistrationInput): Promise<RegistrationResult> {
    return serializedByDatabase(this.dependencies.database, () =>
      this.registerSerialized(input),
    );
  }

  private async registerSerialized(
    input: RegistrationInput,
  ): Promise<RegistrationResult> {
    try {
      const repository = this.repository();
      const [documentTypes, securityQuestions] = await Promise.all([
        repository.listActiveDocumentTypes(),
        repository.getSecurityQuestionCatalog(),
      ]);
      const errors = validateRegistration(input, {
        activeDocumentTypeCodes: documentTypes.map(type => type.code),
        callingCodes: CALLING_CODES,
        securityQuestions,
      });
      if (hasRegistrationErrors(errors)) {
        return { status: 'invalid', errors };
      }
      const verifierDependencies = {
        engine: this.dependencies.engine,
        random: this.random,
        parameters: this.dependencies.parameters,
      };
      const [credential, ...answerRecords] = await Promise.all([
        createSecretVerifier(input.password, 'nfc', verifierDependencies),
        ...input.securityAnswers.map(answer =>
          createSecretVerifier(
            answer.answer,
            'free-text-folded',
            verifierDependencies,
          ),
        ),
      ]);
      const userId = randomUuid(this.random);
      await this.dependencies.database.transaction(executor =>
        new IdentityRepository(executor).createAccount(
          {
            userId,
            profile: {
              documentTypeCode: input.documentTypeCode,
              documentNumber: input.documentNumber,
              firstName: normalizePersonName(input.firstName),
              middleName: optionalName(input.middleName),
              lastName: normalizePersonName(input.lastName),
              secondLastName: optionalName(input.secondLastName),
              phoneCountryCode: input.phoneCountryCode,
              phoneNumber: input.phoneNumber,
              email: input.email,
            },
            credential,
            securityAnswers: input.securityAnswers.map((answer, index) => ({
              questionId: answer.questionId,
              record: answerRecords[index],
            })),
          },
          this.now(),
        ),
      );
      return { status: 'registered' };
    } catch (error) {
      if (error instanceof AccountAlreadyRegisteredError) {
        return { status: 'already_registered' };
      }
      if (error instanceof InactiveDocumentTypeError) {
        return {
          status: 'invalid',
          errors: {
            fields: { documentTypeCode: 'not_in_list' },
            securityAnswers: input.securityAnswers.map(() => ({
              question: null,
              answer: null,
            })),
            securityAnswerCountValid: true,
          },
        };
      }
      return { status: 'failed' };
    }
  }
}
