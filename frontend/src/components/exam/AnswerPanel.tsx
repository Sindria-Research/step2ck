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
  } = useExam();

  if (!currentQuestion) return null;

  const choices = currentQuestion.choices;
  const keys = CHOICE_ORDER.filter((k) => k in choices);
  const showSubmitBar = !isSubmitted && selectedAnswer;

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 bg-[var(--color-bg-primary)] ${
        !showSubmitBar ? 'border-b border-[var(--color-border)]' : ''
      }`}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6">
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            Select your answer:
          </p>
          <div className="space-y-2">
            {keys.map((key) => {
              const label = choices[key];
              const isSelected = selectedAnswer === key;
              const isCorrect = currentQuestion.correct_answer === key;
              const showCorrect = isSubmitted && isCorrect;
              const showWrong = isSubmitted && isSelected && !isCorrect;
              const struck = struckThroughChoices.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (!isSubmitted) {
                      selectAnswer(key);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isSubmitted) toggleStrikethrough(key);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-100 focus-ring ${
                    showCorrect
                      ? 'choice-correct'
                      : showWrong
                      ? 'choice-incorrect'
                      : isSelected
                      ? 'border-[var(--color-accent)] bg-[var(--color-bg-active)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]'
                  } ${struck ? 'line-through opacity-70' : ''}`}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {key}. {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky submit bar — always visible when an answer is selected */}
      {showSubmitBar && (
        <div className="shrink-0 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]">
          <button
            type="button"
            onClick={submit}
            className="btn btn-primary w-full focus-ring py-3 rounded-lg"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}
