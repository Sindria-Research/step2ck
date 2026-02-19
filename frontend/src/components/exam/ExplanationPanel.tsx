import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, Sparkles, Layers, StickyNote } from 'lucide-react';
import Markdown from 'react-markdown';
import { useExam } from '../../context/ExamContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/api';
import { UpgradePrompt } from '../ProGate';

export function ExplanationPanel() {
  const {
    currentQuestion,
    selectedAnswer,
    isSubmitted,
    nextQuestion,
    finishExam,
    currentQuestionIndex,
    questions,
    examType,
    examFinished,
    lockAnswerAndAdvance,
    answeredQuestions,
    isReviewMode,
  } = useExam();
  const { addToast } = useToast();
  const [aiExplainActive, setAiExplainActive] = useState(false);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainError, setAiExplainError] = useState<string | null>(null);
  const [aiExplainText, setAiExplainText] = useState('');
  const [flashcardCreated, setFlashcardCreated] = useState(false);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [noteCreated, setNoteCreated] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    setAiExplainActive(false);
    setAiExplainLoading(false);
    setAiExplainError(null);
    setAiExplainText('');
    setFlashcardCreated(false);
    setNoteCreated(false);
  }, [currentQuestion?.id]);

  const handleCreateFlashcard = useCallback(async () => {
    if (!currentQuestion || flashcardLoading || flashcardCreated) return;
    setFlashcardLoading(true);
    try {
      const decks = await api.flashcards.listDecks();
      let deck = decks.find((d) => d.name === 'Missed Questions');
      if (!deck) {
        deck = await api.flashcards.createDeck({
          name: 'Missed Questions',
          description: 'Auto-generated from incorrect exam answers',
        });
      }

      const stem = currentQuestion.question_stem.length > 300
        ? currentQuestion.question_stem.slice(0, 300) + '…'
        : currentQuestion.question_stem;

      const correctKey = currentQuestion.correct_answer;
      const correctText = currentQuestion.choices[correctKey] ?? '';
      let back = `**${correctKey}. ${correctText}**`;
      if (currentQuestion.correct_explanation) {
        back += `\n\n${currentQuestion.correct_explanation}`;
      }

      await api.flashcards.createCard({
        deck_id: deck.id,
        front: stem,
        back,
        question_id: currentQuestion.id,
      });
      setFlashcardCreated(true);
      addToast('Flashcard created in "Missed Questions" deck', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to create flashcard', 'error');
    } finally {
      setFlashcardLoading(false);
    }
  }, [currentQuestion, flashcardLoading, flashcardCreated, addToast]);

  const handleCreateNote = useCallback(async () => {
    if (!currentQuestion || noteLoading || noteCreated) return;
    setNoteLoading(true);
    try {
      const esc = (t: string) =>
        t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const stemPreview = currentQuestion.question_stem.length > 60
        ? currentQuestion.question_stem.slice(0, 60) + '…'
        : currentQuestion.question_stem;
      const title = `${currentQuestion.section} — ${stemPreview}`;

      const correctKey = currentQuestion.correct_answer;
      const correctText = currentQuestion.choices[correctKey] ?? '';

      let content = '';
      if (selectedAnswer && selectedAnswer !== correctKey) {
        const selectedText = currentQuestion.choices[selectedAnswer] ?? '';
        content += `<h3>Your Answer</h3><p><strong>${esc(selectedAnswer)}.</strong> ${esc(selectedText)}</p>`;
      }
      content += `<h3>Question</h3><p>${esc(currentQuestion.question_stem)}</p>`;
      content += `<h3>Correct Answer</h3><p><strong>${esc(correctKey)}.</strong> ${esc(correctText)}</p>`;
      if (currentQuestion.correct_explanation) {
        content += `<h3>Explanation</h3><p>${esc(currentQuestion.correct_explanation)}</p>`;
      }

      await api.notes.create({
        title,
        content,
        question_id: currentQuestion.id,
        section: currentQuestion.section,
      });
      setNoteCreated(true);
      addToast('Note saved', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to save note', 'error');
    } finally {
      setNoteLoading(false);
    }
  }, [currentQuestion, selectedAnswer, noteLoading, noteCreated, addToast]);

  if (!currentQuestion) return null;

  const isTestMode = examType === 'test';
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const hasNext = currentQuestionIndex < questions.length - 1;
  const isLocked = isTestMode && answeredQuestions.has(currentQuestion.id);

  // In test mode during the exam: only show navigation, no feedback
  if (isTestMode && !examFinished) {
    if (!isLocked) return null;
    return (
      <div className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Answer locked. {hasNext ? 'Move to next question.' : 'Finish to see results.'}
          </p>
          <div className="flex gap-2">
            {hasNext ? (
              <button
                type="button"
                onClick={lockAnswerAndAdvance}
                className="btn btn-primary flex items-center gap-2 py-2 px-4 rounded-lg focus-ring text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishExam}
                className="btn btn-primary flex items-center gap-2 py-2 px-4 rounded-lg focus-ring text-sm"
              >
                Finish Test
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Practice mode or test review: show full explanations
  const showExplanation = isTestMode ? examFinished && isSubmitted : isSubmitted;
  if (!showExplanation) return null;

  const handleExplainWithAI = async () => {
    if (!currentQuestion) return;
    setAiExplainActive(true);
    setAiExplainLoading(true);
    setAiExplainError(null);
    setAiExplainText('');
    try {
      const res = await api.ai.explain({
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer ?? undefined,
      });
      setAiExplainText(res.explanation);
    } catch (e) {
      setAiExplainError(e instanceof Error ? e.message : 'Chiron couldn\u2019t explain this one');
    } finally {
      setAiExplainLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="p-4 md:p-6 flex-1 flex flex-col gap-5">
        {/* Result badge + correct answer + action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge ${isCorrect ? 'badge-success' : 'badge-error'}`}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          {!isCorrect && (
            <span className="text-sm font-medium text-[var(--color-success)]">
              Correct answer: {currentQuestion.correct_answer}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={noteCreated || noteLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring border ${
                noteCreated
                  ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] cursor-default'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
              }`}
              title={noteCreated ? 'Note saved' : 'Save as note'}
            >
              <StickyNote className="w-3.5 h-3.5" />
              {noteLoading ? 'Saving…' : noteCreated ? 'Saved' : 'Save Note'}
            </button>
            {!isCorrect && (
              <button
                type="button"
                onClick={handleCreateFlashcard}
                disabled={flashcardCreated || flashcardLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring border ${
                  flashcardCreated
                    ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] cursor-default'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                }`}
                title={flashcardCreated ? 'Flashcard saved' : 'Save as flashcard'}
              >
                <Layers className="w-3.5 h-3.5" />
                {flashcardLoading ? 'Saving…' : flashcardCreated ? 'Saved' : 'Save as Flashcard'}
              </button>
            )}
          </div>
        </div>

        {/* Built-in explanations */}
        {currentQuestion.correct_explanation && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Explanation
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {currentQuestion.correct_explanation}
            </p>
          </div>
        )}
        {!isCorrect && currentQuestion.incorrect_explanation && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Why others are wrong
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {currentQuestion.incorrect_explanation}
            </p>
          </div>
        )}

        {/* AI Explanation */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          {!aiExplainActive ? (
            <button
              type="button"
              onClick={handleExplainWithAI}
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all focus-ring border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
            >
              <Sparkles className="w-4 h-4 text-[var(--color-accent)] group-hover:scale-110 transition-transform" />
              Ask Chiron
            </button>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">Chiron</span>
                </div>
                <div className="flex items-center gap-2">
                  {!aiExplainLoading && (
                    <button
                      type="button"
                      onClick={handleExplainWithAI}
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors focus-ring"
                      title="Regenerate"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAiExplainActive(false)}
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="px-5 py-4">
                {aiExplainLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[var(--color-text-secondary)] thinking-text">
                      Chiron is thinking…
                    </span>
                  </div>
                ) : aiExplainError ? (
                  <div className="py-2">
                    <p className="text-sm text-[var(--color-error)] mb-2">
                      {aiExplainError}
                    </p>
                    {(aiExplainError.toLowerCase().includes('limit') || aiExplainError.toLowerCase().includes('upgrade')) && (
                      <UpgradePrompt message="Upgrade to Pro for unlimited AI explanations." />
                    )}
                  </div>
                ) : (
                  <div className="ai-explanation-content text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <Markdown>{aiExplainText}</Markdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next question or Finish */}
        {!examFinished && (
          <div className="mt-auto pt-4 flex justify-end">
            {hasNext ? (
              <button
                type="button"
                onClick={nextQuestion}
                className="btn btn-primary flex items-center gap-2 py-2.5 px-4 rounded-lg focus-ring"
              >
                Next question
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishExam}
                className="btn btn-primary flex items-center gap-2 py-2.5 px-4 rounded-lg focus-ring"
              >
                {isReviewMode ? 'Exit Review' : 'Finish exam'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
