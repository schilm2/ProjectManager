import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'sql.js';
import { Project, ProjectStats } from '../../types';
import { getAllProjects, getProjectStats } from '../../db/database';

interface ProjectTileProps {
  project: Project;
  stats: ProjectStats;
  onClick: () => void;
}

function ProjectTile({ project, stats, onClick }: ProjectTileProps) {
  const total = stats.total;
  const donePct = total > 0 ? (stats.done / total) * 100 : 0;
  const progressPct = total > 0 ? (stats.inProgress / total) * 100 : 0;
  const openPct = total > 0 ? (stats.open / total) * 100 : 0;

  return (
    <div className="project-tile" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}>
      <div className="project-tile-name">{project.name}</div>
      {total > 0 ? (
        <>
          <div className="progress-bar project-tile-bar">
            <div className="progress-done" style={{ width: `${donePct}%` }} />
            <div className="progress-in-progress" style={{ width: `${progressPct}%` }} />
            <div className="progress-open" style={{ width: `${openPct}%` }} />
          </div>
          <div className="project-tile-labels">
            <span className="label-done">{stats.done} done</span>
            <span className="label-progress">{stats.inProgress} in progress</span>
            <span className="label-open">{stats.open} open</span>
          </div>
        </>
      ) : (
        <div className="project-tile-empty">Noch keine Aufgaben</div>
      )}
    </div>
  );
}

interface ProjectOverviewProps {
  db: Database;
}

export function ProjectOverview({ db }: ProjectOverviewProps) {
  const navigate = useNavigate();
  const projects = useMemo(() => getAllProjects(db).filter((p) => p.status === 'active'), [db]);
  const statsMap = useMemo(
    () => new Map(projects.map((p) => [p.id, getProjectStats(db, p.id)])),
    [db, projects],
  );

  if (projects.length === 0) return null;

  return (
    <div className="project-overview">
      {projects.map((project) => (
        <ProjectTile
          key={project.id}
          project={project}
          stats={statsMap.get(project.id)!}
          onClick={() => navigate('/projects', { state: { selectedProjectId: project.id } })}
        />
      ))}
    </div>
  );
}
