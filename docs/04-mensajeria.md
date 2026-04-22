# Mensajeria (`/mensajeria`)

## Descripción

Centro de mensajería unificado que muestra bandeja de conversaciones (WhatsApp/Email/SMS), panel de chat con mensajes reales, composer para enviar mensajes tipo `salida`, y sidebar con resumen del lead.

## Endpoints Utilizados

| Hook | Endpoint | Método | Descripción |
|------|----------|--------|-------------|
| `useConversaciones()` | `/api/conversaciones?populate[lead][populate][asesor]=true&sort=ultimo_mensaje_at:desc` | GET | Lista conversaciones |
| `useConversacion(id)` | `/api/conversaciones/:id?populate[lead][populate][asesor]=true&populate[mensajes]=true` | GET | Detalle con mensajes |
| `useMensajes(convId)` | `/api/mensajes?filters[conversacion][id][$eq]=:id&sort=timestamp:asc` | GET | Mensajes de una conversación |
| `useCreateMensaje()` | `/api/mensajes` | POST | Envía mensaje tipo salida |

## Flujo de Datos

```
MensajeriaPage
  ├── useConversaciones()
  │     └── GET /api/conversaciones?populate[lead]...&sort=ultimo_mensaje_at:desc
  │
  ├── ConversationList
  │     └── Muestra conversaciones ordenadas por ultimo_mensaje_at DESC
  │     └── Badge de "sin respuesta" si sin_respuesta = true
  │
  ├── ChatPanel (al seleccionar conversación)
  │     ├── useConversacion(id) → GET /api/conversaciones/:id?populate[lead]...&populate[mensajes]
  │     └── useMensajes(convId) → GET /api/mensajes?filters[conversacion][id][$eq]=:id&sort=timestamp:asc
  │
  ├── MessageBubble
  │     └── Diferencia mensajes tipo 'entrada' vs 'salida'
  │     └── Muestra canal (whatsapp/email/sms)
  │
  └── Composer
        └── useCreateMensaje() → POST /api/mensajes {
              conversacion: convId,
              contenido: texto,
              tipo: 'salida',
              canal: conv.canal,
              timestamp: new Date().toISOString()
            }
        └── También actualiza conversación con PUT /api/conversaciones/:id
```

## Tipos de Canal

| Canal | Descripción |
|-------|-------------|
| `whatsapp` | Mensajes vía WhatsApp |
| `email` | Correo electrónico |
| `sms` | Mensajes de texto |

## Tipo de Mensaje

| Tipo | Dirección | Uso |
|------|-----------|-----|
| `entrada` | Llegada (lead → CRM) | Mensajes recibidos del lead |
| `salida` | Salida (CRM → lead) | Mensajes enviados por el asesor |

## Notas de Implementación

- Los mensajes tipo `salida` se crean via POST a `/api/mensajes`
- Luego n8n replica estos mensajes a Evolution API (WhatsApp) o email
- La conversación `ultimo_mensaje` y `ultimo_mensaje_at` se actualizan tras cada mensaje

## Componentes

- `MensajeriaPage.tsx` / `MensajeriaPage.css`
