---
name: 03-config-endpoints
description: Añadir endpoints de asesores, conversaciones, actividades y configuracion-global a src/lib/config.ts, y ampliar leadWritableFields con los campos que el UI edita.
---

# 03 · Endpoints de configuración

## Objetivo
Ampliar [src/lib/config.ts](../../../src/lib/config.ts) para que `getStrapiUrl` sirva a todas las entidades y para que `leadWritableFields` incluya todos los campos editables desde la UI.

## Archivos a tocar
- `src/lib/config.ts` (único archivo)

## Estado actual
```typescript
endpoints: {
  leads: 'leads',
  mensajes: 'mensajes',
  seguimientos: 'seguimientos',
  tableros: 'tableros',
},
leadWritableFields: ['nombres', 'apellidos', 'programa', 'cedula', 'celular', 'correo', 'ciudad', 'estado'],
```

## Cambios requeridos

### `endpoints`
Reemplazar por:
```typescript
endpoints: {
  leads: 'leads',
  asesores: 'asesores',
  conversaciones: 'conversaciones',
  mensajes: 'mensajes',
  actividades: 'actividades',
  configuracion: 'configuracion-global',
},
```
> Eliminar `seguimientos` y `tableros`: no corresponden a ningún Content Type real (se calculan desde leads/actividades en la UI).

### `leadWritableFields`
Reemplazar por la lista completa de campos editables desde `CreateLeadModal` y `LeadDetailModal`:
```typescript
leadWritableFields: [
  'nombres',
  'apellidos',
  'programa',
  'cedula',
  'celular',
  'correo',
  'ciudad',
  'estado',
  'fuente',
  'prioridad',
  'asesor',
  'fecha_ultimo_contacto',
  'fecha_proxima_accion',
  'tipo_proxima_accion',
  'notas',
],
```

### Exportar un helper tipado para endpoints
Agregar:
```typescript
export type EndpointKey = keyof typeof config.endpoints;

export function endpointUrl(key: EndpointKey, id?: number | string) {
  return getStrapiUrl(config.endpoints[key], id as number | undefined);
}
```
> `getStrapiUrl` actual ya acepta string cuando se llama directamente; este helper añade seguridad de tipos sobre las keys.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] `getStrapiUrl('asesores')` devuelve `http://localhost:1337/api/asesores`.
- [ ] `endpointUrl('configuracion')` devuelve `http://localhost:1337/api/configuracion-global`.
- [ ] `config.leadWritableFields` contiene 15 entradas.

## Restricciones
- No modificar `strapiBaseUrl` ni `strapiApiPath`.
- No tocar `strapiEnabled` (sigue en `true`).
- Si algún otro archivo importa `endpoints.seguimientos` o `endpoints.tableros`, reemplazar por el endpoint correcto o eliminar el import (hacer `grep` de `endpoints.seguimientos` y `endpoints.tableros` antes de terminar).
