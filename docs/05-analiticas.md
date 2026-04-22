# Analiticas (`/analiticas`)

## Descripción

Dashboard analítico con gráficos de barras por estado, programa, fuente y asesor. Muestra KPIs y tabla de servicios con indicadores.

## Endpoints Utilizados

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useLeads()` | `/api/leads?populate=asesor&sort=createdAt:desc` | GET | Lista leads para agregaciones |
| `useActividades()` | `/api/actividads?filters[lead][id][$eq]=:id&populate=asesor&sort=timestamp:desc` | GET | Actividades para indicadores |
| `useAsesores()` | `/api/asesors?sort=nombre:asc` | GET | Asesores para barras de carga |

## Flujo de Datos

```
AnaliticasPage
  ├── useLeads()
  │     └── GET /api/leads?populate=asesor&sort=createdAt:desc
  │     └── Calcula agregaciones client-side:
  │           - Leads por estado
  │           - Leads por programa
  │           - Leads por fuente
  │           - Leads por asesor
  │
  ├── useAsesores()
  │     └── GET /api/asesors?sort=nombre:asc
  │     └── Para barras de carga por asesor
  │
  ├── KPIs (calculados)
  │     ├── Total leads
  │     ├── Nuevos esta semana
  │     ├── Conversion rate
  │     └── Actividad reciente
  │
  └── BarCharts
        ├── Por Estado
        ├── Por Programa
        ├── Por Fuente
        └── Por Asesor
```

## Agregaciones Calculadas Client-Side

### Por Estado
```typescript
leads.reduce((acc, lead) => {
  acc[lead.estado] = (acc[lead.estado] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### Por Programa
```typescript
leads.reduce((acc, lead) => {
  acc[lead.programa] = (acc[lead.programa] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### Por Fuente
```typescript
leads.reduce((acc, lead) => {
  if (lead.fuente) {
    acc[lead.fuente] = (acc[lead.fuente] || 0) + 1;
  }
  return acc;
}, {} as Record<string, number>);
```

### Por Asesor
```typescript
leads.reduce((acc, lead) => {
  const nombre = typeof lead.asesor === 'object' ? lead.asesor?.nombre : 'Sin asignar';
  acc[nombre] = (acc[nombre] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

## KPIs Calculados

- **Total de Leads**: `leads.length`
- **Nuevos**: `leads.filter(l => l.estado === 'nuevo').length`
- **Contactados**: `leads.filter(l => l.estado === 'contactado').length`
- **Interesados**: `leads.filter(l => l.estado === 'interesado').length`
- **Calificados**: `leads.filter(l => l.estado === 'calificado').length`
- **Cerrados**: `leads.filter(l => l.estado === 'cerrado').length`

## Componentes

- `AnaliticasPage.tsx` / `AnaliticasPage.css`
