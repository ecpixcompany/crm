---
name: 07-mensajeria-page
description: Conectar MensajeriaPage.tsx a Strapi — bandeja de conversaciones ordenadas por ultimo_mensaje_at, panel de chat con mensajes reales, envío de mensajes tipo salida que luego n8n replica a Evolution API.
---

# 07 · MensajeriaPage contra Strapi

## Objetivo
[src/pages/MensajeriaPage.tsx](../../../src/pages/MensajeriaPage.tsx) debe consumir `Conversacion` + `Mensaje` reales. El envío desde la UI crea un `Mensaje` tipo `salida` en Strapi, el cual n8n detecta y despacha hacia WhatsApp via Evolution API.

## Prerrequisitos
Skills **01–04** completos.

## Archivos a tocar
- `src/pages/MensajeriaPage.tsx`

## Tareas

### 1. Lista de conversaciones (panel izquierdo)
- Usar `useConversaciones()` del skill 04.
- Mostrar el orden tal como viene de la API (la query ya incluye `sort=ultimo_mensaje_at:desc`).
- Cada item muestra:
  - `lead.nombres + ' ' + lead.apellidos` (o "Sin lead" si la conversación aún no tiene lead asociado).
  - `lead.programa` como sub-label.
  - `ultimo_mensaje` truncado a ~60 chars.
  - `ultimo_mensaje_at` formateado (ej. "hace 3 min", o `HH:mm` si es hoy, o `DD MMM` si es otro día).
  - Badge rojo si `sin_respuesta === true`.
  - Icono de canal (`whatsapp`, `email`, `sms`).
- Buscador en cliente por nombre o último mensaje.

### 2. Panel de chat (derecha)
- Al seleccionar una conversación:
  - `useConversacion(id)` para traer datos de lead y mensajes poblados.
  - Lista de mensajes ordenados ascendente por `timestamp`.
  - Burbuja `entrada` alineada izquierda; `salida` alineada derecha.
  - Scroll al final cuando llegan mensajes nuevos (usar `useEffect` + ref).
  - Cabecera con nombre del lead, programa, asesor y canal.

### 3. Enviar mensaje
- Input + botón "Enviar".
- Al enviar:
  - Llamar `useCreateMensaje().mutate({ conversacion: id, contenido, tipo: 'salida', canal: conversacion.canal, timestamp: new Date().toISOString() })`.
  - El hook del skill 04 ya se encarga de actualizar `ultimo_mensaje` y `ultimo_mensaje_at` en la conversación.
  - Limpiar el input en `onSuccess`.
  - Deshabilitar el botón mientras `isPending`.
- Enter envía; Shift+Enter salto de línea.

### 4. Estados vacíos
- Si no hay conversaciones: mostrar mensaje "No hay conversaciones aún. n8n creará una cuando llegue el primer mensaje por WhatsApp."
- Si hay conversaciones pero ninguna seleccionada: mostrar estado placeholder.

### 5. Polling opcional
- Activar `refetchInterval: 10_000` sobre `useConversaciones()` y sobre `useConversacion(activeId)` para que lleguen mensajes nuevos enviados por n8n sin recargar la página.
- Exponer la opción pasando un parámetro opcional al hook (ajustar el hook del skill 04 si hace falta).

## Criterios de aceptación
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] La bandeja muestra conversaciones reales ordenadas por `ultimo_mensaje_at:desc`.
- [ ] Seleccionar una conversación muestra sus mensajes en orden cronológico.
- [ ] Enviar un mensaje lo persiste en Strapi con `tipo: 'salida'` y refresca la bandeja.
- [ ] El badge de "sin respuesta" aparece cuando corresponde.
- [ ] Ningún array hardcoded de conversaciones o mensajes permanece en el archivo.

## Restricciones
- No instalar librerías de chat. Render manual con CSS existente.
- No implementar WebSockets (n8n escribe en Strapi; el polling basta para el demo).
- No tocar [MensajeriaPage.css](../../../src/pages/MensajeriaPage.css) salvo para añadir clases nuevas al final.
