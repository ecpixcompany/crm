---
name: 02-api-crud
description: Añadir funciones CRUD en src/lib/api.ts para Asesor, Conversacion, Mensaje, Actividad y ConfiguracionGlobal, y reescribir las de Lead para usar el helper flatten y populate de relaciones.
---

# 02 · Funciones CRUD contra Strapi

## Objetivo
Completar [src/lib/api.ts](../../../src/lib/api.ts) con todas las funciones `fetch/create/update/delete` que necesita el frontend. Sin token. Usar `populate` para traer relaciones cuando se requieran.

## Prerrequisito
Skill **01-api-types** ya ejecutado (interfaces y helper `flatten`/`flattenList` existen).

## Archivos a tocar
- `src/lib/api.ts`
- `src/lib/config.ts` (solo si el skill 03 aún no se ejecutó, añadir endpoints faltantes)

## Qué implementar

### Utilidad base
Agregar al inicio del archivo (tras imports):

```typescript
async function strapiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Strapi ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
```

### Leads (reemplazar las funciones existentes)
- `fetchLeads()` → usa `getStrapiUrl('leads') + '?populate=asesor&sort=createdAt:desc'`. Devuelve `Lead[]` ya aplanados (incluye `asesor` aplanado).
- `fetchLead(id)` → agrega `?populate[asesor]=true&populate[conversaciones]=true&populate[actividades]=true`.
- `createLead(input)` / `updateLead(id, input)` → cuando `input.asesor` sea un número o `Asesor`, enviar como `{ data: { ..., asesor: idAsesor } }`. Si es `null`, enviar `asesor: null` para desasignar.
- `deleteLead(id)` → `DELETE`, devuelve `void`.

### Asesores
```typescript
export async function fetchAsesores(): Promise<Asesor[]>;
export async function createAsesor(input: Omit<Asesor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asesor>;
export async function updateAsesor(id: number, input: Partial<Asesor>): Promise<Asesor>;
export async function deleteAsesor(id: number): Promise<void>;
```
Orden por `nombre:asc`. Sin populate.

### Conversaciones
```typescript
export async function fetchConversaciones(): Promise<Conversacion[]>;
export async function fetchConversacion(id: number): Promise<Conversacion>;
export async function createConversacion(input: { lead: number; canal: Conversacion['canal'] }): Promise<Conversacion>;
export async function updateConversacion(id: number, input: Partial<Conversacion>): Promise<Conversacion>;
```
- `fetchConversaciones` → `?populate[lead][populate][asesor]=true&sort=ultimo_mensaje_at:desc`.
- `fetchConversacion` → `?populate[lead][populate][asesor]=true&populate[mensajes]=true`. Mensajes deben venir aplanados y ordenados por `timestamp:asc` (hacer el sort en cliente tras flatten).

### Mensajes
```typescript
export async function fetchMensajesByConversacion(conversacionId: number): Promise<Mensaje[]>;
export async function createMensaje(input: {
  conversacion: number;
  contenido: string;
  tipo: Mensaje['tipo'];
  canal: Mensaje['canal'];
  timestamp?: string; // default: new Date().toISOString()
}): Promise<Mensaje>;
```
Filtro Strapi: `?filters[conversacion][id][$eq]=${id}&sort=timestamp:asc`.

Tras crear un mensaje tipo `salida`, el consumidor (skill 07) es responsable de llamar `updateConversacion` para refrescar `ultimo_mensaje` y `ultimo_mensaje_at`. Esta función no lo hace automáticamente.

### Actividades
```typescript
export async function fetchActividadesByLead(leadId: number): Promise<Actividad[]>;
export async function createActividad(input: {
  lead: number;
  tipo: Actividad['tipo'];
  descripcion?: string;
  timestamp?: string;
  asesor?: number;
}): Promise<Actividad>;
```
Filtro: `?filters[lead][id][$eq]=${leadId}&populate=asesor&sort=timestamp:desc`.

### ConfiguracionGlobal (Single Type)
```typescript
export async function fetchConfiguracion(): Promise<ConfiguracionGlobal>;
export async function updateConfiguracion(input: Partial<ConfiguracionGlobal>): Promise<ConfiguracionGlobal>;
```
- `fetchConfiguracion` → `GET /api/configuracion-global`. Aplicar `flatten` al `data`.
- `updateConfiguracion` → `PUT /api/configuracion-global` con `{ data: {...} }`.

## Notas sobre el shape de Strapi
- Strapi v4 envuelve en `data.attributes`; Strapi v5 lo aplana. Usar `flatten()` siempre — si ya está plano, es no-op (ver skill 01).
- Para relaciones en `POST/PUT`, Strapi acepta el **id** directo: `{ data: { asesor: 3 } }`.
- Colecciones filtradas devuelven `{ data: [...], meta: { pagination } }`.

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Todas las funciones exportadas arriba existen y tienen el shape tipado correcto.
- [ ] `fetchLeads()` devuelve leads con `asesor` ya aplanado (accesible como `lead.asesor?.nombre`).
- [ ] Funciones manejan errores con mensaje claro (`Strapi 404: ...`).

## Restricciones
- No agregar librerías (sin axios, sin ky). Usar `fetch` nativo.
- No mutar `src/lib/config.ts` más allá de agregar endpoints faltantes si el skill 03 no se ejecutó.
- No añadir autenticación/token.
- La constante hardcoded `ASESORES` se deja intacta en este skill (se elimina en skill 09).
