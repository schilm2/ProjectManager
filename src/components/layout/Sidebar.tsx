import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>PM</h1>
      </div>
      <ul className="sidebar-nav">
        <li>
          <NavLink to="/" end>
            <span className="nav-icon">&#9744;</span>
            <span>Board</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/notes">
            <span className="nav-icon">&#9998;</span>
            <span>Notizen</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/projects">
            <span className="nav-icon">&#9881;</span>
            <span>Projekte</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/contacts">
            <span className="nav-icon">&#9787;</span>
            <span>Kontakte</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
