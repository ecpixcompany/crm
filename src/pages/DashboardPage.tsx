import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../lib/api';
import { useConfiguracion } from '../hooks/useConfiguracion';

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
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Operacion comercial preparada para Strapi</h2>
          <p>El dashboard consume la misma capa de datos que luego podras alimentar desde Strapi sin rehacer las vistas.</p>
        </div>
        <div className="intro-chip-group">
          {config?.modo_demo && <span className="intro-chip" id="dataModeChip">Modo demo</span>}
          <span className="intro-chip">UNIMETA</span>
        </div>
      </section>

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Leads totales</span>
            <span className="kpi-icon"><i className="fas fa-users"></i></span>
          </div>
          <div className="kpi-value">{isLoading ? '...' : totalLeads}</div>
          <div className="kpi-change">Base comercial consolidada</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Leads activos</span>
            <span className="kpi-icon"><i className="fas fa-user-clock"></i></span>
          </div>
          <div className="kpi-value">{isLoading ? '...' : activeLeads}</div>
          <div className="kpi-change">Sin estados cerrados</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Calificados</span>
            <span className="kpi-icon"><i className="fas fa-check-double"></i></span>
          </div>
          <div className="kpi-value">{isLoading ? '...' : qualifiedLeads}</div>
          <div className="kpi-change">Listos para cierre</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Conversion</span>
            <span className="kpi-icon"><i className="fas fa-chart-line"></i></span>
          </div>
          <div className="kpi-value">{isLoading ? '...' : `${conversionRate}%`}</div>
          <div className="kpi-change">Matriculados sobre total</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Embudo por estado</h2>
              <p className="section-subtitle">Resumen dinamico del pipeline comercial.</p>
            </div>
          </div>
          <div id="dashboardFunnel" className="funnel-list">
            {error && <p className="error-message">Error cargando datos</p>}
          </div>
        </section>

        <section className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Alertas operativas</h2>
              <p className="section-subtitle">Seguimientos vencidos y conversaciones pendientes.</p>
            </div>
          </div>
          <div id="dashboardAlerts" className="alert-list"></div>
        </section>
      </div>

      <section className="table-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Actividad comercial reciente</h2>
            <p className="section-subtitle">Cada fila abre la hoja de vida del lead.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Programa</th>
                <th>Asesor</th>
                <th>Estado</th>
                <th>Proxima accion</th>
              </tr>
            </thead>
            <tbody id="dashboardRecentTableBody">
              {isLoading && <tr><td colSpan={5}>Cargando...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
