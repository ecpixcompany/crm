import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendWhatsappManual, N8nWebhookError } from '../lib/n8n';

export function useSendWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendWhatsappManual,
    onSuccess: (_, vars) => {
      toast.success('Mensaje enviado');
      if (vars.conversacionDocumentId) {
        qc.invalidateQueries({ queryKey: ['mensajes', vars.conversacionDocumentId] });
      }
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
    },
    onError: (err) => {
      if (err instanceof N8nWebhookError) {
        toast.error(`Error ${err.status}: no se pudo enviar el mensaje`);
      } else if (err instanceof Error && err.name === 'TimeoutError') {
        toast.error('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Error al enviar el mensaje');
      }
    },
  });
}
