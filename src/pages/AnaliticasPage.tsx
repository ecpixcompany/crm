import {
  Users,
  Percent,
  CalendarX2,
  MessageCircleOff,
  TrendingUp,
  BarChart3,
  ListChecks,
  Loader2,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useLeads';
import { useAsesores } from '@/hooks/useAsesores';
import { useConversaciones } from '@/hooks/useConversaciones';
import { PROGRAMAS, FUENTES } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BarItemProps {
  label: string;
  count: number;
  max: number;
  barClass?: string;
}

function BarItem({ label, count, max, barClass = 'bg-slate-900' }: BarItemProps) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[13px]">
        <span className="truncate text-slate-700">{label}</span>
        <strong className="ml-3 shrink-0 text-slate-900 tabular-nums">{count}</strong>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AnaliticasPage() {
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const { data: conversaciones = [] } = useConversaciones();

  const totalLeads = leads.length;
  const conversionRate =
    totalLeads > 0
      ? Math.round(
          (leads.filter((l) => l.estado === 'calificado' || l.estado === 'cerrado').length /
            totalLeads) *
            100
        )
      : 0;

  const today = new Date();
  const pendingTasks = leads.filter((l) => {
    if (!l.fecha_proxima_accion) return false;
    return new Date(l.fecha_proxima_accion) < today;
  }).length;

  const pendingChats = conversaciones.filter((c) => c.sin_respuesta).length;

  const getEstadoCount = (estado: string) => leads.filter((l) => l.estado === estado).length;
  const getProgramaCount = (programa: string) =>
    leads.filter((l) => l.programa === programa).length;
  const getFuenteCount = (fuente: string) => leads.filter((l) => l.fuente === fuente).length;
  const getAsesorCount = (asesorId: number) =>
    leads.filter((l) => typeof l.asesor === 'object' && l.asesor && l.asesor.id === asesorId).length;

  const maxCount = Math.max(
    ...['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado'].map((e) =>
      getEstadoCount(e)
    ),
    ...PROGRAMAS.map((p) => getProgramaCount(p)),
    ...FUENTES.map((f) => getFuenteCount(f)),
    ...asesores.map((a) => getAsesorCount(a.id))
  );

  const leadsPorAsesorPromedio = asesores.length > 0 ? Math.round(totalLeads / asesores.length) : 0;

  const serviceIndicators = [
    { indicator: 'Tasa de conversión total', valor: `${conversionRate}%`, meta: '25%' },
    { indicator: 'Leads nuevos / mes', valor: String(getEstadoCount('nuevo')), meta: '15' },
    { indicator: 'Tiempo promedio respuesta', valor: '—', meta: '1h' },
    { indicator: 'Tasa de respuesta', valor: '—', meta: '90%' },
    {
      indicator: 'Leads por asesor (promedio)',
      valor: String(leadsPorAsesorPromedio),
      meta: '10',
    },
    {
      indicator: 'Seguimientos realizados',
      valor: String(getEstadoCount('contactado') + getEstadoCount('interesado')),
      meta: '30',
    },
  ];

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Cargando análisis…
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-rose-600">
        <AlertTriangle className="mb-2 size-8" />
        <p>Error al cargar datos: {leadsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            Analiticas
          </h2>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Tableros operativos conectados a Strapi · BI académico
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
          BI académico
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiAna label="Leads" value={totalLeads} icon={<Users className="size-4" />} subtitle="Base analizada" />
        <KpiAna label="Conversion" value={`${conversionRate}%`} icon={<Percent className="size-4" />} subtitle="Calificados sobre total" />
        <KpiAna
          label="Seguimientos vencidos"
          value={pendingTasks}
          icon={<CalendarX2 className="size-4" />}
          subtitle="Alertas operativas"
          accent={pendingTasks > 0 ? "warning" : "default"}
        />
        <KpiAna
          label="Chats pendientes"
          value={pendingChats}
          icon={<MessageCircleOff className="size-4" />}
          subtitle="Bandeja comercial"
          accent={pendingChats > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AnaliticasCard title="Embudo comercial" icon={<BarChart3 className="size-4" />} subtitle="Distribución por estado del lead.">
          {(['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado'] as const).map((e) => {
            const barMap: Record<string, string> = {
              nuevo: 'bg-slate-400',
              contactado: 'bg-amber-500',
              interesado: 'bg-emerald-500',
              calificado: 'bg-violet-500',
              cerrado: 'bg-slate-700',
            };
            return (
              <BarItem
                key={e}
                label={e.charAt(0).toUpperCase() + e.slice(1)}
                count={getEstadoCount(e)}
                max={maxCount}
                barClass={barMap[e]}
              />
            );
          })}
        </AnaliticasCard>

        <AnaliticasCard title="Leads por programa" icon={<TrendingUp className="size-4" />} subtitle="Prioriza programas con mayor volumen.">
          {PROGRAMAS.map((p) => (
            <BarItem key={p} label={p} count={getProgramaCount(p)} max={maxCount} barClass="bg-slate-900" />
          ))}
        </AnaliticasCard>

        <AnaliticasCard title="Leads por fuente" icon={<Target className="size-4" />} subtitle="Mide rendimiento de canales de captación.">
          {FUENTES.map((f) => (
            <BarItem key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} count={getFuenteCount(f)} max={maxCount} barClass="bg-slate-900" />
          ))}
        </AnaliticasCard>

        <AnaliticasCard title="Carga por asesor" icon={<Users className="size-4" />} subtitle="Ayuda a distribuir la operación del equipo.">
          {asesoresLoading ? (
            <p className="py-4 text-center text-[13px] text-slate-500">Cargando asesores…</p>
          ) : asesores.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-slate-500">Sin asesores registrados aún.</p>
          ) : (
            asesores.map((a) => (
              <BarItem key={a.id} label={a.nombre} count={getAsesorCount(a.id)} max={maxCount} barClass="bg-slate-900" />
            ))
          )}
        </AnaliticasCard>
      </div>

      <Card className="overflow-hidden border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
        <CardHeader className="border-b border-slate-200/70">
          <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
            <ListChecks className="size-4 text-slate-500" />
            Indicadores de servicio
          </CardTitle>
          <p className="mt-1 text-[12.5px] text-slate-500">
            KPIs base recomendados para el trabajo de grado.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-slate-200/70 bg-slate-50/50 text-left text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Indicador</th>
                  <th className="px-3 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium text-right">Meta sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceIndicators.map((item) => (
                  <tr key={item.indicator} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 text-slate-700">{item.indicator}</td>
                    <td className="px-3 py-3.5 font-semibold text-slate-900 tabular-nums">{item.valor}</td>
                    <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">{item.meta}</td>
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

function KpiAna({
  label,
  value,
  icon,
  subtitle,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  accent?: "default" | "warning";
}) {
  const a =
    accent === "warning"
      ? { bg: "bg-rose-50", fg: "text-rose-600" }
      : { bg: "bg-slate-100", fg: "text-slate-700" };
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <div className={cn("flex size-8 items-center justify-center rounded-md", a.bg, a.fg)}>
          {icon}
        </div>
      </div>
      <div className="text-[24px] font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1.5 text-[12.5px] text-slate-500">{subtitle}</div>
      )}
    </div>
  );
}

function AnaliticasCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
      <CardHeader className="border-b border-slate-200/70">
        <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
          <span className="text-slate-500">{icon}</span>
          {title}
        </CardTitle>
        {subtitle && (
          <p className="mt-1 text-[12.5px] text-slate-500">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-6">{children}</CardContent>
    </Card>
  );
}
