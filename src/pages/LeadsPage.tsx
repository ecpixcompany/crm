import { useState } from "react";
import { Plus, Search, ListFilter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const getInitials = (n: string, a: string) =>
  `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();

const getAvatarColor = (nombre: string) => {
  const colors = ["#4a90d9", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"];
  return colors[nombre.charCodeAt(0) % colors.length];
};

const estadoColor: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-700",
  contactado: "bg-orange-100 text-orange-700",
  interesado: "bg-emerald-100 text-emerald-700",
  calificado: "bg-purple-100 text-purple-700",
  cerrado: "bg-red-100 text-red-700",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex justify-between items-center py-5">
          <div>
            <h2 className="text-lg font-semibold mb-1">Hoja de vida 360° conectada a Strapi</h2>
            <p className="text-sm text-muted-foreground">
              Los campos visibles ya quedaron estructurados para que el backend alimente el CRM.
            </p>
          </div>
          <Badge className="bg-unimeta-red text-white">Lead 360</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListFilter className="h-4 w-4 text-unimeta-red" /> Leads
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Filtra, abre y actualiza leads con estructura preparada para Strapi.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-unimeta-red hover:bg-unimeta-red-dark"
            >
              <Plus className="h-4 w-4" /> Nuevo lead
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cedula, correo, celular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={programaFilter} onValueChange={setProgramaFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[200px]">
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

          {/* Table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left">
                <tr>
                  <th className="py-3 px-3 font-medium w-12"></th>
                  <th className="py-3 px-3 font-medium">Lead</th>
                  <th className="py-3 px-3 font-medium">Programa</th>
                  <th className="py-3 px-3 font-medium">Fuente</th>
                  <th className="py-3 px-3 font-medium">Asesor</th>
                  <th className="py-3 px-3 font-medium text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      Cargando leads...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-destructive">
                      Error: {error.message}
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      No hay leads
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.documentId)}
                      className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div
                          className="w-9 h-9 rounded-full text-white flex items-center justify-center font-semibold text-xs"
                          style={{ background: getAvatarColor(lead.nombres) }}
                        >
                          {getInitials(lead.nombres, lead.apellidos)}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {lead.nombres} {lead.apellidos}
                      </td>
                      <td className="py-3 px-3">{lead.programa}</td>
                      <td className="py-3 px-3">{lead.fuente || "-"}</td>
                      <td className="py-3 px-3">
                        {lead.asesor && typeof lead.asesor === "object"
                          ? lead.asesor.nombre
                          : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={estadoColor[lead.estado] || "bg-gray-100 text-gray-700"}>
                          {lead.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
