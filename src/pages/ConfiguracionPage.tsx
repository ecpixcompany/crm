import { useState } from 'react';
import {
  Plus,
  Save,
  Check,
  Pencil,
  Trash2,
  Settings as SettingsIcon,
  Users as UsersIcon,
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
import { cn } from '@/lib/utils';

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
      <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
        <CardContent className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Configuración del CRM
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Administra asesores y configuración global del CRM.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 bg-slate-100 text-slate-700">
            Ajustes
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          <CardHeader className="border-b border-slate-200/70">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <UsersIcon className="size-4 text-slate-500" />
                  Asesores
                </CardTitle>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  {asesores.length} {asesores.length === 1 ? 'registrado' : 'registrados'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenAsesorModal()}
                className="bg-unimeta-red text-white hover:bg-unimeta-red-dark"
              >
                <Plus className="size-4" />
                Agregar asesor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {asesoresLoading ? (
              <p className="py-10 text-center text-[13px] text-slate-500">Cargando…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-y border-slate-200/70 bg-slate-50/50 text-left text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
                      <th className="py-3 px-6 font-medium">Nombre</th>
                      <th className="py-3 px-3 font-medium">Correo</th>
                      <th className="py-3 px-3 font-medium">Estado</th>
                      <th className="py-3 px-6 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {asesores.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-500">
                          No hay asesores registrados
                        </td>
                      </tr>
                    ) : (
                      asesores.map((asesor) => (
                        <tr
                          key={asesor.id}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="px-6 py-3.5">
                            <div className="font-medium text-slate-900">{asesor.nombre}</div>
                          </td>
                          <td className="px-3 py-3.5 text-slate-600">
                            {asesor.correo || '—'}
                          </td>
                          <td className="px-3 py-3.5">
                            <label className="inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={asesor.activo}
                                onChange={() => handleToggleActivo(asesor)}
                                className="peer sr-only"
                              />
                              <span
                                className={cn(
                                  'relative h-5 w-9 rounded-full transition-colors',
                                  asesor.activo
                                    ? 'bg-unimeta-red'
                                    : 'bg-slate-300'
                                )}
                              >
                                <span
                                  className={cn(
                                    'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all',
                                    asesor.activo ? 'left-[18px]' : 'left-0.5'
                                  )}
                                />
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="inline-flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleOpenAsesorModal(asesor)}
                                className="text-slate-500 hover:text-slate-900"
                                title="Editar"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteAsesor(asesor.documentId)}
                                className="text-slate-500 hover:text-rose-600"
                                title="Eliminar"
                              >
                                <Trash2 className="size-3.5" />
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

        <Card className="border-slate-200/70 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.04)]">
          <CardHeader className="border-b border-slate-200/70">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
              <SettingsIcon className="size-4 text-slate-500" />
              Configuración global
            </CardTitle>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Ajustes visibles para toda la operación.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="slogan" className="text-[12.5px] font-medium text-slate-700">
                Slogan principal
              </Label>
              <Input
                id="slogan"
                value={configForm.slogan_principal}
                onChange={(e) => setConfigForm({ ...configForm, slogan_principal: e.target.value })}
                placeholder="Texto que verán los usuarios al iniciar"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-md border border-slate-200/70 bg-slate-50/50 p-4">
              <div>
                <Label htmlFor="modo-demo" className="text-[13px] font-medium text-slate-900">
                  Modo demo
                </Label>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Cuando está activo, muestra el chip "Modo demo" en las páginas.
                </p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  id="modo-demo"
                  type="checkbox"
                  checked={configForm.modo_demo}
                  onChange={(e) => setConfigForm({ ...configForm, modo_demo: e.target.checked })}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    configForm.modo_demo ? 'bg-unimeta-red' : 'bg-slate-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all',
                      configForm.modo_demo ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </span>
              </label>
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={updateConfig.isPending}
              className="w-full bg-unimeta-red text-white hover:bg-unimeta-red-dark"
            >
              {saveSuccess ? (
                <>
                  <Check className="size-4" /> Guardado
                </>
              ) : updateConfig.isPending ? (
                'Guardando…'
              ) : (
                <>
                  <Save className="size-4" /> Guardar cambios
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
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="asesor-nombre">Nombre *</Label>
              <Input
                id="asesor-nombre"
                value={asesorForm.nombre}
                onChange={(e) => setAsesorForm({ ...asesorForm, nombre: e.target.value })}
                placeholder="Nombre del asesor"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asesor-correo">Correo</Label>
              <Input
                id="asesor-correo"
                type="email"
                value={asesorForm.correo}
                onChange={(e) => setAsesorForm({ ...asesorForm, correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/50 p-3.5">
              <Label htmlFor="asesor-activo">Asesor activo</Label>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  id="asesor-activo"
                  type="checkbox"
                  checked={asesorForm.activo}
                  onChange={(e) => setAsesorForm({ ...asesorForm, activo: e.target.checked })}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    asesorForm.activo ? 'bg-unimeta-red' : 'bg-slate-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all',
                      asesorForm.activo ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </span>
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
              className="bg-unimeta-red text-white hover:bg-unimeta-red-dark"
            >
              {createAsesor.isPending || updateAsesor.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
