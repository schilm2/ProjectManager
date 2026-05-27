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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
      <div className="projects-table-header">
        <span>Name</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Created</span>
      </div>
      <div className="entity-items">
        {active.map((p, idx) => (
          <div
            key={p.id}
            className={`project-table-row card-enter ${selectedId === p.id ? 'active' : ''}`}
            onClick={() => onSelect(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p); }}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <span className="project-table-name">{p.name}</span>
            <span className="status-pill status-pill-active">aktiv</span>
            <span className="project-table-priority priority-active">--</span>
            <span className="project-table-date">{formatDate(p.createdAt)}</span>
          </div>
        ))}
        {active.length === 0 && archived.length === 0 && (
          <div className="empty-state">Noch keine Projekte</div>
        )}
      </div>
      {archived.length > 0 && (
        <>
          <div className="archive-section-header">Archiviert</div>
          <div className="entity-items">
            {archived.map((p, idx) => (
              <div
                key={p.id}
                className={`project-table-row card-enter ${selectedId === p.id ? 'active' : ''}`}
                onClick={() => onSelect(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p); }}
                style={{ animationDelay: `${idx * 0.05}s`, opacity: 0.6 }}
              >
                <span className="project-table-name" style={{ textDecoration: 'line-through' }}>{p.name}</span>
                <span className="status-pill status-pill-archive">archiv</span>
                <span className="project-table-priority priority-archive">--</span>
                <span className="project-table-date">{formatDate(p.createdAt)}</span>
              </div>
            ))}
          </div>
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
