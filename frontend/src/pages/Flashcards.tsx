import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus,
  Layers,
  Play,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Check,
  Search,
  Upload,
  Download,
  FileUp,
  Wand2,
  Flag,
  Undo2,
  Keyboard,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Archive,
  StickyNote,
  Tag,
  Info,
} from 'lucide-react';
import { api } from '../api/api';
import type {
  FlashcardDeckResponse,
  FlashcardResponse,
  FlashcardSettingsResponse,
  FlashcardSettingsUpdate,
  GenerationQuestionItem,
  GenerationSessionSource,
  IntervalPreview,
  ScheduleInfo,
} from '../api/types';
import { EmptyState } from '../components/common';
import { Modal } from '../components/common/Modal';
import { parseFlashcardText, exportCardsAsText } from '../utils/importFlashcards';
import { formatFlashcardContent } from '../utils/formatFlashcardContent';
import { FreeTierBanner, ProBadge } from '../components/ProGate';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type View = 'decks' | 'cards' | 'review' | 'summary' | 'settings';

interface SessionStats {
  total: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
  graduated: number;
  startTime: number;
}

interface QueueEntry {
  card: FlashcardResponse;
  dueAt: number;
}

interface UndoEntry {
  previousQueue: QueueEntry[];
  previousCard: FlashcardResponse;
  previousStats: SessionStats;
}

function formatSchedule(info: ScheduleInfo): string {
  if (!info.graduated && info.minutes > 0) {
    if (info.minutes < 60) return `${info.minutes}m`;
    return `${(info.minutes / 60).toFixed(1)}h`;
  }
  const days = info.days;
  if (days < 1) return '<1d';
  if (days === 1) return '1d';
  if (days < 31) return `${days}d`;
  if (days < 365) return `${(days / 30.44).toFixed(1)}mo`;
  return `${(days / 365.25).toFixed(1)}yr`;
}

const RATING_CONFIG = [
  { rating: 1, label: 'Again', key: '1', color: 'var(--color-error)' },
  { rating: 2, label: 'Hard', key: '2', color: 'var(--color-warning)' },
  { rating: 3, label: 'Good', key: '3', color: 'var(--color-brand-blue)' },
  { rating: 4, label: 'Easy', key: '4', color: 'var(--color-success)' },
] as const;

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
  const { isPro } = useAuth();
  const { addToast } = useToast();
  const [view, setView] = useState<View>('decks');
  const [decks, setDecks] = useState<FlashcardDeckResponse[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeckResponse | null>(null);
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBack, setShowBack] = useState(false);

  // Queue-based session state (Anki-style)
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [, setQueueSource] = useState<'due' | 'deck'>('due');
  const [creating, setCreating] = useState(false);
  const [newDeckModalOpen, setNewDeckModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const apkgInputRef = useRef<HTMLInputElement>(null);
  const [apkgImporting, setApkgImporting] = useState(false);
  const [apkgError, setApkgError] = useState<string | null>(null);

  // Generation modal state
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genStep, setGenStep] = useState<'source' | 'deck' | 'questions'>('source');
  const [genSources, setGenSources] = useState<{ sessions: GenerationSessionSource[]; sections: string[]; systems: string[]; all_sections: string[]; all_systems: string[] } | null>(null);
  const [genSourcesLoading, setGenSourcesLoading] = useState(false);
  const [genSourceType, setGenSourceType] = useState<'missed' | 'session' | 'section' | 'system' | 'all_section' | 'all_system'>('missed');
  const [genSelectedSession, setGenSelectedSession] = useState<number | null>(null);
  const [genSelectedSection, setGenSelectedSection] = useState<string | null>(null);
  const [genSelectedSystem, setGenSelectedSystem] = useState<string | null>(null);
  const [genQuestions, setGenQuestions] = useState<GenerationQuestionItem[]>([]);
  const [genQuestionsLoading, setGenQuestionsLoading] = useState(false);
  const [genCreated, setGenCreated] = useState<Set<string>>(new Set());
  const [genLoading, setGenLoading] = useState<Set<string>>(new Set());
  const [genTargetDeckId, setGenTargetDeckId] = useState<number | 'new'>('new');
  const [genNewDeckName, setGenNewDeckName] = useState('AI Generated');
  const [genNumCards, setGenNumCards] = useState(4);
  const [genQuestionLimit, setGenQuestionLimit] = useState(50);

  // Inline deck rename
  const [renamingDeckId, setRenamingDeckId] = useState<number | null>(null);
  const [renameDeckValue, setRenameDeckValue] = useState('');

  // User flashcard settings
  const [fcSettings, setFcSettings] = useState<FlashcardSettingsResponse | null>(null);
  const [fcDraft, setFcDraft] = useState<Partial<FlashcardSettingsUpdate>>({});
  const [fcSettingsSaving, setFcSettingsSaving] = useState(false);
  const [fcCapturingKey, setFcCapturingKey] = useState<string | null>(null);

  // FSRS review state
  const [intervals, setIntervals] = useState<IntervalPreview | null>(null);
  const [intervalsLoading, setIntervalsLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ total: 0, again: 0, hard: 0, good: 0, easy: 0, graduated: 0, startTime: Date.now() });
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [cardTimerStart, setCardTimerStart] = useState<number>(Date.now());
  const [cardTimerElapsed, setCardTimerElapsed] = useState(0);

  const [deleteConfirmDeck, setDeleteConfirmDeck] = useState<FlashcardDeckResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [deckSearchQuery, setDeckSearchQuery] = useState('');

  const [addFront, setAddFront] = useState('');
  const [addBack, setAddBack] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  // Card detail modal
  const [detailCard, setDetailCard] = useState<FlashcardResponse | null>(null);
  const [detailNotes, setDetailNotes] = useState('');
  const [detailTags, setDetailTags] = useState('');
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailEditingContent, setDetailEditingContent] = useState(false);
  const [detailFront, setDetailFront] = useState('');
  const [detailBack, setDetailBack] = useState('');
  const [detailFromReview, setDetailFromReview] = useState(false);

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
    if (sessionStorage.getItem('fc_open_settings') === '1') {
      sessionStorage.removeItem('fc_open_settings');
      setView('settings');
    }
    api.flashcards.listDecks()
      .then(setDecks)
      .catch(() => {})
      .finally(() => setLoading(false));
    api.flashcards.getDueCards().then(setDueCards).catch(() => {});
    api.flashcards.getSettings().then(setFcSettings).catch(() => {});
  }, []);

  const openDeck = async (deck: FlashcardDeckResponse) => {
    setSelectedDeck(deck);
    setView('cards');
    const c = await api.flashcards.listCards(deck.id);
    setCards(c);
    setAddFront('');
    setAddBack('');
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

  const fetchIntervals = useCallback(async (cardId: number) => {
    setIntervalsLoading(true);
    try {
      const iv = await api.flashcards.getIntervals(cardId);
      setIntervals(iv);
    } catch {
      setIntervals(null);
    } finally {
      setIntervalsLoading(false);
    }
  }, []);

  const buildQueue = (cards: FlashcardResponse[]): QueueEntry[] => {
    const newLimit = fcSettings?.daily_new_cards ?? 20;
    const reviewLimit = fcSettings?.daily_review_limit ?? 200;

    let newCards = cards.filter((c) => c.state === 'new');
    let reviewCards = cards.filter((c) => c.state !== 'new');

    if (fcSettings?.new_card_order === 'random') {
      for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
      }
    }

    newCards = newCards.slice(0, newLimit);
    reviewCards = reviewCards.slice(0, reviewLimit);

    return [...newCards, ...reviewCards].map((card) => ({ card, dueAt: Date.now() }));
  };

  const startDeckStudy = async (deck: FlashcardDeckResponse) => {
    const list = await api.flashcards.getDeckReviewCards(deck.id, 'all');
    if (list.length === 0) return;
    const q = buildQueue(list);
    setQueue(q);
    setQueueSource('deck');
    setShowBack(false);
    setUndoStack([]);
    setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0, graduated: 0, startTime: Date.now() });
    setView('review');
    fetchIntervals(q[0].card.id);
  };

  const handleDeleteDeck = async () => {
    if (!deleteConfirmDeck) return;
    const id = deleteConfirmDeck.id;
    setDeleting(true);
    try {
      await api.flashcards.deleteDeck(id);
      setDecks((prev) => prev.filter((d) => d.id !== id));
      if (selectedDeck?.id === id) {
        setSelectedDeck(null);
        setView('decks');
      }
      // Refresh due cards so deleted deck's cards disappear from the queue
      const fresh = await api.flashcards.getDueCards();
      setDueCards(fresh);
    } finally {
      setDeleting(false);
      setDeleteConfirmDeck(null);
    }
  };

  const handleRenameDeck = useCallback(async (deckId: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setRenamingDeckId(null);
      return;
    }
    try {
      const updated = await api.flashcards.updateDeck(deckId, { name: trimmed });
      setDecks((prev) => prev.map((d) => d.id === deckId ? { ...d, name: updated.name } : d));
      if (selectedDeck?.id === deckId) setSelectedDeck((prev) => prev ? { ...prev, name: updated.name } : prev);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to rename deck', 'error');
    }
    setRenamingDeckId(null);
  }, [selectedDeck, addToast]);

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

  const handleDeleteCard = async (cardId: number) => {
    await api.flashcards.deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedDeck((d) => (d ? { ...d, card_count: Math.max(0, d.card_count - 1) } : null));
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

  const openCardDetail = useCallback((card: FlashcardResponse, fromReview = false) => {
    setDetailCard(card);
    setDetailNotes(card.notes ?? '');
    setDetailTags(card.tags ?? '');
    setDetailFront(card.front);
    setDetailBack(card.back);
    setDetailEditingContent(false);
    setDetailFromReview(fromReview);
  }, []);

  const handleDetailSave = useCallback(async () => {
    if (!detailCard) return;
    setDetailSaving(true);
    try {
      const body: Record<string, string> = { notes: detailNotes, tags: detailTags };
      if (detailFront !== detailCard.front) body.front = detailFront;
      if (detailBack !== detailCard.back) body.back = detailBack;
      const updated = await api.flashcards.updateCard(detailCard.id, body);
      setDetailCard(updated);
      setDetailEditingContent(false);
      setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      if (detailFromReview) {
        setQueue((prev) => prev.map((qe) => qe.card.id === updated.id ? { ...qe, card: updated } : qe));
      }
    } catch {
      addToast('Failed to save card', 'error');
    }
    setDetailSaving(false);
  }, [detailCard, detailNotes, detailTags, detailFront, detailBack, detailFromReview, addToast]);

  const handleCardAction = useCallback(async (cardId: number, action: 'suspend' | 'unsuspend' | 'bury' | 'flag' | 'unflag') => {
    const body: Record<string, boolean> = {};
    if (action === 'suspend') body.suspended = true;
    if (action === 'unsuspend') body.suspended = false;
    if (action === 'bury') body.buried = true;
    if (action === 'flag') body.flagged = true;
    if (action === 'unflag') body.flagged = false;
    try {
      const updated = await api.flashcards.updateCard(cardId, body);
      setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      setDetailCard((prev) => prev?.id === updated.id ? updated : prev);
      setDueCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      // Remove suspended/buried cards from queue during review
      if (action === 'suspend' || action === 'bury') {
        setQueue((prev) => prev.filter((qe) => qe.card.id !== cardId));
      }
      // Update flagged state in queue
      if (action === 'flag' || action === 'unflag') {
        setQueue((prev) => prev.map((qe) => qe.card.id === updated.id ? { ...qe, card: updated } : qe));
      }
    } catch {
      addToast('Action failed', 'error');
    }
  }, [addToast]);

  const startReview = () => {
    if (dueCards.length === 0) return;
    const q = buildQueue(dueCards);
    setQueue(q);
    setQueueSource('due');
    setShowBack(false);
    setUndoStack([]);
    setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0, graduated: 0, startTime: Date.now() });
    setView('review');
    fetchIntervals(q[0].card.id);
  };

  const currentEntry = queue[0] ?? null;
  const currentCard = currentEntry?.card ?? null;

  const handleReviewAnswer = useCallback(async (rating: number) => {
    if (!currentCard || reviewBusy) return;
    setReviewBusy(true);

    const statKey = rating === 1 ? 'again' : rating === 2 ? 'hard' : rating === 3 ? 'good' : 'easy';

    setUndoStack((prev) => [...prev, {
      previousQueue: [...queue],
      previousCard: { ...currentCard },
      previousStats: { ...sessionStats },
    }]);

    try {
      const result = await api.flashcards.reviewCard(currentCard.id, rating);
      setIntervals(null);

      const newStats = {
        ...sessionStats,
        total: sessionStats.total + 1,
        [statKey]: sessionStats[statKey] + 1,
        graduated: sessionStats.graduated + (result.graduated ? 1 : 0),
      };
      setSessionStats(newStats);

      // Build next queue: remove current card from front
      const remaining = queue.slice(1);

      if (!result.graduated) {
        // Card needs to come back — re-insert after a delay
        const updatedCard = result.card;
        const dueAt = Date.now() + result.again_in_minutes * 60 * 1000;

        // Insert at appropriate position in queue
        const insertIdx = remaining.findIndex((e) => e.dueAt > dueAt);
        const entry: QueueEntry = { card: updatedCard, dueAt };
        if (insertIdx === -1) {
          remaining.push(entry);
        } else {
          remaining.splice(Math.max(1, insertIdx), 0, entry);
        }
      }

      if (remaining.length === 0) {
        setQueue([]);
        setView('summary');
      } else {
        setQueue(remaining);
        setShowBack(fcSettings?.auto_advance ?? false);
        fetchIntervals(remaining[0].card.id);
      }
    } catch (err) {
      setUndoStack((prev) => prev.slice(0, -1));
      addToast(err instanceof Error ? err.message : 'Review failed. Please try again.', 'error');
    } finally {
      setReviewBusy(false);
    }
  }, [queue, currentCard, sessionStats, fetchIntervals, reviewBusy, addToast, fcSettings]);

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setSessionStats(last.previousStats);
    setQueue(last.previousQueue);
    setShowBack(false);
    fetchIntervals(last.previousCard.id);
    if (view === 'summary') setView('review');
  }, [undoStack, fetchIntervals, view]);

  const handleToggleFlag = useCallback(async () => {
    if (!currentCard) return;
    const newFlagged = !currentCard.flagged;

    const optimistic = { ...currentCard, flagged: newFlagged };
    setQueue((prev) => prev.map((e, i) => i === 0 ? { ...e, card: optimistic } : e));

    try {
      await api.flashcards.updateCard(currentCard.id, { flagged: newFlagged });
    } catch {
      setQueue((prev) => prev.map((e, i) => i === 0 ? { ...e, card: currentCard } : e));
    }
  }, [queue, currentCard]);

  const finishSession = useCallback(async () => {
    setView('decks');
    setQueue([]);
    const fresh = await api.flashcards.getDueCards();
    setDueCards(fresh);
  }, []);

  const handleSaveFcSettings = useCallback(async () => {
    if (Object.keys(fcDraft).length === 0) return;
    setFcSettingsSaving(true);
    try {
      const updated = await api.flashcards.updateSettings(fcDraft);
      setFcSettings(updated);
      setFcDraft({});
      addToast('Settings saved', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    }
    setFcSettingsSaving(false);
  }, [fcDraft, addToast]);

  const updateFcDraft = useCallback((key: string, value: unknown) => {
    setFcDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Counts for the review header
  const learningCount = queue.filter((e) => e.card.state === 'learning' || e.card.state === 'relearning' || e.card.state === 'new').length;
  const reviewCount = queue.filter((e) => e.card.state === 'review').length;

  // Per-card timer
  useEffect(() => {
    if (view !== 'review' || !currentCard) return;
    setCardTimerStart(Date.now());
    setCardTimerElapsed(0);
  }, [view, currentCard?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view !== 'review' || !(fcSettings?.show_timer ?? false)) return;
    const interval = setInterval(() => {
      setCardTimerElapsed(Math.floor((Date.now() - cardTimerStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [view, cardTimerStart, fcSettings?.show_timer]);

  // Keyboard shortcuts for review mode (uses user-configurable hotkeys)
  useEffect(() => {
    if (view !== 'review' || queue.length === 0) return;
    const hk = fcSettings ?? {
      hotkey_show_answer: 'Space',
      hotkey_again: '1',
      hotkey_hard: '2',
      hotkey_good: '3',
      hotkey_easy: '4',
      hotkey_flag: 'f',
      hotkey_undo: 'z',
    };
    const matchKey = (e: KeyboardEvent, hotkey: string) => {
      if (hotkey === 'Space') return e.key === ' ' || e.code === 'Space';
      return e.key.toLowerCase() === hotkey.toLowerCase();
    };
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutHelp((p) => !p);
        return;
      }
      if (e.key === 'Escape') {
        if (showShortcutHelp) { setShowShortcutHelp(false); e.preventDefault(); }
        return;
      }

      if (showShortcutHelp) return;

      if (!showBack) {
        if (matchKey(e, hk.hotkey_show_answer) || e.key === 'Enter') {
          e.preventDefault();
          setShowBack(true);
        }
        return;
      }

      if (matchKey(e, hk.hotkey_again)) { e.preventDefault(); handleReviewAnswer(1); return; }
      if (matchKey(e, hk.hotkey_hard)) { e.preventDefault(); handleReviewAnswer(2); return; }
      if (matchKey(e, hk.hotkey_good)) { e.preventDefault(); handleReviewAnswer(3); return; }
      if (matchKey(e, hk.hotkey_easy)) { e.preventDefault(); handleReviewAnswer(4); return; }
      if (matchKey(e, hk.hotkey_flag)) { e.preventDefault(); handleToggleFlag(); return; }
      if (matchKey(e, hk.hotkey_undo)) { e.preventDefault(); handleUndo(); return; }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        const cur = queue[0]?.card;
        if (cur) openCardDetail(cur, true);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, queue.length, showBack, showShortcutHelp, handleReviewAnswer, handleToggleFlag, handleUndo, openCardDetail, queue, fcSettings]);

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

  const openGenModal = useCallback(async () => {
    setGenModalOpen(true);
    setGenStep('source');
    setGenCreated(new Set());
    setGenLoading(new Set());
    setGenQuestions([]);
    setGenSourceType('missed');
    setGenSelectedSession(null);
    setGenSelectedSection(null);
    setGenSelectedSystem(null);
    setGenTargetDeckId('new');
    setGenNewDeckName('AI Generated');
    setGenNumCards(4);
    setGenQuestionLimit(50);
    setGenSourcesLoading(true);
    try {
      const sources = await api.flashcards.getGenerationSources();
      setGenSources(sources);
    } catch {
      setGenSources({ sessions: [], sections: [], systems: [], all_sections: [], all_systems: [] });
    } finally {
      setGenSourcesLoading(false);
    }
  }, []);

  const loadGenQuestions = useCallback(async () => {
    setGenQuestionsLoading(true);
    setGenCreated(new Set());
    setGenLoading(new Set());
    try {
      const body: { source: string; session_id?: number; section?: string; system?: string; limit?: number } = { source: genSourceType, limit: genQuestionLimit };
      if (genSourceType === 'session' && genSelectedSession != null) body.session_id = genSelectedSession;
      if ((genSourceType === 'section' || genSourceType === 'all_section') && genSelectedSection) body.section = genSelectedSection;
      if ((genSourceType === 'system' || genSourceType === 'all_system') && genSelectedSystem) body.system = genSelectedSystem;
      const res = await api.flashcards.getGenerationQuestions(body as Parameters<typeof api.flashcards.getGenerationQuestions>[0]);
      setGenQuestions(res.questions);
      setGenStep('questions');
    } catch {
      setGenQuestions([]);
      setGenStep('questions');
    } finally {
      setGenQuestionsLoading(false);
    }
  }, [genSourceType, genSelectedSession, genSelectedSection, genSelectedSystem, genQuestionLimit]);

  const genTargetDeckRef = useRef<{ id: number } | null>(null);

  const resolveTargetDeck = useCallback(async (): Promise<{ id: number }> => {
    if (genTargetDeckRef.current) return genTargetDeckRef.current;

    let deck: FlashcardDeckResponse;
    if (genTargetDeckId !== 'new') {
      const existing = decks.find((d) => d.id === genTargetDeckId);
      if (existing) {
        genTargetDeckRef.current = existing;
        return existing;
      }
    }
    const name = genNewDeckName.trim() || 'AI Generated';
    deck = await api.flashcards.createDeck({
      name,
      description: 'AI-generated flashcards',
    });
    setDecks((prev) => [deck, ...prev]);
    genTargetDeckRef.current = deck;
    return deck;
  }, [genTargetDeckId, genNewDeckName, decks]);

  const handleGenerate = useCallback(async (question: GenerationQuestionItem) => {
    if (genLoading.has(question.id) || genCreated.has(question.id)) return;
    setGenLoading((prev) => new Set(prev).add(question.id));
    try {
      const deck = await resolveTargetDeck();
      const aiResult = await api.ai.generateFlashcard({ question_id: question.id, num_cards: genNumCards });
      for (const card of aiResult.cards) {
        await api.flashcards.createCard({
          deck_id: deck.id,
          front: card.front,
          back: card.back,
          question_id: question.id,
        });
      }
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deck.id ? { ...d, card_count: d.card_count + aiResult.cards.length, new_count: d.new_count + aiResult.cards.length } : d,
        ),
      );
      setGenCreated((prev) => new Set(prev).add(question.id));
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to generate flashcards', 'error');
    } finally {
      setGenLoading((prev) => {
        const next = new Set(prev);
        next.delete(question.id);
        return next;
      });
    }
  }, [genLoading, genCreated, addToast, resolveTargetDeck, genNumCards]);

  const handleGenerateAll = useCallback(async () => {
    genTargetDeckRef.current = null;
    for (const q of genQuestions) {
      if (!genCreated.has(q.id) && !genLoading.has(q.id)) {
        await handleGenerate(q);
      }
    }
  }, [genQuestions, genCreated, genLoading, handleGenerate]);

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
            <div className="flex items-center gap-2 shrink-0">
              {view !== 'decks' && (
                <button
                  type="button"
                  onClick={() => setView('decks')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to decks
                </button>
              )}
              {view === 'decks' && (
                <button
                  type="button"
                  onClick={() => setView('settings')}
                  className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                  title="Flashcard settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
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
                {isPro ? (
                  <button
                    type="button"
                    onClick={openGenModal}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                  >
                    <Wand2 className="w-4 h-4" />
                    AI Generate
                  </button>
                ) : (
                  <a
                    href="/pricing"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-brand-blue)]/30 bg-[var(--color-brand-blue)]/5 text-sm font-medium text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10 transition-colors focus-ring"
                  >
                    <Wand2 className="w-4 h-4" />
                    AI Generate
                    <ProBadge />
                  </a>
                )}
                {apkgError && (
                  <p className="text-xs text-[var(--color-error)]">{apkgError}</p>
                )}
              </div>

              <Modal open={genModalOpen} onClose={() => setGenModalOpen(false)} title="Generate AI Flashcards" size="lg">
                <div className="flex flex-col max-h-[calc(80vh-5rem)]">
                {genSourcesLoading ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Loading sources…</span>
                  </div>
                ) : genStep === 'source' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Choose a source for AI flashcard generation.</p>

                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSourceType === 'missed' ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`}>
                        <input type="radio" name="genSource" checked={genSourceType === 'missed'} onChange={() => setGenSourceType('missed')} className="accent-[var(--color-brand-blue)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">All Missed Questions</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Questions you got wrong across all sessions</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSourceType === 'session' ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`}>
                        <input type="radio" name="genSource" checked={genSourceType === 'session'} onChange={() => setGenSourceType('session')} className="accent-[var(--color-brand-blue)] mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">From Session</p>
                          <p className="text-xs text-[var(--color-text-muted)] mb-2">Incorrect questions from a specific practice/test session</p>
                          {genSourceType === 'session' && genSources && genSources.sessions.length > 0 && (
                            <select value={genSelectedSession ?? ''} onChange={(e) => setGenSelectedSession(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]">
                              <option value="">Select a session…</option>
                              {genSources.sessions.map((s) => (
                                <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} — {s.mode} ({s.incorrect_count} missed{s.accuracy != null ? `, ${Math.round(s.accuracy)}%` : ''})</option>
                              ))}
                            </select>
                          )}
                          {genSourceType === 'session' && genSources && genSources.sessions.length === 0 && (
                            <p className="text-xs text-[var(--color-text-muted)] italic">No completed sessions with incorrect answers.</p>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSourceType === 'section' ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`}>
                        <input type="radio" name="genSource" checked={genSourceType === 'section'} onChange={() => setGenSourceType('section')} className="accent-[var(--color-brand-blue)] mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">Missed by Section</p>
                          <p className="text-xs text-[var(--color-text-muted)] mb-2">Missed questions in a specific section</p>
                          {genSourceType === 'section' && genSources && genSources.sections.length > 0 && (
                            <select value={genSelectedSection ?? ''} onChange={(e) => setGenSelectedSection(e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]">
                              <option value="">Select a section…</option>
                              {genSources.sections.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          )}
                          {genSourceType === 'section' && genSources && genSources.sections.length === 0 && (
                            <p className="text-xs text-[var(--color-text-muted)] italic">No sections with missed questions.</p>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSourceType === 'system' ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`}>
                        <input type="radio" name="genSource" checked={genSourceType === 'system'} onChange={() => setGenSourceType('system')} className="accent-[var(--color-brand-blue)] mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">Missed by System</p>
                          <p className="text-xs text-[var(--color-text-muted)] mb-2">Missed questions by organ system</p>
                          {genSourceType === 'system' && genSources && genSources.systems.length > 0 && (
                            <select value={genSelectedSystem ?? ''} onChange={(e) => setGenSelectedSystem(e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]">
                              <option value="">Select a system…</option>
                              {genSources.systems.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          )}
                          {genSourceType === 'system' && genSources && genSources.systems.length === 0 && (
                            <p className="text-xs text-[var(--color-text-muted)] italic">No systems with missed questions.</p>
                          )}
                        </div>
                      </label>

                      <div className="border-t border-[var(--color-border)] my-1" />
                      <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider px-1">All Questions</p>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSourceType === 'all_section' ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`}>
                        <input type="radio" name="genSource" checked={genSourceType === 'all_section'} onChange={() => setGenSourceType('all_section')} className="accent-[var(--color-brand-blue)] mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">All Questions by Section</p>
                          <p className="text-xs text-[var(--color-text-muted)] mb-2">Generate from any question in a section (not just missed)</p>
                          {genSourceType === 'all_section' && genSources && genSources.all_sections.length > 0 && (
                            <select value={genSelectedSection ?? ''} onChange={(e) => setGenSelectedSection(e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]">
                              <option value="">Select a section…</option>
                              {genSources.all_sections.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSourceType === 'all_system' ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`}>
                        <input type="radio" name="genSource" checked={genSourceType === 'all_system'} onChange={() => setGenSourceType('all_system')} className="accent-[var(--color-brand-blue)] mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">All Questions by System</p>
                          <p className="text-xs text-[var(--color-text-muted)] mb-2">Generate from any question in an organ system (not just missed)</p>
                          {genSourceType === 'all_system' && genSources && genSources.all_systems.length > 0 && (
                            <select value={genSelectedSystem ?? ''} onChange={(e) => setGenSelectedSystem(e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]">
                              <option value="">Select a system…</option>
                              {genSources.all_systems.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          )}
                        </div>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGenStep('deck')}
                        disabled={
                          (genSourceType === 'session' && genSelectedSession == null) ||
                          ((genSourceType === 'section' || genSourceType === 'all_section') && !genSelectedSection) ||
                          ((genSourceType === 'system' || genSourceType === 'all_system') && !genSelectedSystem)
                        }
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring disabled:opacity-50"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : genStep === 'deck' ? (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setGenStep('source')} className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <p className="text-sm text-[var(--color-text-secondary)]">Choose a deck for the generated cards and adjust settings.</p>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Destination deck</label>
                      <select
                        value={genTargetDeckId}
                        onChange={(e) => setGenTargetDeckId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      >
                        <option value="new">+ Create new deck</option>
                        {decks.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.card_count} cards)</option>
                        ))}
                      </select>
                    </div>

                    {genTargetDeckId === 'new' && (
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">New deck name</label>
                        <input
                          type="text"
                          value={genNewDeckName}
                          onChange={(e) => setGenNewDeckName(e.target.value)}
                          placeholder="e.g. Cardiology Review"
                          className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] focus:border-transparent"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Cards per question: {genNumCards}</label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={genNumCards}
                          onChange={(e) => setGenNumCards(Number(e.target.value))}
                          className="w-full accent-[var(--color-brand-blue)]"
                        />
                        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          <span>1</span><span>5</span><span>10</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Max questions: {genQuestionLimit}</label>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          step={5}
                          value={genQuestionLimit}
                          onChange={(e) => setGenQuestionLimit(Number(e.target.value))}
                          className="w-full accent-[var(--color-brand-blue)]"
                        />
                        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          <span>5</span><span>50</span><span>100</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { genTargetDeckRef.current = null; loadGenQuestions(); }}
                        disabled={genQuestionsLoading || (genTargetDeckId === 'new' && !genNewDeckName.trim())}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring disabled:opacity-50"
                      >
                        {genQuestionsLoading ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading…</>
                        ) : (
                          <>Find Questions <ChevronRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col max-h-[calc(80vh-8rem)]">
                    <div className="shrink-0 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGenStep('deck')}
                          className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back
                        </button>
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          {genQuestions.length - genCreated.size > 0
                            ? `${genQuestions.length - genCreated.size} question${genQuestions.length - genCreated.size !== 1 ? 's' : ''} available`
                            : genQuestions.length === 0 ? 'No questions found' : 'All done!'}
                        </span>
                      </div>
                      {genQuestions.length > 0 && (
                        <button
                          type="button"
                          onClick={handleGenerateAll}
                          disabled={genCreated.size >= genQuestions.length || genLoading.size > 0}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg btn-primary text-xs font-medium transition-all focus-ring disabled:opacity-50"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          {genLoading.size > 0 ? 'Generating…' : genCreated.size >= genQuestions.length ? 'All Created' : 'Generate All'}
                        </button>
                      )}
                    </div>
                    {genQuestions.length > 0 && (
                      <p className="text-xs text-[var(--color-text-muted)] mb-3">
                        Adding to: <span className="font-medium text-[var(--color-text-secondary)]">{genTargetDeckId === 'new' ? genNewDeckName.trim() || 'AI Generated' : decks.find((d) => d.id === genTargetDeckId)?.name ?? 'Selected deck'}</span>
                        {' · '}{genNumCards} card{genNumCards !== 1 ? 's' : ''}/question
                      </p>
                    )}
                    {genQuestions.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          No questions without flashcards for this source.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                        {genQuestions.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                {q.question_stem.slice(0, 100)}{q.question_stem.length > 100 ? '…' : ''}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{q.section}{q.system ? ` · ${q.system}` : ''}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerate(q)}
                              disabled={genCreated.has(q.id) || genLoading.has(q.id)}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all focus-ring border ${
                                genCreated.has(q.id)
                                  ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] cursor-default'
                                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              {genLoading.has(q.id) ? 'Generating…' : genCreated.has(q.id) ? 'Created' : 'Generate'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>
              </Modal>

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

              <Modal open={!!deleteConfirmDeck} onClose={() => setDeleteConfirmDeck(null)} title="Delete deck" size="sm">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  Are you sure you want to delete <strong>{deleteConfirmDeck?.name}</strong>?
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mb-5">
                  This will permanently remove all {deleteConfirmDeck?.card_count ?? 0} card{deleteConfirmDeck?.card_count !== 1 ? 's' : ''} in this deck. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmDeck(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] focus-ring"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDeck}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-error)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 focus-ring"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
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
                        {renamingDeckId === deck.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={renameDeckValue}
                            onChange={(e) => setRenameDeckValue(e.target.value)}
                            onBlur={() => handleRenameDeck(deck.id, renameDeckValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameDeck(deck.id, renameDeckValue);
                              if (e.key === 'Escape') setRenamingDeckId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm font-medium text-[var(--color-text-primary)] bg-transparent border-b border-[var(--color-brand-blue)] outline-none py-0.5"
                          />
                        ) : (
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{deck.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--color-text-muted)]">{deck.card_count} card{deck.card_count !== 1 ? 's' : ''}</span>
                          {(deck.new_count > 0 || deck.learning_count > 0 || deck.due_count > 0) && (
                            <span className="flex items-center gap-1.5 text-[10px]">
                              {deck.new_count > 0 && <span className="text-[var(--color-brand-blue)] font-medium">{deck.new_count} new</span>}
                              {deck.learning_count > 0 && <span className="text-[var(--color-warning)] font-medium">{deck.learning_count} learning</span>}
                              {deck.due_count > 0 && <span className="text-[var(--color-success)] font-medium">{deck.due_count} due</span>}
                            </span>
                          )}
                          {deck.description && <span className="text-xs text-[var(--color-text-muted)] truncate hidden sm:inline"> · {deck.description}</span>}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRenamingDeckId(deck.id); setRenameDeckValue(deck.name); }}
                        className="p-2.5 md:p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                        title="Rename deck"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
                        onClick={() => setDeleteConfirmDeck(deck)}
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
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => openCardDetail(card)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="text-sm font-medium text-[var(--color-text-primary)] break-words">
                              {card.front}
                            </p>
                            <p className="text-xs text-[var(--color-text-tertiary)] mt-1 break-words">{card.back}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wider ${
                                card.state === 'new' ? 'bg-blue-500/10 text-blue-500' :
                                card.state === 'learning' || card.state === 'relearning' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-green-500/10 text-green-500'
                              }`}>{card.state}</span>
                              {card.suspended && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wider bg-red-500/10 text-red-500">Suspended</span>}
                              {card.buried && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wider bg-yellow-500/10 text-yellow-500">Buried</span>}
                              {card.flagged && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400">Flagged</span>}
                              {card.interval_days > 0 && <span className="text-[0.6rem] text-[var(--color-text-muted)]">{card.interval_days}d interval</span>}
                            </div>
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openCardDetail(card)}
                              className="p-2.5 md:p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                              title="Edit card details"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review view */}
          {view === 'review' && currentCard && (
            <div className="chiron-mockup max-w-xl mx-auto">
              {/* Header: queue counts + toolbar */}
              <div className="flex items-center justify-between gap-3 mb-2">
                {(fcSettings?.show_remaining_count ?? true) ? (
                  <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
                    {learningCount > 0 && (
                      <span className="text-orange-500">{learningCount}</span>
                    )}
                    {reviewCount > 0 && (
                      <span className="text-green-500">{reviewCount}</span>
                    )}
                    <span className="text-[var(--color-text-muted)]">
                      {queue.length} remaining
                    </span>
                  </div>
                ) : <div />}
                <div className="flex-1 max-w-[10rem] h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-brand-blue)] transition-[width] duration-300 ease-out"
                    style={{ width: `${sessionStats.total > 0 ? (sessionStats.graduated / (sessionStats.graduated + queue.length)) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {(fcSettings?.show_timer ?? false) && (
                    <span className="text-xs tabular-nums text-[var(--color-text-muted)] mr-1">
                      {Math.floor(cardTimerElapsed / 60)}:{String(cardTimerElapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openCardDetail(currentCard, true)}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
                    title="Card details (E)"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleFlag}
                    className={`p-2 rounded-lg transition-colors focus-ring ${
                      currentCard.flagged
                        ? 'text-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                    title="Flag card (F)"
                  >
                    <Flag className="w-4 h-4" fill={currentCard.flagged ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring disabled:opacity-30 disabled:pointer-events-none"
                    title="Undo (Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShortcutHelp((p) => !p)}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
                    title="Shortcuts (?)"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card state badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  currentCard.state === 'new' ? 'bg-blue-500/10 text-blue-500' :
                  currentCard.state === 'learning' ? 'bg-orange-500/10 text-orange-500' :
                  currentCard.state === 'relearning' ? 'bg-red-500/10 text-red-500' :
                  'bg-green-500/10 text-green-500'
                }`}>
                  {currentCard.state}
                </span>
                {(currentCard.state === 'learning' || currentCard.state === 'relearning') && (
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    step {currentCard.learning_step + 1}
                  </span>
                )}
                {currentCard.lapses > 0 && (
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {currentCard.lapses} lapse{currentCard.lapses !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Card content */}
              <div className="py-8 px-2">
                <div
                  key={`card-${currentCard.id}-${sessionStats.total}`}
                  className="flashcard-card-enter min-h-[120px] flex flex-col justify-center"
                >
                  <div className="text-xl font-medium text-[var(--color-text-primary)] leading-relaxed text-center">
                    <FlashcardContent text={currentCard.front} />
                  </div>
                </div>

                {showBack ? (
                  <>
                    <div key="answer" className="flashcard-answer-enter mt-8 pt-6 border-t border-[var(--color-border)]">
                      <div className="text-base text-[var(--color-text-secondary)] leading-relaxed text-center">
                        <FlashcardContent text={currentCard.back} />
                      </div>
                    </div>

                    {/* Rating buttons with interval previews */}
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-8 mb-3 text-center">
                      How well did you know this?
                    </p>
                    <div className="flex justify-center gap-3">
                      {RATING_CONFIG.map((opt) => {
                        const info = intervals?.[opt.label.toLowerCase() as keyof IntervalPreview] as ScheduleInfo | undefined;
                        return (
                          <button
                            key={opt.rating}
                            type="button"
                            onClick={() => handleReviewAnswer(opt.rating)}
                            disabled={reviewBusy}
                            className="flex flex-col items-center gap-0.5 min-w-[5.5rem] px-4 py-3 rounded-xl text-white hover:brightness-110 active:scale-95 focus-ring transition-all disabled:opacity-60"
                            style={{ backgroundColor: opt.color }}
                          >
                            <span className="text-sm font-semibold leading-tight">{opt.label}</span>
                            <span className="text-[11px] font-medium opacity-75 leading-tight">
                              {info ? formatSchedule(info) : intervalsLoading ? '...' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-2.5 tabular-nums">
                      Press <kbd className="font-mono font-semibold">{fcSettings?.hotkey_again ?? '1'}</kbd> <kbd className="font-mono font-semibold">{fcSettings?.hotkey_hard ?? '2'}</kbd> <kbd className="font-mono font-semibold">{fcSettings?.hotkey_good ?? '3'}</kbd> <kbd className="font-mono font-semibold">{fcSettings?.hotkey_easy ?? '4'}</kbd> to rate
                    </p>
                  </>
                ) : (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setShowBack(true)}
                      className="px-6 py-3 rounded-lg btn-primary text-sm font-medium transition-all focus-ring"
                    >
                      Show answer
                      <kbd className="ml-2 text-xs opacity-60 font-mono">{fcSettings?.hotkey_show_answer === 'Space' ? '␣' : (fcSettings?.hotkey_show_answer ?? '␣')}</kbd>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session summary */}
          {view === 'summary' && (
            <div className="chiron-mockup max-w-md mx-auto text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-[var(--color-brand-blue)]/10">
                  <BarChart3 className="w-8 h-8 text-[var(--color-brand-blue)]" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Session Complete</h2>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-2">
                {sessionStats.graduated} card{sessionStats.graduated !== 1 ? 's' : ''} graduated in {Math.max(1, Math.round((Date.now() - sessionStats.startTime) / 60000))} min
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-6">
                {sessionStats.total} total review{sessionStats.total !== 1 ? 's' : ''} (including repetitions)
              </p>

              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'Again', count: sessionStats.again, color: 'var(--color-error)' },
                  { label: 'Hard', count: sessionStats.hard, color: 'var(--color-warning)' },
                  { label: 'Good', count: sessionStats.good, color: 'var(--color-brand-blue)' },
                  { label: 'Easy', count: sessionStats.easy, color: 'var(--color-success)' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
                      {s.count}
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">{s.label}</span>
                  </div>
                ))}
              </div>

              {sessionStats.total > 0 && (
                <div className="h-2 rounded-full overflow-hidden flex mb-8 mx-4">
                  {sessionStats.again > 0 && (
                    <div style={{ width: `${(sessionStats.again / sessionStats.total) * 100}%`, backgroundColor: 'var(--color-error)' }} />
                  )}
                  {sessionStats.hard > 0 && (
                    <div style={{ width: `${(sessionStats.hard / sessionStats.total) * 100}%`, backgroundColor: 'var(--color-warning)' }} />
                  )}
                  {sessionStats.good > 0 && (
                    <div style={{ width: `${(sessionStats.good / sessionStats.total) * 100}%`, backgroundColor: 'var(--color-brand-blue)' }} />
                  )}
                  {sessionStats.easy > 0 && (
                    <div style={{ width: `${(sessionStats.easy / sessionStats.total) * 100}%`, backgroundColor: 'var(--color-success)' }} />
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={finishSession}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Settings view */}
          {view === 'settings' && (() => {
            const s = { ...(fcSettings ?? {}), ...fcDraft } as FlashcardSettingsResponse;
            return (
              <div className="space-y-6 max-w-2xl">
                {/* Scheduling */}
                <div className="chiron-mockup">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">Scheduling</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Daily new cards</label>
                      <input
                        type="number"
                        min={1} max={999}
                        value={s.daily_new_cards}
                        onChange={(e) => updateFcDraft('daily_new_cards', Math.max(1, Math.min(999, Number(e.target.value))))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Daily review limit</label>
                      <input
                        type="number"
                        min={1} max={9999}
                        value={s.daily_review_limit}
                        onChange={(e) => updateFcDraft('daily_review_limit', Math.max(1, Math.min(9999, Number(e.target.value))))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Learning steps (minutes)</label>
                      <input
                        type="text"
                        value={s.learning_steps}
                        onChange={(e) => updateFcDraft('learning_steps', e.target.value)}
                        placeholder="1, 10"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      />
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Comma-separated, e.g. 1, 10</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Relearning steps (minutes)</label>
                      <input
                        type="text"
                        value={s.relearning_steps}
                        onChange={(e) => updateFcDraft('relearning_steps', e.target.value)}
                        placeholder="10"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      />
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Comma-separated, e.g. 10</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Desired retention: {Math.round((s.desired_retention ?? 0.9) * 100)}%
                      </label>
                      <input
                        type="range"
                        min={70} max={99}
                        value={Math.round((s.desired_retention ?? 0.9) * 100)}
                        onChange={(e) => updateFcDraft('desired_retention', Number(e.target.value) / 100)}
                        className="w-full accent-[var(--color-brand-blue)]"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                        <span>70%</span>
                        <span>More reviews, better recall</span>
                        <span>99%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Maximum interval (days)</label>
                      <input
                        type="number"
                        min={1} max={3650}
                        value={s.max_interval_days}
                        onChange={(e) => updateFcDraft('max_interval_days', Math.max(1, Math.min(3650, Number(e.target.value))))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">New card order</label>
                      <select
                        value={s.new_card_order}
                        onChange={(e) => updateFcDraft('new_card_order', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
                      >
                        <option value="sequential">Sequential</option>
                        <option value="random">Random</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Display */}
                <div className="chiron-mockup">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">Display</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'show_remaining_count', label: 'Show remaining card count', value: s.show_remaining_count },
                      { key: 'show_timer', label: 'Show per-card timer', value: s.show_timer },
                      { key: 'auto_advance', label: 'Auto-advance after rating', value: s.auto_advance },
                    ].map((toggle) => (
                      <div key={toggle.key} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--color-text-secondary)]">{toggle.label}</span>
                        <button
                          type="button"
                          onClick={() => updateFcDraft(toggle.key, !toggle.value)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${toggle.value ? 'bg-[var(--color-brand-blue)]' : 'bg-[var(--color-bg-tertiary)]'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${toggle.value ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hotkeys */}
                <div className="chiron-mockup">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">Hotkeys</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'hotkey_show_answer', label: 'Show answer' },
                      { key: 'hotkey_again', label: 'Again' },
                      { key: 'hotkey_hard', label: 'Hard' },
                      { key: 'hotkey_good', label: 'Good' },
                      { key: 'hotkey_easy', label: 'Easy' },
                      { key: 'hotkey_flag', label: 'Flag' },
                      { key: 'hotkey_undo', label: 'Undo' },
                    ].map((hk) => (
                      <div key={hk.key} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-[var(--color-text-secondary)]">{hk.label}</span>
                        <button
                          type="button"
                          onClick={() => setFcCapturingKey(hk.key)}
                          onKeyDown={(e) => {
                            if (fcCapturingKey !== hk.key) return;
                            e.preventDefault();
                            const key = e.code === 'Space' ? 'Space' : e.key.length === 1 ? e.key : e.key;
                            updateFcDraft(hk.key, key);
                            setFcCapturingKey(null);
                          }}
                          onBlur={() => { if (fcCapturingKey === hk.key) setFcCapturingKey(null); }}
                          className={`inline-flex items-center justify-center min-w-[3rem] h-8 px-3 rounded-md border text-xs font-mono font-medium transition-all ${
                            fcCapturingKey === hk.key
                              ? 'border-[var(--color-brand-blue)] ring-2 ring-[var(--color-brand-blue)]/30 bg-[var(--color-brand-blue)]/5 text-[var(--color-brand-blue)]'
                              : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
                          }`}
                        >
                          {fcCapturingKey === hk.key
                            ? 'Press…'
                            : (s as unknown as Record<string, string>)[hk.key] === 'Space'
                              ? '␣'
                              : (s as unknown as Record<string, string>)[hk.key]}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save / Reset */}
                {Object.keys(fcDraft).length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveFcSettings}
                      disabled={fcSettingsSaving}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring"
                    >
                      {fcSettingsSaving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFcDraft({})}
                      className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Card detail modal */}
          <Modal open={!!detailCard} onClose={() => setDetailCard(null)} title="Card Details" size="lg">
            {detailCard && (
              <div className="space-y-5 max-h-[calc(80vh-5rem)] overflow-y-auto">
                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Content</h4>
                    <button
                      type="button"
                      onClick={() => { setDetailEditingContent(!detailEditingContent); setDetailFront(detailCard.front); setDetailBack(detailCard.back); }}
                      className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      {detailEditingContent ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {detailEditingContent ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Front</label>
                        <textarea
                          value={detailFront}
                          onChange={(e) => setDetailFront(e.target.value)}
                          rows={3}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] resize-y"
                        />
                      </div>
                      <div>
                        <label className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Back</label>
                        <textarea
                          value={detailBack}
                          onChange={(e) => setDetailBack(e.target.value)}
                          rows={3}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] resize-y"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-2">
                      <div>
                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Front</span>
                        <FlashcardContent text={detailCard.front} className="text-sm text-[var(--color-text-primary)] mt-0.5" />
                      </div>
                      <hr className="border-[var(--color-border)]" />
                      <div>
                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Back</span>
                        <FlashcardContent text={detailCard.back} className="text-sm text-[var(--color-text-primary)] mt-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                    <StickyNote className="w-3.5 h-3.5" /> Notes
                  </label>
                  <textarea
                    value={detailNotes}
                    onChange={(e) => setDetailNotes(e.target.value)}
                    placeholder="Add personal notes or mnemonics..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] resize-y"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                    <Tag className="w-3.5 h-3.5" /> Tags
                  </label>
                  <input
                    type="text"
                    value={detailTags}
                    onChange={(e) => setDetailTags(e.target.value)}
                    placeholder="Comma-separated, e.g. cardiology, murmurs"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  />
                </div>

                {/* Save notes/tags */}
                {(detailNotes !== (detailCard.notes ?? '') || detailTags !== (detailCard.tags ?? '') || detailFront !== detailCard.front || detailBack !== detailCard.back) && (
                  <button
                    type="button"
                    onClick={handleDetailSave}
                    disabled={detailSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary text-sm font-medium transition-all focus-ring"
                  >
                    <Check className="w-4 h-4" />
                    {detailSaving ? 'Saving...' : 'Save changes'}
                  </button>
                )}

                {/* Scheduling info */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                    <Info className="w-3.5 h-3.5" /> Scheduling
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'State', value: detailCard.state },
                      { label: 'Interval', value: `${detailCard.interval_days}d` },
                      { label: 'Stability', value: detailCard.stability.toFixed(2) },
                      { label: 'Difficulty', value: detailCard.difficulty.toFixed(2) },
                      { label: 'Ease', value: detailCard.ease_factor.toFixed(2) },
                      { label: 'Repetitions', value: String(detailCard.repetitions) },
                      { label: 'Lapses', value: String(detailCard.lapses) },
                      { label: 'Step', value: String(detailCard.learning_step) },
                      { label: 'Next review', value: detailCard.next_review ? new Date(detailCard.next_review).toLocaleDateString() : 'N/A' },
                      { label: 'Last review', value: detailCard.last_review ? new Date(detailCard.last_review).toLocaleDateString() : 'N/A' },
                      { label: 'Created', value: new Date(detailCard.created_at).toLocaleDateString() },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
                        <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{item.label}</p>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCardAction(detailCard.id, detailCard.suspended ? 'unsuspend' : 'suspend')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors focus-ring ${
                        detailCard.suspended
                          ? 'border-green-500/30 bg-green-500/5 text-green-600 hover:bg-green-500/10'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      {detailCard.suspended ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {detailCard.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCardAction(detailCard.id, 'bury')}
                      disabled={detailCard.buried}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring disabled:opacity-50"
                    >
                      <Archive className="w-4 h-4" />
                      {detailCard.buried ? 'Buried' : 'Bury'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCardAction(detailCard.id, detailCard.flagged ? 'unflag' : 'flag')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors focus-ring ${
                        detailCard.flagged
                          ? 'border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      {detailCard.flagged ? 'Unflag' : 'Flag'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleDeleteCard(detailCard.id);
                        setDetailCard(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-error)]/30 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/5 transition-colors focus-ring"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Keyboard shortcut help overlay */}
          <Modal open={showShortcutHelp} onClose={() => setShowShortcutHelp(false)} title="Keyboard Shortcuts" size="sm">
            <div className="space-y-3">
              {[
                { keys: [fcSettings?.hotkey_show_answer ?? 'Space', 'Enter'], desc: 'Show answer' },
                { keys: [fcSettings?.hotkey_again ?? '1'], desc: 'Again' },
                { keys: [fcSettings?.hotkey_hard ?? '2'], desc: 'Hard' },
                { keys: [fcSettings?.hotkey_good ?? '3'], desc: 'Good' },
                { keys: [fcSettings?.hotkey_easy ?? '4'], desc: 'Easy' },
                { keys: [fcSettings?.hotkey_flag ?? 'f'], desc: 'Flag / unflag card' },
                { keys: ['e'], desc: 'Card details / edit' },
                { keys: [fcSettings?.hotkey_undo ?? 'z'], desc: 'Undo last review' },
                { keys: ['?'], desc: 'Toggle this help' },
              ].map((s) => (
                <div key={s.desc} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">{s.desc}</span>
                  <div className="flex items-center gap-1.5">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-xs font-mono font-medium text-[var(--color-text-primary)]"
                      >
                        {k === 'Space' ? '␣' : k.toUpperCase()}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        </div>
      </section>
    </div>
  );
}
