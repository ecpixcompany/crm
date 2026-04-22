---
name: 11-fix-modal-css-collision
description: Corregir la colisión global entre .modal-overlay / .modal-content de LeadsPage.css y ConfiguracionPage.css que bloquea los inputs del modal "Nuevo lead" y del modal de detalle de lead.
---

# 11 · Fix colisión CSS de modales en LeadsPage

## Contexto del bug
[src/pages/LeadsPage.css](../../../src/pages/LeadsPage.css) y [src/pages/ConfiguracionPage.css](../../../src/pages/ConfiguracionPage.css) ambos definen reglas globales para `.modal-overlay` y `.modal-content`:

- **LeadsPage.css** (asume overlay y content como **hermanos** dentro de `.lead-create-modal`):
  ```css
  .modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.5); }
  .modal-content { position: relative; background: white; ... }
  ```
- **ConfiguracionPage.css** (asume overlay como **padre** centrando al content):
  ```css
  .modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.5); }
  .modal-content { background: white; ... /* sin position */ }
  ```

Como [src/router.tsx](../../../src/router.tsx) importa `ConfiguracionPage` **después** de `LeadsPage`, la segunda regla gana el cascade. Resultado en LeadsPage:
- `.modal-overlay` queda `position: fixed; z-index: 1000` → cubre todo el viewport y crea un stacking context propio.
- `.modal-content` queda sin `position` ni `z-index` → pinta **detrás** del overlay.

Visible en la UI: al abrir "Nuevo lead" o el detalle de un lead la pantalla se oscurece pero **los inputs no reciben clicks ni foco** porque el overlay los tapa.

## Prerrequisitos
Ninguno — es un fix puntual de CSS/JSX. Puede correrse independientemente del resto.

## Archivos a tocar
- `src/pages/LeadsPage.css`
- `src/pages/LeadsPage.tsx`

No tocar `ConfiguracionPage.css` — sus reglas están correctamente diseñadas para el patrón overlay-como-padre que usa esa página.

## Tareas

### 1. Renombrar las clases en `LeadsPage.css`
Reemplaza **todas** las ocurrencias de las clases genéricas por versiones prefijadas que no colisionen:

| Antes            | Después                |
|------------------|------------------------|
| `.modal-overlay` | `.lead-modal-overlay`  |
| `.modal-content` | `.lead-modal-content`  |
| `.modal-content-wide` | `.lead-modal-content-wide` |
| `.modal-header`  | `.lead-modal-header`   |
| `.modal-close`   | `.lead-modal-close`    |
| `.modal-body`    | `.lead-modal-body`     |

Regla: si una clase empieza con `modal-` en este archivo, renómbrala con prefijo `lead-`. No tocar clases no relacionadas con modales.

### 2. Actualizar JSX en `LeadsPage.tsx`
Aplicar el mismo renombrado en cada uso dentro del archivo. Verificar al menos los bloques en:
- `CreateLeadModal` (~línea 217-325): `<div className="lead-create-modal">` envuelve `<div className="modal-overlay">` y `<div className="modal-content modal-content-wide">` → deben pasar a `lead-modal-overlay` y `lead-modal-content lead-modal-content-wide`. Igual con `modal-header`, `modal-close`, `modal-body`.
- `LeadDetailModal` (~línea 427-): incluye dos estados tempranos (`isLoading` y `error || !lead`) que también renderizan `modal-overlay` y `modal-content`. Renombrar en los tres returns.

Tras el cambio, grep `className=.*\bmodal-(overlay|content|header|close|body)\b` en `LeadsPage.tsx` debe devolver 0 resultados.

### 3. Confirmar que el overlay sigue cerrando al click fuera
El patrón en LeadsPage es hermanos (overlay sibling de content, cada uno con su propio `onClick={onClose}` en el overlay). Al renombrar no cambia la semántica: el overlay sigue recibiendo clicks y `content` sigue pintando encima porque ahora:
- `.lead-modal-overlay` vuelve a ser `position: absolute; inset: 0` (sin z-index propio).
- `.lead-modal-content` vuelve a ser `position: relative`.
- Entre dos hermanos positioned con `z-index: auto`, el posterior en el DOM (`content`) pinta arriba → inputs clickables.

### 4. Sanity check en Seguimiento
Skill **06** (SeguimientoPage) planeaba reutilizar `LeadDetailModal`. Si ya se hizo y la página importa el JSX reusado, el renombrado se propaga automáticamente (el CSS solo se activa si la página importa `LeadsPage.css`, cosa que SeguimientoPage debería estar haciendo para reusar el modal — si no, importarlo).

Si `src/pages/SeguimientoPage.tsx` no existe aún o no reusa `LeadDetailModal`, ignorar este paso.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] En `/leads`, el botón "Nuevo lead" abre el modal y **todos los inputs aceptan teclado/clicks** (nombres, apellidos, cedula, celular, correo, ciudad, notas, selects, fechas).
- [ ] Click fuera del modal (zona oscura) lo cierra.
- [ ] Click dentro del modal **no** lo cierra.
- [ ] El modal de detalle de lead (click en una fila) también permite editar y sus inputs son interactivos.
- [ ] Los modales de `/configuracion` (Asesor + global) siguen funcionando sin regresión.
- [ ] `grep -nE 'className="[^"]*\bmodal-(overlay|content|header|close|body)\b' src/pages/LeadsPage.tsx` no arroja resultados.

## Restricciones
- No cambiar la estructura JSX (seguir con overlay y content como hermanos dentro de `.lead-create-modal`).
- No introducir librerías de modal ni portales.
- No tocar `src/pages/ConfiguracionPage.css` ni `src/pages/ConfiguracionPage.tsx`.
- No renombrar clases no relacionadas con modales (ej. `form-input`, `form-group`, `btn` siguen igual).
