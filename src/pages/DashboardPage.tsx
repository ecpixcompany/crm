import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Users, UserCheck, Target, TrendingUp, Bell, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchLeads } from '@/lib/api';
import { useConfiguracion } from '@/hooks/useConfiguracion';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  variant?: 'default' | 'destructive';
}

function KpiCard({ title, value, icon, subtitle, variant }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={variant === 'destructive' ? 'text-destructive' : 'text-unimeta-red'}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });
  const { data: config } = useConfiguracion();

  const totalLeads = leads?.length || 0;
  const activeLeads = leads?.filter((l) => !['cerrado', 'matriculado'].includes(l.estado)).length || 0;
  const qualifiedLeads = leads?.filter((l) => l.estado === 'calificado').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex justify-between items-center py-5">
          <div>
            <h2 className="text-lg font-semibold mb-1">Operación comercial conectada a Strapi</h2>
            <p className="text-sm text-muted-foreground">
              El dashboard consume la misma capa de datos que luego podrás alimentar desde Strapi.
            </p>
          </div>
          <div className="flex gap-2">
            {config?.modo_demo && (
              <Badge variant="outline" className="border-unimeta-red text-unimeta-red">
                Modo demo
              </Badge>
            )}
            <Badge className="bg-unimeta-red text-white">UNIMETA</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Leads totales"
          value={isLoading ? '...' : totalLeads}
          icon={<Users className="h-5 w-5" />}
          subtitle="Base comercial consolidada"
        />
        <KpiCard
          title="Leads activos"
          value={isLoading ? '...' : activeLeads}
          icon={<UserCheck className="h-5 w-5" />}
          subtitle="Sin estados cerrados"
        />
        <KpiCard
          title="Calificados"
          value={isLoading ? '...' : qualifiedLeads}
          icon={<Target className="h-5 w-5" />}
          subtitle="Listos para cierre"
        />
        <KpiCard
          title="Conversión"
          value={isLoading ? '...' : `${conversionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Calificados sobre total"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-unimeta-red" />
              Embudo por estado
            </CardTitle>
            <p className="text-xs text-muted-foreground">Resumen dinámico del pipeline comercial.</p>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-destructive text-center py-5">Error cargando datos</p>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Visualización en desarrollo
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-unimeta-red" />
              Alertas operativas
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Seguimientos vencidos y conversaciones pendientes.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Visualización en desarrollo
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-unimeta-red" />
            Actividad comercial reciente
          </CardTitle>
          <p className="text-xs text-muted-foreground">Cada fila abre la hoja de vida del lead.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 px-3 font-medium">Lead</th>
                  <th className="py-3 px-3 font-medium">Programa</th>
                  <th className="py-3 px-3 font-medium">Asesor</th>
                  <th className="py-3 px-3 font-medium">Estado</th>
                  <th className="py-3 px-3 font-medium">Próxima acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
