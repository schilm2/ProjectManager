import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Database } from 'sql.js';
import { Contact, ContactUpdate } from '../../types';
import { updateContact, getAllContacts } from '../../db/database';
import { ContactsList } from './ContactsList';
import { ContactDetail } from './ContactDetail';

interface ContactsPageProps {
  db: Database;
}

export function ContactsPage({ db }: ContactsPageProps) {
  const location = useLocation();
  const autoCreate = !!(location.state as { autoCreate?: boolean } | null)?.autoCreate;
  const [contacts, setContacts] = useState<Contact[]>(() => getAllContacts(db));
  const [selected, setSelected] = useState<Contact | null>(null);

  const refresh = useCallback(() => setContacts(getAllContacts(db)), [db]);

  function handleDelete(id: string) {
    if (selected?.id === id) setSelected(null);
  }

  function handleUpdate({ name, nickname, email, phone }: ContactUpdate) {
    if (!selected) return;
    try {
      updateContact(db, selected.id, name, nickname, email, phone);
      setSelected({ ...selected, name, nickname, email, phone });
      refresh();
    } catch (err) {
      console.error('Failed to update contact', err);
    }
  }

  return (
    <div className="view-enter">
      <div className="page-header">
        <h2>Kontakte<span className="header-accent">Netzwerk und Verbindungen</span></h2>
      </div>
      <div className="split-page">
        <ContactsList db={db} contacts={contacts} onRefresh={refresh} onSelect={setSelected} onDelete={handleDelete} selectedId={selected?.id ?? null} autoCreate={autoCreate} />
        <div className="split-detail">
          {selected ? (
            <ContactDetail db={db} contact={selected} onUpdate={handleUpdate} />
          ) : (
            <div className="empty-state-contacts">
              <div className="empty-message">
                <p>Select a contact</p>
                <div className="empty-actions">
                  <span className="empty-action-pill">Browse contacts</span>
                  <span className="empty-action-pill">Add new contact</span>
                  <span className="empty-action-pill">Import from file</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
