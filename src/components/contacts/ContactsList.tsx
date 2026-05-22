import { useState, useEffect } from 'react';
import { Database } from 'sql.js';
import { Contact } from '../../types';
import { createContact, deleteContact } from '../../db/database';

interface ContactsListProps {
  db: Database;
  contacts: Contact[];
  onRefresh: () => void;
  onSelect: (contact: Contact) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  autoCreate?: boolean;
}

export function ContactsList({ db, contacts, onRefresh, onSelect, onDelete, selectedId, autoCreate }: ContactsListProps) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (autoCreate) {
      setShowForm(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [autoCreate]);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createContact(db, name.trim(), nickname.trim(), email.trim(), phone.trim());
    onRefresh();
    setName('');
    setNickname('');
    setEmail('');
    setPhone('');
    setShowForm(false);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteContact(db, id);
    onRefresh();
    onDelete(id);
  }

  return (
    <div className="contacts-list">
      <div className="list-header">
        <h3>Kontakte</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Neuer Kontakt</button>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input type="text" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          <input type="text" placeholder="Spitzname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="tel" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="inline-form-actions">
            <button type="submit" className="btn btn-primary">Erstellen</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      )}
      <ul className="entity-items">
        {contacts.map((c) => (
          <li
            key={c.id}
            className={`entity-item ${selectedId === c.id ? 'active' : ''}`}
            onClick={() => onSelect(c)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(c); }}
          >
            <div className="entity-item-info">
              <span className="entity-item-name">{c.name}</span>
              {c.nickname && <span className="entity-item-sub">({c.nickname})</span>}
            </div>
            <button className="btn-icon btn-danger" onClick={(e) => handleDelete(e, c.id)} aria-label="Löschen">&times;</button>
          </li>
        ))}
        {contacts.length === 0 && <li className="empty-state">Noch keine Kontakte</li>}
      </ul>
    </div>
  );
}
