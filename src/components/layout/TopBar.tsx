import { useLocation } from '@tanstack/react-router';

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

  return (
    <div className="top-bar">
      <h1 className="page-title">{title}</h1>
      <div className="top-bar-right">
        <div className="notification-icon">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">0</span>
        </div>
        <div className="user-profile">
          <div className="profile-avatar">AC</div>
        </div>
      </div>
    </div>
  );
}
