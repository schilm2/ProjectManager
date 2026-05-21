import { useState } from 'react';
import { Todo, Project, Contact } from '../../types';
import { MultiSelect } from '../common/MultiSelect';

interface TodoDialogProps {
  todo: Todo | null;
  projects: Project[];
  contacts: Contact[];
  initialProjects: string[];
  initialContacts: string[];
  onSave: (name: string, priority: Todo['priority'], projectIds: string[], contactIds: string[]) => void;
  onCancel: () => void;
}

export function TodoDialog({ todo, projects, contacts, initialProjects, initialContacts, onSave, onCancel }: TodoDialogProps) {
  const [name, setName] = useState(todo?.name ?? '');
  const [priority, setPriority] = useState<Todo['priority']>(todo?.priority ?? 'normal');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialProjects);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(initialContacts);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), priority, selectedProjects, selectedContacts);
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{todo ? 'ToDo bearbeiten' : 'Neues ToDo'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="todo-name">Name *</label>
            <input
              id="todo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
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
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              selected={selectedProjects}
              onChange={setSelectedProjects}
              placeholder="Projekte auswählen..."
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
