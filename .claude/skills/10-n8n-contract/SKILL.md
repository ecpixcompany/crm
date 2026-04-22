---
name: 10-n8n-contract
description: Documentar (en docs/n8n-strapi-contract.md) el contrato entre n8n + Evolution API y Strapi — payloads, matching de leads por celular, creación automática de conversaciones y el ciclo de mensajes entrada/salida.
---

# 10 · Contrato n8n ↔ Strapi

## Objetivo
Crear el documento `docs/n8n-strapi-contract.md` (crear carpeta `docs/` si no existe) que especifique exactamente qué debe hacer n8n cuando:

1. Entra un webhook de Evolution API con un mensaje de WhatsApp.
2. La UI crea un mensaje tipo `salida` en Strapi y hay que despacharlo a WhatsApp.

No hay código que ejecutar — es un artefacto de documentación. El frontend no cambia.

## Prerrequisitos
Skill **02** completo (los endpoints y shapes de Strapi están definidos).

## Archivos a crear
- `docs/n8n-strapi-contract.md`

## Contenido mínimo del documento

### Encabezado
```
# Contrato n8n ↔ Strapi (CRM UNIMETA)

n8n es el único backend que escribe mensajes desde WhatsApp hacia Strapi
y que despacha mensajes salientes desde Strapi hacia Evolution API.
El frontend no conoce n8n; solo lee/escribe contra Strapi.
```

### 1. Flujo ENTRADA (WhatsApp → Strapi)

Trigger: **Evolution API webhook** de mensaje recibido.

Pasos n8n:

1. **Extraer** del payload Evolution:
   - `remoteJid` (número WhatsApp)
   - `message.conversation` o `message.extendedTextMessage.text` → contenido
   - `messageTimestamp` (unix seconds)
   - Normalizar `remoteJid` a formato local de celular (ej. quitar `@s.whatsapp.net`, prefijo `+`, etc.).

2. **Buscar Lead por celular**
   ```
   GET http://localhost:1337/api/leads?filters[celular][$eq]=<celular>
   ```
   - Si 0 resultados: crear Lead mínimo.
     ```
     POST /api/leads
     { "data": {
         "nombres": "Desconocido",
         "apellidos": "(WhatsApp)",
         "celular": "<celular>",
         "programa": "Ingenieria",       // placeholder; editable luego
         "cedula": "",
         "correo": "",
         "ciudad": "",
         "estado": "nuevo",
         "fuente": "web"
     } }
     ```
   - Guardar `leadId`.

3. **Buscar Conversación abierta del lead**
   ```
   GET /api/conversaciones?filters[lead][id][$eq]=<leadId>&filters[canal][$eq]=whatsapp
   ```
   - Si 0: crear
     ```
     POST /api/conversaciones
     { "data": { "lead": <leadId>, "canal": "whatsapp", "sin_respuesta": true } }
     ```
   - Guardar `conversacionId`.

4. **Crear Mensaje**
   ```
   POST /api/mensajes
   { "data": {
       "conversacion": <conversacionId>,
       "contenido": "<texto>",
       "tipo": "entrada",
       "canal": "whatsapp",
       "timestamp": "<ISO8601>"
   } }
   ```

5. **Actualizar Conversación** (cache de listado)
   ```
   PUT /api/conversaciones/<conversacionId>
   { "data": {
       "ultimo_mensaje": "<texto truncado a 200 chars>",
       "ultimo_mensaje_at": "<ISO8601>",
       "sin_respuesta": true
   } }
   ```

### 2. Flujo SALIDA (Strapi → WhatsApp)

Trigger: **Strapi webhook** (o polling desde n8n) sobre `mensaje.create` con `tipo === 'salida'`.

> Si se usa webhook de Strapi: configurar en Strapi admin → Settings → Webhooks: evento `entry.create` sobre `mensaje`, filtrar en n8n por `tipo === 'salida'`.
> Alternativa polling: cada 10s `GET /api/mensajes?filters[tipo][$eq]=salida&filters[despachado][$eq]=false&sort=timestamp:asc`. Requiere añadir un boolean `despachado` al Content Type `Mensaje` — **decidir antes de implementar**. Recomendado: usar webhook.

Pasos n8n:

1. Leer `conversacionId` del payload.
2. `GET /api/conversaciones/<id>?populate[lead]=true` → obtener `celular` del lead.
3. Llamar Evolution API:
   ```
   POST <evolution-base>/message/sendText/<instance>
   { "number": "<celular>", "text": "<contenido>" }
   ```
4. Al responder OK, `PUT /api/conversaciones/<id>` con `sin_respuesta: false`, `ultimo_mensaje`, `ultimo_mensaje_at`.

### 3. Tabla de mapeo de campos

| Evolution API               | Strapi Mensaje  |
|-----------------------------|-----------------|
| `message.conversation`      | `contenido`     |
| `messageTimestamp` (s → ms) | `timestamp`     |
| `"whatsapp"` (constante)    | `canal`         |
| `"entrada"` (constante)     | `tipo`          |

### 4. Errores y reintentos

- Si Strapi devuelve 4xx/5xx, n8n debe reintentar con backoff exponencial (3 intentos max) y loggear al canal de alertas.
- Duplicados: usar `messageTimestamp + remoteJid` como idempotency key en n8n (p.ej. nodo "If" con cache).

### 5. Permisos Strapi requeridos (Public role)

| Endpoint          | find | findOne | create | update | delete |
|-------------------|------|---------|--------|--------|--------|
| leads             | ✓    | ✓       | ✓      | ✓      | ✓      |
| asesores          | ✓    | ✓       | ✓      | ✓      | ✓      |
| conversaciones    | ✓    | ✓       | ✓      | ✓      |        |
| mensajes          | ✓    | ✓       | ✓      |        |        |
| actividades       | ✓    | ✓       | ✓      |        |        |
| configuracion-global | ✓ |         |        | ✓      |        |

> Sin token. Mientras el proyecto esté local (`localhost:1337`) esto es aceptable; antes de exponer Strapi públicamente, migrar a API Tokens o JWT y refactorizar `src/lib/api.ts` para enviar `Authorization`.

## Criterios de aceptación
- [ ] El archivo `docs/n8n-strapi-contract.md` existe con las 5 secciones anteriores.
- [ ] Todos los endpoints, payloads y shapes coinciden con lo declarado en [strapi.md](../../../strapi.md) y [src/lib/api.ts](../../../src/lib/api.ts) tras los skills 01-02.

## Restricciones
- No crear workflows de n8n (`.json`) — solo documentación.
- No tocar código fuente del frontend.
