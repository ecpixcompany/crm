# Dashboard (`/`)

## Descripción

Página principal que muestra KPIs generales del pipeline de ventas, visualización del embudo de leads por estado, alertas de seguimiento y tabla de actividad reciente.

## Endpoints Utilizados

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useLeads()` | `/api/leads?populate=asesor&sort=createdAt:desc` | GET | Lista todos los leads con populate de asesor |

## Flujo de Datos

```
DashboardPage
  └── useLeads()
        └── fetchLeads()
              └── GET /api/leads?populate=asesor&sort=createdAt:desc
```

## KPIs Calculados

- **Total de Leads**: `leads.length`
- **Leads Activos**: `leads.filter(l => l.estado !== 'cerrado').length`
- **Leads Calificados**: `leads.filter(l => l.estado === 'calificado').length`
- **Tasa de Conversión**: `(calificados / total * 100).toFixed(1)%`

## Componentes Principales

- `DashboardPage.tsx` - Componente principal
- `DashboardPage.css` - Estilos

## Notas

- Los datos son calculados en tiempo real desde los leads obtenidos via React Query.
- El embudo muestra la distribución de leads por `estado`.
- Las alertas muestran leads que tienen `fecha_proxima_accion` vencida.
