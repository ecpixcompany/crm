# Leads (`/leads`)

## Descripción

Página de gestión de leads con tabla navegable, filtros por estado/programa/asesor, búsqueda por texto, y modales para crear/editar leads.

## Endpoints Utilizados

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useLeads()` | `/api/leads?populate=asesor&sort=createdAt:desc` | GET | Lista todos los leads |
| `useCreateLead()` | `/api/leads` | POST | Crea un nuevo lead |
| `useUpdateLead()` | `/api/leads/:documentId` | PUT | Actualiza un lead existente |
| `useDeleteLead()` | `/api/leads/:documentId` | DELETE | Elimina un lead |
| `useAsesores()` | `/api/asesors?sort=nombre:asc` | GET | Lista asesores para selects |

## Flujo de Datos

```
LeadsPage
  ├── useLeads() → GET /api/leads?populate=asesor&sort=createdAt:desc
  ├── useAsesores() → GET /api/asesors?sort=nombre:asc
  │
  ├── Toolbar (filtros/search)
  │     └── Filtra client-side los leads obtenidos
  │
  ├── LeadsTable
  │     └── Renderiza tabla con leads filtrados
  │
  ├── CreateLeadModal
  │     └── useCreateLead() → POST /api/leads
  │     └── useAsesores() para select de asesor
  │
  └── LeadDetailModal
        └── useLead(id) → GET /api/leads/:documentId?populate=...
        └── useUpdateLead() → PUT /api/leads/:documentId
        └── useDeleteLead() → DELETE /api/leads/:documentId
        └── useActividades(leadId) → GET /api/actividads?filters[lead][id][$eq]=...
        └── useCreateActividad() → POST /api/actividads
```

## Campos del Lead

| Campo | Tipo | Editable | Descripción |
|-------|------|----------|-------------|
| `nombres` | string | Sí | Nombre(s) del lead |
| `apellidos` | string | Sí | Apellido(s) del lead |
| `programa` | enum | Sí | Programa de interés |
| `cedula` | string | Sí | Cédula de identidad |
| `celular` | string | Sí | Número de WhatsApp |
| `correo` | string | Sí | Email |
| `ciudad` | string | Sí | Ciudad de residencia |
| `estado` | enum | Sí | Estado en el pipeline |
| `fuente` | enum | Sí | Fuente de adquisición |
| `asesor` | relation | Sí | Asesor asignado |
| `prioridad` | enum | Sí | Prioridad de contacto |
| `fecha_ultimo_contacto` | date | Sí | Último contacto |
| `fecha_proxima_accion` | date | Sí | Próxima acción programada |
| `tipo_proxima_accion` | enum | Sí | Tipo de acción |
| `notas` | text | Sí | Notas adicionales |

## Enums Disponibles

```typescript
PROGRAMAS = ['Ingenieria', 'Medicina', 'Derecho', 'Administracion', 'Psicologia', 'Comunicacion']
ESTADOS = ['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado']
FUENTES = ['web', 'referido', 'facebook', 'instagram', 'google']
PRIORIDADES = ['baja', 'media', 'alta']
TIPOS_ACCION = ['llamada', 'correo', 'reunion', 'visita']
```

## Componentes

- `LeadsPage.tsx` / `LeadsPage.css`
- `CreateLeadModal.tsx` - Modal de creación
- `LeadDetailModal.tsx` - Modal de detalle/edición
- `AsesorQuickCreate` - Subcomponente para crear asesor inline
