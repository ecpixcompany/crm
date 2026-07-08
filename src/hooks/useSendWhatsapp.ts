import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendWhatsappManual, N8nWebhookError } from '../lib/n8n';
import { updateConversacion, type Mensaje, type Conversacion } from '../lib/api';

type SendInput = {
  numero: string;
  texto: string;
  leadDocumentId?: string;
  conversacionDocumentId?: string;
};

type OptimisticContext = {
  previousMensajes: Mensaje[] | undefined;
  previousConversaciones: Conversacion[] | undefined;
  previousConversacion: Conversacion | undefined;
};

export function useSendWhatsapp() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, SendInput, OptimisticContext>({
    mutationFn: sendWhatsappManual,
    onMutate: async (input) => {
      if (!input.conversacionDocumentId) {
        return {
          previousMensajes: undefined,
          previousConversaciones: undefined,
          previousConversacion: undefined,
        };
      }

      const mensajesKey = ['mensajes', input.conversacionDocumentId] as const;
      const convsKey = ['conversaciones'] as const;
      const convKey = ['conversaciones', input.conversacionDocumentId] as const;

      await qc.cancelQueries({ queryKey: mensajesKey });
      await qc.cancelQueries({ queryKey: convsKey });
      await qc.cancelQueries({ queryKey: convKey });

      const previousMensajes = qc.getQueryData<Mensaje[]>(mensajesKey);
      const previousConversaciones = qc.getQueryData<Conversacion[]>(convsKey);
      const previousConversacion = qc.getQueryData<Conversacion>(convKey);

      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ts = new Date().toISOString();
      const optimistic: Mensaje = {
        id: -Date.now(),
        documentId: tempId,
        contenido: input.texto,
        tipo: 'salida',
        canal: 'whatsapp',
        timestamp: ts,
        createdAt: ts,
        updatedAt: ts,
        publishedAt: ts,
      };

      qc.setQueryData<Mensaje[]>(mensajesKey, (old) => [...(old ?? []), optimistic]);

      const patchConv = (c: Conversacion): Conversacion => ({
        ...c,
        ultimo_mensaje: input.texto,
        ultimo_mensaje_at: ts,
        sin_respuesta: false,
      });

      qc.setQueryData<Conversacion[]>(convsKey, (old) =>
        (old ?? []).map((c) => (c.documentId === input.conversacionDocumentId ? patchConv(c) : c)),
      );
      qc.setQueryData<Conversacion>(convKey, (old) => (old ? patchConv(old) : old));

      return { previousMensajes, previousConversaciones, previousConversacion };
    },
    onError: (err, input, ctx) => {
      if (ctx && input.conversacionDocumentId) {
        qc.setQueryData(['mensajes', input.conversacionDocumentId], ctx.previousMensajes);
        qc.setQueryData(['conversaciones'], ctx.previousConversaciones);
        qc.setQueryData(
          ['conversaciones', input.conversacionDocumentId],
          ctx.previousConversacion,
        );
      }
      if (err instanceof N8nWebhookError) {
        toast.error(`Error ${err.status}: no se pudo enviar el mensaje`);
      } else if (err instanceof Error && err.name === 'TimeoutError') {
        toast.error('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Error al enviar el mensaje');
      }
    },
    onSuccess: async (_, vars) => {
      toast.success('Mensaje enviado');
      if (vars.conversacionDocumentId && vars.leadDocumentId === undefined) {
        try {
          await updateConversacion(vars.conversacionDocumentId, {
            ultimo_mensaje: vars.texto,
            ultimo_mensaje_at: new Date().toISOString(),
            sin_respuesta: false,
          });
        } catch (e) {
          console.error('No se pudo actualizar sin_respuesta:', e);
        }
      }
      if (vars.conversacionDocumentId) {
        qc.invalidateQueries({ queryKey: ['mensajes', vars.conversacionDocumentId] });
        qc.invalidateQueries({ queryKey: ['conversaciones', vars.conversacionDocumentId] });
      }
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
    },
  });
}
