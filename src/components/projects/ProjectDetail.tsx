import { useMemo, useState, useRef } from 'react';
import { Database } from 'sql.js';
import { Project } from '../../types';
import { getProjectStats, getProjectTodos, getProjectNotes } from '../../db/database';

interface ProjectDetailProps {
  db: Database;
  project: Project;
  onUpdate: (name: string, description: string) => void;
}

function extractTitle(content: string): string {
  return content.split('\n')[0].replace(/^#+\s*/, '') || 'Unbenannt';
}

export function ProjectDetail({ db, project, onUpdate }: ProjectDetailProps) {
  const stats = useMemo(() => getProjectStats(db, project.id), [db, project.id]);
  const todos = useMemo(() => getProjectTodos(db, project.id), [db, project.id]);
  const notes = useMemo(() => getProjectNotes(db, project.id), [db, project.id]);

  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [draftName, setDraftName] = useState(project.name);
  const [draftDescription, setDraftDescription] = useState(project.description);
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const openPct = stats.total > 0 ? (stats.open / stats.total) * 100 : 0;
  const progressPct = stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0;
  const donePct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  function startEditing(field: 'name' | 'description') {
    setDraftName(project.name);
    setDraftDescription(project.description);
    setEditingField(field);
    setTimeout(() => {
      if (field === 'name') nameRef.current?.select();
      else descRef.current?.select();
    }, 0);
  }

  function save() {
    const name = draftName.trim() || project.name;
    onUpdate(name, draftDescription);
    setEditingField(null);
  }

  function cancel() {
    setDraftName(project.name);
    setDraftDescription(project.description);
    setEditingField(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, field: 'name' | 'description') {
    if (e.key === 'Escape') { cancel(); return; }
    if (e.key === 'Enter' && field === 'name') { e.preventDefault(); save(); }
  }

  return (
    <div className="project-detail">
      {editingField === 'name' ? (
        <input
          ref={nameRef}
          className="editable-input editable-title"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => handleKeyDown(e, 'name')}
        />
      ) : (
        <h2
          className="editable-field"
          onClick={() => startEditing('name')}
          title="Klicken zum Bearbeiten"
        >
          {project.name}
        </h2>
      )}

      {editingField === 'description' ? (
        <textarea
          ref={descRef}
          className="editable-input editable-description"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => handleKeyDown(e, 'description')}
          rows={3}
        />
      ) : (
        <p
          className={`project-description editable-field${!project.description ? ' editable-placeholder' : ''}`}
          onClick={() => startEditing('description')}
          title="Klicken zum Bearbeiten"
        >
          {project.description || 'Beschreibung hinzufügen…'}
        </p>
      )}

      {stats.total > 0 && (
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-done" style={{ width: `${donePct}%` }} title={`Done: ${stats.done}`} />
            <div className="progress-in-progress" style={{ width: `${progressPct}%` }} title={`In Progress: ${stats.inProgress}`} />
            <div className="progress-open" style={{ width: `${openPct}%` }} title={`Open: ${stats.open}`} />
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
              <li key={t.id} className={`link-item status-${t.status}`}>
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
              <li key={n.id} className="link-item">
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
