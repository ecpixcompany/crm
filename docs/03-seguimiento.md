# Seguimiento (`/seguimiento`)

## Descripción

Página de pipeline Kanban con 5 etapas (nuevo → contactado → interesado → calificado → cerrado). Permite arrastrar leads entre etapas, lo cual persiste el cambio de estado en Strapi y registra automáticamente una actividad de tipo `cambio_estado`.

## Endpoints Utilizados

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useLeads()` | `/api/leads?populate=asesor&sort=createdAt:desc` | GET | Lista todos los leads |
| `useAsesores()` | `/api/asesors?sort=nombre:asc` | GET | Lista asesores para filtros |
| `useUpdateLead()` | `/api/leads/:documentId` | PUT | Actualiza estado del lead |
| `useCreateActividad()` | `/api/actividads` | POST | Registra cambio de estado |

## Flujo de Datos

```
SeguimientoPage
  ├── useLeads() → GET /api/leads?populate=asesor&sort=createdAt:desc
  ├── useAsesores() → GET /api/asesors?sort=nombre:asc
  │
  ├── KanbanBoard
  │     └── 5 Columnas: nuevo, contactado, interesado, calificado, cerrado
  │     └── Cada lead se muestra como tarjeta arrastrable
  │
  ├── FiltroPorAsesor (dropdown)
  │     └── Filtra client-side las tarjetas
  │
  └── onDrop(lead, nuevoEstado)
        ├── useUpdateLead() → PUT /api/leads/:documentId { estado: nuevoEstado }
        └── useCreateActividad() → POST /api/actividads {
              tipo: 'cambio_estado',
              lead: leadId,
              descripcion: 'Lead movido de {oldEstado} a {newEstado}'
            }
```

## Etapas del Pipeline

| Etapa | Color | Descripción |
|-------|-------|-------------|
| `nuevo` | Azul | Lead recién registrado |
| `contactado` | Amarillo | Primer contacto realizado |
| `interesado` | Naranja | Lead ha mostrado interés |
| `calificado` | Verde | Lead cualificado para cierre |
| `cerrado` | Rojo | Lead cerrado (ganado o perdido) |

## Registro de Actividad Automática

Cuando se arrastra un lead a una nueva etapa:
1. Se actualiza el campo `estado` del lead via `PUT /api/leads/:documentId`
2. Se crea automáticamente una actividad `cambio_estado` via `POST /api/actividads` con descripción del cambio

## Componentes

- `SeguimientoPage.tsx` / `SeguimientoPage.css`
