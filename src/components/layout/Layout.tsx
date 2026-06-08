import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SidebarProvider } from './SidebarContext';
import { useSidebar } from './use-sidebar';

function LayoutInner() {
  const { collapsed } = useSidebar();
  return (
    <>
      <Sidebar />
      <div
        className={
          'min-h-screen overflow-x-hidden bg-background transition-[margin] duration-200 ease-out ' +
          (collapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar')
        }
      >
        <TopBar />
        <div className="mx-auto w-full max-w-[1400px] space-y-8 px-8 py-8 xl:px-10 xl:py-10">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
