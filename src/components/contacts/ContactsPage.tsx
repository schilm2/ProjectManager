import { useState } from 'react';
import { Database } from 'sql.js';
import { Contact } from '../../types';
import { ContactsList } from './ContactsList';
import { ContactDetail } from './ContactDetail';

interface ContactsPageProps {
  db: Database;
}

export function ContactsPage({ db }: ContactsPageProps) {
  const [selected, setSelected] = useState<Contact | null>(null);

  function handleDelete(id: string) {
    if (selected?.id === id) {
      setSelected(null);
    }
  }

  return (
    <div className="split-page">
      <ContactsList db={db} onSelect={setSelected} onDelete={handleDelete} selectedId={selected?.id ?? null} />
      <div className="split-detail">
        {selected ? (
          <ContactDetail db={db} contact={selected} />
        ) : (
          <div className="empty-state-centered">
            <p>Wähle einen Kontakt aus oder erstelle einen neuen</p>
          </div>
        )}
      </div>
    </div>
  );
}
