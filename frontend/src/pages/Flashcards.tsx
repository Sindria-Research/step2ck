import { useState, useEffect } from 'react';
import { Plus, Layers, Play, Trash2, ChevronRight } from 'lucide-react';
import { api } from '../api/api';
import type { FlashcardDeckResponse, FlashcardResponse } from '../api/types';
import { EmptyState } from '../components/common';

type View = 'decks' | 'cards' | 'review';

export function Flashcards() {
  const [view, setView] = useState<View>('decks');
  const [decks, setDecks] = useState<FlashcardDeckResponse[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeckResponse | null>(null);
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  useEffect(() => {
    api.flashcards.listDecks()
      .then(setDecks)
      .catch(() => {})
      .finally(() => setLoading(false));
    api.flashcards.getDueCards().then(setDueCards).catch(() => {});
  }, []);

  const openDeck = async (deck: FlashcardDeckResponse) => {
    setSelectedDeck(deck);
    setView('cards');
    const c = await api.flashcards.listCards(deck.id);
    setCards(c);
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    setCreating(true);
    try {
      const deck = await api.flashcards.createDeck({ name: newDeckName.trim() });
      setDecks((prev) => [deck, ...prev]);
      setNewDeckName('');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDeck = async (id: number) => {
    await api.flashcards.deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
  };

  const startReview = () => {
    if (dueCards.length === 0) return;
    setReviewIndex(0);
    setShowBack(false);
    setView('review');
  };

  const handleReviewAnswer = async (quality: number) => {
    const card = dueCards[reviewIndex];
    await api.flashcards.reviewCard(card.id, quality);
    if (reviewIndex < dueCards.length - 1) {
      setReviewIndex((i) => i + 1);
      setShowBack(false);
    } else {
      setView('decks');
      const fresh = await api.flashcards.getDueCards();
      setDueCards(fresh);
    }
  };

  return (
    <div className="chiron-dash min-h-screen">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="chiron-feature-label">Tools</p>
              <h1 className="chiron-feature-heading">Flashcards</h1>
              <p className="chiron-feature-body mt-2">Spaced repetition for long-term retention.</p>
            </div>
            {view !== 'decks' && (
              <button
                type="button"
                onClick={() => setView('decks')}
                className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline"
              >
                &larr; Back to decks
              </button>
            )}
          </div>

          {/* Due cards banner */}
          {view === 'decks' && dueCards.length > 0 && (
            <div className="chiron-mockup mb-6 flex items-center justify-between bg-[color-mix(in_srgb,var(--color-brand-blue)_6%,var(--color-bg-primary))]">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Practice now to stay on schedule.</p>
              </div>
              <button
                type="button"
                onClick={startReview}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium hover:opacity-90"
              >
                <Play className="w-4 h-4" />
                Start Review
              </button>
            </div>
          )}

          {/* Decks view */}
          {view === 'decks' && (
            <>
              <div className="chiron-mockup mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
                    placeholder="New deck name..."
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateDeck}
                    disabled={creating || !newDeckName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="chiron-mockup animate-pulse h-16" />
                  ))}
                </div>
              ) : decks.length === 0 ? (
                <div className="chiron-mockup">
                  <EmptyState
                    icon={Layers}
                    title="No decks yet"
                    description="Create a deck above to start adding flashcards."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {decks.map((deck) => (
                    <div key={deck.id} className="chiron-mockup hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDeck(deck)}>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{deck.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {deck.card_count} card{deck.card_count !== 1 ? 's' : ''}
                            {deck.section && <> &middot; {deck.section}</>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openDeck(deck)}
                          className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Cards view */}
          {view === 'cards' && selectedDeck && (
            <div className="chiron-mockup">
              <div className="flex items-center justify-between mb-4">
                <p className="chiron-mockup-label">{selectedDeck.name} &middot; {cards.length} cards</p>
              </div>
              {cards.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)] py-8 text-center">
                  No cards in this deck yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {cards.map((card) => (
                    <div key={card.id} className="chiron-progress-row">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{card.front}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{card.back}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review view */}
          {view === 'review' && dueCards.length > 0 && (
            <div className="chiron-mockup max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <p className="chiron-mockup-label">Card {reviewIndex + 1} of {dueCards.length}</p>
                <div className="chiron-meter-track w-32">
                  <div className="chiron-meter-fill" style={{ width: `${((reviewIndex + 1) / dueCards.length) * 100}%` }} />
                </div>
              </div>

              <div className="py-12 text-center">
                <p className="text-lg font-medium text-[var(--color-text-primary)] mb-8">
                  {dueCards[reviewIndex].front}
                </p>

                {showBack ? (
                  <>
                    <div className="border-t border-[var(--color-border)] pt-6 mb-8">
                      <p className="text-base text-[var(--color-text-secondary)]">
                        {dueCards[reviewIndex].back}
                      </p>
                    </div>
                    <p className="chiron-mockup-label mb-3">How well did you know this?</p>
                    <div className="flex justify-center gap-2">
                      {[
                        { q: 1, label: 'Again', color: 'var(--color-error)' },
                        { q: 3, label: 'Hard', color: 'var(--color-warning)' },
                        { q: 4, label: 'Good', color: 'var(--color-brand-blue)' },
                        { q: 5, label: 'Easy', color: 'var(--color-success)' },
                      ].map((opt) => (
                        <button
                          key={opt.q}
                          type="button"
                          onClick={() => handleReviewAnswer(opt.q)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: opt.color }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBack(true)}
                    className="px-6 py-2.5 rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium hover:opacity-90"
                  >
                    Show Answer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
