# Guard anti-spam de IA en n8n — flujo `whatsapp-incoming`

> **No modifica el AI Agent.** Solo añade una compuerta antes de invocarlo y un par de recomendaciones en Evolution API para cortar el eco.

## Por qué existe este guard

Cuando un usuario escribe "hola" en WhatsApp, el flujo de n8n:

1. Recibe el webhook de Evolution API
2. Crea el mensaje `entrada` en Strapi
3. Llama al **AI Agent** → genera respuesta
4. Crea el `salida` en Strapi
5. Envía por Evolution API con `POST /message/sendText/{instance}`

El problema: **Evolution API puede devolver como entrante el mismo mensaje que el bot acaba de enviar** (eco). Eso vuelve a entrar como `entrada`, vuelve a llamar al AI Agent, vuelve a generar `salida`, vuelve a enviar, vuelve a entrar... spam infinito.

Además, el AI Agent, por defecto, no verifica si el último mensaje de la conversación fue un `salida` propio. Así que aunque el eco no existiera, el agente puede iterar sobre su propia salida.

La regla que pediste:
- **IA habilitada y último mensaje `entrada` (usuario)** → responder.
- **IA habilitada pero último mensaje `salida` (asistente)** → NO responder.
- **IA deshabilitada** → no responder (lo hace el n8n actual con el flag global, o el per-lead `configuracion-ai.habilitado`).

## Capa 1 — Guard en n8n (antes del AI Agent)

Insertar **entre el paso 5 (guardar `entrada`) y el paso 7 (enviar a AI Agent)** de `strapi.md`. Con un nodo **HTTP Request + IF**.

### Variables en n8n que debes tener disponibles en el scope

- `conversacionDocumentId` (viene del paso 4)
- `mensajeEntranteContenido` (viene del webhook de Evolution, `text`)
- `strapiBaseUrl` (ej. `https://strapi.tudominio.com` — ponlo en una variable de entorno del workflow)
- `strapiToken` (un API token de Strapi con permisos de lectura sobre `mensajes` y `conversaciones`. Ponlo en **Credentials → Header Auth** o variable de entorno, **nunca en claro**)

### Nodos a insertar (en este orden)

#### Nodo 1 — HTTP Request: "Obtener último mensaje de la conversación"

- **Method:** `GET`
- **URL:** `{{$env.STRAPI_BASE_URL}}/api/mensajes?filters[conversacion][documentId][$eq]={{$json.conversacionDocumentId}}&sort=timestamp:desc&pagination[pageSize]=2`
- **Authentication:** Generic Credential Type → Header Auth con `Authorization: Bearer {{$env.STRAPI_TOKEN}}`
- **Headers:** `Content-Type: application/json`

Guarda la respuesta en `{{$json.data}}`. El array viene en `data[0]` (más reciente) y `data[1]` (anterior).

Extrae:
- `ultimoTipo` = `{{$json.data[0].attributes.tipo}}` (o `{{$json.data[0].tipo}}` según la versión de n8n)
- `ultimoContenido` = `{{$json.data[0].attributes.contenido}}`

#### Nodo 2 — HTTP Request: "Obtener config AI del lead"

- **Method:** `GET`
- **URL:** `{{$env.STRAPI_BASE_URL}}/api/leads/{{$json.leadDocumentId}}?populate[configuracion_ai]=true`

Guarda `habilitado` de `{{$json.data.attributes.configuracion_ai.attributes.habilitado}}` (o la ruta equivalente según tu n8n).

> **Tip:** si tu workflow ya obtiene el `leadDocumentId` antes (paso 2), reutilízalo. Si no, puedes sacarlo de la conversación con otro GET.

#### Nodo 3 — IF: "¿Debe responder la IA?"

**Condición (AND):**
- `{{$json.habilitado}}` es `true`
- `{{$json.ultimoTipo}}` es igual a `"entrada"`
- **Y además** una de estas dos (anti-eco duro):
  - El `ultimoContenido` **NO** es igual (case-insensitive, trim) al texto del webhook entrante, **O**
  - Si `ultimoTipo` es `"salida"` y el contenido coincide → eco → FALSO.

Expresión sugerida (Code node o combinación de IF):

```js
// Pseudocódigo para un Function node
const incoming = ($input.first().json.mensajeEntranteContenido || '').trim().toLowerCase();
const lastTipo = $input.first().json.ultimoTipo;
const lastContenido = ($input.first().json.ultimoContenido || '').trim().toLowerCase();
const habilitado = $input.first().json.habilitado;

// Caso A: eco duro — el último mensaje (salida) es idéntico al entrante
const esEco = lastTipo === 'salida' && lastContenido === incoming && incoming.length > 0;

// Caso B: la última interacción fue del bot (salida) y el entrante es distinto
//   → podría ser un eco parcial o un re-trigger; por seguridad, no responder.
const botHablo = lastTipo === 'salida';

return [{
  json: {
    debeResponder: habilitado === true && !esEco && !botHablo
  }
}];
```

- **TRUE (rama superior):** continúa al **AI Agent** (paso 7 del flujo).
- **FALSE (rama inferior):** termina el workflow (nodo **Stop and Error** opcional, o solo **NoOp**).

#### Nodo 4 — Stop / NoOp (rama FALSE)

Solo conecta un nodo **Stop** con mensaje "Echo o última interacción del bot, no se responde."

### Diagrama del flujo actualizado

```
[Evolution webhook]
   ↓
[Paso 2: buscar/crear lead]
   ↓
[Paso 3-4: buscar/crear conversacion]      ← aquí ya tienes conversacionDocumentId
   ↓
[Paso 5: GUARDAR mensaje entrada]          ← sigue igual
   ↓
[🆕 Paso 5.5: HTTP GET último mensaje]     ← NUEVO
   ↓
[🆕 Paso 5.6: HTTP GET config AI lead]     ← NUEVO
   ↓
[🆕 Paso 5.7: IF debeResponder?]           ← NUEVO
   ├─ TRUE  → [Paso 7: AI Agent] (intacto)
   └─ FALSE → [Stop: no responder]
```

## Capa 2 — Supresión de eco en Evolution API (opcional pero recomendado)

El echo de Evolution API es la causa más común de spam. Además del guard de n8n, configura Evolution para **ignorar mensajes propios** (`fromMe: true`).

### Opciones

1. **En el nodo de Webhook Trigger del workflow:**
   - Añade un nodo **IF** justo al inicio.
   - Condición: `{{$json.body.data.key.fromMe}}` es **false**.
   - Si es **true** (mensaje propio), termina el workflow inmediatamente. Así ni siquiera llegas al AI Agent.

2. **En la configuración de la instancia de Evolution API:**
   - Desactivar `WEBHOOK_MESSAGES_UPSERT` para mensajes salientes, o filtrar por `fromMe` en el panel de Evolution.
   - Depende de tu versión de Evolution; revisa su doc de "ignore own messages".

## Capa 3 — Guard en Strapi (defensa redundante)

Ya está implementado en este repo en:
- `strapi-chatbot-tesis/src/api/mensaje/content-types/mensaje/lifecycles.ts`

Si por algún motivo n8n igual reenviara un eco, Strapi **rechaza** el insert de la `entrada` con error `ECHO_GUARD` (cuando su contenido coincide con un `salida` reciente de la misma conversación, ventana de 60s). Así el bucle se rompe también en la BD.

## Resumen de dónde quedó cada cosa

| Capa | Dónde | Qué hace |
|------|-------|----------|
| 1 | n8n (instrucciones arriba) | No llama al AI Agent si el último mensaje fue del bot o si la IA está deshabilitada. |
| 2 | Evolution API / n8n webhook trigger | Ignora `fromMe: true` para no re-entrar al flujo con mensajes propios. |
| 3 | Strapi lifecycle `beforeCreate` | Rechaza `entrada` con contenido idéntico a un `salida` reciente (60s). |

Las tres capas son defensa en profundidad. Si una falla, las demás frenan el spam.
