# CRM UNIMETA - Estructura Strapi

> Revisado contra el codigo real del frontend (src/pages/*, src/lib/api.ts).
> Cambios clave: se agrega Collection Type `Asesor`, se define `asesor` como relacion en Lead,
> se corrige la enumeracion de `programa` para coincidir con `src/lib/api.ts`, y se aclaran campos
> derivados de la relacion. No se usan Components: las entidades son planas y no hay estructuras
> reutilizables entre ellas que lo justifiquen.

---

## Resumen

- **Collection Types (5):** Lead, Asesor, Conversacion, Mensaje, Actividad
- **Single Types (1):** ConfiguracionGlobal
- **Components:** ninguno

---

## Content Types

### 1. Lead (Collection Type)

**Campos:**

| Campo | Tipo | Opciones/Notas |
|-------|------|----------------|
| nombres | Text (short) | Required |
| apellidos | Text (short) | Required |
| programa | Enumeration | Ingenieria, Medicina, Derecho, Administracion, Psicologia, Comunicacion |
| cedula | Text (short) | Unique recomendado |
| celular | Text (short) | |
| correo | Email | |
| ciudad | Text (short) | |
| estado | Enumeration | nuevo, contactado, interesado, calificado, cerrado (default: nuevo) |
| fuente | Enumeration | web, referido, facebook, instagram, google |
| prioridad | Enumeration | baja, media, alta (default: media) |
| fecha_ultimo_contacto | Date | |
| fecha_proxima_accion | Date | |
| tipo_proxima_accion | Enumeration | llamada, correo, reunion, visita |
| notas | Text (long) | |
| asesor | Relation (Asesor) | Many-to-One — leads asignados a un asesor |
| conversaciones | Relation (Conversacion) | One-to-Many (inverso) |
| actividades | Relation (Actividad) | One-to-Many (inverso) |

**Configuracion:**
- UID: `lead`
- draftAndPublish: true
- searchableFields: `nombres`, `apellidos`, `programa`, `ciudad`, `cedula`
- filterableFields: `estado`, `programa`, `fuente`, `asesor`, `prioridad`

> **Nota sobre `programa`:** el frontend usa valores capitalizados en `PROGRAMAS` (`src/lib/api.ts`).
> Se mantiene el mismo casing en Strapi para evitar transformar en cada request.

---

### 2. Asesor (Collection Type)

Antes estaba hardcoded como array `ASESORES` en `src/lib/api.ts`. Al modelarlo como entidad,
se habilita filtrar pipeline por asesor, medir carga en analiticas y relacionarlo con leads.

**Campos:**

| Campo | Tipo | Notas |
|-------|------|-------|
| nombre | Text (short) | Required. ej: "Carlos M." |
| correo | Email | Opcional |
| activo | Boolean | Default: true |
| leads | Relation (Lead) | One-to-Many (inverso de Lead.asesor) |

**Configuracion:**
- UID: `asesor`
- draftAndPublish: false

---

### 3. Conversacion (Collection Type)

**Campos:**

| Campo | Tipo | Notas |
|-------|------|-------|
| lead | Relation (Lead) | Many-to-One |
| canal | Enumeration | whatsapp, email, sms |
| ultimo_mensaje | Text (long) | Se puede calcular en backend; util como cache para listar |
| ultimo_mensaje_at | DateTime | Para ordenar bandeja (MensajeriaPage ordena por timestamp) |
| sin_respuesta | Boolean | Default: false |
| mensajes | Relation (Mensaje) | One-to-Many (inverso) |

**Configuracion:**
- UID: `conversacion`
- draftAndPublish: false

---

### 4. Mensaje (Collection Type)

**Campos:**

| Campo | Tipo | Notas |
|-------|------|-------|
| conversacion | Relation (Conversacion) | Many-to-One |
| contenido | Text (long) | Required |
| tipo | Enumeration | entrada, salida |
| canal | Enumeration | whatsapp, email, sms |
| timestamp | DateTime | Required. Usado en chat-messages |

**Configuracion:**
- UID: `mensaje`
- draftAndPublish: false

---

### 5. Actividad (Collection Type)

Alimenta la trazabilidad/timeline del lead (LeadDetailModal > `lead-timeline`).

**Campos:**

| Campo | Tipo | Notas |
|-------|------|-------|
| lead | Relation (Lead) | Many-to-One |
| tipo | Enumeration | llamada, correo, reunion, visita, nota, cambio_estado |
| descripcion | Text (long) | |
| timestamp | DateTime | Required |
| asesor | Relation (Asesor) | Opcional: quien registro la actividad |

**Configuracion:**
- UID: `actividad`
- draftAndPublish: false

---

## Single Types

### ConfiguracionGlobal

| Campo | Tipo | Notas |
|-------|------|-------|
| slogan_principal | Text | Default: "CRM UNIMETA" |
| modo_demo | Boolean | Default: true. Controla chips "Modo demo" en UI |

---

## Relaciones entre Content Types

```
Asesor (1) ←→ (N) Lead
Lead (1) ←→ (N) Conversacion
Lead (1) ←→ (N) Actividad
Conversacion (1) ←→ (N) Mensaje
Asesor (1) ←→ (N) Actividad   (opcional, autor)
```

---

## Configuracion API (Permissions)

### Lead
- [x] `find`, `findOne`, `create`, `update`
- [x] `delete` (recomendado habilitarlo para pruebas y limpieza)

### Asesor
- [x] `find`, `findOne`
- [ ] `create`, `update`, `delete` — gestionados desde el admin de Strapi

### Conversacion
- [x] `find`, `findOne`, `create`, `update`

### Mensaje
- [x] `find`, `create`

### Actividad
- [x] `find`, `create`

### ConfiguracionGlobal
- [x] `find`

---

## Pasos para configurar en Strapi

1. **Crear Asesor** — Collection Type. Poblar con los 4 asesores actuales (Carlos M., Ana L., Juan P., Maria G.).
2. **Crear Lead** — Collection Type con los campos indicados, incluyendo relacion `asesor → Asesor`.
3. **Crear Conversacion** — Collection Type, relacion con Lead.
4. **Crear Mensaje** — Collection Type, relacion con Conversacion.
5. **Crear Actividad** — Collection Type, relacion con Lead (y opcionalmente Asesor).
6. **Crear ConfiguracionGlobal** — Single Type.
7. **Configurar permisos** — Settings > Roles > Public o Authenticated, habilitar endpoints necesarios.
8. **Verificar Strapi** — corriendo en `http://localhost:1337`.
9. **Actualizar frontend** — `src/lib/config.ts` ya tiene `strapiEnabled: true`. Cuando Asesor este activo, reemplazar `ASESORES` hardcoded en `src/lib/api.ts` por un fetch real.

---

## Nota sobre enumeraciones

Strapi y el frontend deben usar los mismos valores exactos para evitar transformaciones:

```typescript
// src/lib/api.ts
export const PROGRAMAS = ['Ingenieria', 'Medicina', 'Derecho', 'Administracion', 'Psicologia', 'Comunicacion']; // capitalizadas
export const ESTADOS = ['nuevo', 'contactado', 'interesado', 'calificado', 'cerrado'];                        // minusculas
export const FUENTES = ['web', 'referido', 'facebook', 'instagram', 'google'];                                // minusculas
export const PRIORIDADES = ['baja', 'media', 'alta'];                                                         // minusculas
export const TIPOS_ACCION = ['llamada', 'correo', 'reunion', 'visita'];                                       // minusculas
```

Regla: `programa` capitalizado porque asi lo muestra la UI sin transformar; el resto en minusculas porque se usan como clases CSS (`status-nuevo`, `priority-alta`) directamente en el DOM.

---

## Por que no se usan Components

Los Components de Strapi sirven para estructuras reutilizables entre Content Types (ej: una direccion compartida entre Cliente y Proveedor). En este CRM:

- No hay estructuras compartidas entre Lead, Conversacion, Mensaje, Actividad.
- Los grupos de campos (contacto, accion) viven solo en Lead.
- Añadir components introduciria un nivel de anidamiento que complica queries (`populate=contacto,accion...`) sin beneficio real.

Si a futuro se agregan entidades como `Prospecto` o `Estudiante` que compartan datos de contacto, ahi si conviene extraer un component `datos-contacto`.
