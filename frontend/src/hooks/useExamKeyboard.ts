import { useEffect, useCallback } from 'react';
import { useExam } from '../context/ExamContext';

const LETTER_TO_INDEX: Record<string, number> = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
};
const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function useExamKeyboard() {
  const {
    currentQuestion,
    selectedAnswer,
    isSubmitted,
    selectAnswer,
    submit,
    nextQuestion,
    prevQuestion,
    finishExam,
    currentQuestionIndex,
    questions,
    examType,
    examFinished,
    lockAnswerAndAdvance,
    answeredQuestions,
  } = useExam();

  const isTestMode = examType === 'test';
  const isLocked = isTestMode && currentQuestion ? answeredQuestions.has(currentQuestion.id) : false;
  const hasNext = currentQuestionIndex < questions.length - 1;
  const canSelectAnswer = isTestMode ? !isLocked && !examFinished : !isSubmitted;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentQuestion || examFinished) return;

    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const choices = currentQuestion.choices;
    const availableKeys = CHOICE_KEYS.filter((k) => k in choices);

    // Number keys (1-8) or letter keys (a-h) to select an answer
    const numIndex = parseInt(e.key, 10) - 1;
    const letterIndex = LETTER_TO_INDEX[e.key.toLowerCase()];
    const choiceIndex = numIndex >= 0 && numIndex < availableKeys.length
      ? numIndex
      : letterIndex !== undefined && letterIndex < availableKeys.length
        ? letterIndex
        : -1;

    if (choiceIndex >= 0 && canSelectAnswer) {
      e.preventDefault();
      selectAnswer(availableKeys[choiceIndex]);
      return;
    }

    // Enter: submit / lock+advance / next / finish
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isTestMode) {
        if (!isLocked && selectedAnswer) {
          lockAnswerAndAdvance();
        } else if (isLocked && hasNext) {
          lockAnswerAndAdvance();
        } else if (isLocked && !hasNext) {
          finishExam();
        }
      } else {
        if (!isSubmitted && selectedAnswer) {
          submit();
        } else if (isSubmitted && hasNext) {
          nextQuestion();
        } else if (isSubmitted && !hasNext) {
          finishExam();
        }
      }
      return;
    }

    // Arrow right / N: next question
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
      if (isTestMode ? isLocked : isSubmitted) {
        e.preventDefault();
        if (hasNext) nextQuestion();
      }
      return;
    }

    // Arrow left / P: previous question
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
      e.preventDefault();
      prevQuestion();
      return;
    }
  }, [
    currentQuestion, selectedAnswer, isSubmitted, canSelectAnswer, isTestMode,
    isLocked, hasNext, examFinished, selectAnswer, submit, nextQuestion,
    prevQuestion, finishExam, lockAnswerAndAdvance,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
