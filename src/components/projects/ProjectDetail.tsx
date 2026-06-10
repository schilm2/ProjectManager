import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'sql.js';
import { Project, ProjectUpdate } from '../../types';
import { getProjectStats, getProjectTodos, getProjectNotes } from '../../db/database';
import { RichTextarea } from '../ui/RichTextarea';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface ProjectDetailProps {
  db: Database;
  project: Project;
  onUpdate: (update: ProjectUpdate) => void;
}

function extractTitle(content: string): string {
  return content.split('\n')[0].replace(/^#+\s*/, '') || 'Unbenannt';
}

type EditableField = 'name' | 'description';

export function ProjectDetail({ db, project, onUpdate }: ProjectDetailProps) {
  const navigate = useNavigate();
  const stats = useMemo(() => getProjectStats(db, project.id), [db, project.id]);
  const todos = useMemo(() => getProjectTodos(db, project.id), [db, project.id]);
  const notes = useMemo(() => getProjectNotes(db, project.id), [db, project.id]);

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState<ProjectUpdate>({ name: project.name, description: project.description });

  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const nameTriggerRef = useRef<HTMLButtonElement>(null);
  const descTriggerRef = useRef<HTMLButtonElement>(null);

  const openPct = stats.total > 0 ? (stats.open / stats.total) * 100 : 0;
  const progressPct = stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0;
  const donePct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  function startEditing(field: EditableField) {
    setDraft({ name: project.name, description: project.description });
    setEditingField(field);
    setTimeout(() => {
      if (field === 'name') { nameRef.current?.focus(); nameRef.current?.select(); }
      else { descRef.current?.focus(); descRef.current?.select(); }
    }, 0);
  }

  function save() {
    const name = draft.name.trim() || project.name;
    const description = draft.description;
    if (name === project.name && description === project.description) {
      setEditingField(null);
      return;
    }
    try {
      onUpdate({ name, description });
    } catch (err) {
      console.error('Failed to update project', err);
    }
    setEditingField(null);
  }

  function cancel() {
    setDraft({ name: project.name, description: project.description });
    setEditingField(null);
  }

  function returnFocus(field: EditableField | null) {
    setTimeout(() => {
      if (field === 'name') nameTriggerRef.current?.focus();
      else if (field === 'description') descTriggerRef.current?.focus();
    }, 0);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const panel = e.currentTarget.closest('.project-detail');
    if (panel?.contains(e.relatedTarget as Node)) return;
    save();
  }

  return (
    <div className="project-detail">
      {editingField === 'name' ? (
        <input
          ref={nameRef}
          aria-label="Projektname"
          className="editable-input editable-title"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { const f = editingField; cancel(); returnFocus(f); return; }
            if (e.key === 'Enter') { e.preventDefault(); const f = editingField; save(); returnFocus(f); }
          }}
        />
      ) : (
        <button
          ref={nameTriggerRef}
          className="editable-field editable-trigger"
          onClick={() => startEditing('name')}
          aria-label={`Projektname bearbeiten: ${project.name}`}
        >
          <h2>{project.name}</h2>
        </button>
      )}

      {editingField === 'description' ? (
        <RichTextarea
          ref={descRef}
          aria-label="Beschreibung"
          className="editable-input editable-description"
          value={draft.description}
          onChange={(description) => setDraft({ ...draft, description })}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { const f = editingField; cancel(); returnFocus(f); }
          }}
          rows={8}
        />
      ) : (
        <button
          ref={descTriggerRef}
          className={`editable-field editable-trigger${!project.description ? ' editable-placeholder' : ''}`}
          onClick={() => startEditing('description')}
          aria-label={project.description ? `Beschreibung bearbeiten` : 'Beschreibung hinzufügen'}
        >
          {project.description ? (
            <div className="project-description project-description-md">
              <MarkdownRenderer>{project.description}</MarkdownRenderer>
            </div>
          ) : (
            <p className="project-description">Beschreibung hinzufügen…</p>
          )}
        </button>
      )}

      {stats.total > 0 && (
        <div className="progress-section">
          <div
            className="progress-bar"
            role="img"
            aria-label={`Fortschritt: ${stats.done} erledigt, ${stats.inProgress} in Bearbeitung, ${stats.open} offen`}
          >
            <div className="progress-done" style={{ width: `${donePct}%` }} />
            <div className="progress-in-progress" style={{ width: `${progressPct}%` }} />
            <div className="progress-open" style={{ width: `${openPct}%` }} />
          </div>
          <div className="progress-labels">
            <span className="label-done">{stats.done} Done ({Math.round(donePct)}%)</span>
            <span className="label-progress">{stats.inProgress} In Progress ({Math.round(progressPct)}%)</span>
            <span className="label-open">{stats.open} Open ({Math.round(openPct)}%)</span>
          </div>
        </div>
      )}

      <div className="project-links">
        <h4>ToDos ({todos.length})</h4>
        {todos.length > 0 ? (
          <ul className="link-list">
            {todos.map((t) => (
              <li
                key={t.id}
                className={`link-item status-${t.status} link-item-clickable`}
                onClick={() => navigate('/', { state: { editTodoId: t.id } })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/', { state: { editTodoId: t.id } }); }}
              >
                <span className={`priority-dot priority-${t.priority}`} />
                <span>{t.name}</span>
                <span className="status-label">{t.status.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-hint">Keine ToDos verknüpft</p>
        )}
      </div>

      <div className="project-links">
        <h4>Notizen ({notes.length})</h4>
        {notes.length > 0 ? (
          <ul className="link-list">
            {notes.map((n) => (
              <li
                key={n.id}
                className="link-item link-item-clickable"
                onClick={() => navigate('/notes', { state: { selectedNoteId: n.id } })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/notes', { state: { selectedNoteId: n.id } }); }}
              >
                <span>{extractTitle(n.content)}</span>
                <span className="note-date">{new Date(n.createdAt).toLocaleDateString('de-DE')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-hint">Keine Notizen verknüpft</p>
        )}
      </div>
    </div>
  );
}
