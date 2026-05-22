import { useState, useCallback } from 'react';
import { Database } from 'sql.js';
import { Project, ProjectUpdate } from '../../types';
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
    // ProjectsList already calls onRefresh before invoking onDelete — no second refresh needed
    if (selected?.id === id) setSelected(null);
  }

  function handleUpdate({ name, description }: ProjectUpdate) {
    if (!selected) return;
    try {
      updateProject(db, selected.id, name, description);
      setSelected({ ...selected, name, description });
      refresh();
    } catch (err) {
      console.error('Failed to update project', err);
    }
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
