import { useLocation, Link } from 'react-router-dom';
import './breadcrumb.css';

const breadcrumbLabels: Record<string, string> = {
  '/': 'Board',
  '/notes': 'Notizen',
  '/projects': 'Projekte',
  '/contacts': 'Kontakte',
  '/settings': 'Einstellungen',
};

export function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const breadcrumbs = [
    { path: '/', label: 'Board' },
    ...segments.map((segment, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      const label = breadcrumbLabels[path] || segment;
      return { path, label };
    }),
  ];

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, idx) => (
        <div key={crumb.path} className="breadcrumb-item">
          {idx > 0 && <span className="breadcrumb-separator">/</span>}
          {idx === breadcrumbs.length - 1 ? (
            <span className="breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="breadcrumb-link">{crumb.label}</Link>
          )}
        </div>
      ))}
    </nav>
  );
}
