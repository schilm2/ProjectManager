import { useState } from 'react';
import { Database } from 'sql.js';
import { Project } from '../../types';
import { createProject, deleteProject } from '../../db/database';

interface ProjectsListProps {
  db: Database;
  projects: Project[];
  onRefresh: () => void;
  onSelect: (project: Project) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

export function ProjectsList({ db, projects, onRefresh, onSelect, onDelete, selectedId }: ProjectsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject(db, name.trim(), description.trim());
    onRefresh();
    setName('');
    setDescription('');
    setShowForm(false);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteProject(db, id);
    onRefresh();
    onDelete(id);
  }

  return (
    <div className="projects-list">
      <div className="list-header">
        <h3>Projekte</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Neues Projekt</button>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Projektname *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <textarea
            placeholder="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="inline-form-actions">
            <button type="submit" className="btn btn-primary">Erstellen</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      )}
      <ul className="entity-items">
        {projects.map((p) => (
          <li
            key={p.id}
            className={`entity-item ${selectedId === p.id ? 'active' : ''}`}
            onClick={() => onSelect(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p); }}
          >
            <span className="entity-item-name">{p.name}</span>
            <button className="btn-icon btn-danger" onClick={(e) => handleDelete(e, p.id)} aria-label="Löschen">&times;</button>
          </li>
        ))}
        {projects.length === 0 && <li className="empty-state">Noch keine Projekte</li>}
      </ul>
    </div>
  );
}
