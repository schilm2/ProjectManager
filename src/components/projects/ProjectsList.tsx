import { useState, useEffect } from 'react';
import { Database } from 'sql.js';
import { Project, Todo } from '../../types';
import { createProject, deleteProject, updateProjectStatus, markProjectTodosDone, getOpenTodosForProject } from '../../db/database';
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';
import { DeleteConfirmDialog } from '../ui/DeleteConfirmDialog';

interface ProjectsListProps {
  db: Database;
  projects: Project[];
  onRefresh: () => void;
  onSelect: (project: Project) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  autoCreate?: boolean;
}

export function ProjectsList({ db, projects, onRefresh, onSelect, onDelete, selectedId, autoCreate }: ProjectsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [archivingProject, setArchivingProject] = useState<{ project: Project; openTodos: Todo[] } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (autoCreate) {
      setShowForm(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [autoCreate]);

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
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteProject(db, deletingId);
    onRefresh();
    onDelete(deletingId);
    setDeletingId(null);
  }

  function handleStatusToggle(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    if (project.status === 'active') {
      const openTodos = getOpenTodosForProject(db, project.id);
      setArchivingProject({ project, openTodos });
    } else {
      updateProjectStatus(db, project.id, 'active');
      onRefresh();
    }
  }

  function handleArchiveConfirm() {
    if (!archivingProject) return;
    markProjectTodosDone(db, archivingProject.project.id);
    updateProjectStatus(db, archivingProject.project.id, 'archive');
    setArchivingProject(null);
    onRefresh();
  }

  const active = projects.filter((p) => p.status !== 'archive');
  const archived = projects.filter((p) => p.status === 'archive');

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
        {active.map((p) => (
          <li
            key={p.id}
            className={`entity-item ${selectedId === p.id ? 'active' : ''}`}
            onClick={() => onSelect(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p); }}
          >
            <div className="entity-item-info">
              <span className="entity-item-name">{p.name}</span>
              <span className="status-pill status-pill-active">aktiv</span>
            </div>
            <div className="entity-item-actions">
              <button
                className="btn-icon btn-archive"
                onClick={(e) => handleStatusToggle(e, p)}
                aria-label="Archivieren"
                title="Archivieren"
              >⊘</button>
              <button className="btn-icon btn-danger" onClick={(e) => handleDelete(e, p.id)} aria-label="Löschen">&times;</button>
            </div>
          </li>
        ))}
        {active.length === 0 && archived.length === 0 && (
          <li className="empty-state">Noch keine Projekte</li>
        )}
      </ul>
      {archived.length > 0 && (
        <>
          <div className="archive-section-header">Archiviert</div>
          <ul className="entity-items">
            {archived.map((p) => (
              <li
                key={p.id}
                className={`entity-item entity-item-archived ${selectedId === p.id ? 'active' : ''}`}
                onClick={() => onSelect(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p); }}
              >
                <span className="entity-item-name">{p.name}</span>
                <div className="entity-item-actions">
                  <button
                    className="btn-icon btn-unarchive"
                    onClick={(e) => handleStatusToggle(e, p)}
                    aria-label="Reaktivieren"
                    title="Reaktivieren"
                  >↩</button>
                  <button className="btn-icon btn-danger" onClick={(e) => handleDelete(e, p.id)} aria-label="Löschen">&times;</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {archivingProject && (
        <ArchiveConfirmDialog
          projectName={archivingProject.project.name}
          openTodos={archivingProject.openTodos}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchivingProject(null)}
        />
      )}
      {deletingId && (
        <DeleteConfirmDialog
          itemName={projects.find((p) => p.id === deletingId)?.name ?? 'Projekt'}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
