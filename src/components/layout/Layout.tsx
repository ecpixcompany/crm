import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout() {
  return (
    <>
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
