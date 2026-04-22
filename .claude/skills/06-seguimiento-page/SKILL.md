---
name: 06-seguimiento-page
description: Conectar SeguimientoPage.tsx (pipeline kanban) a Strapi — cambio de etapa persiste el estado del lead, filtro por asesor desde API, registro automático de actividad tipo cambio_estado.
---

# 06 · SeguimientoPage contra Strapi

## Objetivo
[src/pages/SeguimientoPage.tsx](../../../src/pages/SeguimientoPage.tsx) debe mostrar el pipeline kanban con leads reales, permitir mover tarjetas entre columnas (drag & drop o botones) y persistir el cambio de `estado` en Strapi. Además, cada cambio genera una actividad de auditoría.

## Prerrequisitos
Skills **01–04** completos.

## Archivos a tocar
- `src/pages/SeguimientoPage.tsx`

## Tareas

### 1. Reemplazar fuente de datos
- Eliminar arrays hardcoded (`STAGES`, `ASESORES`) si son de datos — **conservar** la config visual de columnas (nombre, color, icono) como constante local.
- Usar `useLeads()` para la lista.
- Agrupar leads por `estado` usando las columnas: `nuevo`, `contactado`, `interesado`, `calificado`, `cerrado`.

### 2. Filtros
- Filtro por asesor: `useAsesores()` + comparación `lead.asesor?.id === filtroId`.
- Filtro por prioridad: constante `PRIORIDADES`.
- Filtro por rango de `fecha_proxima_accion` (opcional, dejar si ya existía).

### 3. Cambio de etapa
- Implementar con botones de flecha en cada tarjeta (◄ ►) para mover a la etapa anterior/siguiente — más simple y accesible que drag & drop.
- Al click:
  1. Llamar `useUpdateLead().mutate({ id, data: { estado: nuevoEstado } })`.
  2. En `onSuccess` del mutation, llamar `useCreateActividad().mutate({ lead: id, tipo: 'cambio_estado', descripcion: \`Estado cambiado de ${estadoAnterior} a ${nuevoEstado}\`, timestamp: new Date().toISOString() })`.
  3. Disparar ambas mutations en secuencia (no paralelo) para preservar el orden de auditoría.
- Mientras la mutation corre, deshabilitar los botones de esa tarjeta (`isPending`).

### 4. Tarjeta
Mostrar por cada lead:
- `nombres apellidos`
- `programa` (chip)
- `prioridad` con clase `priority-{prioridad}` existente
- `asesor?.nombre ?? 'Sin asignar'`
- `fecha_proxima_accion` si existe; si está vencida (antes de hoy), aplicar clase `overdue`.
- Click en la tarjeta → abrir `LeadDetailModal` reutilizando el de [LeadsPage.tsx](../../../src/pages/LeadsPage.tsx). Si ese modal aún no es exportable, exportarlo desde su archivo original e importarlo aquí.

### 5. Contador por columna
Cada header de columna muestra el conteo de leads en esa etapa.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Las columnas muestran leads reales de Strapi.
- [ ] Mover un lead con los botones persiste el nuevo `estado` y recarga el pipeline.
- [ ] Se crea automáticamente una `Actividad` tipo `cambio_estado` con descripción correcta.
- [ ] El filtro por asesor funciona con los asesores reales.
- [ ] No hay arrays hardcoded de leads ni asesores.

## Restricciones
- No agregar `react-beautiful-dnd` ni `dnd-kit`. Usar botones simples para mover entre etapas.
- Conservar el CSS existente ([SeguimientoPage.css](../../../src/pages/SeguimientoPage.css)). Si agregas clases nuevas, añadirlas al mismo archivo al final.
- No duplicar el componente `LeadDetailModal` — importarlo de `LeadsPage`.
