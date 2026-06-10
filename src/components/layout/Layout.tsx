import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from '../ui/Breadcrumb';

export function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <Outlet />
      </main>
    </div>
  );
}
