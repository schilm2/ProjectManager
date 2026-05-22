import { useMemo, useState, useRef } from 'react';
import { Database } from 'sql.js';
import { Contact, ContactUpdate } from '../../types';
import { getContactTodos, getContactNotes } from '../../db/database';

interface ContactDetailProps {
  db: Database;
  contact: Contact;
  onUpdate: (update: ContactUpdate) => void;
}

function extractTitle(content: string): string {
  return content.split('\n')[0].replace(/^#+\s*/, '') || 'Unbenannt';
}

type EditableField = keyof ContactUpdate;

export function ContactDetail({ db, contact, onUpdate }: ContactDetailProps) {
  const todos = useMemo(() => getContactTodos(db, contact.id), [db, contact.id]);
  const notes = useMemo(() => getContactNotes(db, contact.id), [db, contact.id]);

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState<ContactUpdate>({
    name: contact.name,
    nickname: contact.nickname,
    email: contact.email,
    phone: contact.phone,
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nicknameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const nameTriggerRef = useRef<HTMLButtonElement>(null);
  const nicknameTriggerRef = useRef<HTMLButtonElement>(null);
  const emailTriggerRef = useRef<HTMLButtonElement>(null);
  const phoneTriggerRef = useRef<HTMLButtonElement>(null);

  const fieldRefs: Record<EditableField, React.RefObject<HTMLInputElement | null>> = {
    name: nameRef,
    nickname: nicknameRef,
    email: emailRef,
    phone: phoneRef,
  };

  const triggerRefs: Record<EditableField, React.RefObject<HTMLButtonElement | null>> = {
    name: nameTriggerRef,
    nickname: nicknameTriggerRef,
    email: emailTriggerRef,
    phone: phoneTriggerRef,
  };

  function startEditing(field: EditableField) {
    setDraft({ name: contact.name, nickname: contact.nickname, email: contact.email, phone: contact.phone });
    setEditingField(field);
    setTimeout(() => {
      const ref = fieldRefs[field].current as HTMLInputElement | null;
      ref?.focus();
      ref?.select();
    }, 0);
  }

  function save() {
    const name = draft.name.trim() || contact.name;
    const update: ContactUpdate = { name, nickname: draft.nickname, email: draft.email, phone: draft.phone };
    const unchanged =
      update.name === contact.name &&
      update.nickname === contact.nickname &&
      update.email === contact.email &&
      update.phone === contact.phone;
    if (unchanged) {
      setEditingField(null);
      return;
    }
    try {
      onUpdate(update);
    } catch (err) {
      console.error('Failed to update contact', err);
    }
    setEditingField(null);
  }

  function cancel() {
    setDraft({ name: contact.name, nickname: contact.nickname, email: contact.email, phone: contact.phone });
    setEditingField(null);
  }

  function returnFocus(field: EditableField | null) {
    if (!field) return;
    setTimeout(() => triggerRefs[field].current?.focus(), 0);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const panel = e.currentTarget.closest('.contact-detail');
    if (panel?.contains(e.relatedTarget as Node)) return;
    save();
  }

  function handleKeyDown(e: React.KeyboardEvent, field: EditableField) {
    if (e.key === 'Escape') { cancel(); returnFocus(field); return; }
    if (e.key === 'Enter') { e.preventDefault(); save(); returnFocus(field); }
  }

  function renderField(
    field: EditableField,
    triggerContent: React.ReactNode,
    triggerClassName: string,
    triggerAriaLabel: string,
    inputType = 'text',
    inputPlaceholder = '',
  ) {
    if (editingField === field) {
      return (
        <input
          ref={fieldRefs[field] as React.RefObject<HTMLInputElement>}
          type={inputType}
          aria-label={field === 'name' ? 'Name' : triggerAriaLabel.split(':')[0].replace(' bearbeiten', '')}
          className={`editable-input${field === 'name' ? ' editable-title' : ''}`}
          value={draft[field]}
          onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, field)}
          placeholder={inputPlaceholder}
        />
      );
    }
    return (
      <button
        ref={triggerRefs[field] as React.RefObject<HTMLButtonElement>}
        className={triggerClassName}
        onClick={() => startEditing(field)}
        aria-label={triggerAriaLabel}
      >
        {triggerContent}
      </button>
    );
  }

  return (
    <div className="contact-detail">
      {renderField(
        'name',
        <h2>{contact.name}</h2>,
        'editable-field editable-trigger',
        `Name bearbeiten: ${contact.name}`,
      )}

      {renderField(
        'nickname',
        <p className={`contact-nickname${!contact.nickname ? ' editable-placeholder' : ''}`}>
          {contact.nickname ? `"${contact.nickname}"` : 'Spitzname hinzufügen…'}
        </p>,
        'editable-field editable-trigger',
        contact.nickname ? `Spitzname bearbeiten: ${contact.nickname}` : 'Spitzname hinzufügen',
        'text',
        'Spitzname…',
      )}

      <div className="contact-info">
        <div className="info-row">
          <span className="info-label">E-Mail:</span>
          {renderField(
            'email',
            <span className={!contact.email ? 'editable-placeholder' : ''}>
              {contact.email || 'E-Mail hinzufügen…'}
            </span>,
            'editable-field editable-trigger',
            contact.email ? `E-Mail bearbeiten: ${contact.email}` : 'E-Mail hinzufügen',
            'email',
            'E-Mail…',
          )}
        </div>
        <div className="info-row">
          <span className="info-label">Telefon:</span>
          {renderField(
            'phone',
            <span className={!contact.phone ? 'editable-placeholder' : ''}>
              {contact.phone || 'Telefon hinzufügen…'}
            </span>,
            'editable-field editable-trigger',
            contact.phone ? `Telefon bearbeiten: ${contact.phone}` : 'Telefon hinzufügen',
            'tel',
            'Telefon…',
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
