---
name: 04-react-query-hooks
description: Crear hooks de React Query (src/hooks/*) para cada entidad Strapi con queries, mutations e invalidaciones correctas.
---

# 04 · Hooks de React Query

## Objetivo
Crear en `src/hooks/` un hook por entidad que encapsule las queries y mutations de [src/lib/api.ts](../../../src/lib/api.ts). Las páginas del skill 05 en adelante **solo** consumirán estos hooks — no llamarán `fetch*` directamente.

## Prerrequisito
Skills **01**, **02**, **03** completos.

## Archivos a crear
- `src/hooks/useLeads.ts`
- `src/hooks/useAsesores.ts`
- `src/hooks/useConversaciones.ts`
- `src/hooks/useMensajes.ts`
- `src/hooks/useActividades.ts`
- `src/hooks/useConfiguracion.ts`

El `QueryClient` ya está configurado en [src/lib/query.ts](../../../src/lib/query.ts) con `staleTime: 5min` y `retry: 1`.

## Convenciones

### Query keys
Usar arrays con convención jerárquica:
```typescript
['leads']                       // lista
['leads', id]                   // detalle
['conversaciones']              // lista
['conversaciones', id]          // detalle con mensajes
['mensajes', { conversacionId }]
['actividades', { leadId }]
['asesores']
['configuracion']
```

### Invalidaciones esperadas
| Mutation                | Invalida                                                        |
|-------------------------|-----------------------------------------------------------------|
| `createLead`            | `['leads']`                                                     |
| `updateLead`            | `['leads']`, `['leads', id]`                                    |
| `deleteLead`            | `['leads']`                                                     |
| `createAsesor` / update | `['asesores']`                                                  |
| `deleteAsesor`          | `['asesores']`, `['leads']` (porque cambia la relación)         |
| `createMensaje`         | `['conversaciones']`, `['conversaciones', conversacionId]`, `['mensajes', { conversacionId }]` |
| `updateConversacion`    | `['conversaciones']`, `['conversaciones', id]`                  |
| `createActividad`       | `['actividades', { leadId }]`, `['leads', leadId]`              |
| `updateConfiguracion`   | `['configuracion']`                                             |

## Shape de cada hook

### Ejemplo: `useLeads.ts`
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchLeads, fetchLead, createLead, updateLead, deleteLead,
  type Lead,
} from '../lib/api';

export function useLeads() {
  return useQuery({ queryKey: ['leads'], queryFn: fetchLeads });
}

export function useLead(id: number | undefined) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => fetchLead(id!),
    enabled: id !== undefined,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) => updateLead(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads', vars.id] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
```

Replicar el mismo patrón en los otros archivos siguiendo la tabla de invalidaciones.

### `useMensajes.ts` — nota especial
`useCreateMensaje` debe aceptar un parámetro `conversacionId` en el payload y, tras crear, disparar también `updateConversacion` para refrescar `ultimo_mensaje` y `ultimo_mensaje_at` con los datos del mensaje recién creado. Implementarlo dentro del `mutationFn` para mantener el hook en un solo paso desde el punto de vista del consumidor.

### `useConfiguracion.ts`
Single Type. Exponer `useConfiguracion()` (query) y `useUpdateConfiguracion()` (mutation). La query no requiere id.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Los 6 archivos existen.
- [ ] Cada hook exporta sus queries/mutations con nombres consistentes (`useX`, `useCreateX`, `useUpdateX`, `useDeleteX`).
- [ ] Las invalidaciones respetan la tabla.

## Restricciones
- No crear un `index.ts` barrel en `src/hooks/` (las páginas importan directo del archivo del hook).
- No agregar optimistic updates en este skill (puede venir después si se pide).
- No envolver en try/catch — React Query gestiona el estado de error.
