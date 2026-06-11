import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { IconBoard, IconNotes, IconProjects, IconContacts, IconSettings } from '../ui/Icons';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <nav className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar-brand">
        <Logo />
      </div>
      <ul className="sidebar-nav">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} title="Board">
            <span className="nav-icon"><IconBoard /></span>
            <span className="nav-label">Board</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/notes" className={({ isActive }) => isActive ? 'active' : ''} title="Notizen">
            <span className="nav-icon"><IconNotes /></span>
            <span className="nav-label">Notizen</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''} title="Projekte">
            <span className="nav-icon"><IconProjects /></span>
            <span className="nav-label">Projekte</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/contacts" className={({ isActive }) => isActive ? 'active' : ''} title="Kontakte">
            <span className="nav-icon"><IconContacts /></span>
            <span className="nav-label">Kontakte</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''} title="Einstellungen">
            <span className="nav-icon"><IconSettings /></span>
            <span className="nav-label">Einstellungen</span>
          </NavLink>
        </li>
      </ul>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(prev => !prev)}
        aria-label={collapsed ? 'Sidebar erweitern' : 'Sidebar minimieren'}
        title={collapsed ? 'Erweitern' : 'Minimieren'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: `transform var(--duration-normal) var(--ease-out)` }}
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  );
}
