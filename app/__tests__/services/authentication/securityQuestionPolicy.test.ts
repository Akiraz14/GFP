import { PROPOSED_SECURITY_QUESTIONS } from '../../../src/infrastructure/database/seedCatalogs';
import {
  isValidSecurityAnswer,
  securityAnswerViolation,
  pickRecoveryQuestions,
  REGISTRATION_QUESTION_COUNT,
  validateRegistrationAnswers,
  validateSecurityAnswerSlots,
  type SecurityQuestion,
} from '../../../src/services/authentication/securityQuestionPolicy';
import { sequenceRandom } from '../../../testing/nodeSqliteDatabase';

const CATALOG: SecurityQuestion[] = PROPOSED_SECURITY_QUESTIONS.map(
  question => ({
    id: question.id,
    prompt: question.prompt,
    similarityGroup: question.similarityGroup,
  }),
);

const VALID = [
  { questionId: 'favorite-color', answer: 'Azul' },
  { questionId: 'first-pet', answer: 'Perro' },
  { questionId: 'favorite-sport', answer: 'Ajedrez' },
  { questionId: 'favorite-dish', answer: 'Ajiaco' },
  { questionId: 'favorite-music-genre', answer: 'Salsa' },
];

describe('security question policy (HU1, HU3, E03-D5, E03-D6, E03-D11)', () => {
  test('the catalog allows five non-similar questions', () => {
    const groups = new Set(CATALOG.map(question => question.similarityGroup));
    expect(CATALOG).toHaveLength(10);
    expect(groups.size).toBeGreaterThanOrEqual(REGISTRATION_QUESTION_COUNT);
  });

  test('accepts five distinct, non-similar questions with written answers', () => {
    expect(validateRegistrationAnswers(VALID, CATALOG)).toEqual([]);
  });

  test('rejects wrong counts, duplicates, similar or unknown questions and invalid answers', () => {
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
          { questionId: 'favorite-fruit', answer: 'Mango' },
        ],
        CATALOG,
      ),
    ).toEqual(['similar_questions']);
    expect(
      validateRegistrationAnswers(
        [
          ...VALID.slice(0, 4),
          { questionId: 'mother-maiden-name', answer: 'X' },
        ],
        CATALOG,
      ),
    ).toEqual(['invalid_answer', 'unknown_question']);
    expect(
      validateRegistrationAnswers(
        [
          ...VALID.slice(0, 4),
          { questionId: 'favorite-music-genre', answer: ' ' },
        ],
        CATALOG,
      ),
    ).toEqual(['invalid_answer']);
  });

  test('counts 2 to 100 code points after free-text folding (E03-D5, 2026-10-26)', () => {
    expect(isValidSecurityAnswer('Sol')).toBe(true);
    expect(isValidSecurityAnswer('Te')).toBe(true);
    expect(isValidSecurityAnswer('  Té  ')).toBe(true);
    expect(isValidSecurityAnswer('T\u00e9')).toBe(true);
    expect(isValidSecurityAnswer('Te\u0301')).toBe(true);
    expect(isValidSecurityAnswer('a  b')).toBe(true);
    expect(isValidSecurityAnswer('ab')).toBe(true);
    expect(isValidSecurityAnswer('a')).toBe(false);
    expect(isValidSecurityAnswer('  T ')).toBe(false);
    expect(isValidSecurityAnswer('\u00e9')).toBe(false);
    expect(isValidSecurityAnswer('e\u0301')).toBe(false);
    expect(isValidSecurityAnswer('😀')).toBe(false);
    expect(isValidSecurityAnswer('😀😀')).toBe(true);
    expect(isValidSecurityAnswer('ñ'.repeat(100))).toBe(true);
    expect(isValidSecurityAnswer('ñ'.repeat(101))).toBe(false);
    expect(isValidSecurityAnswer(`a${'  '.repeat(60)}b`)).toBe(true);
    expect(isValidSecurityAnswer('ab\u0007c')).toBe(false);
  });

  test('names the reason of an invalid answer', () => {
    expect(securityAnswerViolation('   ')).toBe('required');
    expect(securityAnswerViolation('a')).toBe('too_short');
    expect(securityAnswerViolation('ñ'.repeat(101))).toBe('too_long');
    expect(securityAnswerViolation('ab\u0007c')).toBe('invalid_characters');
    expect(securityAnswerViolation('Te')).toBeNull();
    expect(securityAnswerViolation('n\u0303'.repeat(100))).toBeNull();
    expect(securityAnswerViolation('n\u0303'.repeat(101))).toBe('too_long');
  });

  test('reports which slot has a question or an answer problem', () => {
    expect(
      validateSecurityAnswerSlots(
        [
          { questionId: 'favorite-dish', answer: 'Ajiaco' },
          { questionId: 'favorite-drink', answer: 'Café' },
          { questionId: '', answer: 'Azul' },
          { questionId: 'first-pet', answer: 'n' },
          { questionId: 'favorite-dish', answer: 'Sancocho' },
        ],
        CATALOG,
      ),
    ).toEqual([
      { question: null, answer: null },
      { question: 'repeated', answer: null },
      { question: 'required', answer: null },
      { question: null, answer: 'too_short' },
      { question: 'repeated', answer: null },
    ]);
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
