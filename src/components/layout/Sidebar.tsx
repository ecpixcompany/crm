import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'fa-th-large' },
  { path: '/mensajeria', label: 'Mensajeria', icon: 'fa-comments' },
  { path: '/leads', label: 'Leads', icon: 'fa-users' },
  { path: '/seguimiento', label: 'Seguimiento', icon: 'fa-binoculars' },
  { path: '/analiticas', label: 'Analiticas', icon: 'fa-chart-bar' },
  { path: '/configuracion', label: 'Configuracion', icon: 'fa-cog' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[250px] h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0 z-50">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 bg-unimeta-red rounded-lg flex items-center justify-center">
          <i className="fas fa-graduation-cap text-white"></i>
        </div>
        <div className="text-base font-bold tracking-wider text-white">UNIMETA</div>
      </div>

      <nav className="py-5 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-5 py-3 text-sm no-underline transition-all',
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                isActive && 'bg-unimeta-red text-white hover:bg-unimeta-red hover:text-white'
              )}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-5 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
        <div className="font-semibold text-white/80">CRM UNIMETA</div>
        <div>Corporación Universitaria</div>
      </div>
    </aside>
  );
}
