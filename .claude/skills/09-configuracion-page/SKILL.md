---
name: 09-configuracion-page
description: Habilitar ConfiguracionPage.tsx para gestionar asesores (CRUD) y el Single Type ConfiguracionGlobal (modo_demo, slogan_principal). Eliminar el array ASESORES hardcoded de src/lib/api.ts.
---

# 09 · ConfiguracionPage como panel de administración

## Objetivo
[src/pages/ConfiguracionPage.tsx](../../../src/pages/ConfiguracionPage.tsx) debe permitir:
1. CRUD de `Asesor` (crear, editar nombre/correo, activar/desactivar, eliminar con confirmación).
2. Editar `ConfiguracionGlobal` (toggle `modo_demo`, editar `slogan_principal`).

Además, eliminar el array hardcoded `ASESORES` de [src/lib/api.ts](../../../src/lib/api.ts) ya que ahora los asesores vienen de la API.

## Prerrequisitos
Skills **01–04** completos, y **05**/**06**/**07**/**08** ya migrados (porque seguirían rompiéndose si `ASESORES` se borra antes).

## Archivos a tocar
- `src/pages/ConfiguracionPage.tsx`
- `src/lib/api.ts` (solo para eliminar la constante `ASESORES`)

## Tareas

### 1. Sección "Asesores"
Tabla con columnas: Nombre, Correo, Activo, Acciones.

- `useAsesores()` para la lista.
- Botón "Agregar asesor" abre modal con campos `nombre` (requerido), `correo`, `activo` (default true). Usa `useCreateAsesor()`.
- Cada fila tiene botones "Editar" (abre mismo modal en modo edición, usa `useUpdateAsesor()`) y "Eliminar" (confirmación + `useDeleteAsesor()`).
- Toggle en columna "Activo" puede ejecutar `useUpdateAsesor()` directo para alternar `activo`.

### 2. Sección "Configuración global"
- `useConfiguracion()` para leer.
- Formulario con:
  - `slogan_principal` (input text)
  - `modo_demo` (toggle/checkbox)
- Botón "Guardar" usa `useUpdateConfiguracion()`.
- Mostrar estado `isPending` y feedback de éxito ("Guardado ✓" temporal).

### 3. Chip "Modo demo" global
- Buscar en la UI (Sidebar, TopBar, páginas) dónde aparece el chip "Modo demo" hardcoded.
- Condicionarlo a `configuracion.modo_demo` leyendo `useConfiguracion()` donde haga falta.
- Si `modo_demo === false`, el chip no se renderiza.

### 4. Eliminar `ASESORES` de api.ts
- Grep `ASESORES` en todo `src/` antes de borrar.
- Si algún archivo aún lo importa, migrar a `useAsesores()` — los skills 05/06/07/08 ya debieron hacerlo, pero verificar.
- Eliminar la línea `export const ASESORES = [...]` en [src/lib/api.ts](../../../src/lib/api.ts).

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Crear, editar y eliminar asesores funciona desde la UI y se refleja inmediatamente en LeadsPage/SeguimientoPage (porque comparten el query key).
- [ ] Toggle `modo_demo` se persiste y se refleja en los chips globales.
- [ ] `grep -r "ASESORES" src/` no retorna resultados.

## Restricciones
- No introducir librerías de forms ni toasts. Usar feedback inline.
- La sección de configuración global es pequeña — no la sobreingenierizes con tabs.
- Conservar los estilos base de la página actual; si no hay CSS, usar inline o las clases utilitarias que ya se usan en otras páginas.
