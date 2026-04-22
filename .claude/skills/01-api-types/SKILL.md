---
name: 01-api-types
description: Extender src/lib/api.ts con interfaces TypeScript para Asesor, Conversacion, Mensaje, Actividad y ConfiguracionGlobal, y agregar helper para normalizar respuestas de Strapi.
---

# 01 · Tipos TypeScript para entidades Strapi

## Objetivo
Extender [src/lib/api.ts](../../../src/lib/api.ts) con las interfaces de todas las entidades Strapi documentadas en [strapi.md](../../../strapi.md) (Lead ya existe, no tocar su shape pero sí agregar campos relacionales). Dejar tipos listos para que los siguientes skills (02, 04) los consuman.

## Contexto
- Strapi devuelve datos envueltos en `{ data: { id, attributes: {...} } }` o un array de esos objetos.
- Hoy `Lead` en [src/lib/api.ts](../../../src/lib/api.ts) asume shape plano (sin `attributes`). Mantener compatibilidad: el helper debe aplanar `attributes` antes de devolver.
- Frontend no usa Strapi token — todas las peticiones son públicas contra `http://localhost:1337/api`.
- Enumeraciones exactas en [strapi.md](../../../strapi.md) líneas 198-207.

## Archivos a tocar
- `src/lib/api.ts` (extender, no reemplazar)

## Qué agregar

### Interfaces nuevas (al final del archivo, antes de las constantes `PROGRAMAS`)

```typescript
export interface Asesor {
  id: number;
  nombre: string;
  correo?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Mensaje {
  id: number;
  contenido: string;
  tipo: 'entrada' | 'salida';
  canal: 'whatsapp' | 'email' | 'sms';
  timestamp: string;
  conversacion?: { id: number };
  createdAt: string;
  updatedAt: string;
}

export interface Conversacion {
  id: number;
  canal: 'whatsapp' | 'email' | 'sms';
  ultimo_mensaje?: string;
  ultimo_mensaje_at?: string;
  sin_respuesta: boolean;
  lead?: Lead;
  mensajes?: Mensaje[];
  createdAt: string;
  updatedAt: string;
}

export interface Actividad {
  id: number;
  tipo: 'llamada' | 'correo' | 'reunion' | 'visita' | 'nota' | 'cambio_estado';
  descripcion?: string;
  timestamp: string;
  lead?: { id: number };
  asesor?: Asesor;
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracionGlobal {
  id: number;
  slogan_principal: string;
  modo_demo: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Ajustar `Lead` para incluir relaciones
Cambiar el campo `asesor?: string` a `asesor?: Asesor | null`. Agregar opcionales:

```typescript
conversaciones?: Conversacion[];
actividades?: Actividad[];
```

### Helper `unwrapStrapi`
Agregar al inicio del archivo (justo después del import):

```typescript
type StrapiItem<T> = { id: number; attributes: Omit<T, 'id'> };
type StrapiCollection<T> = { data: StrapiItem<T>[]; meta: unknown };
type StrapiSingle<T> = { data: StrapiItem<T>; meta: unknown };

export function flatten<T extends { id: number }>(item: StrapiItem<T> | T): T {
  if (item && typeof item === 'object' && 'attributes' in (item as object)) {
    const raw = item as StrapiItem<T>;
    return { id: raw.id, ...raw.attributes } as T;
  }
  return item as T;
}

export function flattenList<T extends { id: number }>(items: (StrapiItem<T> | T)[]): T[] {
  return items.map((i) => flatten<T>(i));
}
```

## Criterios de aceptación
- [ ] `npm run build` pasa sin errores de TypeScript.
- [ ] `npm run lint` pasa.
- [ ] Las interfaces existentes (`StrapiResponse<T>`, `Lead` base) siguen exportadas.
- [ ] Las funciones actuales `fetchLeads`, `fetchLead`, `createLead`, `updateLead` **no se modifican en este skill** (eso va en 02).
- [ ] Las constantes `PROGRAMAS`, `ESTADOS`, etc. permanecen sin cambio de valores.

## Restricciones
- No crear archivos nuevos; todo en `src/lib/api.ts`.
- No tocar `src/lib/config.ts` (eso es el skill 03).
- No cambiar el comportamiento de las funciones CRUD existentes.
