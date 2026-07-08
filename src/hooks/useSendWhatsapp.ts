import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendWhatsappManual, N8nWebhookError } from '../lib/n8n';
import type { Mensaje } from '../lib/api';

type SendInput = {
  numero: string;
  texto: string;
  leadDocumentId?: string;
  conversacionDocumentId?: string;
};

type OptimisticContext = {
  previousMensajes: Mensaje[] | undefined;
  tempId: string;
};

export function useSendWhatsapp() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, SendInput, OptimisticContext>({
    mutationFn: sendWhatsappManual,
    onMutate: async (input) => {
      if (!input.conversacionDocumentId) return { previousMensajes: undefined, tempId: '' };

      const mensajesKey = ['mensajes', input.conversacionDocumentId] as const;
      await qc.cancelQueries({ queryKey: mensajesKey });
      const previousMensajes = qc.getQueryData<Mensaje[]>(mensajesKey);

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

      return { previousMensajes, tempId };
    },
    onError: (err, input, ctx) => {
      if (ctx && input.conversacionDocumentId) {
        qc.setQueryData(['mensajes', input.conversacionDocumentId], ctx.previousMensajes);
      }
      if (err instanceof N8nWebhookError) {
        toast.error(`Error ${err.status}: no se pudo enviar el mensaje`);
      } else if (err instanceof Error && err.name === 'TimeoutError') {
        toast.error('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Error al enviar el mensaje');
      }
    },
    onSuccess: (_, vars) => {
      toast.success('Mensaje enviado');
      if (vars.conversacionDocumentId) {
        qc.invalidateQueries({ queryKey: ['mensajes', vars.conversacionDocumentId] });
      }
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
    },
  });
}
