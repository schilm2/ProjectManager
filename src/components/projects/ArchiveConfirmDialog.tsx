import { Todo } from '../../types';

interface ArchiveConfirmDialogProps {
  projectName: string;
  openTodos: Todo[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ArchiveConfirmDialog({ projectName, openTodos, onConfirm, onCancel }: ArchiveConfirmDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Projekt archivieren</h3>
        <p className="archive-confirm-intro">
          Möchtest du <strong>{projectName}</strong> wirklich archivieren?
        </p>
        {openTodos.length > 0 ? (
          <>
            <p className="archive-confirm-warning">
              Die folgenden {openTodos.length} offenen {openTodos.length === 1 ? 'ToDo wird' : 'ToDos werden'} als <strong>erledigt</strong> markiert:
            </p>
            <ul className="archive-todo-list">
              {openTodos.map((t) => (
                <li key={t.id} className="archive-todo-item">
                  <span className={`priority-dot priority-${t.priority}`} />
                  <span>{t.name}</span>
                  <span className="status-label">{t.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="archive-confirm-no-todos">Alle ToDos sind bereits erledigt.</p>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>Archivieren</button>
        </div>
      </div>
    </div>
  );
}
