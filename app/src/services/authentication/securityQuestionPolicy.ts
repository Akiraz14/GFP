import {
  randomIndex,
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import { codePointLength } from './passwordPolicy';
import {
  hasInvalidCodeUnits,
  normalizeFreeTextAnswer,
} from './secretNormalization';

export const REGISTRATION_QUESTION_COUNT = 5;
export const RECOVERY_QUESTION_COUNT = 2;
export const SECURITY_ANSWER_MIN_LENGTH = 2;
export const SECURITY_ANSWER_MAX_LENGTH = 100;

export type SecurityQuestion = {
  id: string;
  prompt: string;
  similarityGroup: string;
};

export type SecurityAnswerInput = {
  questionId: string;
  answer: string;
};

export type QuestionSelectionViolation =
  | 'wrong_count'
  | 'unknown_question'
  | 'duplicate_question'
  | 'similar_questions'
  | 'invalid_answer';

export type SecurityQuestionSlotViolation = 'required' | 'repeated';

export type SecurityAnswerViolation =
  | 'required'
  | 'too_short'
  | 'too_long'
  | 'invalid_characters';

export type SecurityAnswerSlotError = {
  question: SecurityQuestionSlotViolation | null;
  answer: SecurityAnswerViolation | null;
};

export function securityAnswerViolation(
  answer: string,
): SecurityAnswerViolation | null {
  if (hasInvalidCodeUnits(answer)) {
    return 'invalid_characters';
  }
  const length = codePointLength(normalizeFreeTextAnswer(answer));
  if (length === 0) {
    return 'required';
  }
  if (length < SECURITY_ANSWER_MIN_LENGTH) {
    return 'too_short';
  }
  return length > SECURITY_ANSWER_MAX_LENGTH ? 'too_long' : null;
}

export function isValidSecurityAnswer(answer: string): boolean {
  return securityAnswerViolation(answer) === null;
}

export function validateSecurityAnswerSlots(
  answers: readonly SecurityAnswerInput[],
  catalog: readonly SecurityQuestion[],
): SecurityAnswerSlotError[] {
  const byId = new Map(catalog.map(question => [question.id, question]));
  const seenQuestions = new Set<string>();
  const seenGroups = new Set<string>();
  return answers.map(answer => {
    const question = byId.get(answer.questionId);
    let questionError: SecurityQuestionSlotViolation | null = 'required';
    if (question !== undefined) {
      questionError =
        seenQuestions.has(question.id) ||
        seenGroups.has(question.similarityGroup)
          ? 'repeated'
          : null;
      seenQuestions.add(question.id);
      seenGroups.add(question.similarityGroup);
    }
    return {
      question: questionError,
      answer: securityAnswerViolation(answer.answer),
    };
  });
}

export function validateRegistrationAnswers(
  answers: readonly SecurityAnswerInput[],
  catalog: readonly SecurityQuestion[],
): QuestionSelectionViolation[] {
  const violations = new Set<QuestionSelectionViolation>();
  if (answers.length !== REGISTRATION_QUESTION_COUNT) {
    violations.add('wrong_count');
  }
  const byId = new Map(catalog.map(question => [question.id, question]));
  const seenQuestions = new Set<string>();
  const seenGroups = new Set<string>();
  for (const answer of answers) {
    if (!isValidSecurityAnswer(answer.answer)) {
      violations.add('invalid_answer');
    }
    const question = byId.get(answer.questionId);
    if (question === undefined) {
      violations.add('unknown_question');
      continue;
    }
    if (seenQuestions.has(question.id)) {
      violations.add('duplicate_question');
    } else if (seenGroups.has(question.similarityGroup)) {
      violations.add('similar_questions');
    }
    seenQuestions.add(question.id);
    seenGroups.add(question.similarityGroup);
  }
  return [...violations];
}

export function pickRecoveryQuestions(
  configuredQuestionIds: readonly string[],
  random: RandomBytesSource = secureRandomBytes,
): string[] {
  if (configuredQuestionIds.length < RECOVERY_QUESTION_COUNT) {
    throw new RangeError('not enough configured security questions');
  }
  const pool = [...configuredQuestionIds];
  const picked: string[] = [];
  while (picked.length < RECOVERY_QUESTION_COUNT) {
    const [questionId] = pool.splice(randomIndex(pool.length, random), 1);
    picked.push(questionId);
  }
  return picked;
}
