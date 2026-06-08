import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROGRAMAS, ESTADOS } from "@/lib/api";
import { useLeads } from "@/hooks/useLeads";
import { useAsesores } from "@/hooks/useAsesores";
import { CreateLeadModal } from "@/components/modals/CreateLeadModal";
import { LeadDetailModal } from "@/components/modals/LeadDetailModal";
import { cn } from "@/lib/utils";

const getInitials = (n: string, a: string) =>
  `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();

const getAvatarColor = (nombre: string) => {
  const colors = ["#0f172a", "#475569", "#0891b2", "#7c3aed", "#db2777"];
  return colors[nombre.charCodeAt(0) % colors.length];
};

const ESTADO_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  interesado: "Interesado",
  calificado: "Calificado",
  cerrado: "Cerrado",
};

const ESTADO_TONE: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-700 ring-blue-600/10",
  contactado: "bg-amber-50 text-amber-700 ring-amber-600/15",
  interesado: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  calificado: "bg-violet-50 text-violet-700 ring-violet-600/15",
  cerrado: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

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
      !searchTerm ||
      `${lead.nombres} ${lead.apellidos} ${lead.cedula || ""} ${lead.correo || ""} ${lead.celular || ""} ${lead.programa} ${lead.ciudad}`
        .toLowerCase()
        .includes(searchLower);
    const matchesState = !stateFilter || lead.estado === stateFilter;
    const matchesPrograma = !programaFilter || lead.programa === programaFilter;
    const matchesAsesor =
      !asesorFilter ||
      (typeof lead.asesor === "object" && lead.asesor?.id === Number(asesorFilter)) ||
      (typeof lead.asesor === "string" && lead.asesor === asesorFilter);
    return matchesSearch && matchesState && matchesPrograma && matchesAsesor;
  });

  const hasFilters = !!(stateFilter || programaFilter || asesorFilter || searchTerm);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            Leads
          </h2>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Hoja de vida 360° · {leads.length} {leads.length === 1 ? 'lead' : 'leads'} en base
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-unimeta-red text-white hover:bg-unimeta-red-dark shadow-sm"
        >
          <Plus className="size-4" />
          Nuevo lead
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
        <CardHeader className="border-b border-slate-200/70 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, cedula, correo, celular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_LABEL[estado] || estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={programaFilter} onValueChange={setProgramaFilter}>
              <SelectTrigger className="h-10 w-[200px]">
                <SelectValue placeholder="Todos los programas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {PROGRAMAS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={asesorFilter} onValueChange={setAsesorFilter} disabled={asesoresLoading}>
              <SelectTrigger className="h-10 w-[200px]">
                <SelectValue placeholder={asesoresLoading ? "Cargando..." : "Todos los asesores"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los asesores</SelectItem>
                {asesores.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-y border-slate-200/70 bg-slate-50/50 text-left text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="py-3 px-6 font-medium w-14" />
                  <th className="py-3 px-3 font-medium">Lead</th>
                  <th className="py-3 px-3 font-medium">Programa</th>
                  <th className="py-3 px-3 font-medium">Fuente</th>
                  <th className="py-3 px-3 font-medium">Asesor</th>
                  <th className="py-3 px-6 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Cargando leads…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-rose-600">
                      Error: {error.message}
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <p className="text-[13px] font-medium text-slate-900">
                        {hasFilters ? "Sin resultados" : "No hay leads"}
                      </p>
                      <p className="mt-1 text-[12.5px] text-slate-500">
                        {hasFilters
                          ? "Ajusta los filtros o limpia la búsqueda."
                          : "Crea el primer lead con el botón superior."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.documentId)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-3.5">
                        <div
                          className="flex size-9 items-center justify-center rounded-full text-[12px] font-semibold text-white shadow-sm"
                          style={{ background: getAvatarColor(lead.nombres) }}
                        >
                          {getInitials(lead.nombres, lead.apellidos)}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-medium text-slate-900">
                          {lead.nombres} {lead.apellidos}
                        </div>
                        <div className="mt-0.5 text-[12px] text-slate-500">
                          {lead.celular || lead.correo || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700">{lead.programa}</td>
                      <td className="px-3 py-3.5 text-slate-600">{lead.fuente || "—"}</td>
                      <td className="px-3 py-3.5 text-slate-700">
                        {lead.asesor && typeof lead.asesor === "object"
                          ? lead.asesor.nombre
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset",
                            ESTADO_TONE[lead.estado] || ESTADO_TONE.nuevo
                          )}
                        >
                          {ESTADO_LABEL[lead.estado] || lead.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredLeads.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200/70 px-6 py-3 text-[12.5px] text-slate-500">
              <span>
                Mostrando {filteredLeads.length} de {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

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
