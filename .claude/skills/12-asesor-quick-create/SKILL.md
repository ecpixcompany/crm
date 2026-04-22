---
name: 12-asesor-quick-create
description: Añadir un atajo "Crear asesor" junto al select de Asesor en el modal de nuevo lead / detalle de lead, y un empty-state con CTA cuando no hay asesores cargados, para que el usuario no tenga que salir a /configuracion para registrar el primero.
---

# 12 · Crear asesor desde el modal de lead

## Contexto
Hoy, para asignar un asesor a un lead, el usuario debe:
1. Salir de `/leads`.
2. Ir a `/configuracion`.
3. Crear un asesor.
4. Volver a `/leads` y reabrir el modal.

Eso frustra a quien entra por primera vez y ve el dropdown "Asesor" solo con "Sin asignar". Este skill agrega un atajo inline para crear un asesor sin salir del modal de lead, reutilizando `useCreateAsesor` del hook del skill 04.

## Prerrequisitos
- Skills **01-04** completos (hooks `useAsesores`, `useCreateAsesor` disponibles).
- Skill **05** completo (LeadsPage conectada a hooks reales, formulario de nuevo lead con select de asesor).
- Skill **11** completo o no hace falta — pero si aún existe el bug de overlay, conviene correrlo primero para poder validar visualmente.

## Archivos a tocar
- `src/pages/LeadsPage.tsx`
- `src/pages/LeadsPage.css` (solo si hace falta una clase nueva para el botón/inline form — reutilizar las ya existentes si es posible)

## Tareas

### 1. Componente `AsesorQuickCreate`
Definir dentro del mismo archivo `LeadsPage.tsx` (no crear archivo nuevo) un subcomponente:

```tsx
function AsesorQuickCreate({ onCreated }: { onCreated: (asesor: Asesor) => void }) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const createAsesor = useCreateAsesor();

  const submit = () => {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    createAsesor.mutate({ nombre: trimmed, activo: true }, {
      onSuccess: (asesor) => {
        onCreated(asesor);   // el padre preselecciona el asesor recién creado
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
```

Notas:
- `useCreateAsesor` debe devolver el asesor creado en `onSuccess`. Si el hook del skill 04 ya lo hace (porque la mutación retorna la respuesta de `createAsesor(data)`), perfecto. Si no, ajustar el hook para que `mutationFn` retorne el asesor.
- No usar `alert`/toast — feedback inline con `isPending`.

### 2. Integrarlo en `CreateLeadModal`
En el `<div className="form-group">` que contiene el select de asesor (~línea 281-287), renderizar `<AsesorQuickCreate>` justo debajo del `<select>`:

```tsx
<div className="form-group">
  <label className="form-label">Asesor</label>
  <select className="form-input" value={formData.asesor} onChange={...}>
    <option value="">Sin asignar</option>
    {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
  </select>
  <AsesorQuickCreate onCreated={(asesor) => setFormData({ ...formData, asesor: asesor.id })} />
</div>
```

### 3. Integrarlo también en `LeadDetailModal`
El modal de detalle también permite editar asesor. Añadir el mismo `<AsesorQuickCreate>` junto a su select, con `onCreated` preseleccionando el nuevo asesor en el estado local del detalle.

### 4. Empty-state cuando `asesores.length === 0`
Si `asesores.length === 0`, ocultar el `<select>` (que solo tendría "Sin asignar") y mostrar directamente un mensaje pequeño + el botón:

```tsx
{asesores.length === 0 ? (
  <div className="form-hint-inline">
    <span>No hay asesores registrados.</span>
    <AsesorQuickCreate onCreated={(asesor) => setFormData({ ...formData, asesor: asesor.id })} />
  </div>
) : (
  <>
    <select ...>...</select>
    <AsesorQuickCreate onCreated={...} />
  </>
)}
```

### 5. Estilos mínimos
En `LeadsPage.css`, añadir al final (no sobreescribir reglas existentes) algo como:

```css
.btn-link-inline {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: .85rem;
  padding: 6px 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.btn-link-inline:hover { text-decoration: underline; }

.asesor-quick-create {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
}
.asesor-quick-create .form-input { flex: 1; }

.form-hint-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: .85rem;
  color: #666;
}
```

Adaptar si el proyecto ya tiene una variable de color primario — no duplicar hex si existe un token.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Con base vacía (0 asesores), al abrir "Nuevo lead" el usuario ve un botón/CTA para crear un asesor sin salir del modal.
- [ ] Crear un asesor desde el modal lo persiste en Strapi, lo preselecciona en el campo `Asesor` del lead y aparece también en `/configuracion`.
- [ ] Con >= 1 asesor existente, el select muestra opciones y el botón "Crear asesor" sigue disponible debajo.
- [ ] El modal de detalle de lead tiene el mismo comportamiento.
- [ ] No se introducen librerías nuevas.

## Restricciones
- No duplicar el modal completo de creación de asesor — usar el mini-form inline.
- No migrar el campo `correo` al quick-create; el formulario "grande" de `/configuracion` sigue siendo el canónico para datos completos.
- El quick-create solo captura `nombre` (+ `activo: true` por defecto). El usuario puede completar `correo` después desde `/configuracion`.
- Reusar `useCreateAsesor` del skill 04. Si ese hook no retorna el asesor creado en `onSuccess`, ajustar **el hook** (no hacer otro fetch aquí) y dejar documentado el cambio en el commit.
