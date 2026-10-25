import {
  randomIndex,
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';

export const REGISTRATION_QUESTION_COUNT = 5;
export const RECOVERY_QUESTION_COUNT = 2;

export type SecurityQuestion = {
  id: string;
  similarityGroup: string;
  optionIds: readonly string[];
};

export type SecurityAnswerInput = {
  questionId: string;
  optionId: string;
};

export type QuestionSelectionViolation =
  | 'wrong_count'
  | 'unknown_question'
  | 'duplicate_question'
  | 'similar_questions'
  | 'unknown_option';

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
    if (!question.optionIds.includes(answer.optionId)) {
      violations.add('unknown_option');
    }
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
