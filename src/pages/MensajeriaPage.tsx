import { useEffect, useRef, useState } from 'react';
import { useConversaciones, useConversacion } from '../hooks/useConversaciones';
import { useCreateMensaje } from '../hooks/useMensajes';
import type { Lead } from '../lib/api';
import './MensajeriaPage.css';

export function MensajeriaPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState('todos');

  const { data: conversaciones = [], isLoading } = useConversaciones(10000);
  const { data: convActual } = useConversacion(selectedId ?? undefined, selectedId ? 10000 : false);
  const createMensaje = useCreateMensaje();

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convActual?.mensajes]);

  const activeConversations = conversaciones.filter((c) => {
    const leadEstado = c.lead?.estado || '';
    return !leadEstado.includes('cerrado');
  });
  const pendingCount = conversaciones.filter((c) => c.sin_respuesta).length;

  const filteredConversaciones = conversaciones.filter((conv) => {
    const nombreLead = conv.lead ? `${conv.lead.nombres} ${conv.lead.apellidos}` : 'Sin lead';
    const matchesSearch =
      searchTerm === '' ||
      nombreLead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.ultimo_mensaje || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (tabFilter === 'nuevos') {
      matchesTab = !conv.mensajes || conv.mensajes.length === 0;
    } else if (tabFilter === 'seguimiento') {
      matchesTab = conv.lead?.estado === 'interesado';
    } else if (tabFilter === 'sin-respuesta') {
      matchesTab = conv.sin_respuesta;
    }

    return matchesSearch && matchesTab;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedId || !convActual) return;
    createMensaje.mutate(
      {
        conversacion: selectedId,
        contenido: newMessage.trim(),
        tipo: 'salida',
        canal: convActual.canal,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => setNewMessage(''),
      }
    );
  };

  const getAsesorNombre = (asesor: Lead['asesor']) => {
    if (!asesor) return 'Sin asignar';
    if (typeof asesor === 'object') return asesor.nombre;
    if (typeof asesor === 'string') return asesor;
    return String(asesor);
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;

    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `hace ${diffD}d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'whatsapp': return 'fab fa-whatsapp';
      case 'email': return 'fas fa-envelope';
      case 'sms': return 'fas fa-comment-sms';
      default: return 'fas fa-comment';
    }
  };

  const getInitials = (nombre: string) =>
    nombre.split(' ').map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);

  const getAvatarColor = (nombre: string) => {
    const colors = ['#4a90d9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    return colors[nombre.charCodeAt(0) % colors.length];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Bandeja unificada lista para enlazar con Strapi</h2>
          <p>La mensajeria ya queda conectada al lead y a la trazabilidad, aunque hoy funcione con datos locales.</p>
        </div>
        <div className="intro-chip-group">
          <span className="intro-chip">WhatsApp first</span>
        </div>
      </section>

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Conversaciones activas</span>
            <span className="kpi-icon"><i className="fas fa-comments"></i></span>
          </div>
          <div className="kpi-value">{activeConversations.length}</div>
          <div className="kpi-change">Bandeja consolidada</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Sin respuesta</span>
            <span className="kpi-icon"><i className="fas fa-clock"></i></span>
          </div>
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-change negative">Pendientes de atencion</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Tiempo promedio</span>
            <span className="kpi-icon"><i className="fas fa-stopwatch"></i></span>
          </div>
          <div className="kpi-value">--</div>
          <div className="kpi-change">Medicion operativa</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Conversion estimada</span>
            <span className="kpi-icon"><i className="fas fa-user-check"></i></span>
          </div>
          <div className="kpi-value">--</div>
          <div className="kpi-change">Calificados y matriculados</div>
        </div>
      </div>

      <div className="messaging-layout">
        <section className="messaging-sidebar-panel">
          <div className="messaging-panel-header">
            <div>
              <h2><i className="fab fa-whatsapp"></i> Bandeja de conversaciones</h2>
              <p>Busca por lead, programa, ciudad o tema para trabajar la operacion comercial.</p>
            </div>
          </div>

          <div className="messaging-search">
            <i className="fas fa-search"></i>
            <input
              id="messagingSearchInput"
              type="text"
              placeholder="Buscar por nombre, programa, ciudad o etiqueta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="messaging-tabs">
            {(['todos', 'nuevos', 'seguimiento', 'sin-respuesta'] as const).map((tab) => (
              <button
                key={tab}
                className={`messaging-tab ${tabFilter === tab ? 'active' : ''}`}
                onClick={() => setTabFilter(tab)}
              >
                {tab === 'todos' ? 'Todos' : tab === 'nuevos' ? 'Nuevos' : tab === 'seguimiento' ? 'Seguimiento' : 'Sin respuesta'}
              </button>
            ))}
          </div>

          <div className="conversation-list">
            {isLoading ? (
              <p className="no-conversations">Cargando...</p>
            ) : filteredConversaciones.length === 0 ? (
              <p className="no-conversations">
                {searchTerm || tabFilter !== 'todos'
                  ? 'No hay conversaciones que coincidan'
                  : 'No hay conversaciones aún. n8n creará una cuando llegue el primer mensaje por WhatsApp.'}
              </p>
            ) : (
              filteredConversaciones.map((conv) => {
                const nombreLead = conv.lead ? `${conv.lead.nombres} ${conv.lead.apellidos}` : 'Sin lead';
                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedId === conv.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(conv.id)}
                  >
                    <div className="conversation-avatar" style={{ background: getAvatarColor(nombreLead) }}>
                      {getInitials(nombreLead)}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header-row">
                        <span className="conversation-name">{nombreLead}</span>
                        <span className="conversation-time">{formatRelativeTime(conv.ultimo_mensaje_at || conv.createdAt)}</span>
                      </div>
                      <p className="conversation-preview">{conv.ultimo_mensaje || 'Sin mensajes'}</p>
                      <div className="conversation-meta">
                        <span className={`status-dot ${conv.sin_respuesta ? 'pending' : 'responded'}`}></span>
                        <i className={`${getCanalIcon(conv.canal)} canal-icon`}></i>
                        <span className="conversation-program">{conv.lead?.programa || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="chat-panel">
          {selectedId && convActual ? (
            <>
              <div className="chat-header">
                <div className="chat-contact">
                  <div className="chat-contact-avatar" style={{ background: getAvatarColor(convActual.lead ? `${convActual.lead.nombres} ${convActual.lead.apellidos}` : 'Sin lead') }}>
                    {getInitials(convActual.lead ? `${convActual.lead.nombres} ${convActual.lead.apellidos}` : 'SL')}
                  </div>
                  <div>
                    <h2>{convActual.lead ? `${convActual.lead.nombres} ${convActual.lead.apellidos}` : 'Sin lead'}</h2>
                    <p>{convActual.lead?.programa || '-'} - {convActual.lead?.ciudad || '-'}</p>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <span className="chat-channel-badge">
                    <i className={getCanalIcon(convActual.canal)}></i> {convActual.canal}
                  </span>
                  <button className="messaging-icon-btn"><i className="fas fa-phone"></i></button>
                  <button className="messaging-icon-btn"><i className="fas fa-ellipsis-v"></i></button>
                </div>
              </div>

              <div className="chat-messages">
                {(!convActual.mensajes || convActual.mensajes.length === 0) ? (
                  <div className="chat-empty">
                    <i className="fas fa-comment-dots"></i>
                    <p>Sin mensajes aún</p>
                  </div>
                ) : (
                  convActual.mensajes.map((msg) => (
                    <div key={msg.id} className={`message ${msg.tipo}`}>
                      <div className="message-bubble">
                        <p>{msg.contenido}</p>
                        <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-composer">
                <button className="messaging-icon-btn"><i className="fas fa-paperclip"></i></button>
                <input
                  type="text"
                  placeholder="Escribe una respuesta para dejarla registrada en el historial"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={createMensaje.isPending || !newMessage.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <i className="fas fa-comments"></i>
              <p>Selecciona una conversacion para comenzar</p>
            </div>
          )}
        </section>

        <aside className="conversation-summary">
          {selectedId && convActual ? (
            <>
              <div className="summary-card">
                <h3>Resumen del lead</h3>
                <ul className="summary-list">
                  <li>
                    <span>Estado</span>
                    <strong className={`status-badge status-${convActual.lead?.estado || 'nuevo'}`}>
                      {convActual.lead?.estado || 'Sin estado'}
                    </strong>
                  </li>
                  <li>
                    <span>Canal</span>
                    <strong><i className={`${getCanalIcon(convActual.canal)}`}></i> {convActual.canal}</strong>
                  </li>
                  <li>
                    <span>Ciudad</span>
                    <strong>{convActual.lead?.ciudad || '-'}</strong>
                  </li>
                  <li>
                    <span>Asesor</span>
                    <strong>{getAsesorNombre(convActual.lead?.asesor)}</strong>
                  </li>
                  <li>
                    <span>Tiempo de respuesta</span>
                    <strong>{convActual.sin_respuesta ? 'Sin responder' : 'Respondido'}</strong>
                  </li>
                </ul>
              </div>

              <div className="summary-card">
                <h3>Proxima accion</h3>
                <div className="next-action-card">
                  <span className="next-action-tag">Sin etiqueta</span>
                  <p>{convActual.lead?.fecha_proxima_accion || 'Sin proxima accion registrada.'}</p>
                </div>
              </div>

              <div className="summary-card">
                <h3>Actividad reciente</h3>
                <div className="activity-list">
                  {convActual.mensajes && convActual.mensajes.length > 0 ? (
                    convActual.mensajes.slice(-3).map((msg) => (
                      <div key={msg.id} className="activity-item">
                        <span className={`activity-dot ${msg.tipo}`}></span>
                        <p>{msg.contenido}</p>
                        <span className="activity-time">
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-activities">Sin actividad reciente</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="summary-empty">
              <p>Selecciona una conversacion para ver el resumen</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
