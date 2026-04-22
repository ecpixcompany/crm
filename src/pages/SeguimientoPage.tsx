import { useState } from 'react';
import { PRIORIDADES } from '../lib/api';
import type { Lead } from '../lib/api';
import { useLeads, useUpdateLead } from '../hooks/useLeads';
import { useAsesores } from '../hooks/useAsesores';
import { useCreateActividad } from '../hooks/useActividades';
import './SeguimientoPage.css';

const STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: '#4a90d9' },
  { id: 'contactado', label: 'Contactado', color: '#f39c12' },
  { id: 'interesado', label: 'Interesado', color: '#2ecc71' },
  { id: 'calificado', label: 'Calificado', color: '#9b59b6' },
  { id: 'cerrado', label: 'Cerrado', color: '#e74c3c' },
] as const;

export function SeguimientoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);

  const { data: leads = [], isLoading, error } = useLeads();
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const updateLead = useUpdateLead();
  const createActividad = useCreateActividad();

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
    if (movingLeadId) return;
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
            onSuccess: () => setMovingLeadId(null),
            onError: () => setMovingLeadId(null),
          });
        },
        onError: () => setMovingLeadId(null),
      }
    );
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

  const selectedLead = leads.find((l) => l.documentId === selectedLeadId) || null;

  return (
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Pipeline visual listo para alimentar con Strapi</h2>
          <p>Mueve leads por etapa, filtra por asesor y conserva la estructura para sincronizar el estado desde el backend.</p>
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
                        onClick={() => setSelectedLeadId(lead.documentId)}
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
                        <div className="pipeline-card-actions">
                          {STAGES.filter((s) => s.id !== lead.estado).map((s) => (
                            <button
                              key={s.id}
                              className="move-btn"
                              style={{ background: s.color }}
                              disabled={movingLeadId === lead.documentId}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToStage(lead, s.id);
                              }}
                              title={`Mover a ${s.label}`}
                            >
                              <i className="fas fa-arrow-right"></i>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <aside className="pipeline-sidebar">
          <div className="summary-card">
            <h3>Lead seleccionado</h3>
            {selectedLead ? (
              <div className="lead-selected-detail">
                <div className="lead-selected-header">
                  <div className="lead-selected-avatar" style={{ background: getAvatarColor(selectedLead.nombres) }}>
                    {getInitials(selectedLead.nombres, selectedLead.apellidos)}
                  </div>
                  <div>
                    <strong>{selectedLead.nombres} {selectedLead.apellidos}</strong>
                    <p>{selectedLead.programa}</p>
                  </div>
                </div>
                <ul className="summary-list">
                  <li><span>Estado</span><strong className={`status-badge status-${selectedLead.estado}`}>{selectedLead.estado}</strong></li>
                  <li><span>Ciudad</span><strong>{selectedLead.ciudad}</strong></li>
                  <li><span>Asesor</span><strong>{getAsesorName(selectedLead.asesor)}</strong></li>
                  <li><span>Prioridad</span><strong className={getPriorityClass(selectedLead.prioridad || '')}>{selectedLead.prioridad || 'media'}</strong></li>
                  <li><span>Proxima accion</span><strong>{selectedLead.fecha_proxima_accion || 'Sin asignar'}</strong></li>
                </ul>
                <div className="lead-stage-actions">
                  <p>Mover a:</p>
                  <div className="stage-buttons">
                    {STAGES.filter((s) => s.id !== selectedLead.estado).map((s) => (
                      <button
                        key={s.id}
                        className="stage-move-btn"
                        style={{ background: s.color }}
                        disabled={movingLeadId === selectedLead.documentId}
                        onClick={() => moveToStage(selectedLead, s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-selection">Selecciona un lead para ver detalles</p>
            )}
          </div>

          <div className="summary-card">
            <h3>Listo para Strapi</h3>
            <ul className="summary-list static-summary-list">
              <li><span>Campo clave</span><strong>estado</strong></li>
              <li><span>Relacion sugerida</span><strong>asesor</strong></li>
              <li><span>Trazabilidad</span><strong>activities</strong></li>
              <li><span>Proxima accion</span><strong>fecha_proxima_accion</strong></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
