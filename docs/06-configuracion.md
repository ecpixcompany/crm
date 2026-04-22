# Configuracion (`/configuracion`)

## Descripción

Página de configuración para gestionar asesores (CRUD completo) y configuración global (Single Type de Strapi).

## Endpoints Utilizados

### Asesores

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useAsesores()` | `/api/asesors?sort=nombre:asc` | GET | Lista asesores |
| `useCreateAsesor()` | `/api/asesors` | POST | Crea asesor |
| `useUpdateAsesor()` | `/api/asesors/:id` | PUT | Actualiza asesor |
| `useDeleteAsesor()` | `/api/asesors/:id` | DELETE | Elimina asesor |

### Configuración Global

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useConfiguracion()` | `/api/configuracion-global` | GET | Obtiene configuración |
| `useUpdateConfiguracion()` | `/api/configuracion-global` | PUT | Actualiza configuración |

## Flujo de Datos

```
ConfiguracionPage
  │
  ├── Sección: Asesores
  │     ├── useAsesores() → GET /api/asesors?sort=nombre:asc
  │     ├── Tabla de asesores (nombre, correo, activo)
  │     ├── useCreateAsesor() → POST /api/asesors
  │     ├── useUpdateAsesor() → PUT /api/asesors/:id
  │     └── useDeleteAsesor() → DELETE /api/asesors/:id
  │
  └── Sección: Configuración Global
        ├── useConfiguracion() → GET /api/configuracion-global
        ├── useUpdateConfiguracion() → PUT /api/configuracion-global
        └── Formulario con:
              ├── slogan_principal (string)
              └── modo_demo (boolean)
```

## Modelo Asesor

```typescript
interface Asesor {
  id: number;
  nombre: string;       // Requerido
  correo?: string;      // Opcional
  activo: boolean;      // default: true
}
```

## Modelo ConfiguracionGlobal

```typescript
interface ConfiguracionGlobal {
  id: number;
  slogan_principal: string;  // Texto del slogan
  modo_demo: boolean;        // Modo demostración
}
```

## Notas

- `ConfiguracionGlobal` es un **Single Type** en Strapi (no tiene colección)
- La actualización de configuración usa PUT directo a `/api/configuracion-global`
- El `modo_demo` controla si la app está en modo demostración
- Los asesores eliminados no eliminan los leads asociados (solo se desasocian)
