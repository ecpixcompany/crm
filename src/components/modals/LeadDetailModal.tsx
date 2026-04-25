import { useState, useEffect } from "react";
import { PROGRAMAS, ESTADOS, FUENTES, PRIORIDADES, TIPOS_ACCION } from "../../lib/api";
import type { Lead } from "../../lib/api";
import type { Actividad } from "../../lib/api";
import { useLead, useUpdateLead, useDeleteLead } from "../../hooks/useLeads";
import { useAsesores, useCreateAsesor } from "../../hooks/useAsesores";
import { useActividades, useCreateActividad, useUpdateActividad, useDeleteActividad } from "../../hooks/useActividades";

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailModal({ leadId, onClose }: LeadDetailModalProps) {
  const { data: lead, isLoading, error } = useLead(leadId);
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const { data: actividades = [] } = useActividades(lead?.id);
  const createActividad = useCreateActividad();
  const updateActividad = useUpdateActividad();
  const deleteActividad = useDeleteActividad();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Lead | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityData, setActivityData] = useState({
    tipo: "llamada" as Actividad["tipo"],
    descripcion: "",
    asesor: "" as number | "",
  });

  useEffect(() => {
    if (lead && !formData) setFormData(lead);
  }, [lead]);

  const getAsesorDisplayValue = (asesor: Lead["asesor"]) => {
    if (!asesor) return "";
    if (typeof asesor === "string") return asesor;
    if (typeof asesor === "number") return asesor;
    return asesor.id;
  };

  const getAsesorDisplayName = (asesor: Lead["asesor"]) => {
    if (!asesor) return "Sin asignar";
    if (typeof asesor === "string") return asesor;
    if (typeof asesor === "number") return String(asesor);
    return asesor.nombre;
  };

  const handleSave = () => {
    if (!formData) return;
    const dataToSave = { ...formData };
    if (typeof dataToSave.asesor === "object" && dataToSave.asesor) {
      dataToSave.asesor = dataToSave.asesor.id;
    }
    updateLead.mutate(
      { id: leadId, data: dataToSave },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDelete = () => {
    if (confirm("¿Estás seguro de eliminar este lead?")) {
      deleteLead.mutate(leadId, { onSuccess: () => onClose() });
    }
  };

  const handleCreateActivity = () => {
    if (!activityData.descripcion.trim()) return;
    if (editingActivityId) {
      const act = actividades.find((a) => a.documentId === editingActivityId);
      if (!act) return;
      updateActividad.mutate(
        {
          documentId: editingActivityId,
          data: {
            tipo: activityData.tipo,
            descripcion: activityData.descripcion,
            asesor: activityData.asesor ? Number(activityData.asesor) : undefined,
          },
        },
        {
          onError: (err) => console.error("🐼 ~ updateActividad error:", err),
          onSuccess: () => {
            setActivityData({ tipo: "llamada", descripcion: "", asesor: "" });
            setShowActivityForm(false);
            setEditingActivityId(null);
          },
        },
      );
    } else {
      createActividad.mutate(
        {
          lead: lead!.id,
          tipo: activityData.tipo,
          descripcion: activityData.descripcion,
          asesor: activityData.asesor ? Number(activityData.asesor) : undefined,
          timestamp: new Date().toISOString(),
        },
        {
          onSuccess: () => {
            setActivityData({ tipo: "llamada", descripcion: "", asesor: "" });
            setShowActivityForm(false);
          },
        },
      );
    }
  };

  const handleDeleteActivity = (documentId: string) => {
    if (confirm("¿Eliminar esta actividad?")) {
      deleteActividad.mutate(documentId, {
        onError: (err) => console.error("🐼 ~ deleteActividad error:", err),
      });
    }
  };

  const openEditActivityForm = (act: Actividad) => {
    setEditingActivityId(act.documentId);
    const asesorValue = (() => {
      if (!act.asesor) return "";
      if (typeof act.asesor === "number") return String(act.asesor);
      return String(act.asesor.id);
    })();
    setActivityData({
      tipo: act.tipo,
      descripcion: act.descripcion || "",
      asesor: asesorValue as number | "",
    });
    setShowActivityForm(true);
  };

  const closeActivityForm = () => {
    setShowActivityForm(false);
    setEditingActivityId(null);
    setActivityData({ tipo: "llamada", descripcion: "", asesor: "" });
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case "llamada":
        return "fa-phone";
      case "correo":
        return "fa-envelope";
      case "reunion":
        return "fa-users";
      case "visita":
        return "fa-map-marker";
      case "cambio_estado":
        return "fa-exchange-alt";
      default:
        return "fa-sticky-note";
    }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvatarColor = (nombre: string) => {
    const colors = ["#4a90d9", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"];
    return colors[nombre.charCodeAt(0) % colors.length];
  };

  if (isLoading)
    return (
      <div className="lead-create-modal">
        <div className="lead-modal-overlay" onClick={onClose}></div>
        <div className="lead-modal-content lead-modal-content-wide">
          <div className="lead-modal-body">
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );

  if (error || !lead)
    return (
      <div className="lead-create-modal">
        <div className="lead-modal-overlay" onClick={onClose}></div>
        <div className="lead-modal-content lead-modal-content-wide">
          <div className="lead-modal-body">
            <p>Error cargando lead</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="lead-create-modal">
      <div className="lead-modal-overlay" onClick={onClose}></div>
      <div className="lead-modal-content lead-modal-content-wide">
        <div className="lead-modal-header">
          <h2>Detalle del Lead</h2>
          <button className="lead-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="lead-modal-body">
          <button className="btn-back-to-list" onClick={onClose}>
            <i className="fas fa-arrow-left"></i> Volver al listado
          </button>
          <div className="leads-container">
            <div className="lead-info-panel">
              <div className="lead-avatar-section">
                <div
                  className="lead-avatar-large"
                  style={{ background: getAvatarColor(lead.nombres) }}
                >
                  {lead.nombres?.charAt(0)}
                  {lead.apellidos?.charAt(0)}
                </div>
                <div className="lead-name-display">
                  {lead.nombres} {lead.apellidos}
                </div>
                <div className="lead-program-display">{lead.programa}</div>
                <div className="meta-chip-group">
                  <span className="meta-chip">{lead.estado}</span>
                  <span className="meta-chip">{lead.prioridad || "media"}</span>
                </div>
              </div>
              <form>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombres</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData?.nombres || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, nombres: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData?.apellidos || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, apellidos: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Programa</label>
                    <select
                      className="form-input"
                      value={formData?.programa || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, programa: e.target.value })
                      }
                    >
                      {PROGRAMAS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-input"
                      value={formData?.estado || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, estado: e.target.value })
                      }
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cedula</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData?.cedula || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, cedula: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Celular</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData?.celular || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, celular: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData?.correo || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, correo: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ciudad</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData?.ciudad || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, ciudad: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuente</label>
                    <select
                      className="form-input"
                      value={formData?.fuente || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, fuente: e.target.value })
                      }
                    >
                      {FUENTES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Asesor</label>
                    {asesoresLoading ?
                      <span className="form-hint-inline">Cargando asesores...</span>
                    : asesores.length === 0 ?
                      <div className="form-hint-inline">
                        <span>No hay asesores registrados.</span>
                        <AsesorQuickCreate
                          onCreated={(a) => setFormData({ ...formData!, asesor: a.id })}
                        />
                      </div>
                    : <>
                        <select
                          className="form-input"
                          value={getAsesorDisplayValue(formData?.asesor || null) || ""}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setFormData({
                              ...formData!,
                              asesor: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        >
                          <option value="">Sin asignar</option>
                          {asesores.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nombre}
                            </option>
                          ))}
                        </select>
                        <AsesorQuickCreate
                          onCreated={(a) => setFormData({ ...formData!, asesor: a.id })}
                        />
                      </>
                    }
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prioridad</label>
                    <select
                      className="form-input"
                      value={formData?.prioridad || "media"}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, prioridad: e.target.value })
                      }
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ultimo contacto</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData?.fecha_ultimo_contacto || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({
                          ...formData!,
                          fecha_ultimo_contacto: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proxima accion</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData?.fecha_proxima_accion || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({
                          ...formData!,
                          fecha_proxima_accion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo proxima accion</label>
                    <select
                      className="form-input"
                      value={formData?.tipo_proxima_accion || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, tipo_proxima_accion: e.target.value })
                      }
                    >
                      <option value="">Sin accion</option>
                      {TIPOS_ACCION.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Notas</label>
                    <textarea
                      className="form-input form-textarea"
                      rows={4}
                      value={formData?.notas || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, notas: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  {!isEditing ?
                    <>
                      <button
                        type="button"
                        className="btn btn-edit"
                        onClick={() => {
                          setIsEditing(true);
                          setFormData(lead);
                        }}
                      >
                        <i className="fas fa-pencil-alt"></i> Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDelete}
                      >
                        <i className="fas fa-trash"></i> Eliminar
                      </button>
                    </>
                  : <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={updateLead.isPending}
                      >
                        <i className="fas fa-save"></i>{" "}
                        {updateLead.isPending ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData(lead);
                        }}
                      >
                        Cancelar
                      </button>
                    </>
                  }
                </div>
              </form>
            </div>
            <div className="lead-timeline">
              <div className="timeline-header">
                <h2>
                  <i className="fas fa-history"></i> Trazabilidad
                </h2>
                <p>Resumen operativo y cronologia del lead.</p>
              </div>
              <div className="timeline-summary-grid">
                <article className="summary-mini-card">
                  <span>Fuente</span>
                  <strong>{formData?.fuente || "Sin fuente"}</strong>
                </article>
                <article className="summary-mini-card">
                  <span>Asesor</span>
                  <strong>{getAsesorDisplayName(formData?.asesor || null)}</strong>
                </article>
                <article className="summary-mini-card">
                  <span>Prioridad</span>
                  <strong>{formData?.prioridad || "Media"}</strong>
                </article>
                <article className="summary-mini-card">
                  <span>Proxima accion</span>
                  <strong>
                    {formData?.fecha_proxima_accion || "Sin proxima accion"}
                  </strong>
                </article>
              </div>

              {showActivityForm ?
                <div className="activity-form">
                  <h4>{editingActivityId ? "Editar actividad" : "Registrar actividad"}</h4>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-input"
                      value={activityData.tipo}
                      onChange={(e) =>
                        setActivityData({
                          ...activityData,
                          tipo: e.target.value as Actividad["tipo"],
                        })
                      }
                    >
                      <option value="llamada">Llamada</option>
                      <option value="correo">Correo</option>
                      <option value="reunion">Reunion</option>
                      <option value="visita">Visita</option>
                      <option value="nota">Nota</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripcion</label>
                    <textarea
                      className="form-input form-textarea"
                      rows={3}
                      value={activityData.descripcion}
                      onChange={(e) =>
                        setActivityData({ ...activityData, descripcion: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Asesor (opcional)</label>
                    {asesoresLoading ?
                      <span className="form-hint-inline">Cargando...</span>
                    : <select
                        className="form-input"
                        value={activityData.asesor}
                        onChange={(e) =>
                          setActivityData({
                            ...activityData,
                            asesor: e.target.value ? Number(e.target.value) : "",
                          })
                        }
                      >
                        <option value="">No asignado</option>
                        {asesores.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                    }
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateActivity}
                      disabled={createActividad.isPending || updateActividad.isPending}
                    >
                      <i className="fas fa-save"></i>{" "}
                      {createActividad.isPending || updateActividad.isPending ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeActivityForm}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              : <button
                  type="button"
                  className="btn btn-primary add-activity-btn"
                  onClick={() => setShowActivityForm(true)}
                >
                  <i className="fas fa-plus"></i> Registrar actividad
                </button>
              }

              <div className="timeline-list">
                {actividades.length === 0 ?
                  <p className="timeline-empty">Sin actividad registrada</p>
                : actividades.map((act) => (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon">
                        <i className={`fas ${getActivityIcon(act.tipo)}`}></i>
                      </div>
                      <div className="activity-content">
                        <p className="activity-desc">{act.descripcion}</p>
                        <span className="activity-meta">
                          {(act.asesor && typeof act.asesor === "object" ? act.asesor.nombre : "Sin asesor")} -{" "}
                          {formatTimestamp(act.timestamp)}
                        </span>
                      </div>
                      <div className="activity-actions">
                        <button
                          type="button"
                          className="btn-icon-sm"
                          onClick={() => openEditActivityForm(act)}
                          title="Editar"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sm btn-danger-sm"
                          onClick={() => handleDeleteActivity(act.documentId)}
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsesorQuickCreate({
  onCreated,
}: {
  onCreated: (asesor: { id: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const createAsesor = useCreateAsesor();

  const submit = () => {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    createAsesor.mutate(
      { nombre: trimmed, activo: true },
      {
        onSuccess: (asesor) => {
          onCreated(asesor);
          setNombre("");
          setOpen(false);
        },
      },
    );
  };

  if (!open) {
    return (
      <button type="button" className="btn-link-inline" onClick={() => setOpen(true)}>
        <i className="fas fa-plus"></i> Crear asesor
      </button>
    );
  }

  return (
    <div className="asesor-quick-create">
      <input
        type="text"
        className="form-input"
        placeholder="Nombre del asesor"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        autoFocus
      />
      <button
        type="button"
        className="btn btn-primary"
        onClick={submit}
        disabled={!nombre.trim() || createAsesor.isPending}
      >
        {createAsesor.isPending ? "Creando..." : "Guardar"}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          setOpen(false);
          setNombre("");
        }}
      >
        Cancelar
      </button>
    </div>
  );
}
