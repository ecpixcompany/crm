export const config = {
  strapiEnabled: true,
  strapiBaseUrl: import.meta.env.VITE_STRAPI_BASE_URL ?? '',
  strapiApiPath: '/api',
  n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.ecpixcompany.com/webhook/send-text',
endpoints: {
    leads: 'leads',
    asesores: 'asesors',
    conversaciones: 'conversacions',
    mensajes: 'mensajes',
    actividades: 'actividads',
    configuracion: 'configuracion-global',
    configuracionAi: 'configuracion-ais',
  },
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
};

export type EndpointKey = keyof typeof config.endpoints;

export function getStrapiUrl(endpoint: string, id?: number | string) {
  const base = `${config.strapiBaseUrl}${config.strapiApiPath}/${endpoint}`;
  return id ? `${base}/${id}` : base;
}

export function endpointUrl(key: EndpointKey, id?: number | string) {
  return getStrapiUrl(config.endpoints[key], id as number | undefined);
}
