import { useState } from 'react';
import {
  Plus,
  Save,
  Check,
  Pencil,
  Trash2,
  Settings as SettingsIcon,
  Users as UsersIcon,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useAsesores, useCreateAsesor, useUpdateAsesor, useDeleteAsesor } from '@/hooks/useAsesores';
import { useConfiguracion, useUpdateConfiguracion } from '@/hooks/useConfiguracion';
import type { Asesor } from '@/lib/api';

export function ConfiguracionPage() {
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const createAsesor = useCreateAsesor();
  const updateAsesor = useUpdateAsesor();
  const deleteAsesor = useDeleteAsesor();
  const updateConfig = useUpdateConfiguracion();

  const { data: config } = useConfiguracion();

  const [showAsesorModal, setShowAsesorModal] = useState(false);
  const [editingAsesor, setEditingAsesor] = useState<Asesor | null>(null);
  const [asesorForm, setAsesorForm] = useState({ nombre: '', correo: '', activo: true });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [configForm, setConfigForm] = useState({
    slogan_principal: config?.slogan_principal || '',
    modo_demo: config?.modo_demo ?? true,
  });

  const handleOpenAsesorModal = (asesor?: Asesor) => {
    if (asesor) {
      setEditingAsesor(asesor);
      setAsesorForm({ nombre: asesor.nombre, correo: asesor.correo || '', activo: asesor.activo });
    } else {
      setEditingAsesor(null);
      setAsesorForm({ nombre: '', correo: '', activo: true });
    }
    setShowAsesorModal(true);
  };

  const handleSaveAsesor = () => {
    if (!asesorForm.nombre.trim()) return;

    if (editingAsesor) {
      updateAsesor.mutate(
        {
          documentId: editingAsesor.documentId,
          data: {
            nombre: asesorForm.nombre,
            correo: asesorForm.correo || undefined,
            activo: asesorForm.activo,
          },
        },
        { onSuccess: () => { setShowAsesorModal(false); setEditingAsesor(null); } }
      );
    } else {
      createAsesor.mutate(
        { nombre: asesorForm.nombre, correo: asesorForm.correo || undefined, activo: asesorForm.activo },
        { onSuccess: () => setShowAsesorModal(false) }
      );
    }
  };

  const handleDeleteAsesor = (documentId: string) => {
    if (confirm('¿Estás seguro de eliminar este asesor?')) {
      deleteAsesor.mutate(documentId);
    }
  };

  const handleToggleActivo = (asesor: Asesor) => {
    updateAsesor.mutate({ documentId: asesor.documentId, data: { activo: !asesor.activo } });
  };

  const handleSaveConfig = () => {
    updateConfig.mutate(configForm, {
      onSuccess: () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex justify-between items-center py-5">
          <div>
            <h2 className="text-lg font-semibold mb-1">Configuración del CRM</h2>
            <p className="text-sm text-muted-foreground">
              Administra asesores y configuración global del CRM.
            </p>
          </div>
          <Badge className="bg-unimeta-red text-white">Ajustes</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersIcon className="h-4 w-4 text-unimeta-red" /> Asesores
              </CardTitle>
              <Button
                size="sm"
                onClick={() => handleOpenAsesorModal()}
                className="bg-unimeta-red hover:bg-unimeta-red-dark"
              >
                <Plus className="h-4 w-4" /> Agregar asesor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {asesoresLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-left">
                    <tr>
                      <th className="py-3 px-3 font-medium">Nombre</th>
                      <th className="py-3 px-3 font-medium">Correo</th>
                      <th className="py-3 px-3 font-medium">Activo</th>
                      <th className="py-3 px-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asesores.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-muted-foreground">
                          No hay asesores registrados
                        </td>
                      </tr>
                    ) : (
                      asesores.map((asesor) => (
                        <tr key={asesor.id} className="border-t border-border">
                          <td className="py-3 px-3 font-medium">{asesor.nombre}</td>
                          <td className="py-3 px-3">{asesor.correo || '-'}</td>
                          <td className="py-3 px-3">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={asesor.activo}
                                onChange={() => handleToggleActivo(asesor)}
                                className="sr-only peer"
                              />
                              <span className="w-9 h-5 bg-muted rounded-full relative peer-checked:bg-unimeta-red transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                            </label>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleOpenAsesorModal(asesor)}
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteAsesor(asesor.documentId)}
                                className="text-destructive hover:text-destructive"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-4 w-4 text-unimeta-red" /> Configuración global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Slogan principal</Label>
              <Input
                value={configForm.slogan_principal}
                onChange={(e) => setConfigForm({ ...configForm, slogan_principal: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Modo demo</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Cuando está activo, muestra el chip "Modo demo" en las páginas.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.modo_demo}
                  onChange={(e) => setConfigForm({ ...configForm, modo_demo: e.target.checked })}
                  className="sr-only peer"
                />
                <span className="w-11 h-6 bg-muted rounded-full relative peer-checked:bg-unimeta-red transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
            <Button
              onClick={handleSaveConfig}
              disabled={updateConfig.isPending}
              className="w-full bg-unimeta-red hover:bg-unimeta-red-dark"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4" /> Guardado
                </>
              ) : updateConfig.isPending ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="h-4 w-4" /> Guardar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAsesorModal} onOpenChange={(o) => !o && setShowAsesorModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAsesor ? 'Editar asesor' : 'Nuevo asesor'}</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={asesorForm.nombre}
                onChange={(e) => setAsesorForm({ ...asesorForm, nombre: e.target.value })}
                placeholder="Nombre del asesor"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Correo</Label>
              <Input
                type="email"
                value={asesorForm.correo}
                onChange={(e) => setAsesorForm({ ...asesorForm, correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Activo</Label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={asesorForm.activo}
                  onChange={(e) => setAsesorForm({ ...asesorForm, activo: e.target.checked })}
                  className="sr-only peer"
                />
                <span className="w-11 h-6 bg-muted rounded-full relative peer-checked:bg-unimeta-red transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsesorModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAsesor}
              disabled={!asesorForm.nombre.trim() || createAsesor.isPending || updateAsesor.isPending}
              className="bg-unimeta-red hover:bg-unimeta-red-dark"
            >
              {createAsesor.isPending || updateAsesor.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
