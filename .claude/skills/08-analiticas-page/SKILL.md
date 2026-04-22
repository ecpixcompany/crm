---
name: 08-analiticas-page
description: Reemplazar MOCK_LEADS en AnaliticasPage.tsx con agregaciones reales calculadas desde useLeads y useActividades, y leer asesores reales para las barras de carga por asesor.
---

# 08 · AnaliticasPage contra datos reales

## Objetivo
[src/pages/AnaliticasPage.tsx](../../../src/pages/AnaliticasPage.tsx) debe calcular todos sus indicadores desde datos reales. Hoy todo viene de `MOCK_LEADS` hardcoded.

## Prerrequisitos
Skills **01–04** completos.

## Archivos a tocar
- `src/pages/AnaliticasPage.tsx`

## Tareas

### 1. Eliminar mocks
- Borrar el array `MOCK_LEADS` y el array `asesores` local (líneas ~10-41).
- Borrar la interfaz local `Lead` (ya se importa desde [src/lib/api.ts](../../../src/lib/api.ts)).

### 2. Fuentes de datos
- `useLeads()` → lista completa (sin paginación).
- `useAsesores()` → para las barras de carga por asesor.
- `useActividades` no aplica aquí (estaría por lead); si hace falta para "seguimientos realizados" usar el conteo de leads en estados `contactado` + `interesado`, que ya es lo que hace la página.

### 3. Recalcular KPIs
- `totalLeads` = `leads.length`.
- `conversionRate` = `leads.filter(l => l.estado === 'calificado' || l.estado === 'cerrado').length / totalLeads * 100`. Redondear.
- `pendingTasks` = `leads.filter(l => l.fecha_proxima_accion && new Date(l.fecha_proxima_accion) < hoy).length`.
- `pendingChats` = por ahora dejar en 0 hasta que se quiera derivar de conversaciones. **Alternativa**: usar `useConversaciones()` y contar `sin_respuesta === true` — implementar esta versión.

### 4. Barras
- `getEstadoCount`, `getProgramaCount`, `getFuenteCount` reciben ahora leads reales.
- `getAsesorCount` debe comparar por `lead.asesor?.id === asesor.id` (no por nombre).
- Si `asesores` viene vacío, la sección "Carga por asesor" muestra mensaje "Sin asesores registrados aún."

### 5. Estados de carga y error
- Si cualquiera de las queries está `isLoading`, mostrar skeleton global o spinner.
- Si hay error, mostrar banner con el mensaje.

### 6. Meta sugeridas
- Conservar los valores de `serviceIndicators` (meta) tal cual — son objetivos estáticos.
- `Leads por asesor (promedio)` = `totalLeads / asesores.length` (guarda contra división por cero).

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Con base vacía, la página no se rompe (muestra 0s y placeholders).
- [ ] Con leads reales en Strapi, los conteos coinciden con los datos.
- [ ] Los asesores mostrados son los reales de Strapi.
- [ ] No queda ningún array hardcoded en el archivo.

## Restricciones
- No introducir librería de charting. Mantener las "barras" CSS actuales.
- No tocar [AnaliticasPage.css](../../../src/pages/AnaliticasPage.css) salvo añadir clases al final si necesitas un estado skeleton.
