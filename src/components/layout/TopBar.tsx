import { useState, type MouseEvent } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/mensajeria': 'Mensajeria',
  '/leads': 'Leads',
  '/seguimiento': 'Seguimiento',
  '/analiticas': 'Analiticas',
  '/configuracion': 'Configuración',
};

const pageDescriptions: Record<string, string> = {
  '/': 'Resumen general de tu operación comercial',
  '/mensajeria': 'Bandeja unificada de conversaciones',
  '/leads': 'Gestión y seguimiento de prospectos',
  '/seguimiento': 'Pipeline y actividades de seguimiento',
  '/analiticas': 'Métricas e indicadores clave',
  '/configuracion': 'Ajustes del CRM y administración',
};

function NotificacionesBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { count, countVencidos } = useNotificaciones();

  const toggleDropdown = (e: MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  };

  const closeDropdown = () => setDropdownOpen(false);

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDropdown}
          className={cn(
            'relative text-slate-500',
            dropdownOpen && 'bg-slate-100 text-slate-900',
            countVencidos > 0 && 'text-rose-600 hover:text-rose-700'
          )}
          aria-label="Notificaciones"
        >
          <Bell className="size-[18px]" />
          {count > 0 && (
            <Badge
              variant={countVencidos > 0 ? 'destructive' : 'default'}
              className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full px-1 text-[10px] font-semibold border-2 border-white"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
        {dropdownOpen && <NotificationDropdown onClose={closeDropdown} />}
      </div>

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={closeDropdown}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CRM';
  const description = pageDescriptions[location.pathname];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-8 backdrop-blur-md xl:px-10">
      <div className="min-w-0">
        <h1 className="truncate text-[19px] font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <NotificacionesBell key={location.pathname} />

        <div className="mx-1 h-7 w-px bg-slate-200" />

        <div className="flex items-center gap-3 pl-1">
          <div className="hidden text-right sm:block">
            <div className="text-[12.5px] font-medium leading-tight text-slate-900">Ana Castro</div>
            <div className="text-[11px] leading-tight text-slate-500">Asesora senior</div>
          </div>
          <div className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-unimeta-red text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-unimeta-red-dark">
            AC
          </div>
        </div>
      </div>
    </header>
  );
}
