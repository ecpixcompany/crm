import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faArrowLeft,
  faPencilAlt,
  faTrash,
  faSave,
  faHistory,
  faPlus,
  faPhone,
  faEnvelope,
  faUsers,
  faMapMarkerAlt,
  faExchangeAlt,
  faStickyNote,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import {
  PROGRAMAS,
  ESTADOS,
  FUENTES,
  PRIORIDADES,
  TIPOS_ACCION,
  type Lead,
  type Actividad,
} from "../../lib/api";
import { useLead, useUpdateLead, useDeleteLead } from "../../hooks/useLeads";
import { useAsesores, useCreateAsesor } from "../../hooks/useAsesores";
import {
  useActividades,
  useCreateActividad,
  useUpdateActividad,
  useDeleteActividad,
} from "../../hooks/useActividades";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar";

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

  if (lead && !formData) {
    setFormData(lead);
  }

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
      { onSuccess: () => setIsEditing(false) },
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
        { onSuccess: () => closeActivityForm() },
      );
    } else {
      createActividad.mutate(
        {
          lead: lead!.id,
          tipo: activityData.tipo,
          descripcion: activityData.descripcion,
          timestamp: new Date().toISOString(),
          asesor: activityData.asesor ? Number(activityData.asesor) : undefined,
        },
        { onSuccess: () => closeActivityForm() },
      );
    }
  };

  const handleDeleteActivity = (documentId: string) => {
    if (confirm("¿Eliminar esta actividad?")) {
      deleteActividad.mutate(documentId, {
        onError: (err) => console.error("deleteActividad error:", err),
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

  const getActivityIcon = (tipo: string): IconDefinition => {
    switch (tipo) {
      case "llamada": return faPhone;
      case "correo": return faEnvelope;
      case "reunion": return faUsers;
      case "visita": return faMapMarkerAlt;
      case "cambio_estado": return faExchangeAlt;
      default: return faStickyNote;
    }
  };

  const activityTone = (tipo: string) => {
    switch (tipo) {
      case "llamada": return { bar: "border-l-blue-500", icon: "text-blue-600", bg: "bg-blue-50" };
      case "correo": return { bar: "border-l-amber-500", icon: "text-amber-600", bg: "bg-amber-50" };
      case "reunion": return { bar: "border-l-emerald-500", icon: "text-emerald-600", bg: "bg-emerald-50" };
      case "visita": return { bar: "border-l-violet-500", icon: "text-violet-600", bg: "bg-violet-50" };
      case "cambio_estado": return { bar: "border-l-slate-700", icon: "text-slate-700", bg: "bg-slate-100" };
      default: return { bar: "border-l-slate-400", icon: "text-slate-500", bg: "bg-slate-50" };
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

  const inputCls =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
  const selectCls = inputCls;
  const labelCls = "text-[12px] font-medium text-slate-700";

  if (isLoading || error || !lead) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="rounded-xl border border-slate-200/70 bg-white p-8 shadow-xl">
          <p className="text-[13px] text-slate-500">
            {isLoading ? "Cargando…" : "Error cargando lead"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 px-6 py-4">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-slate-900">
              Detalle del lead
            </h2>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Edita, registra actividades y consulta la trazabilidad.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="border-b border-slate-200/70 p-6 lg:border-b-0 lg:border-r">
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style={{ background: getAvatarColor(lead.nombres) }}
                >
                  {lead.nombres?.charAt(0)}
                  {lead.apellidos?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                    {lead.nombres} {lead.apellidos}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-slate-500">
                    {lead.programa}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {lead.estado}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/15">
                      {lead.prioridad || "media"}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Nombres</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={formData?.nombres || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, nombres: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Apellidos</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={formData?.apellidos || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, apellidos: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Programa</label>
                    <select
                      className={selectCls}
                      value={formData?.programa || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, programa: e.target.value })}
                    >
                      {PROGRAMAS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Estado</label>
                    <select
                      className={selectCls}
                      value={formData?.estado || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, estado: e.target.value })}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Cedula</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={formData?.cedula || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, cedula: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Celular</label>
                    <input
                      type="tel"
                      className={inputCls}
                      value={formData?.celular || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, celular: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Correo</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={formData?.correo || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, correo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Ciudad</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={formData?.ciudad || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Fuente</label>
                    <select
                      className={selectCls}
                      value={formData?.fuente || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, fuente: e.target.value })}
                    >
                      {FUENTES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Asesor</label>
                    {asesoresLoading ? (
                      <span className="text-[12px] text-slate-500">Cargando asesores…</span>
                    ) : asesores.length === 0 ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-[12px] text-slate-500">No hay asesores registrados.</span>
                        <AsesorQuickCreate
                          onCreated={(a) => setFormData({ ...formData!, asesor: a.id })}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <select
                          className={selectCls}
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
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                          ))}
                        </select>
                        <AsesorQuickCreate
                          onCreated={(a) => setFormData({ ...formData!, asesor: a.id })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Prioridad</label>
                    <select
                      className={selectCls}
                      value={formData?.prioridad || "media"}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, prioridad: e.target.value })}
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Ultimo contacto</label>
                    <input
                      type="date"
                      className={inputCls}
                      value={formData?.fecha_ultimo_contacto || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, fecha_ultimo_contacto: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Proxima accion</label>
                    <input
                      type="date"
                      className={inputCls}
                      value={formData?.fecha_proxima_accion || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, fecha_proxima_accion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={labelCls}>Tipo proxima accion</label>
                    <select
                      className={selectCls}
                      value={formData?.tipo_proxima_accion || ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData!, tipo_proxima_accion: e.target.value })
                      }
                    >
                      <option value="">Sin accion</option>
                      {TIPOS_ACCION.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={labelCls}>Notas</label>
                    <textarea
                      className={cn(inputCls, "min-h-[96px] resize-y")}
                      value={formData?.notas || ""}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData!, notas: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/70 pt-5">
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
                        Volver
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-700"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setFormData(lead);
                        }}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800"
                      >
                        <FontAwesomeIcon icon={faPencilAlt} className="text-[11px]" />
                        Editar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData(lead);
                        }}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateLead.isPending}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-unimeta-red px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-unimeta-red-dark disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faSave} className="text-[11px]" />
                        {updateLead.isPending ? "Guardando…" : "Guardar"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <FontAwesomeIcon icon={faHistory} className="text-slate-500" />
                <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">
                  Trazabilidad
                </h3>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3">
                <SummaryMini label="Fuente" value={formData?.fuente || "Sin fuente"} />
                <SummaryMini label="Asesor" value={getAsesorDisplayName(formData?.asesor || null)} />
                <SummaryMini label="Prioridad" value={formData?.prioridad || "Media"} />
                <SummaryMini
                  label="Proxima accion"
                  value={formData?.fecha_proxima_accion || "Sin proxima accion"}
                />
              </div>

              {showActivityForm ? (
                <div className="mb-5 space-y-4 rounded-lg border border-slate-200/70 bg-slate-50/50 p-4">
                  <h4 className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-700">
                    {editingActivityId ? "Editar actividad" : "Registrar actividad"}
                  </h4>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Tipo</label>
                    <select
                      className={selectCls}
                      value={activityData.tipo}
                      onChange={(e) =>
                        setActivityData({ ...activityData, tipo: e.target.value as Actividad["tipo"] })
                      }
                    >
                      <option value="llamada">Llamada</option>
                      <option value="correo">Correo</option>
                      <option value="reunion">Reunion</option>
                      <option value="visita">Visita</option>
                      <option value="nota">Nota</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Descripcion</label>
                    <textarea
                      className={cn(inputCls, "min-h-[72px] resize-y")}
                      value={activityData.descripcion}
                      onChange={(e) => setActivityData({ ...activityData, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Asesor (opcional)</label>
                    {asesoresLoading ? (
                      <span className="text-[12px] text-slate-500">Cargando…</span>
                    ) : (
                      <select
                        className={selectCls}
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
                          <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeActivityForm}
                      className="inline-flex h-9 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateActivity}
                      disabled={createActividad.isPending || updateActividad.isPending}
                      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faSave} className="text-[11px]" />
                      {createActividad.isPending || updateActividad.isPending ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowActivityForm(true)}
                  className="mb-5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
                  Registrar actividad
                </button>
              )}

              <ul className="space-y-2">
                {actividades.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-200/70 py-8 text-center text-[12.5px] text-slate-500">
                    Sin actividad registrada
                  </li>
                ) : (
                  actividades.map((act) => {
                    const t = activityTone(act.tipo);
                    return (
                      <li
                        key={act.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-md border-l-[3px] p-3",
                          t.bar,
                          t.bg
                        )}
                      >
                        <FontAwesomeIcon
                          icon={getActivityIcon(act.tipo)}
                          className={cn("mt-0.5 size-3.5 shrink-0", t.icon)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[12.5px] leading-snug text-slate-700">
                            {act.descripcion}
                          </p>
                          <span className="mt-1 block text-[10.5px] text-slate-500">
                            {(act.asesor && typeof act.asesor === "object" ? act.asesor.nombre : "Sin asesor")} · {formatTimestamp(act.timestamp)}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditActivityForm(act)}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faPencilAlt} className="text-[11px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.documentId)}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-rose-600"
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                          </button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/50 p-3">
      <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <strong className="mt-1 block truncate text-[12.5px] text-slate-900">{value}</strong>
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 cursor-pointer items-center gap-1.5 self-start rounded-md px-2 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
      >
        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
        Crear asesor
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 text-[12.5px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
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
        onClick={submit}
        disabled={!nombre.trim() || createAsesor.isPending}
        className="inline-flex h-9 cursor-pointer items-center rounded-md bg-slate-900 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
      >
        {createAsesor.isPending ? "Creando…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setNombre("");
        }}
        className="inline-flex h-9 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Cancelar
      </button>
    </div>
  );
}
