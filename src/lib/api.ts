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
    const bodyText = await res.text().catch(() => '');
    let bodyJson: Record<string, unknown> | null = null;
    try { bodyJson = JSON.parse(bodyText); } catch { /* not JSON */ }
    const detail = bodyJson
      ? JSON.stringify(bodyJson)
      : bodyText || res.statusText;
    const method = init?.method || 'GET';
    console.error(`Strapi error: ${method} ${url} → ${res.status}`, bodyJson ?? bodyText);
    throw new Error(`Strapi ${res.status} ${url}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function webhookFetch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Webhook ${res.status}: ${bodyText || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function sendMessageViaN8N(input: {
  phone: string;
  message: string;
  leadName?: string;
  agentName?: string;
}): Promise<unknown> {
  return webhookFetch(config.n8nWebhookUrl, {
    phone: input.phone,
    message: input.message,
    leadName: input.leadName,
    agentName: input.agentName,
  });
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
  documentId: string;
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
  documentId: string;
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

export interface ConfiguracionAi {
  id: number;
  documentId: string;
  lead?: { id: number; documentId: string } | null;
  habilitado: boolean;
  modelo: string;
  prompt_custom?: string;
  notas_ai?: string;
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
  const url = `${getStrapiUrl('leads', documentId)}?populate[asesor]=true&populate[conversaciones]=true&populate[actividades]=true`;
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

export async function createAsesor(input: Omit<Asesor, 'id' | 'documentId' | 'createdAt' | 'updatedAt'>): Promise<Asesor> {
  const res = await strapiFetch<StrapiResponse<Asesor>>(endpointUrl('asesores'), {
    method: 'POST',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

export async function updateAsesor(documentId: string, input: Partial<Asesor>): Promise<Asesor> {
  const res = await strapiFetch<StrapiResponse<Asesor>>(endpointUrl('asesores', documentId), {
    method: 'PUT',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

export async function deleteAsesor(documentId: string): Promise<void> {
  await strapiFetch(endpointUrl('asesores', documentId), { method: 'DELETE' });
}

// ============ CONVERSACIONES ============

export async function fetchConversaciones(): Promise<Conversacion[]> {
  const url = `${endpointUrl('conversaciones')}?populate[lead][populate][asesor]=true&sort=ultimo_mensaje_at:desc`;
  const res = await strapiFetch<StrapiResponse<Conversacion[]>>(url);
  return flattenList(res.data);
}

export async function fetchConversacion(documentId: string): Promise<Conversacion> {
  const url = `${endpointUrl('conversaciones', documentId)}?populate[lead][populate][asesor]=true&populate[mensajes]=true`;
  const res = await strapiFetch<StrapiResponse<Conversacion>>(url);
  const conv = flatten(res.data);
  if (conv.mensajes) {
    conv.mensajes = flattenList(conv.mensajes).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  return conv;
}

export async function createConversacion(input: { leadDocumentId: string; canal: Conversacion['canal'] }): Promise<Conversacion> {
  const res = await strapiFetch<StrapiResponse<Conversacion>>(endpointUrl('conversaciones'), {
    method: 'POST',
    body: JSON.stringify({ data: { lead: input.leadDocumentId, canal: input.canal } }),
  });
  return flatten(res.data);
}

export async function updateConversacion(documentId: string, input: Partial<Conversacion>): Promise<Conversacion> {
  const res = await strapiFetch<StrapiResponse<Conversacion>>(endpointUrl('conversaciones', documentId), {
    method: 'PUT',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}

// ============ MENSAJES ============

export async function fetchMensajesByConversacion(conversacionDocumentId: string): Promise<Mensaje[]> {
  const url = `${endpointUrl('mensajes')}?filters[conversacion][documentId][$eq]=${conversacionDocumentId}&sort=timestamp:asc`;
  const res = await strapiFetch<StrapiResponse<Mensaje[]>>(url);
  return flattenList(res.data);
}

export async function createMensaje(input: {
  conversacionDocumentId: string;
  contenido: string;
  tipo: Mensaje['tipo'];
  canal: Mensaje['canal'];
  timestamp?: string;
}): Promise<Mensaje> {
  const data = {
    conversacion: input.conversacionDocumentId,
    contenido: input.contenido,
    tipo: input.tipo,
    canal: input.canal,
    timestamp: input.timestamp || new Date().toISOString(),
  };
  const res = await strapiFetch<StrapiResponse<Mensaje>>(endpointUrl('mensajes'), {
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
export const MODELOS_AI = [
  'Qwen/Qwen3.6-35B-A3B',
  'google/gemma-4-31B-it',
  'deepseek-ai/DeepSeek-V3.2',
  'MiniMaxAI/MiniMax-M2.5'
];

// ============ CONFIGURACION AI ============

export async function fetchConfiguracionAiByLead(leadDocumentId: string): Promise<ConfiguracionAi | null> {
  const url = `${endpointUrl('configuracionAi')}?filters[lead][documentId][$eq]=${leadDocumentId}&populate=lead`;
  const res = await strapiFetch<StrapiResponse<ConfiguracionAi[]>>(url);
  if (!res.data || res.data.length === 0) return null;
  return flatten(res.data[0]);
}

export async function createConfiguracionAi(input: {
  leadDocumentId: string;
  habilitado?: boolean;
  modelo?: string;
  prompt_custom?: string;
  notas_ai?: string;
}): Promise<ConfiguracionAi> {
  const data: Record<string, unknown> = { lead: input.leadDocumentId };
  if (input.habilitado !== undefined) data.habilitado = input.habilitado;
  if (input.modelo !== undefined) data.modelo = input.modelo;
  if (input.prompt_custom !== undefined) data.prompt_custom = input.prompt_custom;
  if (input.notas_ai !== undefined) data.notas_ai = input.notas_ai;
  const res = await strapiFetch<StrapiResponse<ConfiguracionAi>>(endpointUrl('configuracionAi'), {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return flatten(res.data);
}

export async function updateConfiguracionAi(
  documentId: string,
  input: Partial<Omit<ConfiguracionAi, 'id' | 'documentId' | 'lead' | 'createdAt' | 'updatedAt'>>
): Promise<ConfiguracionAi> {
  const res = await strapiFetch<StrapiResponse<ConfiguracionAi>>(endpointUrl('configuracionAi', documentId), {
    method: 'PUT',
    body: JSON.stringify({ data: input }),
  });
  return flatten(res.data);
}
