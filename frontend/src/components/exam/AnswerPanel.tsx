import { useExam } from '../../context/ExamContext';

const CHOICE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function AnswerPanel() {
  const {
    currentQuestion,
    selectedAnswer,
    struckThroughChoices,
    isSubmitted,
    selectAnswer,
    toggleStrikethrough,
    submit,
    examType,
    examFinished,
    lockAnswerAndAdvance,
    answeredQuestions,
  } = useExam();

  if (!currentQuestion) return null;

  const isTestMode = examType === 'test';
  const showFeedback = !isTestMode || examFinished;
  const isLocked = isTestMode && answeredQuestions.has(currentQuestion.id);

  const choices = currentQuestion.choices;
  const keys = CHOICE_ORDER.filter((k) => k in choices);
  const correctKey = currentQuestion.correct_answer;

  const showSubmitBar = isTestMode
    ? !isLocked && !examFinished && selectedAnswer
    : !isSubmitted && selectedAnswer;

  const correctAnswerMissing = showFeedback && isSubmitted && !(correctKey in choices);

  const canInteract = isTestMode ? !isLocked && !examFinished : !isSubmitted;

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 bg-[var(--color-bg-primary)] ${
        !showSubmitBar ? 'border-b border-[var(--color-border)]' : ''
      }`}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {isTestMode && isLocked && !examFinished
                ? 'Answer locked'
                : 'Select your answer:'}
            </p>
            {canInteract && (
              <span className="text-[0.65rem] text-[var(--color-text-muted)] hidden md:inline">
                Press 1–{keys.length} or Enter
              </span>
            )}
          </div>
          <div className="space-y-2">
            {keys.map((key) => {
              const label = choices[key];
              const isSelected = isTestMode
                ? (answeredQuestions.get(currentQuestion.id)?.selected === key) || selectedAnswer === key
                : selectedAnswer === key;
              const isCorrect = correctKey === key;
              const showCorrect = showFeedback && isSubmitted && isCorrect;
              const showWrong = showFeedback && isSubmitted && isSelected && !isCorrect;
              const struck = struckThroughChoices.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (canInteract) selectAnswer(key);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (canInteract) toggleStrikethrough(key);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-100 focus-ring ${
                    showCorrect
                      ? 'choice-correct'
                      : showWrong
                      ? 'choice-incorrect'
                      : isSelected
                      ? 'border-[var(--color-accent)] bg-[var(--color-bg-active)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]'
                  } ${struck ? 'line-through opacity-70' : ''} ${!canInteract && !showCorrect && !showWrong ? 'cursor-default' : ''}`}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {key}. {label}
                  </span>
                </button>
              );
            })}
            {correctAnswerMissing && (
              <div className="p-4 rounded-lg border-2 choice-correct">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {correctKey}. <span className="italic text-[var(--color-text-secondary)]">(correct answer — choice text unavailable)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSubmitBar && (
        <div className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]">
          <button
            type="button"
            onClick={isTestMode ? lockAnswerAndAdvance : submit}
            className="btn btn-primary w-full focus-ring py-3 rounded-lg"
          >
            {isTestMode ? 'Lock Answer & Next' : 'Submit Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
