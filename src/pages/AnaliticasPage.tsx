import { useLeads } from '../hooks/useLeads';
import { useAsesores } from '../hooks/useAsesores';
import { useConversaciones } from '../hooks/useConversaciones';
import { PROGRAMAS, FUENTES } from '../lib/api';
import './AnaliticasPage.css';

export function AnaliticasPage() {
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const { data: conversaciones = [] } = useConversaciones();

  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0
    ? Math.round((leads.filter((l) => l.estado === 'calificado' || l.estado === 'cerrado').length / totalLeads * 100))
    : 0;

  const today = new Date();
  const pendingTasks = leads.filter((l) => {
    if (!l.fecha_proxima_accion) return false;
    return new Date(l.fecha_proxima_accion) < today;
  }).length;

  const pendingChats = conversaciones.filter((c) => c.sin_respuesta).length;

  const getEstadoCount = (estado: string) => leads.filter((l) => l.estado === estado).length;
  const getProgramaCount = (programa: string) => leads.filter((l) => l.programa === programa).length;
  const getFuenteCount = (fuente: string) => leads.filter((l) => l.fuente === fuente).length;
  const getAsesorCount = (asesorId: number) => leads.filter((l) => {
    if (typeof l.asesor === 'object' && l.asesor) return l.asesor.id === asesorId;
    return false;
  }).length;

  const maxCount = Math.max(
    ...['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado'].map((e) => getEstadoCount(e)),
    ...PROGRAMAS.map((p) => getProgramaCount(p)),
    ...FUENTES.map((f) => getFuenteCount(f)),
    ...asesores.map((a) => getAsesorCount(a.id))
  );

  const renderBar = (label: string, count: number, color: string) => (
    <div className="bar-item" key={label}>
      <div className="bar-label">
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, background: color }}></div>
      </div>
    </div>
  );

  const leadsPorAsesorPromedio = asesores.length > 0
    ? Math.round(totalLeads / asesores.length)
    : 0;

  const serviceIndicators = [
    { indicator: 'Tasa de conversion total', valor: `${conversionRate}%`, meta: '25%' },
    { indicator: 'Leads nuevos / mes', valor: String(getEstadoCount('nuevo')), meta: '15' },
    { indicator: 'Tiempo promedio respuesta', valor: '--', meta: '1h' },
    { indicator: 'Tasa de respuesta', valor: '--', meta: '90%' },
    { indicator: 'Leads por asesor (promedio)', valor: String(leadsPorAsesorPromedio), meta: '10' },
    { indicator: 'Seguimientos realizados', valor: String(getEstadoCount('contactado') + getEstadoCount('interesado')), meta: '30' },
  ];

  if (leadsLoading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i> Cargando análisis...</div>
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="analytics-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Error al cargar datos: {leadsError.message}</p>
      </div>
    );
  }

  return (
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Tableros operativos listos para tomar datos desde Strapi</h2>
          <p>Los indicadores se calculan desde la capa de datos comun, por eso despues solo cambias el origen y no el tablero.</p>
        </div>
        <div className="intro-chip-group">
          <span className="intro-chip">BI academico</span>
        </div>
      </section>

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Leads</span>
            <span className="kpi-icon"><i className="fas fa-users"></i></span>
          </div>
          <div className="kpi-value">{totalLeads}</div>
          <div className="kpi-change">Base analizada</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Conversion</span>
            <span className="kpi-icon"><i className="fas fa-percent"></i></span>
          </div>
          <div className="kpi-value">{conversionRate}%</div>
          <div className="kpi-change">Matriculados sobre total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Seguimientos vencidos</span>
            <span className="kpi-icon"><i className="fas fa-calendar-xmark"></i></span>
          </div>
          <div className="kpi-value">{pendingTasks}</div>
          <div className="kpi-change negative">Alertas operativas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Chats pendientes</span>
            <span className="kpi-icon"><i className="fas fa-comment-slash"></i></span>
          </div>
          <div className="kpi-value">{pendingChats}</div>
          <div className="kpi-change">Bandeja comercial</div>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Embudo comercial</h2>
              <p className="section-subtitle">Distribucion por estado del lead.</p>
            </div>
          </div>
          <div className="bar-list">
            {renderBar('Nuevo', getEstadoCount('nuevo'), '#4a90d9')}
            {renderBar('Contactado', getEstadoCount('contactado'), '#f39c12')}
            {renderBar('Interesado', getEstadoCount('interesado'), '#2ecc71')}
            {renderBar('Calificado', getEstadoCount('calificado'), '#9b59b6')}
            {renderBar('Cerrado', getEstadoCount('cerrado'), '#e74c3c')}
          </div>
        </section>

        <section className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Leads por programa</h2>
              <p className="section-subtitle">Prioriza programas con mayor volumen.</p>
            </div>
          </div>
          <div className="bar-list">
            {PROGRAMAS.map((p) => renderBar(p, getProgramaCount(p), '#4a90d9'))}
          </div>
        </section>

        <section className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Leads por fuente</h2>
              <p className="section-subtitle">Mide rendimiento de canales de captacion.</p>
            </div>
          </div>
          <div className="bar-list">
            {FUENTES.map((f) => renderBar(f.charAt(0).toUpperCase() + f.slice(1), getFuenteCount(f), '#2ecc71'))}
          </div>
        </section>

        <section className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Carga por asesor</h2>
              <p className="section-subtitle">Ayuda a distribuir la operacion del equipo.</p>
            </div>
          </div>
          <div className="bar-list">
            {asesoresLoading ? (
              <p className="no-data-message">Cargando asesores...</p>
            ) : asesores.length === 0 ? (
              <p className="no-data-message">Sin asesores registrados aún.</p>
            ) : (
              asesores.map((a) => renderBar(a.nombre, getAsesorCount(a.id), '#9b59b6'))
            )}
          </div>
        </section>
      </div>

      <section className="table-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Indicadores de servicio</h2>
            <p className="section-subtitle">KPIs base recomendados para el trabajo de grado.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Valor</th>
                <th>Meta sugerida</th>
              </tr>
            </thead>
            <tbody>
              {serviceIndicators.map((item) => (
                <tr key={item.indicator}>
                  <td>{item.indicator}</td>
                  <td><strong>{item.valor}</strong></td>
                  <td>{item.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
