import { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, X, Save } from 'lucide-react';
import { api } from '../api/api';
import type { NoteResponse } from '../api/types';
import { EmptyState } from '../components/common';

export function Notes() {
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.notes.list()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const note = await api.notes.create({ title: 'Untitled Note', content: '' });
      setNotes((prev) => [note, ...prev]);
      setEditingId(note.id);
      setEditTitle(note.title);
      setEditContent(note.content);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (editingId == null) return;
    const updated = await api.notes.update(editingId, { title: editTitle, content: editContent });
    setNotes((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    await api.notes.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (note: NoteResponse) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chiron-dash min-h-screen">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="chiron-feature-label">Tools</p>
              <h1 className="chiron-feature-heading">Notes</h1>
              <p className="chiron-feature-body mt-2">Personal notes for topics, questions, or anything you need to remember.</p>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>

          <div className="grid md:grid-cols-[280px_1fr] gap-6">
            {/* Notes list sidebar */}
            <div className="chiron-mockup overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <p className="chiron-mockup-label mb-3">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-[var(--color-bg-tertiary)] animate-pulse" />
                  ))}
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)] py-4 text-center">
                  No notes yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-1">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => startEdit(note)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                        editingId === note.id
                          ? 'bg-[var(--color-bg-active)] text-[var(--color-accent-text)]'
                          : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <p className="text-sm font-medium truncate">{note.title || 'Untitled'}</p>
                      <p className="text-[0.68rem] text-[var(--color-text-muted)] mt-0.5">
                        {formatDate(note.updated_at)}
                        {note.section && <> &middot; {note.section}</>}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Editor panel */}
            <div className="chiron-mockup min-h-[50vh] flex flex-col">
              {editingId != null ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title"
                      className="flex-1 text-lg font-semibold font-display bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-brand-blue)] text-white text-xs font-medium hover:opacity-90"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(editingId)}
                      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start writing..."
                    className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] leading-relaxed"
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={FileText}
                    title="Select a note"
                    description="Choose a note from the sidebar or create a new one."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
