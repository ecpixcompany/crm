import { Link, useLocation } from '@tanstack/react-router';
import './Sidebar.css';

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
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="phone-icon">
          <i className="fas fa-phone"></i>
        </div>
        <div className="logo-text">UNIMETA</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
