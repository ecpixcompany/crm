import { useNavigate } from '@tanstack/react-router';
import { useNotificaciones, type Notificacion, type NotificacionUrgencia } from '../../hooks/useNotificaciones';
import './NotificationDropdown.css';

interface Props {
  onClose: () => void;
}

const URGENCIA_META: Record<NotificacionUrgencia, { label: string; icon: string; className: string }> = {
  vencido: { label: 'Vencido', icon: 'fa-circle-exclamation', className: 'urg-vencido' },
  hoy: { label: 'Hoy', icon: 'fa-bell', className: 'urg-hoy' },
  manana: { label: 'Mañana', icon: 'fa-clock', className: 'urg-manana' },
  proximo: { label: 'Próximo', icon: 'fa-calendar-day', className: 'urg-proximo' },
};

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTiempoRelativo(dias: number): string {
  if (dias < 0) {
    const abs = Math.abs(dias);
    return abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`;
  }
  if (dias === 0) return 'Para hoy';
  if (dias === 1) return 'Para mañana';
  return `En ${dias} días`;
}

export function NotificationDropdown({ onClose }: Props) {
  const navigate = useNavigate();
  const { notificaciones, countVencidos, countHoy } = useNotificaciones();

  const handleClickNotif = (notif: Notificacion) => {
    onClose();
    navigate({ to: '/seguimiento' });
  };

  return (
    <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="notif-header">
        <h3>Notificaciones</h3>
        <span className="notif-count">
          {notificaciones.length}
        </span>
      </div>

      {notificaciones.length === 0 ? (
        <div className="notif-empty">
          <i className="fas fa-circle-check"></i>
          <p>No hay actividades pendientes</p>
          <span>Estás al día con todos los seguimientos</span>
        </div>
      ) : (
        <>
          {countVencidos > 0 && (
            <div className="notif-summary vencidos">
              <i className="fas fa-circle-exclamation"></i>
              <span>{countVencidos} {countVencidos === 1 ? 'vencido' : 'vencidos'}</span>
            </div>
          )}
          {countHoy > 0 && (
            <div className="notif-summary hoy">
              <i className="fas fa-bell"></i>
              <span>{countHoy} para hoy</span>
            </div>
          )}

          <ul className="notif-list">
            {notificaciones.map((notif) => {
              const meta = URGENCIA_META[notif.urgencia];
              return (
                <li
                  key={notif.id}
                  className={`notif-item ${meta.className}`}
                  onClick={() => handleClickNotif(notif)}
                >
                  <span className="notif-item-icon">
                    <i className={`fas ${meta.icon}`}></i>
                  </span>
                  <div className="notif-item-body">
                    <div className="notif-item-top">
                      <strong>{notif.lead.nombres} {notif.lead.apellidos}</strong>
                      <span className="notif-item-urg">{meta.label}</span>
                    </div>
                    <p className="notif-item-program">
                      {notif.lead.programa} · {notif.lead.ciudad}
                    </p>
                    <div className="notif-item-bottom">
                      <span className="notif-item-time">
                        <i className="fas fa-calendar"></i> {formatFecha(notif.fechaProximaAccion)}
                      </span>
                      <span className="notif-item-rel">
                        {formatTiempoRelativo(notif.diasDiferencia)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="notif-footer">
            <span>Mostrando {notificaciones.length} {notificaciones.length === 1 ? 'alerta' : 'alertas'}</span>
          </div>
        </>
      )}
    </div>
  );
}
