---
name: 05-leads-page
description: Conectar LeadsPage.tsx (lista, CreateLeadModal, LeadDetailModal) a Strapi vía hooks de React Query, eliminando todos los mocks y permitiendo create/update/delete desde la UI.
---

# 05 · LeadsPage contra Strapi

## Objetivo
[src/pages/LeadsPage.tsx](../../../src/pages/LeadsPage.tsx) debe mostrar leads reales de Strapi, permitir crear, editar y eliminar leads desde la UI, y usar asesores reales (no el array hardcoded).

## Prerrequisitos
Skills **01–04** completos.

## Archivos a tocar
- `src/pages/LeadsPage.tsx` (reescritura de la capa de datos; conservar estructura visual y CSS existentes)
- Posiblemente `src/pages/LeadsPage.css` si hay clases nuevas (preferir no tocar)

## Tareas

### 1. Reemplazar la fuente de leads
- Eliminar cualquier `MOCK_LEADS` o array estático dentro del archivo.
- Usar `useLeads()` para la lista.
- Estado de carga: mostrar skeleton o mensaje "Cargando leads…".
- Estado de error: mostrar mensaje con `error.message`.

### 2. CreateLeadModal
- Usar `useCreateLead()` y cerrar el modal en `onSuccess`.
- El select de `asesor` debe usar `useAsesores()` y enviar **id numérico** (no nombre).
- El select de `programa` usa `PROGRAMAS` de [src/lib/api.ts](../../../src/lib/api.ts) (valores capitalizados).
- Los selects de `estado`, `fuente`, `prioridad`, `tipo_proxima_accion` usan las constantes respectivas.
- Campos `fecha_ultimo_contacto` y `fecha_proxima_accion` deben ser `<input type="date">` y enviarse como `YYYY-MM-DD` (Strapi Date).
- Validación mínima antes de enviar: `nombres`, `apellidos`, `programa`, `cedula` requeridos.

### 3. LeadDetailModal
- Usar `useLead(id)` para recargar con relaciones (`asesor`, `actividades`, `conversaciones`).
- Botón "Editar" abre el mismo formulario en modo edición; usa `useUpdateLead()`.
- Botón "Eliminar" usa `useDeleteLead()` con confirmación `confirm()`. Cierra el modal en success.
- Sección timeline:
  - Usar `useActividades(leadId)` (del skill 04) para listar actividades en orden descendente por `timestamp`.
  - Si el array está vacío, conservar el mensaje existente "Sin actividad registrada".
  - Cada item muestra: icono según `tipo`, `descripcion`, `timestamp` formateado, y nombre del asesor si existe.
- Agregar un pequeño formulario "Registrar actividad" dentro del modal:
  - Campos: `tipo` (select), `descripcion` (textarea), `asesor` (select opcional).
  - `timestamp` se asigna automáticamente con `new Date().toISOString()` al enviar.
  - Usa `useCreateActividad()`.

### 4. Filtros y búsqueda
- El input de búsqueda debe filtrar en cliente por `nombres`, `apellidos`, `cedula`, `correo`, `celular`.
- Filtro por `asesor` debe poblarse desde `useAsesores()`.
- Filtros por `estado`, `programa`, `fuente` desde las constantes.

### 5. Display del asesor en la tabla/cards
- Renderizar `lead.asesor?.nombre ?? 'Sin asignar'` (tras skill 01, `lead.asesor` es `Asesor | null`).

## Reglas de estilo
- No mover CSS a otro lugar. No renombrar clases existentes.
- Conservar la jerarquía visual actual (header, filters, table/cards, modal).
- Respetar idioma español en labels y mensajes.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Con Strapi corriendo en `localhost:1337`, la página lista los leads reales.
- [ ] Crear un lead desde el modal lo persiste y aparece en la lista sin recargar.
- [ ] Editar un lead persiste los cambios.
- [ ] Eliminar un lead lo quita de la lista.
- [ ] Registrar una actividad aparece en el timeline del lead.
- [ ] Ningún array hardcoded de leads o asesores queda en `LeadsPage.tsx`.

## Restricciones
- No introducir librerías nuevas de forms (sin react-hook-form, formik, zod). Usar `useState` + validación manual mínima.
- No extraer componentes a archivos nuevos a menos que el archivo supere 500 líneas; si lo hace, permitir extraer `CreateLeadModal` y `LeadDetailModal` a `src/pages/LeadsPage/` en subarchivos sibling.
- No tocar el Sidebar ni TopBar.
