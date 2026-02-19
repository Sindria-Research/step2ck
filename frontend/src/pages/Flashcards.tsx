import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Layers,
  Play,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Pencil,
  X,
  Check,
  Search,
  Upload,
  Download,
  FileUp,
} from 'lucide-react';
import { api } from '../api/api';
import type { FlashcardDeckResponse, FlashcardResponse } from '../api/types';
import { EmptyState } from '../components/common';
import { Modal } from '../components/common/Modal';
import { parseFlashcardText, exportCardsAsText } from '../utils/importFlashcards';
import { formatFlashcardContent } from '../utils/formatFlashcardContent';
import { FreeTierBanner } from '../components/ProGate';

type View = 'decks' | 'cards' | 'review';

function FlashcardContent({ text, className = '' }: { text: string; className?: string }) {
  const html = formatFlashcardContent(text);
  return (
    <div
      className={`flashcard-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function Flashcards() {
  const [view, setView] = useState<View>('decks');
  const [decks, setDecks] = useState<FlashcardDeckResponse[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeckResponse | null>(null);
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardResponse[]>([]);
  const [sessionCards, setSessionCards] = useState<FlashcardResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDeckModalOpen, setNewDeckModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const apkgInputRef = useRef<HTMLInputElement>(null);
  const [apkgImporting, setApkgImporting] = useState(false);
  const [apkgError, setApkgError] = useState<string | null>(null);

  const [deckSearchQuery, setDeckSearchQuery] = useState('');

  const [addFront, setAddFront] = useState('');
  const [addBack, setAddBack] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const filteredDecks = useMemo(() => {
    const q = deckSearchQuery.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter(
      (d) =>
        (d.name ?? '').toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q) ||
        (d.section ?? '').toLowerCase().includes(q)
    );
  }, [decks, deckSearchQuery]);

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
    setAddFront('');
    setAddBack('');
    setEditingCardId(null);
    setImportOpen(false);
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    setCreating(true);
    try {
      const deck = await api.flashcards.createDeck({
        name: newDeckName.trim(),
        description: newDeckDescription.trim() || undefined,
      });
      setDecks((prev) => [deck, ...prev]);
      setNewDeckName('');
      setNewDeckDescription('');
      setNewDeckModalOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const startDeckStudy = async (deck: FlashcardDeckResponse) => {
    const list = await api.flashcards.getDeckReviewCards(deck.id, 'all');
    if (list.length === 0) return;
    setSessionCards(list);
    setReviewIndex(0);
    setShowBack(false);
    setView('review');
  };

  const handleDeleteDeck = async (id: number) => {
    await api.flashcards.deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (selectedDeck?.id === id) {
      setSelectedDeck(null);
      setView('decks');
    }
  };

  const handleAddCard = async () => {
    if (!selectedDeck || !addFront.trim() || !addBack.trim()) return;
    setAddingCard(true);
    try {
      const card = await api.flashcards.createCard({
        deck_id: selectedDeck.id,
        front: addFront.trim(),
        back: addBack.trim(),
      });
      setCards((prev) => [card, ...prev]);
      setSelectedDeck((d) => (d ? { ...d, card_count: d.card_count + 1 } : null));
      setAddFront('');
      setAddBack('');
    } finally {
      setAddingCard(false);
    }
  };

  const startEditCard = (card: FlashcardResponse) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleUpdateCard = async () => {
    if (editingCardId == null) return;
    const updated = await api.flashcards.updateCard(editingCardId, {
      front: editFront.trim(),
      back: editBack.trim(),
    });
    setCards((prev) => prev.map((c) => (c.id === editingCardId ? updated : c)));
    setEditingCardId(null);
  };

  const handleDeleteCard = async (cardId: number) => {
    await api.flashcards.deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedDeck((d) => (d ? { ...d, card_count: Math.max(0, d.card_count - 1) } : null));
    if (editingCardId === cardId) setEditingCardId(null);
  };

  const handleImport = async () => {
    if (!selectedDeck) return;
    setImportError(null);
    const parsed = parseFlashcardText(importText);
    if (parsed.length === 0) {
      setImportError('No valid cards found. Use one card per line, with front and back separated by tab, comma, or semicolon.');
      return;
    }
    setImporting(true);
    try {
      for (const { front, back } of parsed) {
        const card = await api.flashcards.createCard({
          deck_id: selectedDeck.id,
          front,
          back,
        });
        setCards((prev) => [card, ...prev]);
      }
      setSelectedDeck((d) => (d ? { ...d, card_count: d.card_count + parsed.length } : null));
      setImportText('');
      setImportOpen(false);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    const text = exportCardsAsText(cards.map((c) => ({ front: c.front, back: c.back })));
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDeck?.name ?? 'deck'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startReview = () => {
    if (dueCards.length === 0) return;
    setSessionCards(null);
    setReviewIndex(0);
    setShowBack(false);
    setView('review');
  };

  const reviewCards = sessionCards ?? dueCards;

  const handleReviewAnswer = async (quality: number) => {
    const card = reviewCards[reviewIndex];
    await api.flashcards.reviewCard(card.id, quality);
    if (reviewIndex < reviewCards.length - 1) {
      setReviewIndex((i) => i + 1);
      setShowBack(false);
    } else {
      setView('decks');
      setSessionCards(null);
      const fresh = await api.flashcards.getDueCards();
      setDueCards(fresh);
    }
  };

  const handleApkgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setApkgError(null);
    setApkgImporting(true);
    try {
      const created = await api.flashcards.importApkg(file);
      setDecks((prev) => [...created, ...prev]);
    } catch (err) {
      setApkgError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setApkgImporting(false);
    }
  };

  return (
    <div className="chiron-dash min-h-screen">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container max-w-4xl">
          <header className="flex items-center justify-between mb-8 gap-4">
            <div>
              <p className="chiron-feature-label">Tools</p>
              <h1 className="chiron-feature-heading">Flashcards</h1>
              <p className="chiron-feature-body mt-2">Spaced repetition for long-term retention.</p>
            </div>
            {view !== 'decks' && (
              <button
                type="button"
                onClick={() => setView('decks')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to decks
              </button>
            )}
          </header>

          {view === 'decks' && <FreeTierBanner used={decks.length} limit={3} feature="decks" />}

          {/* Due banner */}
          {view === 'decks' && dueCards.length > 0 && (
            <div className="chiron-mockup mb-6 flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Review now to stay on schedule.</p>
              </div>
              <button
                type="button"
                onClick={startReview}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring shrink-0"
              >
                <Play className="w-4 h-4" />
                Start review
              </button>
            </div>
          )}

          {/* Decks view */}
          {view === 'decks' && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setNewDeckModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring"
                >
                  <Plus className="w-4 h-4" />
                  New deck
                </button>
                <input
                  ref={apkgInputRef}
                  type="file"
                  accept=".apkg"
                  onChange={handleApkgChange}
                  className="hidden"
                  aria-label="Import Anki .apkg file"
                />
                <button
                  type="button"
                  onClick={() => apkgInputRef.current?.click()}
                  disabled={apkgImporting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring disabled:opacity-50"
                >
                  <FileUp className="w-4 h-4" />
                  {apkgImporting ? 'Importing…' : 'Import .apkg'}
                </button>
                {apkgError && (
                  <p className="text-xs text-[var(--color-error)]">{apkgError}</p>
                )}
              </div>

              <Modal open={newDeckModalOpen} onClose={() => setNewDeckModalOpen(false)} title="New deck" size="sm">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="new-deck-name" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Title</label>
                    <input
                      id="new-deck-name"
                      type="text"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
                      placeholder="Deck name"
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-deck-desc" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Description (optional)</label>
                    <input
                      id="new-deck-desc"
                      type="text"
                      value={newDeckDescription}
                      onChange={(e) => setNewDeckDescription(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
                      placeholder="Brief description"
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewDeckModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] focus-ring"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateDeck}
                      disabled={creating || !newDeckName.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary text-sm font-medium transition-all disabled:opacity-50 focus-ring"
                    >
                      <Plus className="w-4 h-4" />
                      Create
                    </button>
                  </div>
                </div>
              </Modal>

              {/* Deck search */}
              {decks.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden />
                    <input
                      type="search"
                      value={deckSearchQuery}
                      onChange={(e) => setDeckSearchQuery(e.target.value)}
                      placeholder="Search decks..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] focus:border-transparent transition-[box-shadow]"
                      aria-label="Search decks"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                    {deckSearchQuery.trim()
                      ? `${filteredDecks.length} of ${decks.length} deck${decks.length !== 1 ? 's' : ''}`
                      : `${decks.length} deck${decks.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="chiron-mockup h-16 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : decks.length === 0 ? (
                <div className="chiron-mockup py-12">
                  <EmptyState
                    icon={Layers}
                    title="No decks yet"
                    description="Create a deck above to start adding flashcards."
                  />
                </div>
              ) : filteredDecks.length === 0 ? (
                <div className="chiron-mockup py-10 text-center">
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    No decks match &quot;{deckSearchQuery.trim()}&quot;
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="chiron-mockup chiron-progress-row flex items-center gap-2 py-3 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => openDeck(deck)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{deck.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                          {deck.card_count} card{deck.card_count !== 1 ? 's' : ''}
                          {deck.description && <> · {deck.description}</>}
                          {deck.section && <> · {deck.section}</>}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => startDeckStudy(deck)}
                        disabled={deck.card_count === 0}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-primary text-xs font-medium transition-all disabled:opacity-50 focus-ring"
                        title="Study this deck"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Study
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeck(deck)}
                        className="p-2.5 md:p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                        title="Open deck"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="p-2.5 md:p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
                        title="Delete deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Cards view */}
          {view === 'cards' && selectedDeck && (
            <div className="space-y-4">
              <div className="chiron-mockup">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                      {selectedDeck.name}
                    </h2>
                    {selectedDeck.description && (
                      <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">{selectedDeck.description}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {cards.length} card{cards.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setImportOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                    >
                      <Upload className="w-4 h-4" />
                      Import
                    </button>
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={cards.length === 0}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Import panel */}
                {importOpen && (
                  <div className="mb-5 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/50">
                    <p className="chiron-mockup-label mb-2">Import cards</p>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      One card per line. Separate front and back with <strong>tab</strong>, <strong>comma</strong>, or <strong>semicolon</strong>. Compatible with Quizlet and CSV exports.
                    </p>
                    <textarea
                      value={importText}
                      onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
                      placeholder="term&#10;definition&#10;&#10;or: question, answer"
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] resize-y min-h-[100px]"
                    />
                    {importError && (
                      <p className="text-xs text-[var(--color-error)] mt-2">{importError}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || !importText.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary text-sm font-medium transition-all disabled:opacity-50 focus-ring"
                      >
                        <Upload className="w-4 h-4" />
                        {importing ? 'Importing…' : 'Import'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImportOpen(false); setImportText(''); setImportError(null); }}
                        className="px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] focus-ring"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Add card */}
                <div className="mb-5 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                  <p className="chiron-mockup-label mb-2">Add card</p>
                  <div className="space-y-2">
                    <textarea
                      value={addFront}
                      onChange={(e) => setAddFront(e.target.value)}
                      placeholder="Front (term or question)"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] focus:border-transparent resize-none"
                    />
                    <textarea
                      value={addBack}
                      onChange={(e) => setAddBack(e.target.value)}
                      placeholder="Back (definition or answer)"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] focus:border-transparent resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCard}
                      disabled={addingCard || !addFront.trim() || !addBack.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all disabled:opacity-50 focus-ring"
                    >
                      <Plus className="w-4 h-4" />
                      Add card
                    </button>
                  </div>
                </div>

                {/* Card list */}
                {cards.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[var(--color-text-tertiary)]">No cards yet. Add one above or import from Quizlet/CSV.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 hover:border-[var(--color-border-hover)] transition-colors"
                      >
                        {editingCardId === card.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editFront}
                              onChange={(e) => setEditFront(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] resize-none"
                            />
                            <textarea
                              value={editBack}
                              onChange={(e) => setEditBack(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] resize-none"
                            />
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleUpdateCard}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-primary text-xs font-medium transition-all focus-ring"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCardId(null)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg-hover)] focus-ring"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--color-text-primary)] break-words">
                                {card.front}
                              </p>
                              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 break-words">{card.back}</p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditCard(card)}
                                className="p-2.5 md:p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2.5 md:p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review view */}
          {view === 'review' && reviewCards.length > 0 && (
            <div className="chiron-mockup max-w-xl mx-auto">
              <div className="flex items-center justify-between gap-4 mb-6">
                <span className="text-xs font-medium text-[var(--color-text-muted)] tabular-nums">
                  {reviewIndex + 1} / {reviewCards.length}
                </span>
                <div className="flex-1 max-w-[8rem] h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-brand-blue)] transition-[width] duration-300 ease-out"
                    style={{ width: `${((reviewIndex + 1) / reviewCards.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="py-10 px-2">
                <div
                  key={`card-${reviewIndex}`}
                  className="flashcard-card-enter min-h-[120px] flex flex-col justify-center"
                >
                  <div className="text-xl font-medium text-[var(--color-text-primary)] leading-relaxed text-center">
                    <FlashcardContent text={reviewCards[reviewIndex].front} />
                  </div>
                </div>

                {showBack ? (
                  <>
                    <div key="answer" className="flashcard-answer-enter mt-8 pt-6 border-t border-[var(--color-border)]">
                      <div className="text-base text-[var(--color-text-secondary)] leading-relaxed text-center">
                        <FlashcardContent text={reviewCards[reviewIndex].back} />
                      </div>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-6 mb-3 text-center">
                      How well did you know this?
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
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
                          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 focus-ring transition-opacity"
                          style={{ backgroundColor: opt.color }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setShowBack(true)}
                      className="px-6 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring"
                    >
                      Show answer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
