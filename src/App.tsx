import { Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDB } from './hooks/useDB';
import { Layout } from './components/layout/Layout';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { NotesPage } from './components/notes/NotesPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { ContactsPage } from './components/contacts/ContactsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/ToastContainer';

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-state">
          <h2>Etwas ist schiefgelaufen</h2>
          <p>{this.state.error.message}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { db, error } = useDB();

  if (error) {
    return (
      <div className="error-state">
        <h2>Datenbank konnte nicht geladen werden</h2>
        <p>{error.message}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!db) {
    return <div className="loading">Datenbank wird geladen...</div>;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<KanbanBoard db={db} />} />
              <Route path="/notes" element={<NotesPage db={db} />} />
              <Route path="/projects" element={<ProjectsPage db={db} />} />
              <Route path="/contacts" element={<ContactsPage db={db} />} />
              <Route path="/settings" element={<SettingsPage db={db} />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
