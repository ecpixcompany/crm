import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCommentSms,
  faComment,
  faComments,
  faClock,
  faStopwatch,
  faUserCheck,
  faSearch,
  faPhone,
  faEllipsisV,
  faSpinner,
  faCommentDots,
  faPaperclip,
  faPaperPlane,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp as faWhatsappBrand } from "@fortawesome/free-brands-svg-icons";
import { useConversaciones, useConversacion } from "../hooks/useConversaciones";
import { useCreateMensaje, useMensajes } from "../hooks/useMensajes";
import { useConfiguracionAiByLead, useCreateConfiguracionAi, useUpdateConfiguracionAi } from "../hooks/useConfiguracionAi";
import type { Lead } from "../lib/api";
import { sendMessageViaN8N, MODELOS_AI } from "../lib/api";
import { cn } from "@/lib/utils";

export function MensajeriaPage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState("todos");

  const { data: conversaciones = [], isLoading } = useConversaciones(10000);
  const { data: convActual } = useConversacion(
    selectedDocumentId ?? undefined,
    selectedDocumentId ? 500 : false,
  );
  const { data: mensajes = [], isLoading: mensajesLoading } = useMensajes(
    selectedDocumentId ?? undefined,
    selectedDocumentId ? 500 : false,
  );
  const createMensaje = useCreateMensaje();
  const { data: configAi } = useConfiguracionAiByLead(convActual?.lead?.documentId);
  const createConfigAi = useCreateConfiguracionAi();
  const updateConfigAi = useUpdateConfiguracionAi();
  const [promptDraft, setPromptDraft] = useState(() => configAi?.prompt_custom || "");
  const [notasDraft, setNotasDraft] = useState(() => configAi?.notas_ai || "");
  const [lastDocId, setLastDocId] = useState(configAi?.documentId);
  if (configAi?.documentId !== lastDocId) {
    setLastDocId(configAi?.documentId);
    setPromptDraft(configAi?.prompt_custom || "");
    setNotasDraft(configAi?.notas_ai || "");
  }

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const activeConversations = conversaciones.filter((c) => {
    const leadEstado = c.lead?.estado || "";
    return !leadEstado.includes("cerrado");
  });
  const pendingCount = conversaciones.filter((c) => c.sin_respuesta).length;

  const filteredConversaciones = conversaciones.filter((conv) => {
    const nombreLead =
      conv.lead ? `${conv.lead.nombres} ${conv.lead.apellidos}` : "Sin lead";
    const matchesSearch =
      searchTerm === "" ||
      nombreLead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.ultimo_mensaje || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (tabFilter === "nuevos") {
      matchesTab = !conv.mensajes || conv.mensajes.length === 0;
    } else if (tabFilter === "seguimiento") {
      matchesTab = conv.lead?.estado === "interesado";
    } else if (tabFilter === "sin-respuesta") {
      matchesTab = conv.sin_respuesta;
    }

    return matchesSearch && matchesTab;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedDocumentId || !convActual) return;
    const phone = convActual.lead?.celular || "";
    createMensaje.mutate(
      {
        conversacionDocumentId: selectedDocumentId,
        contenido: newMessage.trim(),
        tipo: "salida",
        canal: convActual.canal,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setNewMessage("");
          if (phone) {
            sendMessageViaN8N({
              phone,
              message: newMessage.trim(),
              leadName:
                convActual.lead ?
                  `${convActual.lead.nombres} ${convActual.lead.apellidos}`
                : undefined,
            }).catch((err) => console.error("Webhook error:", err));
          }
        },
      },
    );
  };

  const getAsesorNombre = (asesor: Lead["asesor"]) => {
    if (!asesor) return "Sin asignar";
    if (typeof asesor === "object") return asesor.nombre;
    if (typeof asesor === "string") return asesor;
    return String(asesor);
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;

    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `hace ${diffD}d`;

    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  const getCanalIcon = (canal: string): IconDefinition => {
    switch (canal) {
      case "whatsapp":
        return faWhatsappBrand;
      case "email":
        return faEnvelope;
      case "sms":
        return faCommentSms;
      default:
        return faComment;
    }
  };

  const getInitials = (nombre: string) =>
    nombre
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getAvatarColor = (nombre: string) => {
    const colors = ["#0f172a", "#475569", "#0891b2", "#7c3aed", "#db2777"];
    return colors[nombre.charCodeAt(0) % colors.length];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            Mensajeria
          </h2>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Bandeja unificada lista para enlazar con Strapi · WhatsApp first
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          WhatsApp conectado
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMensajeria
          label="Conversaciones activas"
          value={activeConversations.length}
          icon={<FontAwesomeIcon icon={faComments} className="size-4" />}
          accent="default"
        />
        <KpiMensajeria
          label="Sin respuesta"
          value={pendingCount}
          icon={<FontAwesomeIcon icon={faClock} className="size-4" />}
          accent={pendingCount > 0 ? "warning" : "default"}
        />
        <KpiMensajeria
          label="Tiempo promedio"
          value="—"
          icon={<FontAwesomeIcon icon={faStopwatch} className="size-4" />}
          accent="default"
        />
        <KpiMensajeria
          label="Conversion estimada"
          value="—"
          icon={<FontAwesomeIcon icon={faUserCheck} className="size-4" />}
          accent="default"
        />
      </div>

      <div className="grid min-h-[560px] grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          <div className="border-b border-slate-200/70 p-5">
            <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">
              <FontAwesomeIcon
                icon={faWhatsappBrand}
                className="mr-2 text-emerald-500"
              />
              Conversaciones
            </h3>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Busca por lead, programa o ciudad.
            </p>
          </div>

          <div className="flex items-center gap-2.5 border-b border-slate-200/70 bg-slate-50/40 px-4 py-3">
            <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
            <input
              id="messagingSearchInput"
              type="text"
              placeholder="Buscar…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-1.5 border-b border-slate-200/70 px-4 py-2.5">
            {(["todos", "nuevos", "seguimiento", "sin-respuesta"] as const).map((tab) => (
              <button
                key={tab}
                className={cn(
                  "rounded-full border-none px-3 py-1 text-[12px] font-medium transition-colors",
                  tabFilter === tab
                    ? "bg-slate-900 text-white"
                    : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
                onClick={() => setTabFilter(tab)}
              >
                {tab === "todos" ?
                  "Todos"
                : tab === "nuevos" ?
                  "Nuevos"
                : tab === "seguimiento" ?
                  "Seguimiento"
                : "Sin respuesta"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ?
              <p className="px-6 py-8 text-center text-[13px] text-slate-500">Cargando…</p>
            : filteredConversaciones.length === 0 ?
              <p className="px-6 py-8 text-center text-[13px] text-slate-500">
                {searchTerm || tabFilter !== "todos" ?
                  "Sin resultados"
                : "Sin conversaciones aún"}
              </p>
            : filteredConversaciones.map((conv) => {
                const nombreLead =
                  conv.lead ? `${conv.lead.nombres} ${conv.lead.apellidos}` : "Sin lead";
                const isActive = selectedDocumentId === conv.documentId;
                return (
                  <div
                    key={conv.documentId}
                    className={cn(
                      "flex cursor-pointer gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors",
                      isActive
                        ? "border-l-[3px] border-l-slate-900 bg-slate-50"
                        : "hover:bg-slate-50/60"
                    )}
                    onClick={() => setSelectedDocumentId(conv.documentId)}
                  >
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                      style={{ background: getAvatarColor(nombreLead) }}
                    >
                      {getInitials(nombreLead)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="truncate text-[13px] font-semibold text-slate-900">
                          {nombreLead}
                        </span>
                        <span className="shrink-0 text-[11.5px] text-slate-400">
                          {formatRelativeTime(conv.ultimo_mensaje_at || conv.createdAt)}
                        </span>
                      </div>
                      <p className="mb-1.5 truncate text-[12.5px] text-slate-500">
                        {conv.ultimo_mensaje || "Sin mensajes"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            conv.sin_respuesta ? "bg-rose-500" : "bg-emerald-500"
                          )}
                        />
                        <FontAwesomeIcon
                          icon={getCanalIcon(conv.canal)}
                          className="text-[10px]"
                        />
                        <span className="truncate">{conv.lead?.programa || "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          {selectedDocumentId && convActual ?
            <>
              <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-11 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{
                      background: getAvatarColor(
                        convActual.lead ?
                          `${convActual.lead.nombres} ${convActual.lead.apellidos}`
                        : "Sin lead",
                      ),
                    }}
                  >
                    {getInitials(
                      convActual.lead ?
                        `${convActual.lead.nombres} ${convActual.lead.apellidos}`
                      : "SL",
                    )}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                      {convActual.lead ?
                        `${convActual.lead.nombres} ${convActual.lead.apellidos}`
                      : "Sin lead"}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">
                      {convActual.lead?.programa || "—"} · {convActual.lead?.ciudad || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                    <FontAwesomeIcon icon={getCanalIcon(convActual.canal)} className="text-[10px]" />
                    {convActual.canal}
                  </span>
                  <button
                    type="button"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-md border-none text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <FontAwesomeIcon icon={faPhone} className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-md border-none text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <FontAwesomeIcon icon={faEllipsisV} className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/40 p-6">
                {mensajesLoading ?
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
                    <FontAwesomeIcon icon={faSpinner} spin className="size-5" />
                    <p className="text-[13px]">Cargando mensajes…</p>
                  </div>
                : !mensajes || mensajes.length === 0 ?
                  <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
                    <FontAwesomeIcon icon={faCommentDots} className="mb-3 size-10 text-slate-300" />
                    <p className="text-[13px]">Sin mensajes aún</p>
                  </div>
                : mensajes.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[72%]",
                        msg.tipo === "entrada" ? "self-start" : "self-end"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 shadow-sm",
                          msg.tipo === "entrada"
                            ? "rounded-bl-sm border border-slate-200/70 bg-white text-slate-900"
                            : "rounded-br-sm bg-slate-900 text-white"
                        )}
                      >
                        <p className="text-[13.5px] leading-relaxed">{msg.contenido}</p>
                        <span
                          className={cn(
                            "mt-0.5 block text-right text-[10.5px]",
                            msg.tipo === "entrada" ? "text-slate-400" : "text-slate-300"
                          )}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                }
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-2.5 border-t border-slate-200/70 bg-white p-4">
                <button
                  type="button"
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border-none text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <FontAwesomeIcon icon={faPaperclip} className="size-3.5" />
                </button>
                <input
                  type="text"
                  placeholder="Escribe una respuesta…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-10 flex-1 rounded-full border border-slate-300 bg-white px-4 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
                />
                <button
                  type="button"
                  className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSendMessage}
                  disabled={createMensaje.isPending || !newMessage.trim()}
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
                  Enviar
                </button>
              </div>
            </>
          : <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faComments} className="mb-3 size-10 text-slate-300" />
              <p className="text-[13px]">Selecciona una conversacion para comenzar</p>
            </div>
          }
        </section>

        <aside className="flex flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          {selectedDocumentId && convActual ?
            <>
              <SummaryCard title="Resumen del lead">
                <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                  <SummaryRow label="Estado">
                    <StatusBadge estado={convActual.lead?.estado} />
                  </SummaryRow>
                  <SummaryRow label="Canal">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700">
                      <FontAwesomeIcon icon={getCanalIcon(convActual.canal)} className="text-slate-400" />
                      {convActual.canal}
                    </span>
                  </SummaryRow>
                  <SummaryRow label="Ciudad" value={convActual.lead?.ciudad} />
                  <SummaryRow label="Asesor" value={getAsesorNombre(convActual.lead?.asesor)} />
                  <SummaryRow
                    label="Respuesta"
                    value={convActual.sin_respuesta ? "Sin responder" : "Respondido"}
                  />
                </ul>
              </SummaryCard>

              <SummaryCard title="Proxima accion">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-600">
                  Sin etiqueta
                </span>
                <p className="mt-2 text-[13px] text-slate-700">
                  {convActual.lead?.fecha_proxima_accion ||
                    "Sin proxima accion registrada."}
                </p>
              </SummaryCard>

              {convActual?.lead?.documentId ?
                <SummaryCard
                  title="Configuracion AI"
                  right={
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                        configAi?.habilitado
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          configAi?.habilitado ? "bg-emerald-500" : "bg-slate-400"
                        )}
                      />
                      {configAi?.habilitado
                        ? (configAi.modelo || MODELOS_AI[0]).slice(0, 18)
                        : "Pausada"}
                    </span>
                  }
                >
                  {configAi ?
                    <>
                      <div className="mb-3 flex items-center gap-2.5">
                        <ToggleSwitch
                          checked={!!configAi.habilitado}
                          disabled={createConfigAi.isPending || updateConfigAi.isPending}
                          onChange={() => {
                            updateConfigAi.mutate({
                              documentId: configAi.documentId,
                              data: { habilitado: !configAi.habilitado },
                            });
                          }}
                        />
                        <span className="text-[12.5px] text-slate-700">
                          {configAi.habilitado ? "AI activa" : "AI pausada para este lead"}
                        </span>
                      </div>

                      {configAi.habilitado && (
                        <div className="space-y-3">
                          <Field label="Modelo">
                            <select
                              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[13px] text-slate-900 outline-none transition-colors focus:border-slate-900"
                              value={configAi.modelo || MODELOS_AI[0]}
                              disabled={updateConfigAi.isPending}
                              onChange={(e) => {
                                updateConfigAi.mutate({
                                  documentId: configAi.documentId,
                                  data: { modelo: e.target.value },
                                });
                              }}
                            >
                              {MODELOS_AI.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Prompt personalizado">
                            <textarea
                              className="min-h-[72px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
                              placeholder="Instrucciones para este lead…"
                              value={promptDraft}
                              onChange={(e) => setPromptDraft(e.target.value)}
                            />
                          </Field>

                          <Field label="Notas AI (privadas)">
                            <textarea
                              className="min-h-[72px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
                              placeholder="Notas internas del asesor…"
                              value={notasDraft}
                              onChange={(e) => setNotasDraft(e.target.value)}
                            />
                          </Field>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                updateConfigAi.isPending ||
                                (promptDraft === (configAi.prompt_custom || "") &&
                                 notasDraft === (configAi.notas_ai || ""))
                              }
                              onClick={() => {
                                updateConfigAi.mutate({
                                  documentId: configAi.documentId,
                                  data: { prompt_custom: promptDraft, notas_ai: notasDraft },
                                });
                              }}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  : (
                    <>
                      <div className="mb-3 flex items-center gap-2.5">
                        <ToggleSwitch
                          checked={false}
                          disabled={createConfigAi.isPending}
                          onChange={() => {
                            createConfigAi.mutate({
                              leadDocumentId: convActual.lead!.documentId,
                              habilitado: true,
                              modelo: MODELOS_AI[0],
                            });
                          }}
                        />
                        <span className="text-[12.5px] text-slate-500">AI pausada</span>
                      </div>
                      <button
                        type="button"
                        className="h-9 w-full cursor-pointer rounded-md border border-slate-300 bg-white text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        disabled={createConfigAi.isPending}
                        onClick={() => {
                          createConfigAi.mutate({
                            leadDocumentId: convActual.lead!.documentId,
                            habilitado: true,
                            modelo: MODELOS_AI[0],
                          });
                        }}
                      >
                        Activar AI
                      </button>
                    </>
                  )}
                </SummaryCard>
              : null}

              <SummaryCard title="Actividad reciente">
                {mensajes && mensajes.length > 0 ?
                  <ul className="m-0 list-none space-y-2 p-0">
                    {mensajes.slice(-3).map((msg) => (
                      <li
                        key={msg.id}
                        className="flex items-start gap-2.5 rounded-md border border-slate-200/70 p-2.5"
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-1.5 shrink-0 rounded-full",
                            msg.tipo === "entrada" ? "bg-blue-500" : "bg-emerald-500"
                          )}
                        />
                        <p className="m-0 flex-1 text-[12.5px] leading-snug text-slate-700">
                          {msg.contenido}
                        </p>
                        <span className="shrink-0 text-[10.5px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                : <p className="m-0 text-[12.5px] text-slate-500">Sin actividad reciente</p>}
              </SummaryCard>
            </>
          : <div className="flex flex-1 items-center justify-center p-6 text-center text-[13px] text-slate-500">
              Selecciona una conversacion para ver el resumen
            </div>
          }
        </aside>
      </div>
    </div>
  );
}

function KpiMensajeria({
  label,
  value,
  icon,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "default" | "warning" | "success";
}) {
  const a =
    accent === "warning"
      ? { bg: "bg-amber-50", fg: "text-amber-600" }
      : accent === "success"
      ? { bg: "bg-emerald-50", fg: "text-emerald-600" }
      : { bg: "bg-slate-100", fg: "text-slate-600" };
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

function SummaryCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-700">
          {title}
        </h4>
        {right}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="text-[12px] text-slate-500">{label}</span>
      {children ?? <span className="text-[12.5px] font-medium text-slate-900">{value}</span>}
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label className={cn("relative inline-flex cursor-pointer items-center", disabled && "cursor-not-allowed opacity-50")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-slate-900" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </label>
  );
}

function StatusBadge({ estado }: { estado?: string }) {
  const map: Record<string, string> = {
    nuevo: "bg-blue-50 text-blue-700 ring-blue-600/10",
    contactado: "bg-amber-50 text-amber-700 ring-amber-600/15",
    interesado: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    calificado: "bg-violet-50 text-violet-700 ring-violet-600/15",
    cerrado: "bg-slate-100 text-slate-600 ring-slate-500/15",
  };
  const cls = map[estado || ""] || map.nuevo;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset",
        cls
      )}
    >
      {estado || "Sin estado"}
    </span>
  );
}
