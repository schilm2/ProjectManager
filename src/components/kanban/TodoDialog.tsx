import { useState, useEffect } from 'react';
import { Todo, Project, Contact } from '../../types';
import { MultiSelect } from '../common/MultiSelect';
import { RichTextarea } from '../ui/RichTextarea';

interface TodoDialogProps {
  todo: Todo | null;
  projects: Project[];
  contacts: Contact[];
  initialProjects: string[];
  initialContacts: string[];
  onSave: (name: string, priority: Todo['priority'], projectIds: string[], contactIds: string[], description: string) => void;
  onCancel: () => void;
  onCreateProject?: (name: string) => Project;
}

export function TodoDialog({ todo, projects, contacts, initialProjects, initialContacts, onSave, onCancel, onCreateProject }: TodoDialogProps) {
  const [name, setName] = useState(todo?.name ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [priority, setPriority] = useState<Todo['priority']>(todo?.priority ?? 'normal');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialProjects);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(initialContacts);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  function handleCreateProject(projectName: string) {
    if (!onCreateProject) return;
    const created = onCreateProject(projectName);
    setLocalProjects((prev) => [...prev, created]);
    setSelectedProjects((prev) => [...prev, created.id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name ist erforderlich');
      return;
    }
    setError('');
    onSave(name.trim(), priority, selectedProjects, selectedContacts, description);
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{todo ? 'ToDo bearbeiten' : 'Neues ToDo'}</h3>
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="todo-name">Name *</label>
            <input
              id="todo-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoFocus
              required
              className={error ? 'input-error' : ''}
            />
          </div>
          <div className="form-group">
            <label htmlFor="todo-description">Beschreibung</label>
            <RichTextarea
              id="todo-description"
              value={description}
              onChange={setDescription}
              rows={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="todo-priority">Priorität</label>
            <select
              id="todo-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Todo['priority'])}
            >
              <option value="critical">Kritisch</option>
              <option value="high">Hoch</option>
              <option value="normal">Normal</option>
              <option value="low">Niedrig</option>
            </select>
          </div>
          <div className="form-group">
            <label>Projekte</label>
            <MultiSelect
              options={localProjects.map((p) => ({ value: p.id, label: p.name }))}
              selected={selectedProjects}
              onChange={setSelectedProjects}
              placeholder="Projekte auswählen..."
              onCreateOption={onCreateProject ? handleCreateProject : undefined}
              createOptionLabel="+ Neues Projekt"
            />
          </div>
          <div className="form-group">
            <label>Personen</label>
            <MultiSelect
              options={contacts.map((c) => ({ value: c.id, label: c.name }))}
              selected={selectedContacts}
              onChange={setSelectedContacts}
              placeholder="Personen auswählen..."
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
            <button type="submit" className="btn btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
}
