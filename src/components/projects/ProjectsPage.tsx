import { useState, useCallback } from 'react';
import { Database } from 'sql.js';
import { Project } from '../../types';
import { updateProject, getAllProjects } from '../../db/database';
import { ProjectsList } from './ProjectsList';
import { ProjectDetail } from './ProjectDetail';

interface ProjectsPageProps {
  db: Database;
}

export function ProjectsPage({ db }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects(db));
  const [selected, setSelected] = useState<Project | null>(null);

  const refresh = useCallback(() => setProjects(getAllProjects(db)), [db]);

  function handleDelete(id: string) {
    if (selected?.id === id) setSelected(null);
    refresh();
  }

  function handleUpdate(name: string, description: string) {
    if (!selected) return;
    updateProject(db, selected.id, name, description);
    const updated = { ...selected, name, description };
    setSelected(updated);
    refresh();
  }

  return (
    <div className="split-page">
      <ProjectsList db={db} projects={projects} onRefresh={refresh} onSelect={setSelected} onDelete={handleDelete} selectedId={selected?.id ?? null} />
      <div className="split-detail">
        {selected ? (
          <ProjectDetail db={db} project={selected} onUpdate={handleUpdate} />
        ) : (
          <div className="empty-state-centered">
            <p>Wähle ein Projekt aus oder erstelle ein neues</p>
          </div>
        )}
      </div>
    </div>
  );
}
