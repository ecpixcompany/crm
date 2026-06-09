import { useState } from 'react';
import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Phone,
  Mail,
  Handshake,
  MapPin,
  StickyNote,
  ArrowRightLeft,
  Plus,
  Save,
  Check,
  Clock,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PRIORIDADES, type Lead, type Actividad } from '@/lib/api';
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useAsesores } from '@/hooks/useAsesores';
import { useActividades, useCreateActividad } from '@/hooks/useActividades';
import { LeadDetailModal } from '@/components/modals/LeadDetailModal';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/lib/avatar';

const STAGES = [
  { id: 'nuevo', label: 'Nuevo', tone: 'border-slate-300' },
  { id: 'contactado', label: 'Contactado', tone: 'border-amber-300' },
  { id: 'interesado', label: 'Interesado', tone: 'border-emerald-400' },
  { id: 'calificado', label: 'Calificado', tone: 'border-violet-400' },
  { id: 'cerrado', label: 'Cerrado', tone: 'border-slate-400' },
] as const;

const TIPOS_ACTIVIDAD: Actividad['tipo'][] = ['llamada', 'correo', 'reunion', 'visita', 'nota'];

const tipoIcon = (tipo: Actividad['tipo']) => {
  switch (tipo) {
    case 'llamada': return Phone;
    case 'correo': return Mail;
    case 'reunion': return Handshake;
    case 'visita': return MapPin;
    case 'nota': return StickyNote;
    case 'cambio_estado': return ArrowRightLeft;
    default: return CheckCircle2;
  }
};

const tipoLabel = (tipo: Actividad['tipo']) => {
  switch (tipo) {
    case 'llamada': return 'Llamada';
    case 'correo': return 'Correo';
    case 'reunion': return 'Reunión';
    case 'visita': return 'Visita';
    case 'nota': return 'Nota';
    case 'cambio_estado': return 'Cambio de estado';
    default: return tipo;
  }
};

const tipoTone = (tipo: Actividad['tipo']) => {
  switch (tipo) {
    case 'llamada': return { bar: 'border-l-blue-500', icon: 'text-blue-600' };
    case 'correo': return { bar: 'border-l-amber-500', icon: 'text-amber-600' };
    case 'reunion': return { bar: 'border-l-emerald-500', icon: 'text-emerald-600' };
    case 'visita': return { bar: 'border-l-violet-500', icon: 'text-violet-600' };
    case 'nota': return { bar: 'border-l-slate-400', icon: 'text-slate-500' };
    case 'cambio_estado': return { bar: 'border-l-slate-700', icon: 'text-slate-700' };
    default: return { bar: 'border-l-slate-400', icon: 'text-slate-500' };
  }
};

const getAsesorName = (asesor: Lead['asesor']) => {
  if (!asesor) return 'Sin asignar';
  if (typeof asesor === 'string') return asesor;
  if (typeof asesor === 'number') return String(asesor);
  return asesor.nombre;
};

const isOverdue = (fecha?: string) => fecha && new Date(fecha) < new Date();

const formatActivityTime = (timestamp: string) => {
  const d = new Date(timestamp);
  return (
    d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  );
};

const ESTADO_TONE: Record<string, string> = {
  nuevo: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  contactado: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  interesado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  calificado: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  cerrado: 'bg-slate-100 text-slate-600 ring-slate-500/15',
};

const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', interesado: 'Interesado',
  calificado: 'Calificado', cerrado: 'Cerrado',
};

const PRIORIDAD_TONE: Record<string, string> = {
  alta: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  media: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  baja: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
};

export function SeguimientoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [activityTipo, setActivityTipo] = useState<Actividad['tipo']>('llamada');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityFecha, setActivityFecha] = useState(new Date().toISOString().split('T')[0]);
  const [activitySuccess, setActivitySuccess] = useState(false);

  const { data: leads = [], isLoading, error } = useLeads();
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const updateLead = useUpdateLead();
  const createActividad = useCreateActividad();

  const selectedLead = leads.find((l) => l.documentId === selectedLeadId) || null;
  const { data: actividades = [], isLoading: actividadesLoading } = useActividades(selectedLead?.id);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchTerm ||
      `${lead.nombres} ${lead.apellidos} ${lead.programa} ${lead.ciudad}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesAdvisor =
      !advisorFilter ||
      (typeof lead.asesor === 'object' && lead.asesor?.id === Number(advisorFilter)) ||
      (typeof lead.asesor === 'string' && lead.asesor === advisorFilter);
    const matchesPriority = !priorityFilter || lead.prioridad === priorityFilter;
    return matchesSearch && matchesAdvisor && matchesPriority;
  });

  const getLeadsByStage = (stage: string) => filteredLeads.filter((l) => l.estado === stage);

  const activeCount = leads.filter((l) => l.estado !== 'cerrado').length;
  const overdueCount = leads.filter((l) => {
    if (!l.fecha_proxima_accion || l.estado === 'cerrado') return false;
    return new Date(l.fecha_proxima_accion) < new Date();
  }).length;
  const readyCount = leads.filter((l) => l.estado === 'calificado').length;
  const lostCount = leads.filter((l) => l.estado === 'cerrado').length;

  const moveToStage = (lead: Lead, newEstado: string) => {
    if (movingLeadId || !newEstado) return;
    setMovingLeadId(lead.documentId);

    const estadoAnterior = lead.estado;
    updateLead.mutate(
      { id: lead.documentId, data: { estado: newEstado } },
      {
        onSuccess: () => {
          createActividad.mutate(
            {
              lead: lead.id,
              tipo: 'cambio_estado',
              descripcion: `Estado cambiado de ${estadoAnterior} a ${newEstado}`,
              timestamp: new Date().toISOString(),
            },
            {
              onSuccess: () => {
                setMovingLeadId(null);
                setTargetStage('');
              },
              onError: () => setMovingLeadId(null),
            }
          );
        },
        onError: () => setMovingLeadId(null),
      }
    );
  };

  const handleMoveFromSidebar = () => {
    if (!selectedLead || !targetStage) return;
    moveToStage(selectedLead, targetStage);
  };

  const handleSaveActivity = () => {
    if (!selectedLead || !activityDesc.trim()) return;

    createActividad.mutate(
      {
        lead: selectedLead.id,
        tipo: activityTipo,
        descripcion: activityDesc,
        timestamp: new Date(activityFecha).toISOString(),
      },
      {
        onSuccess: () => {
          setActivityDesc('');
          setActivityTipo('llamada');
          setActivityFecha(new Date().toISOString().split('T')[0]);
          setActivitySuccess(true);
          setTimeout(() => setActivitySuccess(false), 2000);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            Seguimiento
          </h2>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Pipeline Kanban · mueve leads y registra actividades
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
          Kanban CRM
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiSeg label="Activos" value={activeCount} icon={<Users className="size-4" />} accent="default" />
        <KpiSeg label="Vencidos" value={overdueCount} icon={<AlertTriangle className="size-4" />} accent={overdueCount > 0 ? "warning" : "default"} />
        <KpiSeg label="Listos para cierre" value={readyCount} icon={<CheckCircle2 className="size-4" />} accent="default" />
        <KpiSeg label="Perdidos" value={lostCount} icon={<Ban className="size-4" />} accent="muted" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por lead, programa, ciudad o asesor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10"
          />
        </div>
        <Select value={advisorFilter} onValueChange={setAdvisorFilter} disabled={asesoresLoading}>
          <SelectTrigger className="h-10 w-[200px]">
            <SelectValue placeholder={asesoresLoading ? 'Cargando...' : 'Todos los asesores'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los asesores</SelectItem>
            {asesores.map((asesor) => (
              <SelectItem key={asesor.id} value={String(asesor.id)}>
                {asesor.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-10 w-[200px]">
            <SelectValue placeholder="Todas las prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            {PRIORIDADES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-h-[560px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex min-h-[440px] w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/40 border-t-[3px] xl:w-[280px]",
                  stage.tone
                )}
              >
                <div className="flex items-center justify-between border-b border-slate-200/70 bg-white px-4 py-3">
                  <h3 className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-700">
                    {stage.label}
                  </h3>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                    {stageLeads.length}
                  </Badge>
                </div>
                <ScrollArea className="flex-1 px-2.5 pb-2.5 max-h-[72vh]">
                  {isLoading ? (
                    <div className="py-8 text-center text-[13px] text-slate-500">Cargando…</div>
                  ) : error ? (
                    <div className="py-8 text-center text-[13px] text-rose-600">Error</div>
                  ) : stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-slate-400">Sin leads</div>
                  ) : (
                    <div className="space-y-2">
                      {stageLeads.map((lead) => {
                        const overdue = isOverdue(lead.fecha_proxima_accion);
                        return (
                          <Card
                            key={lead.id}
                            onClick={() => {
                              setSelectedLeadId(lead.documentId);
                              setTargetStage('');
                            }}
                            className={cn(
                              'group relative cursor-pointer overflow-hidden border-slate-200/70 bg-card shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_4px_12px_0_rgb(15_23_42_/_0.08)]',
                              selectedLeadId === lead.documentId &&
                                'border-slate-900 shadow-[0_4px_12px_0_rgb(15_23_42_/_0.12)] ring-1 ring-slate-900/10'
                            )}
                          >
                            <CardContent className="p-0">
                              <div className="space-y-2 px-3 py-3.5">
                                <div className="flex items-start gap-2.5">
                                  <div
                                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white shadow-sm ring-2 ring-white"
                                    style={{ background: getAvatarColor(lead.nombres) }}
                                  >
                                    {getInitials(lead.nombres, lead.apellidos)}
                                  </div>
                                  <div className="min-w-0 flex-1 pr-14">
                                    <div className="line-clamp-2 text-[13.5px] font-semibold leading-tight text-slate-900">
                                      {lead.nombres} {lead.apellidos}
                                    </div>
                                    <div className="mt-0.5 truncate text-[11.5px] leading-tight text-slate-500">
                                      {lead.programa}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 truncate text-[11.5px] text-slate-500">
                                  <MapPin className="size-3.5 shrink-0 text-slate-400" />
                                  <span className="truncate">{lead.ciudad || 'Sin ciudad'}</span>
                                  <span className="text-slate-300">·</span>
                                  <Users className="size-3.5 shrink-0 text-slate-400" />
                                  <span className="truncate">{getAsesorName(lead.asesor)}</span>
                                </div>
                              </div>
                              {lead.prioridad && (
                                <span
                                  className={cn(
                                    'absolute right-3 top-3 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset',
                                    PRIORIDAD_TONE[lead.prioridad] || PRIORIDAD_TONE.media
                                  )}
                                >
                                  {lead.prioridad}
                                </span>
                              )}
                              {lead.fecha_proxima_accion && (
                                <div
                                  className={cn(
                                    'flex items-center gap-1.5 border-t px-3 py-1.5 text-[11px] font-medium',
                                    overdue
                                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-600'
                                  )}
                                >
                                  <Clock className="size-3 shrink-0" />
                                  <span className="truncate">
                                    {overdue ? 'Vencida · ' : 'Próxima · '}
                                    {new Date(lead.fecha_proxima_accion).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                    })}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            );
          })}
        </div>

        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-4 pr-1">
            {selectedLead ? (
              <>
                <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-3 border-b border-slate-200/70 pb-4">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                        style={{ background: getAvatarColor(selectedLead.nombres) }}
                      >
                        {getInitials(selectedLead.nombres, selectedLead.apellidos)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-slate-900">
                          {selectedLead.nombres} {selectedLead.apellidos}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-slate-500">
                          {selectedLead.programa}
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                              ESTADO_TONE[selectedLead.estado] || ESTADO_TONE.nuevo
                            )}
                          >
                            {ESTADO_LABEL[selectedLead.estado] || selectedLead.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                    <dl className="space-y-2 text-[12.5px]">
                      <Row label="Ciudad" value={selectedLead.ciudad} />
                      <Row label="Asesor" value={getAsesorName(selectedLead.asesor)} />
                      <Row label="Prioridad" value={selectedLead.prioridad || 'media'} />
                      <Row label="Próxima acción" value={selectedLead.fecha_proxima_accion || 'Sin asignar'} />
                    </dl>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
                  <CardHeader className="border-b border-slate-200/70">
                    <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                      <ChevronRight className="size-4 text-slate-400" />
                      Mover de etapa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    <Select value={targetStage} onValueChange={setTargetStage} disabled={movingLeadId === selectedLead.documentId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleccionar etapa…" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.filter((s) => s.id !== selectedLead.estado).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleMoveFromSidebar}
                      disabled={!targetStage || movingLeadId === selectedLead.documentId}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {movingLeadId === selectedLead.documentId ? 'Moviendo…' : 'Mover'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
                  <CardHeader className="border-b border-slate-200/70">
                    <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                      <Plus className="size-4 text-slate-400" />
                      Registrar actividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-slate-700">Tipo</Label>
                      <Select value={activityTipo} onValueChange={(v) => setActivityTipo(v as Actividad['tipo'])}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_ACTIVIDAD.map((t) => (
                            <SelectItem key={t} value={t}>
                              {tipoLabel(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-slate-700">Descripción</Label>
                      <Textarea
                        rows={2}
                        placeholder="Describe la actividad…"
                        value={activityDesc}
                        onChange={(e) => setActivityDesc(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-slate-700">Fecha</Label>
                      <Input
                        type="date"
                        value={activityFecha}
                        onChange={(e) => setActivityFecha(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleSaveActivity}
                      disabled={!activityDesc.trim() || createActividad.isPending}
                      className="w-full bg-unimeta-red text-white hover:bg-unimeta-red-dark"
                    >
                      {activitySuccess ? (
                        <>
                          <Check className="size-4" /> Guardado
                        </>
                      ) : createActividad.isPending ? (
                        'Guardando…'
                      ) : (
                        <>
                          <Save className="size-4" /> Guardar actividad
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
                  <CardHeader className="border-b border-slate-200/70">
                    <CardTitle className="flex items-center justify-between text-[13px] font-semibold text-slate-900">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-slate-400" />
                        Actividades recientes
                      </span>
                      {actividades.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowDetailModal(true)}
                          className="h-auto p-0 text-[12px] text-slate-700 hover:text-slate-900"
                        >
                          Ver todas
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {actividadesLoading ? (
                      <p className="py-3 text-center text-[12.5px] text-slate-500">Cargando…</p>
                    ) : actividades.length === 0 ? (
                      <p className="py-3 text-center text-[12.5px] text-slate-500">
                        Sin actividades registradas
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {actividades.slice(0, 5).map((act) => {
                          const Icon = tipoIcon(act.tipo);
                          const t = tipoTone(act.tipo);
                          return (
                            <li
                              key={act.documentId}
                              className={cn(
                                'flex gap-2.5 rounded-md border-l-[3px] bg-slate-50/60 p-2.5',
                                t.bar
                              )}
                            >
                              <Icon className={cn("mt-0.5 size-4 shrink-0", t.icon)} />
                              <div className="min-w-0 flex-1">
                                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                                  <strong className="text-[12px] font-semibold text-slate-900">
                                    {tipoLabel(act.tipo)}
                                  </strong>
                                  <span className="shrink-0 text-[10.5px] text-slate-500">
                                    {formatActivityTime(act.timestamp)}
                                  </span>
                                </div>
                                {act.descripcion && (
                                  <p className="text-[11.5px] leading-snug text-slate-600">
                                    {act.descripcion}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
                <CardContent className="py-12 text-center text-[13px] text-slate-500">
                  Selecciona un lead del pipeline para ver detalles, mover de etapa y registrar actividades.
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {showDetailModal && selectedLead && (
        <LeadDetailModal leadId={selectedLead.documentId} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
}

function KpiSeg({
  label,
  value,
  icon,
  accent = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "default" | "warning" | "muted";
}) {
  const a =
    accent === "warning"
      ? { bg: "bg-rose-50", fg: "text-rose-600" }
      : accent === "muted"
      ? { bg: "bg-slate-100", fg: "text-slate-500" }
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
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}
