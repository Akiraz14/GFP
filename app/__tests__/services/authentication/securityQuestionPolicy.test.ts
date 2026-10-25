import { PROPOSED_SECURITY_QUESTIONS } from '../../../src/infrastructure/database/seedCatalogs';
import {
  pickRecoveryQuestions,
  REGISTRATION_QUESTION_COUNT,
  validateRegistrationAnswers,
  type SecurityQuestion,
} from '../../../src/services/authentication/securityQuestionPolicy';
import { sequenceRandom } from '../../../testing/nodeSqliteDatabase';

const CATALOG: SecurityQuestion[] = PROPOSED_SECURITY_QUESTIONS.map(
  question => ({
    id: question.id,
    similarityGroup: question.similarityGroup,
    optionIds: question.options.map(option => option.id),
  }),
);

const VALID = [
  { questionId: 'favorite-color', optionId: 'blue' },
  { questionId: 'first-pet', optionId: 'dog' },
  { questionId: 'favorite-sport', optionId: 'chess' },
  { questionId: 'favorite-dish', optionId: 'ajiaco' },
  { questionId: 'favorite-music-genre', optionId: 'salsa' },
];

describe('security question policy (HU1, HU3, E03-D6)', () => {
  test('the proposed catalog allows five non-similar questions', () => {
    const groups = new Set(CATALOG.map(question => question.similarityGroup));
    expect(groups.size).toBeGreaterThanOrEqual(REGISTRATION_QUESTION_COUNT);
    for (const question of PROPOSED_SECURITY_QUESTIONS) {
      expect(new Set(question.options.map(option => option.id)).size).toBe(
        question.options.length,
      );
      expect(question.options.length).toBeGreaterThanOrEqual(7);
    }
  });

  test('accepts five distinct, non-similar questions with catalog options', () => {
    expect(validateRegistrationAnswers(VALID, CATALOG)).toEqual([]);
  });

  test('rejects wrong counts, duplicates, similar questions and unknown options', () => {
    expect(validateRegistrationAnswers(VALID.slice(0, 4), CATALOG)).toEqual([
      'wrong_count',
    ]);
    expect(
      validateRegistrationAnswers([...VALID.slice(0, 4), VALID[0]], CATALOG),
    ).toEqual(['duplicate_question']);
    expect(
      validateRegistrationAnswers(
        [
          ...VALID.slice(0, 4),
          { questionId: 'favorite-fruit', optionId: 'mango' },
        ],
        CATALOG,
      ),
    ).toEqual(['similar_questions']);
    expect(
      validateRegistrationAnswers(
        [
          ...VALID.slice(0, 4),
          { questionId: 'favorite-music-genre', optionId: 'tango' },
        ],
        CATALOG,
      ),
    ).toEqual(['unknown_option']);
    expect(
      validateRegistrationAnswers(
        [
          ...VALID.slice(0, 4),
          { questionId: 'mother-maiden-name', optionId: 'x' },
        ],
        CATALOG,
      ),
    ).toEqual(['unknown_question']);
  });

  test('picks two different configured questions for recovery', () => {
    const configured = VALID.map(answer => answer.questionId);
    const picked = pickRecoveryQuestions(
      configured,
      sequenceRandom([0x00, 0x01, 0x00, 0x00]),
    );
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    picked.forEach(questionId => expect(configured).toContain(questionId));
    expect(() => pickRecoveryQuestions(['only-one'])).toThrow(RangeError);
  });
});
