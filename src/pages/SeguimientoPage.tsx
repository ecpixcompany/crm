import { useState } from 'react';
import { PRIORIDADES } from '../lib/api';
import type { Lead, Actividad } from '../lib/api';
import { useLeads, useUpdateLead } from '../hooks/useLeads';
import { useAsesores } from '../hooks/useAsesores';
import { useActividades, useCreateActividad } from '../hooks/useActividades';
import { LeadDetailModal } from '../components/modals/LeadDetailModal';
import './SeguimientoPage.css';

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
    case 'llamada': return 'fa-phone';
    case 'correo': return 'fa-envelope';
    case 'reunion': return 'fa-handshake';
    case 'visita': return 'fa-location-dot';
    case 'nota': return 'fa-note-sticky';
    case 'cambio_estado': return 'fa-arrow-right-arrow-left';
    default: return 'fa-circle';
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

export function SeguimientoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state for quick activity
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
      searchTerm === '' ||
      `${lead.nombres} ${lead.apellidos} ${lead.programa} ${lead.ciudad}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesAdvisor = advisorFilter === '' ||
      (typeof lead.asesor === 'object' && lead.asesor?.id === Number(advisorFilter)) ||
      (typeof lead.asesor === 'string' && lead.asesor === advisorFilter);
    const matchesPriority = priorityFilter === '' || lead.prioridad === priorityFilter;
    return matchesSearch && matchesAdvisor && matchesPriority;
  });

  const getLeadsByStage = (stage: string) =>
    filteredLeads.filter((l) => l.estado === stage);

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
          createActividad.mutate({
            lead: lead.id,
            tipo: 'cambio_estado',
            descripcion: `Estado cambiado de ${estadoAnterior} a ${newEstado}`,
            timestamp: new Date().toISOString(),
          }, {
            onSuccess: () => {
              setMovingLeadId(null);
              setTargetStage('');
            },
            onError: () => setMovingLeadId(null),
          });
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

    createActividad.mutate({
      lead: selectedLead.id,
      tipo: activityTipo,
      descripcion: activityDesc,
      timestamp: new Date(activityFecha).toISOString(),
    }, {
      onSuccess: () => {
        setActivityDesc('');
        setActivityTipo('llamada');
        setActivityFecha(new Date().toISOString().split('T')[0]);
        setActivitySuccess(true);
        setTimeout(() => setActivitySuccess(false), 2000);
      },
    });
  };

  const getInitials = (nombres: string, apellidos: string) =>
    `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

  const getAvatarColor = (nombre: string) => {
    const colors = ['#4a90d9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    return colors[nombre.charCodeAt(0) % colors.length];
  };

  const getPriorityClass = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baja': return 'priority-low';
      default: return '';
    }
  };

  const getAsesorName = (asesor: Lead['asesor']) => {
    if (!asesor) return 'Sin asignar';
    if (typeof asesor === 'string') return asesor;
    if (typeof asesor === 'number') return String(asesor);
    return asesor.nombre;
  };

  const isOverdue = (fecha: string | undefined) => {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  };

  const formatActivityTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' · ' +
      d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Pipeline visual listo para alimentar con Strapi</h2>
          <p>Mueve leads por etapa, registra actividades concretas y consulta el historial sin salir del pipeline.</p>
        </div>
        <div className="intro-chip-group">
          <span className="intro-chip">Kanban CRM</span>
        </div>
      </section>

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Activos</span>
            <span className="kpi-icon"><i className="fas fa-users-rays"></i></span>
          </div>
          <div className="kpi-value">{activeCount}</div>
          <div className="kpi-change">Leads en gestion</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Vencidos</span>
            <span className="kpi-icon"><i className="fas fa-triangle-exclamation"></i></span>
          </div>
          <div className="kpi-value">{overdueCount}</div>
          <div className="kpi-change negative">Seguimientos pendientes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Listos para cierre</span>
            <span className="kpi-icon"><i className="fas fa-check-to-slot"></i></span>
          </div>
          <div className="kpi-value">{readyCount}</div>
          <div className="kpi-change">Etapa calificado</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Perdidos</span>
            <span className="kpi-icon"><i className="fas fa-ban"></i></span>
          </div>
          <div className="kpi-value">{lostCount}</div>
          <div className="kpi-change">Cierre descartado</div>
        </div>
      </div>

      <div className="toolbar-row pipeline-toolbar">
        <div className="search-field">
          <i className="fas fa-search"></i>
          <input
            id="pipelineSearchInput"
            type="text"
            placeholder="Buscar por lead, programa, ciudad o asesor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="toolbar-select"
          id="pipelineAdvisorFilter"
          value={advisorFilter}
          onChange={(e) => setAdvisorFilter(e.target.value)}
          disabled={asesoresLoading}
        >
          <option value="">{asesoresLoading ? 'Cargando...' : 'Todos los asesores'}</option>
          {!asesoresLoading && asesores.map((asesor) => (
            <option key={asesor.id} value={asesor.id}>{asesor.nombre}</option>
          ))}
        </select>
        <select
          className="toolbar-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="pipeline-layout">
        <section className="pipeline-board">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div key={stage.id} className="pipeline-column">
                <div className="pipeline-column-header" style={{ borderTopColor: stage.color }}>
                  <h3>{stage.label}</h3>
                  <span className="pipeline-count">{stageLeads.length}</span>
                </div>
                <div className="pipeline-cards">
                  {isLoading ? (
                    <div className="pipeline-empty">Cargando...</div>
                  ) : error ? (
                    <div className="pipeline-empty">Error</div>
                  ) : stageLeads.length === 0 ? (
                    <div className="pipeline-empty">Sin leads</div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`pipeline-card ${selectedLeadId === lead.documentId ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedLeadId(lead.documentId);
                          setTargetStage('');
                        }}
                      >
                        <div className="pipeline-card-header">
                          <div className="pipeline-avatar" style={{ background: getAvatarColor(lead.nombres) }}>
                            {getInitials(lead.nombres, lead.apellidos)}
                          </div>
                          <div className="pipeline-card-info">
                            <span className="pipeline-card-name">{lead.nombres} {lead.apellidos}</span>
                            <span className="pipeline-card-program">{lead.programa}</span>
                          </div>
                          <span className={`priority-badge ${getPriorityClass(lead.prioridad || '')}`}>
                            {lead.prioridad || 'media'}
                          </span>
                        </div>
                        <div className="pipeline-card-meta">
                          <span><i className="fas fa-map-marker-alt"></i> {lead.ciudad}</span>
                          <span><i className="fas fa-user"></i> {getAsesorName(lead.asesor)}</span>
                        </div>
                        {lead.fecha_proxima_accion && (
                          <div className={`pipeline-card-action ${isOverdue(lead.fecha_proxima_accion) ? 'overdue' : ''}`}>
                            <i className="fas fa-clock"></i>
                            {new Date(lead.fecha_proxima_accion).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <aside className="pipeline-sidebar">
          {selectedLead ? (
            <>
              <div className="summary-card">
                <div className="lead-selected-header">
                  <div className="lead-selected-avatar" style={{ background: getAvatarColor(selectedLead.nombres) }}>
                    {getInitials(selectedLead.nombres, selectedLead.apellidos)}
                  </div>
                  <div className="lead-selected-info">
                    <strong>{selectedLead.nombres} {selectedLead.apellidos}</strong>
                    <p>{selectedLead.programa}</p>
                    <span className={`status-badge status-${selectedLead.estado}`}>{selectedLead.estado}</span>
                  </div>
                </div>
                <ul className="summary-list">
                  <li><span>Ciudad</span><strong>{selectedLead.ciudad}</strong></li>
                  <li><span>Asesor</span><strong>{getAsesorName(selectedLead.asesor)}</strong></li>
                  <li><span>Prioridad</span><strong className={getPriorityClass(selectedLead.prioridad || '')}>{selectedLead.prioridad || 'media'}</strong></li>
                  <li><span>Próxima acción</span><strong>{selectedLead.fecha_proxima_accion || 'Sin asignar'}</strong></li>
                </ul>
              </div>

              <div className="summary-card">
                <h3><i className="fas fa-arrows-up-down-left-right"></i> Mover de etapa</h3>
                <div className="move-stage-row">
                  <select
                    className="toolbar-select"
                    value={targetStage}
                    onChange={(e) => setTargetStage(e.target.value)}
                    disabled={movingLeadId === selectedLead.documentId}
                  >
                    <option value="">Seleccionar etapa...</option>
                    {STAGES.filter((s) => s.id !== selectedLead.estado).map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    disabled={!targetStage || movingLeadId === selectedLead.documentId}
                    onClick={handleMoveFromSidebar}
                  >
                    {movingLeadId === selectedLead.documentId ? 'Moviendo...' : 'Mover'}
                  </button>
                </div>
              </div>

              <div className="summary-card">
                <h3><i className="fas fa-circle-plus"></i> Registrar actividad</h3>
                <div className="activity-form">
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      className="toolbar-select full"
                      value={activityTipo}
                      onChange={(e) => setActivityTipo(e.target.value as Actividad['tipo'])}
                    >
                      {TIPOS_ACTIVIDAD.map((t) => (
                        <option key={t} value={t}>{tipoLabel(t)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Describe la actividad..."
                      value={activityDesc}
                      onChange={(e) => setActivityDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-input"
                      value={activityFecha}
                      onChange={(e) => setActivityFecha(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary full"
                    onClick={handleSaveActivity}
                    disabled={!activityDesc.trim() || createActividad.isPending}
                  >
                    {activitySuccess ? (
                      <><i className="fas fa-check"></i> Guardado</>
                    ) : createActividad.isPending ? (
                      'Guardando...'
                    ) : (
                      <><i className="fas fa-floppy-disk"></i> Guardar actividad</>
                    )}
                  </button>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <h3><i className="fas fa-clock-rotate-left"></i> Actividades recientes</h3>
                  {actividades.length > 0 && (
                    <button
                      className="btn-link"
                      onClick={() => setShowDetailModal(true)}
                    >
                      Ver todas
                    </button>
                  )}
                </div>
                {actividadesLoading ? (
                  <p className="loading-text">Cargando...</p>
                ) : actividades.length === 0 ? (
                  <p className="no-selection">Sin actividades registradas</p>
                ) : (
                  <ul className="activity-timeline">
                    {actividades.slice(0, 5).map((act) => (
                      <li key={act.documentId} className={`activity-item activity-${act.tipo}`}>
                        <span className="activity-icon">
                          <i className={`fas ${tipoIcon(act.tipo)}`}></i>
                        </span>
                        <div className="activity-body">
                          <div className="activity-top">
                            <strong>{tipoLabel(act.tipo)}</strong>
                            <span className="activity-time">{formatActivityTime(act.timestamp)}</span>
                          </div>
                          {act.descripcion && (
                            <p className="activity-desc">{act.descripcion}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="summary-card">
              <p className="no-selection">Selecciona un lead del pipeline para ver detalles, mover de etapa y registrar actividades.</p>
            </div>
          )}
        </aside>
      </div>

      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}
