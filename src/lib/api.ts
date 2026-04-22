import { config, getStrapiUrl, endpointUrl } from './config';

type StrapiItem<T> = { id: number; documentId: string; attributes: Omit<T, 'id' | 'documentId'> };

export function flatten<T extends { id: number; documentId?: string }>(item: StrapiItem<T> | T): T {
  if (item && typeof item === 'object' && 'attributes' in (item as object)) {
    const raw = item as StrapiItem<T>;
    return { id: raw.id, documentId: raw.documentId, ...raw.attributes } as T;
  }
  const raw = item as Record<string, unknown>;
  const { id, documentId, ...rest } = raw;
  return { id: id as number, documentId: documentId as string, ...rest } as T;
}

export function flattenList<T extends { id: number }>(items: (StrapiItem<T> | T)[]): T[] {
  return items.map((i) => flatten<T>(i));
}

async function strapiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers:
    {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_STRAPI_TOKEN}`,
      ...(init?.headers || {})
    }
    ,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Strapi error:', res.status, body);
    throw new Error(`Strapi ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface Lead {
  id: number;
  documentId: string;
  nombres: string;
  apellidos: string;
  programa: string;
  cedula: string;
  celular: string;
  correo: string;
  ciudad: string;
  estado: string;
  fuente?: string;
  asesor?: Asesor | null | string | number;
  prioridad?: string;
  fecha_ultimo_contacto?: string;
  fecha_proxima_accion?: string;
  tipo_proxima_accion?: string;
  notas?: string;
  conversaciones?: Conversacion[];
  actividades?: Actividad[];
  createdAt: string;
  updatedAt: string;
}

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
  documentId: string;
  tipo: 'llamada' | 'correo' | 'reunion' | 'visita' | 'nota' | 'cambio_estado';
  descripcion?: string;
  timestamp: string;
  lead?: { id: number };
  asesor?: Asesor | null | number;
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

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// ============ LEADS ============

export async function fetchLeads(): Promise<Lead[]> {
  const url = `${getStrapiUrl('leads')}?populate=asesor&sort=createdAt:desc`;
  const res = await strapiFetch<StrapiResponse<Lead[]>>(url);
  return flattenList(res.data);
}

export async function fetchLead(documentId: string): Promise<Lead> {
  const url = `${getStrapiUrl('leads', documentId)}?populate[asesor]=true&populate[conversacions]=true&populate[actividads]=true`;
  const res = await strapiFetch<StrapiResponse<Lead>>(url);
  if (!res.data) throw new Error('Lead no encontrado');
  return flatten(res.data);
}

export async function createLead(input: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const { documentId, ...rest } = input as Record<string, unknown>;
  const data: Record<string, unknown> = { ...rest };
  if (input.asesor) {
    const asesor = input.asesor as Asesor;
    data.asesor = typeof asesor === 'object' ? asesor.id : asesor;
  } else if (input.asesor === null) {
    data.asesor = null;
  }
  const res = await strapiFetch<StrapiResponse<Lead>>(getStrapiUrl('leads'), {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return flatten(res.data);
}

export async function updateLead(documentId: string, input: Partial<Lead>): Promise<Lead> {
  // Solo los campos que Strapi acepta en el body
  const EDITABLE_FIELDS = [
    'nombres', 'apellidos', 'programa', 'cedula', 'celular',
    'correo', 'ciudad', 'estado', 'fuente', 'prioridad',
    'fecha_ultimo_contacto', 'fecha_proxima_accion',
    'tipo_proxima_accion', 'notas', 'asesor'
  ];

  const data: Record<string, unknown> = {};

  for (const field of EDITABLE_FIELDS) {
    if (field in input) {
      data[field] = (input as Record<string, unknown>)[field];
    }
  }

  // Manejo especial del asesor
  if (input.asesor !== undefined) {
    if (input.asesor === null) {
      data.asesor = null;
    } else {
      const asesor = input.asesor as Asesor;
      data.asesor = typeof asesor === 'object' ? asesor.id : asesor;
    }
  }

  console.log("🐼 ~ data:", data);
  const res = await strapiFetch<StrapiResponse<Lead>>(getStrapiUrl('leads', documentId), {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  return flatten(res.data);
}

export async function deleteLead(documentId: string): Promise<void> {
  await strapiFetch(getStrapiUrl('leads', documentId), { method: 'DELETE' });
}

// ============ ASESORES ============

export async function fetchAsesores(): Promise<Asesor[]> {
  const url = `${getStrapiUrl('asesors')}?sort=nombre:asc`;
  const res = await strapiFetch<StrapiResponse<Asesor[]>>(url);
  return flattenList(res.data);
}

export async function createAsesor(input: Omit<Asesor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asesor> {
  const res = await strapiFetch<StrapiResponse<Asesor>>(getStrapiUrl('asesores'), {
    method: 'POST',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

export async function updateAsesor(id: number, input: Partial<Asesor>): Promise<Asesor> {
  const res = await strapiFetch<StrapiResponse<Asesor>>(getStrapiUrl('asesores', id), {
    method: 'PUT',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

export async function deleteAsesor(id: number): Promise<void> {
  await strapiFetch(getStrapiUrl('asesores', id), { method: 'DELETE' });
}

// ============ CONVERSACIONES ============

export async function fetchConversaciones(): Promise<Conversacion[]> {
  const url = `${getStrapiUrl('conversaciones')}?populate[lead][populate][asesor]=true&sort=ultimo_mensaje_at:desc`;
  const res = await strapiFetch<StrapiResponse<Conversacion[]>>(url);
  return flattenList(res.data);
}

export async function fetchConversacion(id: number): Promise<Conversacion> {
  const url = `${getStrapiUrl('conversaciones', id)}?populate[lead][populate][asesor]=true&populate[mensajes]=true`;
  const res = await strapiFetch<StrapiResponse<Conversacion>>(url);
  const conv = flatten(res.data);
  if (conv.mensajes) {
    conv.mensajes = flattenList(conv.mensajes).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  return conv;
}

export async function createConversacion(input: { lead: number; canal: Conversacion['canal'] }): Promise<Conversacion> {
  const res = await strapiFetch<StrapiResponse<Conversacion>>(getStrapiUrl('conversaciones'), {
    method: 'POST',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

export async function updateConversacion(id: number, input: Partial<Conversacion>): Promise<Conversacion> {
  const res = await strapiFetch<StrapiResponse<Conversacion>>(getStrapiUrl('conversaciones', id), {
    method: 'PUT',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

// ============ MENSAJES ============

export async function fetchMensajesByConversacion(conversacionId: number): Promise<Mensaje[]> {
  const url = `${getStrapiUrl('mensajes')}?filters[conversacion][id][$eq]=${conversacionId}&sort=timestamp:asc`;
  const res = await strapiFetch<StrapiResponse<Mensaje[]>>(url);
  return flattenList(res.data);
}

export async function createMensaje(input: {
  conversacion: number;
  contenido: string;
  tipo: Mensaje['tipo'];
  canal: Mensaje['canal'];
  timestamp?: string;
}): Promise<Mensaje> {
  const data = {
    ...input,
    timestamp: input.timestamp || new Date().toISOString(),
  };
  const res = await strapiFetch<StrapiResponse<Mensaje>>(getStrapiUrl('mensajes'), {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return flatten(res.data);
}

// ============ ACTIVIDADES ============

export async function fetchActividadesByLead(leadId: number): Promise<Actividad[]> {
  const url = `${endpointUrl('actividades')}?filters[lead][id][$eq]=${leadId}&populate=asesor&sort=timestamp:desc`;
  const res = await strapiFetch<StrapiResponse<Actividad[]>>(url);
  return flattenList(res.data);
}

export async function createActividad(input: {
  lead: number;
  tipo: Actividad['tipo'];
  descripcion?: string;
  timestamp?: string;
  asesor?: number;
}): Promise<Actividad> {
  const data: Record<string, unknown> = {
    lead: input.lead,
    tipo: input.tipo,
    descripcion: input.descripcion,
    timestamp: input.timestamp || new Date().toISOString(),
  };
  if (input.asesor) data.asesor = input.asesor;
  const res = await strapiFetch<StrapiResponse<Actividad>>(endpointUrl('actividades'), {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return flatten(res.data);
}

export async function updateActividad(documentId: string, input: Partial<Actividad>): Promise<Actividad> {
  const { id, documentId: _docId, ...rest } = input as Record<string, unknown>;
  const data: Record<string, unknown> = { ...rest };
  if (input.asesor !== undefined) {
    if (input.asesor === null) {
      data.asesor = null;
    } else if (typeof input.asesor === 'object') {
      data.asesor = input.asesor.id;
    }
  }
  const res = await strapiFetch<StrapiResponse<Actividad>>(endpointUrl('actividades', documentId), {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  return flatten(res.data);
}

export async function deleteActividad(documentId: string): Promise<void> {
  await strapiFetch(endpointUrl('actividades', documentId), { method: 'DELETE' });
}

export async function fetchConfiguracion(): Promise<ConfiguracionGlobal> {
  const res = await strapiFetch<StrapiResponse<ConfiguracionGlobal>>(`${config.strapiBaseUrl}${config.strapiApiPath}/configuracion-global`);
  return flatten(res.data);
}

export async function updateConfiguracion(input: Partial<ConfiguracionGlobal>): Promise<ConfiguracionGlobal> {
  const res = await strapiFetch<StrapiResponse<ConfiguracionGlobal>>(`${config.strapiBaseUrl}${config.strapiApiPath}/configuracion-global`, {
    method: 'PUT',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

export const PROGRAMAS = ['Ingenieria', 'Medicina', 'Derecho', 'Administracion', 'Psicologia', 'Comunicacion'];
export const ESTADOS = ['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado'];
export const FUENTES = ['web', 'referido', 'facebook', 'instagram', 'google'];
export const PRIORIDADES = ['baja', 'media', 'alta'];
export const TIPOS_ACCION = ['llamada', 'correo', 'reunion', 'visita'];
