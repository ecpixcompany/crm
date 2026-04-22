import { useState } from "react";
import { PROGRAMAS, ESTADOS } from "../lib/api";
import { useLeads } from "../hooks/useLeads";
import { useAsesores } from "../hooks/useAsesores";
import { CreateLeadModal } from "../components/modals/CreateLeadModal";
import { LeadDetailModal } from "../components/modals/LeadDetailModal";
import "./LeadsPage.css";

export function LeadsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [programaFilter, setProgramaFilter] = useState("");
  const [asesorFilter, setAsesorFilter] = useState("");

  const { data: leads = [], isLoading, error } = useLeads();
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      `${lead.nombres} ${lead.apellidos} ${lead.cedula || ""} ${lead.correo || ""} ${lead.celular || ""} ${lead.programa} ${lead.ciudad}`
        .toLowerCase()
        .includes(searchLower);
    const matchesState = stateFilter === "" || lead.estado === stateFilter;
    const matchesPrograma = programaFilter === "" || lead.programa === programaFilter;
    const matchesAsesor =
      asesorFilter === "" ||
      (typeof lead.asesor === "object" && lead.asesor?.id === Number(asesorFilter)) ||
      (typeof lead.asesor === "string" && lead.asesor === asesorFilter);
    return matchesSearch && matchesState && matchesPrograma && matchesAsesor;
  });

  const getInitials = (nombres: string, apellidos: string) =>
    `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

  const getAvatarColor = (nombre: string) => {
    const colors = ["#4a90d9", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"];
    return colors[nombre.charCodeAt(0) % colors.length];
  };

  return (
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Hoja de vida 360 lista para Strapi</h2>
          <p>
            Los campos visibles ya quedaron estructurados para que el backend pueda
            alimentar el CRM sin rediseñar esta vista.
          </p>
        </div>
        <div className="intro-chip-group">
          <span className="intro-chip">Lead 360</span>
        </div>
      </section>

      <div className="leads-list-view" id="leadsListView">
        <div className="leads-list-header">
          <div className="leads-list-header-content">
            <div>
              <h2>
                <i className="fas fa-list"></i> LEADS
              </h2>
              <p>Filtra, abre y actualiza leads con estructura preparada para Strapi.</p>
            </div>
            <button
              className="btn btn-primary"
              id="createLeadBtn"
              type="button"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus"></i> Nuevo lead
            </button>
          </div>

          <div className="toolbar-row">
            <div className="search-field">
              <i className="fas fa-search"></i>
              <input
                id="leadSearchInput"
                type="text"
                placeholder="Buscar por nombre, cedula, correo, celular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="toolbar-select"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            <select
              className="toolbar-select"
              value={programaFilter}
              onChange={(e) => setProgramaFilter(e.target.value)}
            >
              <option value="">Todos los programas</option>
              {PROGRAMAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="toolbar-select"
              value={asesorFilter}
              onChange={(e) => setAsesorFilter(e.target.value)}
              disabled={asesoresLoading}
            >
              <option value="">
                {asesoresLoading ? "Cargando..." : "Todos los asesores"}
              </option>
              {!asesoresLoading &&
                asesores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="leads-list-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Lead</th>
                <th>Programa</th>
                <th>Fuente</th>
                <th>Asesor</th>
                <th className="th-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ?
                <tr>
                  <td colSpan={6}>Cargando leads...</td>
                </tr>
              : error ?
                <tr>
                  <td colSpan={6}>Error: {error.message}</td>
                </tr>
              : filteredLeads.length === 0 ?
                <tr>
                  <td colSpan={6}>No hay leads</td>
                </tr>
              : filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.documentId)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div
                        className="lead-avatar"
                        style={{ background: getAvatarColor(lead.nombres) }}
                      >
                        {getInitials(lead.nombres, lead.apellidos)}
                      </div>
                    </td>
                    <td>
                      {lead.nombres} {lead.apellidos}
                    </td>
                    <td>{lead.programa}</td>
                    <td>{lead.fuente || "-"}</td>
                    <td>
                      {lead.asesor && typeof lead.asesor === "object" ?
                        lead.asesor.nombre
                      : "-"}
                    </td>
                    <td className="td-center">
                      <span className={`status-badge status-${lead.estado}`}>
                        {lead.estado}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && <CreateLeadModal onClose={() => setShowCreateModal(false)} />}

      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
