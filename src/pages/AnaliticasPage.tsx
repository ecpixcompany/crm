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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useLeads';
import { useAsesores } from '@/hooks/useAsesores';
import { useConversaciones } from '@/hooks/useConversaciones';
import { PROGRAMAS, FUENTES } from '@/lib/api';

interface BarItemProps {
  label: string;
  count: number;
  color: string;
  max: number;
}

function BarItem({ label, count, color, max }: BarItemProps) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <strong className="text-foreground">{count}</strong>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

const ESTADOS_COLORS: Record<string, string> = {
  nuevo: '#4a90d9',
  contactado: '#f39c12',
  interesado: '#2ecc71',
  calificado: '#9b59b6',
  cerrado: '#e74c3c',
};

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
    { indicator: 'Tiempo promedio respuesta', valor: '--', meta: '1h' },
    { indicator: 'Tasa de respuesta', valor: '--', meta: '90%' },
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
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando análisis...
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Error al cargar datos: {leadsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex justify-between items-center py-5">
          <div>
            <h2 className="text-lg font-semibold mb-1">
              Tableros operativos conectados a Strapi
            </h2>
            <p className="text-sm text-muted-foreground">
              Los indicadores se calculan desde la capa de datos común, después solo cambias el
              origen y no el tablero.
            </p>
          </div>
          <Badge className="bg-unimeta-red text-white">BI académico</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Leads</span>
              <Users className="h-5 w-5 text-unimeta-red" />
            </div>
            <div className="text-3xl font-bold">{totalLeads}</div>
            <div className="text-xs text-muted-foreground">Base analizada</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Conversión</span>
              <Percent className="h-5 w-5 text-unimeta-red" />
            </div>
            <div className="text-3xl font-bold">{conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Calificados sobre total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Seguimientos vencidos</span>
              <CalendarX2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-3xl font-bold">{pendingTasks}</div>
            <div className="text-xs text-destructive">Alertas operativas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Chats pendientes</span>
              <MessageCircleOff className="h-5 w-5 text-unimeta-red" />
            </div>
            <div className="text-3xl font-bold">{pendingChats}</div>
            <div className="text-xs text-muted-foreground">Bandeja comercial</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-unimeta-red" /> Embudo comercial
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribución por estado del lead.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado'] as const).map((e) => (
              <BarItem
                key={e}
                label={e.charAt(0).toUpperCase() + e.slice(1)}
                count={getEstadoCount(e)}
                color={ESTADOS_COLORS[e]}
                max={maxCount}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-unimeta-red" /> Leads por programa
            </CardTitle>
            <p className="text-xs text-muted-foreground">Prioriza programas con mayor volumen.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROGRAMAS.map((p) => (
              <BarItem
                key={p}
                label={p}
                count={getProgramaCount(p)}
                color="#4a90d9"
                max={maxCount}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-unimeta-red" /> Leads por fuente
            </CardTitle>
            <p className="text-xs text-muted-foreground">Mide rendimiento de canales de captación.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FUENTES.map((f) => (
              <BarItem
                key={f}
                label={f.charAt(0).toUpperCase() + f.slice(1)}
                count={getFuenteCount(f)}
                color="#2ecc71"
                max={maxCount}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-unimeta-red" /> Carga por asesor
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ayuda a distribuir la operación del equipo.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {asesoresLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando asesores...</p>
            ) : asesores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin asesores registrados aún.
              </p>
            ) : (
              asesores.map((a) => (
                <BarItem
                  key={a.id}
                  label={a.nombre}
                  count={getAsesorCount(a.id)}
                  color="#9b59b6"
                  max={maxCount}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-unimeta-red" /> Indicadores de servicio
          </CardTitle>
          <p className="text-xs text-muted-foreground">KPIs base recomendados para el trabajo de grado.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left">
                <tr>
                  <th className="py-3 px-3 font-medium">Indicador</th>
                  <th className="py-3 px-3 font-medium">Valor</th>
                  <th className="py-3 px-3 font-medium">Meta sugerida</th>
                </tr>
              </thead>
              <tbody>
                {serviceIndicators.map((item) => (
                  <tr key={item.indicator} className="border-t border-border">
                    <td className="py-3 px-3">{item.indicator}</td>
                    <td className="py-3 px-3 font-semibold">{item.valor}</td>
                    <td className="py-3 px-3">{item.meta}</td>
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
