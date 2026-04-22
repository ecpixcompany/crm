# Arquitectura del CRM

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Strapi v5 (REST API)
- **Comunicación con WhatsApp**: n8n + Evolution API

---

## Endpoints de Strapi

| Entidad | Endpoint | Métodos |
|---------|----------|---------|
| Leads | `/api/leads` | GET, POST, PUT, DELETE |
| Asesores | `/api/asesors` | GET, POST, PUT, DELETE |
| Conversaciones | `/api/conversaciones` | GET, POST, PUT |
| Mensajes | `/api/mensajes` | GET, POST |
| Actividades | `/api/actividads` | GET, POST, PUT, DELETE |
| Configuración Global | `/api/configuracion-global` | GET, PUT |

---

## Modelo de Datos

```
Lead
├── nombres, apellidos, cedula, celular, correo, ciudad
├── programa (Ingenieria, Medicina, Derecho, Administracion, Psicologia, Comunicacion)
├── estado (nuevo, contactado, interesado, calificado, cerrado)
├── fuente (web, referido, facebook, instagram, google)
├── prioridad (baja, media, alta)
├── asesor → Asesor (relación)
├── fecha_ultimo_contacto, fecha_proxima_accion, tipo_proxima_accion
├── notas
├── conversaciones → Conversacion[]
└── actividades → Actividad[]

Asesor
├── nombre, correo
└── activo (boolean)

Conversacion
├── canal (whatsapp, email, sms)
├── ultimo_mensaje, ultimo_mensaje_at
├── sin_respuesta (boolean)
├── lead → Lead
└── mensajes → Mensaje[]

Mensaje
├── contenido, tipo (entrada, salida), canal
├── timestamp
└── conversacion → Conversacion

Actividad
├── tipo (llamada, correo, reunion, visita, nota, cambio_estado)
├── descripcion, timestamp
├── lead → Lead
└── asesor → Asesor

ConfiguracionGlobal (Singleton)
├── slogan_principal
└── modo_demo
```

---

## Helper de API (`lib/api.ts`)

### `flatten<T>(item)`
Normaliza la respuesta de Strapi que viene con formato `{ id, documentId, attributes }` a un objeto plano.

### `flattenList<T>(items[])`
Aplica `flatten` a un array de items.

### `strapiFetch<T>(url, init?)`
Wrapper de `fetch` que incluye:
- Header `Content-Type: application/json`
- Header `Authorization: Bearer {VITE_STRAPI_TOKEN}`
- Validación de respuesta y manejo de errores

---

## Campos Editables de Lead

```typescript
[
  'nombres', 'apellidos', 'programa', 'cedula', 'celular',
  'correo', 'ciudad', 'estado', 'fuente', 'prioridad',
  'fecha_ultimo_contacto', 'fecha_proxima_accion',
  'tipo_proxima_accion', 'notas', 'asesor'
]
```

---

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_STRAPI_BASE_URL` | URL base de Strapi (ej: `https://strapi.ecpixcompany.com`) |
| `VITE_STRAPI_TOKEN` | Token de autenticación de Strapi |
