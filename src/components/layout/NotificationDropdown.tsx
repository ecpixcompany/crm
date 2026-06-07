import { useNavigate } from '@tanstack/react-router';
import { Bell, Clock, Calendar, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotificaciones, type Notificacion, type NotificacionUrgencia } from '@/hooks/useNotificaciones';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

const URGENCIA_META: Record<NotificacionUrgencia, { label: string; className: string }> = {
  vencido: { label: 'Vencido', className: 'border-l-destructive text-destructive' },
  hoy: { label: 'Hoy', className: 'border-l-orange-500 text-orange-600' },
  manana: { label: 'Mañana', className: 'border-l-blue-500 text-blue-600' },
  proximo: { label: 'Próximo', className: 'border-l-emerald-500 text-emerald-600' },
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
    <div
      className="absolute top-full right-0 mt-2 w-[380px] max-h-[540px] bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold">Notificaciones</h3>
        <Badge variant="secondary" className="rounded-full">
          {notificaciones.length}
        </Badge>
      </div>

      {notificaciones.length === 0 ? (
        <div className="px-5 py-10 text-center text-muted-foreground">
          <CircleCheck className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-medium text-foreground">No hay actividades pendientes</p>
          <span className="text-xs">Estás al día con todos los seguimientos</span>
        </div>
      ) : (
        <>
          {countVencidos > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-destructive/10 text-destructive border-b border-border">
              <Bell className="h-3.5 w-3.5" />
              <span>
                {countVencidos} {countVencidos === 1 ? 'vencido' : 'vencidos'}
              </span>
            </div>
          )}
          {countHoy > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-orange-50 text-orange-700 border-b border-border">
              <Clock className="h-3.5 w-3.5" />
              <span>{countHoy} para hoy</span>
            </div>
          )}

          <ScrollArea className="flex-1 max-h-[380px]">
            <ul className="divide-y divide-border">
              {notificaciones.map((notif) => {
                const meta = URGENCIA_META[notif.urgencia];
                return (
                  <li
                    key={notif.id}
                    onClick={() => handleClickNotif(notif)}
                    className={cn(
                      'flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 border-l-[3px]',
                      meta.className.split(' ')[0]
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2 mb-0.5">
                        <strong className="text-sm font-semibold text-foreground truncate">
                          {notif.lead.nombres} {notif.lead.apellidos}
                        </strong>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold shrink-0">
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {notif.lead.programa} · {notif.lead.ciudad}
                      </p>
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatFecha(notif.fechaProximaAccion)}
                        </span>
                        <span className={cn('font-medium italic', meta.className.split(' ')[1])}>
                          {formatTiempoRelativo(notif.diasDiferencia)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>

          <Separator />
          <div className="px-4 py-2 bg-muted/30 text-center text-[11px] text-muted-foreground">
            Mostrando {notificaciones.length} {notificaciones.length === 1 ? 'alerta' : 'alertas'}
          </div>
        </>
      )}
    </div>
  );
}
