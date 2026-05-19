# Strapi Schema — CRM UNIMETA

Versión Strapi: **v5** (documentId como PK en REST)

---

## Resumen

| Tipo | Nombre | UID |
|------|--------|-----|
| Collection Type | Lead | `lead` |
| Collection Type | Asesor | `asesor` |
| Collection Type | Conversacion | `conversacion` |
| Collection Type | Mensaje | `mensaje` |
| Collection Type | Actividad | `actividad` |
| Collection Type | ConfiguracionAi | `configuracion-ai` |
| Single Type | ConfiguracionGlobal | `configuracion-global` |

---

## Collection Types

### 1. Lead

**draftAndPublish:** true

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| nombres | Short text | Sí | |
| apellidos | Short text | Sí | |
| programa | Enumeration | Sí | Ver valores abajo |
| cedula | Short text | No | Recomendado: Unique |
| celular | Short text | No | Usado para matching WhatsApp |
| correo | Email | No | |
| ciudad | Short text | No | |
| estado | Enumeration | No | Default: `nuevo` |
| fuente | Enumeration | No | |
| prioridad | Enumeration | No | Default: `media` |
| fecha_ultimo_contacto | Date | No | |
| fecha_proxima_accion | Date | No | |
| tipo_proxima_accion | Enumeration | No | |
| notas | Long text | No | |
| asesor | Relation → Asesor | No | Many-to-One |
| conversaciones | Relation → Conversacion | No | One-to-Many (inversa) |
| actividades | Relation → Actividad | No | One-to-Many (inversa) |

**Enumeraciones:**

```
programa:           Ingenieria | Medicina | Derecho | Administracion | Psicologia | Comunicacion
estado:             nuevo | contactado | interesado | calificado | cerrado
fuente:             web | referido | facebook | instagram | google | whatsapp
prioridad:          baja | media | alta
tipo_proxima_accion: llamada | correo | reunion | visita
```

---

### 2. Asesor

**draftAndPublish:** false

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| nombre | Short text | Sí | Ej: "Carlos M.", "Chatbot" |
| correo | Email | No | |
| activo | Boolean | No | Default: true |
| leads | Relation → Lead | No | One-to-Many (inversa de Lead.asesor) |

---

### 3. Conversacion

**draftAndPublish:** false

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| lead | Relation → Lead | Sí | Many-to-One |
| canal | Enumeration | Sí | `whatsapp \| email \| sms` |
| ultimo_mensaje | Long text | No | Cache del último mensaje; max ~200 chars |
| ultimo_mensaje_at | Datetime | No | Para ordenar bandeja |
| sin_respuesta | Boolean | No | Default: false |
| mensajes | Relation → Mensaje | No | One-to-Many (inversa) |

> n8n crea conversaciones automáticamente desde webhook de Evolution API.

---

### 4. Mensaje

**draftAndPublish:** false

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| conversacion | Relation → Conversacion | Sí | Many-to-One |
| contenido | Long text | Sí | Cuerpo del mensaje |
| tipo | Enumeration | Sí | `entrada \| salida` |
| canal | Enumeration | Sí | `whatsapp \| email \| sms` |
| timestamp | Datetime | Sí | ISO8601; para ordenar chat |

> n8n escribe mensajes `entrada`. Frontend escribe `salida`; n8n los reenvía a Evolution API.

---

### 5. Actividad

**draftAndPublish:** false

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| lead | Relation → Lead | Sí | Many-to-One |
| tipo | Enumeration | Sí | Ver valores abajo |
| descripcion | Long text | No | |
| timestamp | Datetime | Sí | ISO8601 |
| asesor | Relation → Asesor | No | Many-to-One; quién registró la actividad |

```
tipo: llamada | correo | reunion | visita | nota | cambio_estado
```

> `cambio_estado` se crea automáticamente cuando se mueve una tarjeta en SeguimientoPage.

---

### 6. ConfiguracionAi

**draftAndPublish:** false

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| lead | Relation → Lead | Sí | Many-to-One; Unique (max 1 config por lead) |
| habilitado | Boolean | No | Default: true |
| modelo | Short text | No | Ej: `Qwen/Qwen3.6-35B-A3B` |
| prompt_custom | Long text | No | System prompt personalizado |
| notas_ai | Long text | No | Notas privadas del asesor sobre IA |

**Modelos disponibles:**
```
Qwen/Qwen3.6-35B-A3B
google/gemma-4-31B-it
deepseek-ai/DeepSeek-V3.2
MiniMaxAI/MiniMax-M2.5
```

---

## Single Types

### ConfiguracionGlobal

**UID:** `configuracion-global`  
**draftAndPublish:** false

| Campo | Tipo Strapi | Requerido | Notas |
|-------|-------------|-----------|-------|
| slogan_principal | Short text | No | Default: "CRM UNIMETA" |
| modo_demo | Boolean | No | Default: true; muestra chip "Modo demo" |

---

## Diagrama de Relaciones

```
Asesor (1) ──────────────────────────────── (N) Lead
                                                  │
                                    ┌─────────────┼─────────────────┐
                                    │             │                 │
                                   (N)           (N)              (0..1)
                                    │             │                 │
                               Conversacion   Actividad    ConfiguracionAi
                                    │
                                   (N)
                                    │
                                 Mensaje

Actividad (N) ──── (1) Asesor  [opcional]
```

---

## Endpoints REST (Strapi v5)

| Entidad | Endpoint | Nota |
|---------|----------|------|
| Lead | `/api/leads` | |
| Asesor | `/api/asesors` | Strapi pluraliza a `asesors` |
| Conversacion | `/api/conversacions` | Strapi pluraliza a `conversacions` |
| Mensaje | `/api/mensajes` | |
| Actividad | `/api/actividads` | Strapi pluraliza a `actividads` |
| ConfiguracionAi | `/api/configuracion-ais` | |
| ConfiguracionGlobal | `/api/configuracion-global` | Single Type; sin `/1` |

---

## Campos editables desde Frontend → Strapi

```typescript
// src/lib/config.ts → leadWritableFields
[
  'nombres', 'apellidos', 'programa', 'cedula', 'celular',
  'correo', 'ciudad', 'estado', 'fuente', 'prioridad',
  'asesor', 'fecha_ultimo_contacto', 'fecha_proxima_accion',
  'tipo_proxima_accion', 'notas',
]
```

---

## Permisos requeridos (Roles & Permissions)

Configurar en **Settings → Roles → Authenticated** (o rol dedicado para n8n/frontend).

| Colección | find | findOne | create | update | delete |
|-----------|------|---------|--------|--------|--------|
| Lead | ✓ | ✓ | ✓ | ✓ | ✓ |
| Asesor | ✓ | ✓ | ✓ | ✓ | ✓ |
| Conversacion | ✓ | ✓ | ✓ | ✓ | |
| Mensaje | ✓ | ✓ | ✓ | | |
| Actividad | ✓ | ✓ | ✓ | ✓ | ✓ |
| ConfiguracionAi | ✓ | ✓ | ✓ | ✓ | |
| ConfiguracionGlobal | ✓ | | | ✓ | |

---

## Notas de implementación

1. **documentId vs id** — Strapi v5 usa `documentId` (string) como PK en endpoints REST. El frontend usa `documentId` para URLs de lead/conversacion/actividad. El `id` numérico es interno.

2. **Populate** — Las relaciones no vienen por defecto. Usar `?populate=asesor` o `?populate=*` según necesidad. Evitar `populate=*` en colecciones grandes.

3. **Estructura plana** — No se usan Components de Strapi; todo está desnormalizado a nivel de colección.

4. **ConfiguracionAi** — Relación 0..1 con Lead. Si no existe registro, el frontend usa defaults. Aplicar Unique constraint en el campo `lead`.

5. **n8n** — Ver contrato completo en [docs/n8n-strapi-contract.md](n8n-strapi-contract.md).
