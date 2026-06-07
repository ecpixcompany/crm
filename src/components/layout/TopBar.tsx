import { useState, useEffect, type MouseEvent } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

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

  const toggleDropdown = (e: MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  };

  const closeDropdown = () => setDropdownOpen(false);

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDropdown}
            className={cn(
              'relative',
              dropdownOpen && 'bg-accent text-accent-foreground',
              countVencidos > 0 && 'text-destructive hover:text-destructive'
            )}
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <Badge
                variant={countVencidos > 0 ? 'destructive' : 'default'}
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold border-2 border-card"
              >
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </Button>
          {dropdownOpen && <NotificationDropdown onClose={closeDropdown} />}
        </div>

        <div className="w-10 h-10 bg-unimeta-red text-white rounded-full flex items-center justify-center font-semibold cursor-pointer hover:bg-unimeta-red-dark transition-colors">
          AC
        </div>
      </div>

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={closeDropdown}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
