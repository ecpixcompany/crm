import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Users,
  UserCheck,
  Target,
  TrendingUp,
  BarChart3,
  Bell,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchLeads } from '@/lib/api';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  delta?: { value: string; trend: 'up' | 'down' | 'flat' };
  accent?: 'default' | 'success' | 'warning' | 'destructive';
}

const ACCENT_MAP: Record<NonNullable<KpiCardProps['accent']>, { iconBg: string; iconColor: string }> = {
  default: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  destructive: { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
};

function KpiCard({ title, value, icon, subtitle, delta, accent = 'default' }: KpiCardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[12.5px] font-medium uppercase tracking-wide text-slate-500">
            {title}
          </span>
          <div className={cn('flex size-9 items-center justify-center rounded-md', a.iconBg, a.iconColor)}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-[28px] font-semibold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[12px] font-medium',
                delta.trend === 'up' && 'text-emerald-600',
                delta.trend === 'down' && 'text-rose-600',
                delta.trend === 'flat' && 'text-slate-500'
              )}
            >
              {delta.trend === 'up' && <ArrowUpRight className="size-3" />}
              {delta.trend === 'down' && <ArrowDownRight className="size-3" />}
              {delta.value}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="mt-1.5 text-[12.5px] text-slate-500">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}

const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  interesado: 'Interesado',
  calificado: 'Calificado',
  cerrado: 'Cerrado',
  matriculado: 'Matriculado',
};

const ESTADO_TONE: Record<string, string> = {
  nuevo: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  contactado: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  interesado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  calificado: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  cerrado: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  matriculado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function DashboardPage() {
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });
  const { data: config } = useConfiguracion();
  const { notificaciones, countVencidos } = useNotificaciones();

  const totalLeads = leads?.length || 0;
  const activeLeads =
    leads?.filter((l) => !['cerrado', 'matriculado'].includes(l.estado)).length || 0;
  const qualifiedLeads = leads?.filter((l) => l.estado === 'calificado').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const recentLeads = (leads || []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">Bienvenida, Ana</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
            Operación comercial conectada a Strapi
          </h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">
            El dashboard consume la misma capa de datos que luego podrás alimentar desde Strapi.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {config?.modo_demo && (
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              Modo demo
            </Badge>
          )}
          <Badge className="bg-slate-900 text-white">UNIMETA</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Leads totales"
          value={isLoading ? '—' : totalLeads}
          icon={<Users className="size-[18px]" />}
          subtitle="Base comercial consolidada"
          delta={{ value: '+12%', trend: 'up' }}
        />
        <KpiCard
          title="Leads activos"
          value={isLoading ? '—' : activeLeads}
          icon={<UserCheck className="size-[18px]" />}
          subtitle="Sin estados cerrados"
          accent="success"
        />
        <KpiCard
          title="Calificados"
          value={isLoading ? '—' : qualifiedLeads}
          icon={<Target className="size-[18px]" />}
          subtitle="Listos para cierre"
          accent="default"
        />
        <KpiCard
          title="Conversión"
          value={isLoading ? '—' : `${conversionRate}%`}
          icon={<TrendingUp className="size-[18px]" />}
          subtitle="Calificados sobre total"
          delta={{ value: '+3.1%', trend: 'up' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                  <BarChart3 className="size-4 text-slate-500" />
                  Embudo por estado
                </CardTitle>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Resumen dinámico del pipeline comercial.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                Ver detalle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-[13px] text-rose-600">Error cargando datos</p>
            ) : (
              <div className="space-y-3 py-2">
                {(['nuevo', 'contactado', 'interesado', 'calificado', 'matriculado'] as const).map(
                  (estado) => {
                    const count = leads?.filter((l) => l.estado === estado).length || 0;
                    const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                    return (
                      <div key={estado} className="flex items-center gap-4">
                        <div className="w-24 shrink-0 text-[12.5px] text-slate-600">
                          {ESTADO_LABEL[estado]}
                        </div>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-slate-900 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-10 shrink-0 text-right text-[12.5px] font-medium tabular-nums text-slate-900">
                          {count}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <Bell className="size-4 text-slate-500" />
              Alertas operativas
            </CardTitle>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Seguimientos vencidos y conversaciones pendientes.
            </p>
          </CardHeader>
          <CardContent>
            {notificaciones.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-500">
                Sin alertas activas
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notificaciones.slice(0, 4).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <CircleDot
                      className={cn(
                        'mt-0.5 size-3.5 shrink-0',
                        n.urgencia === 'vencido' && 'text-rose-500',
                        n.urgencia === 'hoy' && 'text-amber-500',
                        n.urgencia === 'manana' && 'text-blue-500',
                        n.urgencia === 'proximo' && 'text-emerald-500'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-slate-900">
                        {n.lead.nombres} {n.lead.apellidos}
                      </div>
                      <div className="text-[12px] text-slate-500">
                        {n.lead.programa} · {n.lead.ciudad}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11.5px] font-medium text-slate-500">
                        {formatDate(n.fechaProximaAccion)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {countVencidos > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-md bg-rose-50 px-3 py-2 text-[12px]">
                <span className="font-medium text-rose-700">
                  {countVencidos} {countVencidos === 1 ? 'vencido' : 'vencidos'}
                </span>
                <Link
                  to="/seguimiento"
                  className="font-medium text-rose-700 hover:text-rose-900"
                >
                  Revisar →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                <Activity className="size-4 text-slate-500" />
                Actividad comercial reciente
              </CardTitle>
              <p className="mt-1 text-[12.5px] text-slate-500">
                Cada fila abre la hoja de vida del lead.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads" className="text-slate-500 hover:text-slate-900">
                Ver todos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-y border-slate-200/70 bg-slate-50/50 text-left text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="py-3 px-6 font-medium">Lead</th>
                  <th className="py-3 px-3 font-medium">Programa</th>
                  <th className="py-3 px-3 font-medium">Asesor</th>
                  <th className="py-3 px-3 font-medium">Estado</th>
                  <th className="py-3 px-3 font-medium">Próx. acción</th>
                  <th className="py-3 px-6 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Cargando…
                    </td>
                  </tr>
                )}
                {!isLoading && recentLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Sin actividad reciente
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  recentLeads.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-900">
                          {lead.nombres} {lead.apellidos}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {lead.correo || lead.celular}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700">{lead.programa || '—'}</td>
                      <td className="px-3 py-3.5 text-slate-700">
                        {typeof lead.asesor === 'object' && lead.asesor
                          ? lead.asesor.nombre
                          : 'Sin asignar'}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset',
                            ESTADO_TONE[lead.estado] || ESTADO_TONE.nuevo
                          )}
                        >
                          {ESTADO_LABEL[lead.estado] || lead.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600">{formatDate(lead.fecha_proxima_accion)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          to="/leads"
                          className="text-[12.5px] font-medium text-slate-500 hover:text-slate-900"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
