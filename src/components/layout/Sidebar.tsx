import { Link, useLocation } from '@tanstack/react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faThLarge,
  faComments,
  faUsers,
  faBinoculars,
  faChartBar,
  faCog,
  faGraduationCap,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { useSidebar } from './use-sidebar';

interface NavItem {
  path: string;
  label: string;
  icon: IconDefinition;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: faThLarge },
  { path: '/mensajeria', label: 'Mensajeria', icon: faComments },
  { path: '/leads', label: 'Leads', icon: faUsers },
  { path: '/seguimiento', label: 'Seguimiento', icon: faBinoculars },
  { path: '/analiticas', label: 'Analiticas', icon: faChartBar },
  { path: '/configuracion', label: 'Configuracion', icon: faCog },
];

export function Sidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/5 bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
      aria-label="Navegación principal"
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-2' : 'gap-3 px-6'
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-unimeta-red text-white shadow-sm">
          <FontAwesomeIcon icon={faGraduationCap} className="text-base" />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold tracking-wide text-white">UNIMETA</span>
            <span className="truncate text-[11px] font-normal tracking-wide text-white/50">
              Corporación Universitaria
            </span>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-3">
        {!collapsed && (
          <div className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Navegación
          </div>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex h-11 cursor-pointer items-center rounded-md text-[13.5px] font-medium no-underline transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                isActive
                  ? 'bg-white/[0.07] text-white'
                  : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-unimeta-red" />
              )}
              <FontAwesomeIcon
                icon={item.icon}
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                )}
              />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-3">
        {!collapsed && (
          <div className="min-w-0 pl-3">
            <div className="text-[11px] font-medium text-white/50">CRM Unimeta</div>
            <div className="mt-0.5 text-[11px] text-white/35">v1.0 · Build interno</div>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={cn(
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-unimeta-red',
            collapsed && 'mx-auto'
          )}
        >
          <FontAwesomeIcon
            icon={collapsed ? faAngleDoubleRight : faAngleDoubleLeft}
            className="text-sm"
          />
        </button>
      </div>
    </aside>
  );
}
