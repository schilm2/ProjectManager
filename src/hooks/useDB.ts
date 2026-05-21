import { useState, useEffect } from 'react';
import { Database } from 'sql.js';
import { getDB } from '../db/database';

interface DBState {
  db: Database | null;
  error: Error | null;
}

export function useDB(): DBState {
  const [state, setState] = useState<DBState>({ db: null, error: null });

  useEffect(() => {
    getDB()
      .then((db) => setState({ db, error: null }))
      .catch((err) => setState({ db: null, error: err instanceof Error ? err : new Error(String(err)) }));
  }, []);

  return state;
}
