import { useMemo, useState, useRef } from 'react';
import { Database } from 'sql.js';
import { Contact } from '../../types';
import { getContactTodos, getContactNotes } from '../../db/database';

interface ContactDetailProps {
  db: Database;
  contact: Contact;
  onUpdate: (name: string, nickname: string, email: string, phone: string) => void;
}

function extractTitle(content: string): string {
  return content.split('\n')[0].replace(/^#+\s*/, '') || 'Unbenannt';
}

type EditableField = 'name' | 'nickname' | 'email' | 'phone';

export function ContactDetail({ db, contact, onUpdate }: ContactDetailProps) {
  const todos = useMemo(() => getContactTodos(db, contact.id), [db, contact.id]);
  const notes = useMemo(() => getContactNotes(db, contact.id), [db, contact.id]);

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState({ name: contact.name, nickname: contact.nickname, email: contact.email, phone: contact.phone });
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing(field: EditableField) {
    setDraft({ name: contact.name, nickname: contact.nickname, email: contact.email, phone: contact.phone });
    setEditingField(field);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function save() {
    const name = draft.name.trim() || contact.name;
    onUpdate(name, draft.nickname, draft.email, draft.phone);
    setEditingField(null);
  }

  function cancel() {
    setDraft({ name: contact.name, nickname: contact.nickname, email: contact.email, phone: contact.phone });
    setEditingField(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { cancel(); return; }
    if (e.key === 'Enter') { e.preventDefault(); save(); }
  }

  function inlineInput(field: EditableField, placeholder: string, type = 'text') {
    return editingField === field ? (
      <input
        ref={inputRef}
        type={type}
        className="editable-input"
        value={draft[field]}
        onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
        onBlur={save}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    ) : null;
  }

  return (
    <div className="contact-detail">
      {editingField === 'name' ? (
        <input
          ref={inputRef}
          className="editable-input editable-title"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onBlur={save}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <h2
          className="editable-field"
          onClick={() => startEditing('name')}
          title="Klicken zum Bearbeiten"
        >
          {contact.name}
        </h2>
      )}

      {editingField === 'nickname' ? inlineInput('nickname', 'Spitzname…') : (
        <p
          className={`contact-nickname editable-field${!contact.nickname ? ' editable-placeholder' : ''}`}
          onClick={() => startEditing('nickname')}
          title="Klicken zum Bearbeiten"
        >
          {contact.nickname ? `"${contact.nickname}"` : 'Spitzname hinzufügen…'}
        </p>
      )}

      <div className="contact-info">
        <div className="info-row">
          <span className="info-label">E-Mail:</span>
          {editingField === 'email' ? inlineInput('email', 'E-Mail…', 'email') : (
            <span
              className={`editable-field${!contact.email ? ' editable-placeholder' : ''}`}
              onClick={() => startEditing('email')}
              title="Klicken zum Bearbeiten"
            >
              {contact.email || 'E-Mail hinzufügen…'}
            </span>
          )}
        </div>
        <div className="info-row">
          <span className="info-label">Telefon:</span>
          {editingField === 'phone' ? inlineInput('phone', 'Telefon…', 'tel') : (
            <span
              className={`editable-field${!contact.phone ? ' editable-placeholder' : ''}`}
              onClick={() => startEditing('phone')}
              title="Klicken zum Bearbeiten"
            >
              {contact.phone || 'Telefon hinzufügen…'}
            </span>
          )}
        </div>
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
