import { useState, useEffect } from 'react';
import { notesAPI } from '@/utils/api';
import NoteItem from './NoteItem';

export default function NotesSection({ projectId, isAdminView = false }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [projectId]);

  // Scroll to top when edit modal opens
  useEffect(() => {
    if (showAddNote || editingNote) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Also prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddNote, editingNote]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await notesAPI.getProjectNotes(projectId);
      setNotes(data.notes);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNote = (noteId) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const noteData = {
        title: formData.get('title'),
        content: formData.get('content'),
        isMarkdown: formData.get('isMarkdown') === 'on',
      };

      if (editingNote) {
        await notesAPI.updateNote(editingNote.id, noteData);
      } else {
        noteData.projectId = projectId;
        await notesAPI.createNote(noteData);
      }

      setShowAddNote(false);
      setEditingNote(null);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note and all its attachments?')) return;

    try {
      await notesAPI.deleteNote(noteId);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await notesAPI.deleteAttachment(attachmentId);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-3 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-5 h-5 text-gray-400 transition-transform duration-200"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            📝 Project Notes
            <span className="text-sm text-gray-400 font-normal">({notes.length})</span>
          </h3>
        </button>
        {isAdminView && !isCollapsed && (
          <button
            onClick={() => setShowAddNote(true)}
            className="text-sm px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            + Add Note
          </button>
        )}
      </div>

      {/* Notes List */}
      {!isCollapsed && (
        notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isAdminView={isAdminView}
                expanded={expandedNotes.has(note.id)}
                onToggle={() => toggleNote(note.id)}
                onEdit={setEditingNote}
                onDelete={handleDeleteNote}
                onDeleteAttachment={handleDeleteAttachment}
                onUploadComplete={loadNotes}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">📝</p>
            <p className="text-sm">No notes yet</p>
            {isAdminView && (
              <button
                onClick={() => setShowAddNote(true)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Create your first note
              </button>
            )}
          </div>
        )
      )}

      {/* Add/Edit Note Modal */}
      {(showAddNote || editingNote) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddNote(false);
              setEditingNote(null);
            }
          }}
        >
          <div
            className="glass-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingNote ? 'Edit Note' : 'Add Note'}
            </h3>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingNote?.title}
                  required
                  className="input-field"
                  placeholder="Meeting notes, requirements, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Content *
                  <span className="text-xs text-gray-500 ml-2 font-normal">
                    (Paste from Notion, Markdown files, or type directly)
                  </span>
                </label>
                <textarea
                  name="content"
                  defaultValue={editingNote?.content}
                  required
                  rows={12}
                  className="input-field resize-none font-mono text-sm"
                  placeholder="Paste your notes from Notion or type markdown...

**Bold text**
*Italic text*

- List item 1
- List item 2

1. Numbered item
2. Another item

[Link](https://example.com)

```javascript
code block
```

> Quote

✨ Emojis work too! 🎉 🚀

Line breaks are preserved automatically!"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isMarkdown"
                  id="isMarkdown"
                  defaultChecked={editingNote?.is_markdown ?? true}
                  className="rounded border-gray-600 bg-slate-800 text-primary focus:ring-primary"
                />
                <label htmlFor="isMarkdown" className="text-sm text-gray-300">
                  Enable markdown formatting
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(false);
                    setEditingNote(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
