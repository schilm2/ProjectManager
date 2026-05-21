import { useMemo } from 'react';
import { Database } from 'sql.js';
import { Contact } from '../../types';
import { getContactTodos, getContactNotes } from '../../db/database';

interface ContactDetailProps {
  db: Database;
  contact: Contact;
}

function extractTitle(content: string): string {
  return content.split('\n')[0].replace(/^#+\s*/, '') || 'Unbenannt';
}

export function ContactDetail({ db, contact }: ContactDetailProps) {
  const todos = useMemo(() => getContactTodos(db, contact.id), [db, contact.id]);
  const notes = useMemo(() => getContactNotes(db, contact.id), [db, contact.id]);

  return (
    <div className="contact-detail">
      <h2>{contact.name}</h2>
      {contact.nickname && <p className="contact-nickname">"{contact.nickname}"</p>}

      <div className="contact-info">
        {contact.email && (
          <div className="info-row">
            <span className="info-label">E-Mail:</span>
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="info-row">
            <span className="info-label">Telefon:</span>
            <span>{contact.phone}</span>
          </div>
        )}
      </div>

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
