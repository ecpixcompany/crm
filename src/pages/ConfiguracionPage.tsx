import { useState } from 'react';
import { useAsesores, useCreateAsesor, useUpdateAsesor, useDeleteAsesor } from '../hooks/useAsesores';
import { useConfiguracion, useUpdateConfiguracion } from '../hooks/useConfiguracion';
import type { Asesor } from '../lib/api';
import './ConfiguracionPage.css';

export function ConfiguracionPage() {
  const { data: asesores = [], isLoading: asesoresLoading } = useAsesores();
  const { data: config } = useConfiguracion();
  const createAsesor = useCreateAsesor();
  const updateAsesor = useUpdateAsesor();
  const deleteAsesor = useDeleteAsesor();
  const updateConfig = useUpdateConfiguracion();

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
        { id: editingAsesor.id, data: { nombre: asesorForm.nombre, correo: asesorForm.correo || undefined, activo: asesorForm.activo } },
        { onSuccess: () => { setShowAsesorModal(false); setEditingAsesor(null); } }
      );
    } else {
      createAsesor.mutate(
        { nombre: asesorForm.nombre, correo: asesorForm.correo || undefined, activo: asesorForm.activo },
        { onSuccess: () => setShowAsesorModal(false) }
      );
    }
  };

  const handleDeleteAsesor = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este asesor?')) {
      deleteAsesor.mutate(id);
    }
  };

  const handleToggleActivo = (asesor: Asesor) => {
    updateAsesor.mutate({ id: asesor.id, data: { activo: !asesor.activo } });
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
    <div>
      <section className="page-intro-card">
        <div>
          <h2>Configuración</h2>
          <p>Administra asesores y configuración global del CRM.</p>
        </div>
      </section>

      <div className="config-layout">
        <section className="config-section">
          <div className="section-header-row">
            <h2>Asesores</h2>
            <button className="btn btn-primary" onClick={() => handleOpenAsesorModal()}>
              <i className="fas fa-plus"></i> Agregar asesor
            </button>
          </div>

          {asesoresLoading ? (
            <p className="loading-text">Cargando...</p>
          ) : (
            <div className="table-responsive">
              <table className="config-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asesores.length === 0 ? (
                    <tr><td colSpan={4} className="empty-cell">No hay asesores registrados</td></tr>
                  ) : (
                    asesores.map((asesor) => (
                      <tr key={asesor.id}>
                        <td>{asesor.nombre}</td>
                        <td>{asesor.correo || '-'}</td>
                        <td>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={asesor.activo}
                              onChange={() => handleToggleActivo(asesor)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-icon" onClick={() => handleOpenAsesorModal(asesor)} title="Editar">
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => handleDeleteAsesor(asesor.id)} title="Eliminar">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="config-section">
          <h2>Configuración global</h2>
          <div className="config-form">
            <div className="form-group">
              <label className="form-label">Slogan principal</label>
              <input
                type="text"
                className="form-input"
                value={configForm.slogan_principal}
                onChange={(e) => setConfigForm({ ...configForm, slogan_principal: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="toggle-label">
                <span>Modo demo</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={configForm.modo_demo}
                    onChange={(e) => setConfigForm({ ...configForm, modo_demo: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </label>
              <p className="form-hint">Cuando está activo, muestra el chip "Modo demo" en las páginas.</p>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveConfig} disabled={updateConfig.isPending}>
                {saveSuccess ? <><i className="fas fa-check"></i> Guardado ✓</> : updateConfig.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {showAsesorModal && (
        <div className="modal-overlay" onClick={() => setShowAsesorModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAsesor ? 'Editar asesor' : 'Nuevo asesor'}</h2>
              <button className="modal-close" onClick={() => setShowAsesorModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  value={asesorForm.nombre}
                  onChange={(e) => setAsesorForm({ ...asesorForm, nombre: e.target.value })}
                  placeholder="Nombre del asesor"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo</label>
                <input
                  type="email"
                  className="form-input"
                  value={asesorForm.correo}
                  onChange={(e) => setAsesorForm({ ...asesorForm, correo: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <span>Activo</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={asesorForm.activo}
                      onChange={(e) => setAsesorForm({ ...asesorForm, activo: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveAsesor} disabled={!asesorForm.nombre.trim() || createAsesor.isPending || updateAsesor.isPending}>
                {createAsesor.isPending || updateAsesor.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAsesorModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
