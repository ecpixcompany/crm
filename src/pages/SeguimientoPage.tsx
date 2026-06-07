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
import { Separator } from '@/components/ui/separator';
import { PRIORIDADES, type Lead, type Actividad } from '@/lib/api';
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useAsesores } from '@/hooks/useAsesores';
import { useActividades, useCreateActividad } from '@/hooks/useActividades';
import { LeadDetailModal } from '@/components/modals/LeadDetailModal';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: '#4a90d9' },
  { id: 'contactado', label: 'Contactado', color: '#f39c12' },
  { id: 'interesado', label: 'Interesado', color: '#2ecc71' },
  { id: 'calificado', label: 'Calificado', color: '#9b59b6' },
  { id: 'cerrado', label: 'Cerrado', color: '#e74c3c' },
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

const tipoColor = (tipo: Actividad['tipo']) => {
  switch (tipo) {
    case 'llamada': return 'border-l-blue-500 text-blue-600 bg-blue-50';
    case 'correo': return 'border-l-orange-500 text-orange-600 bg-orange-50';
    case 'reunion': return 'border-l-emerald-500 text-emerald-600 bg-emerald-50';
    case 'visita': return 'border-l-purple-500 text-purple-600 bg-purple-50';
    case 'nota': return 'border-l-slate-400 text-slate-600 bg-slate-50';
    case 'cambio_estado': return 'border-l-slate-700 text-slate-700 bg-slate-100';
    default: return 'border-l-gray-400 text-gray-600 bg-gray-50';
  }
};

const getInitials = (n: string, a: string) => `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();

const getAvatarColor = (nombre: string) => {
  const colors = ['#4a90d9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
  return colors[nombre.charCodeAt(0) % colors.length];
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
      <Card>
        <CardContent className="flex justify-between items-center py-5">
          <div>
            <h2 className="text-lg font-semibold mb-1">Pipeline Kanban con seguimiento</h2>
            <p className="text-sm text-muted-foreground">
              Mueve leads por etapa, registra actividades concretas y consulta el historial sin salir del pipeline.
            </p>
          </div>
          <Badge className="bg-unimeta-red text-white">Kanban CRM</Badge>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Activos</span>
              <Users className="h-5 w-5 text-unimeta-red" />
            </div>
            <div className="text-3xl font-bold">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Leads en gestión</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Vencidos</span>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-3xl font-bold">{overdueCount}</div>
            <div className="text-xs text-destructive">Seguimientos pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Listos para cierre</span>
              <CheckCircle2 className="h-5 w-5 text-unimeta-red" />
            </div>
            <div className="text-3xl font-bold">{readyCount}</div>
            <div className="text-xs text-muted-foreground">Etapa calificado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">Perdidos</span>
              <Ban className="h-5 w-5 text-unimeta-red" />
            </div>
            <div className="text-3xl font-bold">{lostCount}</div>
            <div className="text-xs text-muted-foreground">Cierre descartado</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lead, programa, ciudad o asesor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={advisorFilter} onValueChange={setAdvisorFilter} disabled={asesoresLoading}>
          <SelectTrigger className="w-[200px]">
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
          <SelectTrigger className="w-[200px]">
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

      {/* Pipeline + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div
                key={stage.id}
                className="bg-muted/40 rounded-lg flex flex-col min-h-[400px]"
                style={{ borderTop: `4px solid ${stage.color}` }}
              >
                <div className="px-4 py-3 bg-card rounded-t-lg flex justify-between items-center">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="secondary" className="rounded-full">
                    {stageLeads.length}
                  </Badge>
                </div>
                <ScrollArea className="flex-1 p-2 max-h-[70vh]">
                  {isLoading ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">Cargando...</div>
                  ) : error ? (
                    <div className="text-center text-destructive py-8 text-sm">Error</div>
                  ) : stageLeads.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">Sin leads</div>
                  ) : (
                    <div className="space-y-2">
                      {stageLeads.map((lead) => (
                        <Card
                          key={lead.id}
                          onClick={() => {
                            setSelectedLeadId(lead.documentId);
                            setTargetStage('');
                          }}
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-md',
                            selectedLeadId === lead.documentId && 'border-unimeta-red shadow-md'
                          )}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-9 h-9 rounded-full text-white flex items-center justify-center font-semibold text-xs shrink-0"
                                style={{ background: getAvatarColor(lead.nombres) }}
                              >
                                {getInitials(lead.nombres, lead.apellidos)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate">
                                  {lead.nombres} {lead.apellidos}
                                </div>
                                <div className="text-xs text-muted-foreground">{lead.programa}</div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] capitalize shrink-0',
                                  lead.prioridad === 'alta' && 'border-destructive text-destructive',
                                  lead.prioridad === 'media' && 'border-orange-500 text-orange-600',
                                  lead.prioridad === 'baja' && 'border-emerald-500 text-emerald-600'
                                )}
                              >
                                {lead.prioridad || 'media'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {lead.ciudad}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {getAsesorName(lead.asesor)}
                              </span>
                            </div>
                            {lead.fecha_proxima_accion && (
                              <div
                                className={cn(
                                  'flex items-center gap-1 text-[11px] px-2 py-1 rounded',
                                  isOverdue(lead.fecha_proxima_accion)
                                    ? 'bg-destructive/10 text-destructive font-semibold'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {new Date(lead.fecha_proxima_accion).toLocaleDateString('es-ES')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-3 pr-2">
            {selectedLead ? (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b">
                      <div
                        className="w-12 h-12 rounded-full text-white flex items-center justify-center font-semibold shrink-0"
                        style={{ background: getAvatarColor(selectedLead.nombres) }}
                      >
                        {getInitials(selectedLead.nombres, selectedLead.apellidos)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {selectedLead.nombres} {selectedLead.apellidos}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {selectedLead.programa}
                        </div>
                        <Badge className={cn('text-[10px] capitalize', `bg-${stageColor(selectedLead.estado)}-100`)}>
                          {selectedLead.estado}
                        </Badge>
                      </div>
                    </div>
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><dt className="text-muted-foreground">Ciudad</dt><dd className="font-medium">{selectedLead.ciudad}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Asesor</dt><dd className="font-medium">{getAsesorName(selectedLead.asesor)}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Prioridad</dt><dd className="font-medium capitalize">{selectedLead.prioridad || 'media'}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Próxima acción</dt><dd className="font-medium">{selectedLead.fecha_proxima_accion || 'Sin asignar'}</dd></div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-unimeta-red" /> Mover de etapa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Select value={targetStage} onValueChange={setTargetStage} disabled={movingLeadId === selectedLead.documentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar etapa..." />
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
                      className="w-full bg-unimeta-red hover:bg-unimeta-red-dark"
                    >
                      {movingLeadId === selectedLead.documentId ? 'Moviendo...' : 'Mover'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Plus className="h-4 w-4 text-unimeta-red" /> Registrar actividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={activityTipo} onValueChange={(v) => setActivityTipo(v as Actividad['tipo'])}>
                        <SelectTrigger>
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
                      <Label className="text-xs">Descripción</Label>
                      <Textarea
                        rows={2}
                        placeholder="Describe la actividad..."
                        value={activityDesc}
                        onChange={(e) => setActivityDesc(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fecha</Label>
                      <Input
                        type="date"
                        value={activityFecha}
                        onChange={(e) => setActivityFecha(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleSaveActivity}
                      disabled={!activityDesc.trim() || createActividad.isPending}
                      className="w-full bg-unimeta-red hover:bg-unimeta-red-dark"
                    >
                      {activitySuccess ? (
                        <>
                          <Check className="h-4 w-4" /> Guardado
                        </>
                      ) : createActividad.isPending ? (
                        'Guardando...'
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Guardar actividad
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-unimeta-red" /> Actividades recientes
                      </span>
                      {actividades.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowDetailModal(true)}
                          className="h-auto p-0 text-xs text-unimeta-red"
                        >
                          Ver todas
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actividadesLoading ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Cargando...</p>
                    ) : actividades.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Sin actividades registradas
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {actividades.slice(0, 5).map((act) => {
                          const Icon = tipoIcon(act.tipo);
                          return (
                            <li
                              key={act.documentId}
                              className={cn(
                                'p-2.5 rounded-md border-l-[3px] flex gap-2.5',
                                tipoColor(act.tipo)
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                  <strong className="text-xs font-semibold">
                                    {tipoLabel(act.tipo)}
                                  </strong>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {formatActivityTime(act.timestamp)}
                                  </span>
                                </div>
                                {act.descripcion && (
                                  <p className="text-[11px] text-foreground/80 leading-snug">
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
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Selecciona un lead del pipeline para ver detalles, mover de etapa y registrar actividades.
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {showDetailModal && selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
}

function stageColor(estado: string): string {
  switch (estado) {
    case 'nuevo': return 'blue';
    case 'contactado': return 'orange';
    case 'interesado': return 'emerald';
    case 'calificado': return 'purple';
    case 'cerrado': return 'red';
    default: return 'slate';
  }
}
