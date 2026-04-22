import { useState } from 'react';
import { PROGRAMAS, ESTADOS, FUENTES, PRIORIDADES, TIPOS_ACCION } from '../../lib/api';
import type { Lead } from '../../lib/api';
import { useAsesores, useCreateAsesor } from '../../hooks/useAsesores';
import { useCreateLead } from '../../hooks/useLeads';

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

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="lead-create-modal">
      <div className="lead-modal-overlay" onClick={onClose}></div>
      <div className="lead-modal-content lead-modal-content-wide">
        <div className="lead-modal-header">
          <h2>Crear nuevo lead</h2>
          <button className="lead-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div className="lead-modal-body">
          <div className="lead-info-panel-modal">
            <div className="lead-avatar-section">
              <div className="lead-avatar-large">
                {formData.nombres ? `${formData.nombres.charAt(0)}${formData.apellidos.charAt(0)}`.toUpperCase() : '--'}
              </div>
              <div className="lead-name-display">{formData.nombres || 'Nuevo lead'} {formData.apellidos}</div>
              <div className="lead-program-display">{formData.programa}</div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input type="text" className={`form-input ${errors.nombres ? 'input-error' : ''}`} value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} />
                  {errors.nombres && <span className="error-text">{errors.nombres}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input type="text" className={`form-input ${errors.apellidos ? 'input-error' : ''}`} value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} />
                  {errors.apellidos && <span className="error-text">{errors.apellidos}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Programa *</label>
                  <select className={`form-input ${errors.programa ? 'input-error' : ''}`} value={formData.programa} onChange={(e) => setFormData({ ...formData, programa: e.target.value })}>
                    {PROGRAMAS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-input" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cedula *</label>
                  <input type="text" className={`form-input ${errors.cedula ? 'input-error' : ''}`} value={formData.cedula} onChange={(e) => setFormData({ ...formData, cedula: e.target.value })} />
                  {errors.cedula && <span className="error-text">{errors.cedula}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Celular</label>
                  <input type="tel" className="form-input" value={formData.celular} onChange={(e) => setFormData({ ...formData, celular: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo</label>
                  <input type="email" className="form-input" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input type="text" className="form-input" value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuente</label>
                  <select className="form-input" value={formData.fuente} onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}>
                    {FUENTES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Asesor</label>
                  {asesoresLoading ? (
                    <span className="form-hint-inline">Cargando asesores...</span>
                  ) : asesores.length === 0 ? (
                    <div className="form-hint-inline">
                      <span>No hay asesores registrados.</span>
                      <AsesorQuickCreate onCreated={(a) => setFormData({ ...formData, asesor: a.id })} />
                    </div>
                  ) : (
                    <>
                      <select className="form-input" value={formData.asesor} onChange={(e) => setFormData({ ...formData, asesor: e.target.value ? Number(e.target.value) : '' })}>
                        <option value="">Sin asignar</option>
                        {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                      <AsesorQuickCreate onCreated={(a) => setFormData({ ...formData, asesor: a.id })} />
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select className="form-input" value={formData.prioridad} onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}>
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ultimo contacto</label>
                  <input type="date" className="form-input" value={formData.fecha_ultimo_contacto} onChange={(e) => setFormData({ ...formData, fecha_ultimo_contacto: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Proxima accion</label>
                  <input type="date" className="form-input" value={formData.fecha_proxima_accion} onChange={(e) => setFormData({ ...formData, fecha_proxima_accion: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo proxima accion</label>
                  <select className="form-input" value={formData.tipo_proxima_accion} onChange={(e) => setFormData({ ...formData, tipo_proxima_accion: e.target.value })}>
                    <option value="">Sin accion</option>
                    {TIPOS_ACCION.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Notas</label>
                  <textarea className="form-input form-textarea" rows={4} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={createLead.isPending}>
                  <i className="fas fa-save"></i> {createLead.isPending ? 'Creando...' : 'Crear lead'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsesorQuickCreate({ onCreated }: { onCreated: (asesor: { id: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const createAsesor = useCreateAsesor();

  const submit = () => {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    createAsesor.mutate({ nombre: trimmed, activo: true }, {
      onSuccess: (asesor) => {
        onCreated(asesor);
        setNombre('');
        setOpen(false);
      },
    });
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
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        autoFocus
      />
      <button type="button" className="btn btn-primary" onClick={submit} disabled={!nombre.trim() || createAsesor.isPending}>
        {createAsesor.isPending ? 'Creando...' : 'Guardar'}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => { setOpen(false); setNombre(''); }}>Cancelar</button>
    </div>
  );
}