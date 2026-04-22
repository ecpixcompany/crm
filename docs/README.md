# Documentación del CRM

## Índice de Módulos

1. [Arquitectura](./00-arquitectura.md) - Visión general del sistema, endpoints, modelo de datos
2. [Dashboard](./01-dashboard.md) - Página principal con KPIs y funnel
3. [Leads](./02-leads.md) - Gestión de leads (CRUD completo)
4. [Seguimiento](./03-seguimiento.md) - Pipeline Kanban
5. [Mensajeria](./04-mensajeria.md) - Centro de mensajería unificado
6. [Analiticas](./05-analiticas.md) - Dashboard analítico
7. [Configuracion](./06-configuracion.md) - Gestión de asesores y configuración

## Resumen de Endpoints

```
GET    /api/leads                      - Lista leads
POST   /api/leads                      - Crea lead
GET    /api/leads/:documentId           - Detalle lead
PUT    /api/leads/:documentId           - Actualiza lead
DELETE /api/leads/:documentId           - Elimina lead

GET    /api/asesors                     - Lista asesores
POST   /api/asesors                     - Crea asesor
PUT    /api/asesors/:id                 - Actualiza asesor
DELETE /api/asesors/:id                 - Elimina asesor

GET    /api/conversaciones              - Lista conversaciones
POST   /api/conversaciones               - Crea conversación
GET    /api/conversaciones/:id          - Detalle con mensajes
PUT    /api/conversaciones/:id          - Actualiza conversación

GET    /api/mensajes                    - Lista mensajes (con filtro por conversación)
POST   /api/mensajes                    - Envía mensaje

GET    /api/actividads                  - Lista actividades (con filtro por lead)
POST   /api/actividads                  - Crea actividad
PUT    /api/actividads/:documentId      - Actualiza actividad
DELETE /api/actividads/:documentId      - Elimina actividad

GET    /api/configuracion-global         - Obtiene configuración
PUT    /api/configuracion-global         - Actualiza configuración
```

## Hooks Disponibles

| Hook | Ubicación | Queries | Mutations |
|------|-----------|---------|-----------|
| `useLeads` | `src/hooks/useLeads.ts` | `useLeads()`, `useLead(id)` | `useCreateLead()`, `useUpdateLead()`, `useDeleteLead()` |
| `useAsesores` | `src/hooks/useAsesores.ts` | `useAsesores()` | `useCreateAsesor()`, `useUpdateAsesor()`, `useDeleteAsesor()` |
| `useConversaciones` | `src/hooks/useConversaciones.ts` | `useConversaciones()`, `useConversacion(id)` | `useCreateConversacion()`, `useUpdateConversacion()` |
| `useMensajes` | `src/hooks/useMensajes.ts` | `useMensajes(convId)` | `useCreateMensaje()` |
| `useActividades` | `src/hooks/useActividades.ts` | `useActividades(leadId)` | `useCreateActividad()`, `useUpdateActividad()`, `useDeleteActividad()` |
| `useConfiguracion` | `src/hooks/useConfiguracion.ts` | `useConfiguracion()` | `useUpdateConfiguracion()` |
