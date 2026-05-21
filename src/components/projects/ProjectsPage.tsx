import { useState } from 'react';
import { Database } from 'sql.js';
import { Project } from '../../types';
import { ProjectsList } from './ProjectsList';
import { ProjectDetail } from './ProjectDetail';

interface ProjectsPageProps {
  db: Database;
}

export function ProjectsPage({ db }: ProjectsPageProps) {
  const [selected, setSelected] = useState<Project | null>(null);

  function handleDelete(id: string) {
    if (selected?.id === id) {
      setSelected(null);
    }
  }

  return (
    <div className="split-page">
      <ProjectsList db={db} onSelect={setSelected} onDelete={handleDelete} selectedId={selected?.id ?? null} />
      <div className="split-detail">
        {selected ? (
          <ProjectDetail db={db} project={selected} />
        ) : (
          <div className="empty-state-centered">
            <p>Wähle ein Projekt aus oder erstelle ein neues</p>
          </div>
        )}
      </div>
    </div>
  );
}
