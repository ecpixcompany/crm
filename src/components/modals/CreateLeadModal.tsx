import { useState, type FormEvent } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROGRAMAS, ESTADOS, FUENTES, PRIORIDADES, TIPOS_ACCION, type Lead } from '@/lib/api';
import { useAsesores, useCreateAsesor } from '@/hooks/useAsesores';
import { useCreateLead } from '@/hooks/useLeads';

interface CreateLeadModalProps {
  onClose: () => void;
}

export function CreateLeadModal({ onClose }: CreateLeadModalProps) {
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const createLead = useCreateLead();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    programa: PROGRAMAS[0],
    estado: ESTADOS[0],
    cedula: '',
    celular: '',
    correo: '',
    ciudad: '',
    fuente: FUENTES[0],
    asesor: '' as number | '',
    prioridad: 'media',
    fecha_ultimo_contacto: '',
    fecha_proxima_accion: '',
    tipo_proxima_accion: '',
    notas: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombres.trim()) newErrors.nombres = 'Requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Requerido';
    if (!formData.programa.trim()) newErrors.programa = 'Requerido';
    if (!formData.cedula.trim()) newErrors.cedula = 'Requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...formData,
      asesor: formData.asesor ? Number(formData.asesor) : null,
    };
    createLead.mutate(data as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, {
      onSuccess: () => onClose(),
    });
  };

  const initials = formData.nombres
    ? `${formData.nombres.charAt(0)}${formData.apellidos.charAt(0)}`.toUpperCase()
    : '--';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo lead</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <div className="flex items-center gap-4 border-b border-slate-200/70 py-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
            {initials}
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-slate-900">
              {formData.nombres || 'Nuevo lead'} {formData.apellidos}
            </div>
            <div className="mt-0.5 text-[12.5px] text-slate-500">{formData.programa}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombres *</Label>
              <Input
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className={errors.nombres ? 'border-destructive' : ''}
              />
              {errors.nombres && <span className="text-xs text-destructive">{errors.nombres}</span>}
            </div>

            <div className="space-y-1.5">
              <Label>Apellidos *</Label>
              <Input
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className={errors.apellidos ? 'border-destructive' : ''}
              />
              {errors.apellidos && <span className="text-xs text-destructive">{errors.apellidos}</span>}
            </div>

            <div className="space-y-1.5">
              <Label>Programa *</Label>
              <Select
                value={formData.programa}
                onValueChange={(v) => setFormData({ ...formData, programa: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMAS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(v) => setFormData({ ...formData, estado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Cédula *</Label>
              <Input
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                className={errors.cedula ? 'border-destructive' : ''}
              />
              {errors.cedula && <span className="text-xs text-destructive">{errors.cedula}</span>}
            </div>

            <div className="space-y-1.5">
              <Label>Celular</Label>
              <Input
                type="tel"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Correo</Label>
              <Input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fuente</Label>
              <Select
                value={formData.fuente}
                onValueChange={(v) => setFormData({ ...formData, fuente: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUENTES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Asesor</Label>
              {asesoresLoading ? (
                <span className="text-xs text-muted-foreground">Cargando asesores...</span>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={formData.asesor ? String(formData.asesor) : 'unassigned'}
                    onValueChange={(v) =>
                      setFormData({ ...formData, asesor: v === 'unassigned' ? '' : Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {asesores.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AsesorQuickCreate
                    onCreated={(a) => setFormData({ ...formData, asesor: a.id })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(v) => setFormData({ ...formData, prioridad: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Último contacto</Label>
              <Input
                type="date"
                value={formData.fecha_ultimo_contacto}
                onChange={(e) => setFormData({ ...formData, fecha_ultimo_contacto: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Próxima acción</Label>
              <Input
                type="date"
                value={formData.fecha_proxima_accion}
                onChange={(e) => setFormData({ ...formData, fecha_proxima_accion: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo próxima acción</Label>
              <Select
                value={formData.tipo_proxima_accion || 'none'}
                onValueChange={(v) =>
                  setFormData({ ...formData, tipo_proxima_accion: v === 'none' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin acción</SelectItem>
                  {TIPOS_ACCION.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              rows={4}
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createLead.isPending}
              className="bg-unimeta-red hover:bg-unimeta-red-dark"
            >
              <Save className="h-4 w-4" />
              {createLead.isPending ? 'Creando...' : 'Crear lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AsesorQuickCreate({ onCreated }: { onCreated: (asesor: { id: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const createAsesor = useCreateAsesor();

  const submit = () => {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    createAsesor.mutate(
      { nombre: trimmed, activo: true },
      {
        onSuccess: (asesor) => {
          onCreated(asesor);
          setNombre('');
          setOpen(false);
        },
      }
    );
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-auto p-0 text-xs text-unimeta-red"
      >
        <UserPlus className="h-3 w-3" /> Crear asesor
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Nombre del asesor"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        autoFocus
        className="h-8 text-sm"
      />
      <Button
        type="button"
        size="sm"
        onClick={submit}
        disabled={!nombre.trim() || createAsesor.isPending}
        className="h-8 bg-unimeta-red hover:bg-unimeta-red-dark"
      >
        {createAsesor.isPending ? 'Creando...' : 'Guardar'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(false);
          setNombre('');
        }}
        className="h-8"
      >
        Cancelar
      </Button>
    </div>
  );
}
