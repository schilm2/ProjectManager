import { useState, useCallback } from 'react';
import { Database } from 'sql.js';
import { Contact } from '../../types';
import { updateContact, getAllContacts } from '../../db/database';
import { ContactsList } from './ContactsList';
import { ContactDetail } from './ContactDetail';

interface ContactsPageProps {
  db: Database;
}

export function ContactsPage({ db }: ContactsPageProps) {
  const [contacts, setContacts] = useState<Contact[]>(() => getAllContacts(db));
  const [selected, setSelected] = useState<Contact | null>(null);

  const refresh = useCallback(() => setContacts(getAllContacts(db)), [db]);

  function handleDelete(id: string) {
    if (selected?.id === id) setSelected(null);
    refresh();
  }

  function handleUpdate(name: string, nickname: string, email: string, phone: string) {
    if (!selected) return;
    updateContact(db, selected.id, name, nickname, email, phone);
    const updated = { ...selected, name, nickname, email, phone };
    setSelected(updated);
    refresh();
  }

  return (
    <div className="split-page">
      <ContactsList db={db} contacts={contacts} onRefresh={refresh} onSelect={setSelected} onDelete={handleDelete} selectedId={selected?.id ?? null} />
      <div className="split-detail">
        {selected ? (
          <ContactDetail db={db} contact={selected} onUpdate={handleUpdate} />
        ) : (
          <div className="empty-state-centered">
            <p>Wähle einen Kontakt aus oder erstelle einen neuen</p>
          </div>
        )}
      </div>
    </div>
  );
}
