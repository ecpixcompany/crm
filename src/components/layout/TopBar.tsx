import { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { NotificationDropdown } from './NotificationDropdown';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard CRM',
  '/mensajeria': 'Mensajeria',
  '/leads': 'Leads',
  '/seguimiento': 'Seguimiento',
  '/analiticas': 'Analiticas',
  '/configuracion': 'Configuracion',
};

export function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CRM UNIMETA';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { count, countVencidos } = useNotificaciones();

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  };

  const closeDropdown = () => setDropdownOpen(false);

  const badgeClass = countVencidos > 0 ? '' : 'normal';

  return (
    <div className="top-bar">
      <h1 className="page-title">{title}</h1>
      <div className="top-bar-right">
        <div
          className={`notification-icon ${dropdownOpen ? 'active' : ''} ${countVencidos > 0 ? 'has-vencidos' : ''}`}
          onClick={toggleDropdown}
        >
          <i className="fas fa-bell"></i>
          {count > 0 && (
            <span className={`notification-badge ${badgeClass}`}>
              {count > 99 ? '99+' : count}
            </span>
          )}
          {dropdownOpen && <NotificationDropdown onClose={closeDropdown} />}
        </div>
        <div className="user-profile">
          <div className="profile-avatar">AC</div>
        </div>
      </div>
      {dropdownOpen && <div className="notif-overlay" onClick={closeDropdown}></div>}
    </div>
  );
}
