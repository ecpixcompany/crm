import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMensajesByConversacion,
  createMensaje,
  updateConversacion,
  type Mensaje,
} from '../lib/api';

export function useMensajes(conversacionDocumentId: string | undefined, refetchIntervalMs?: number | false) {
  return useQuery({
    queryKey: ['mensajes', conversacionDocumentId],
    queryFn: () => fetchMensajesByConversacion(conversacionDocumentId!),
    enabled: conversacionDocumentId !== undefined,
    refetchInterval: refetchIntervalMs ?? false,
    staleTime: 2000,
  });
}

export function useCreateMensaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      conversacionDocumentId: string;
      contenido: string;
      tipo: Mensaje['tipo'];
      canal: Mensaje['canal'];
      timestamp?: string;
    }) => {
      const mensaje = await createMensaje({ conversacionDocumentId: input.conversacionDocumentId, contenido: input.contenido, tipo: input.tipo, canal: input.canal, timestamp: input.timestamp });
      await updateConversacion(input.conversacionDocumentId, {
        ultimo_mensaje: input.contenido,
        ultimo_mensaje_at: input.timestamp || new Date().toISOString(),
        sin_respuesta: false,
      });
      return mensaje;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
      qc.invalidateQueries({ queryKey: ['mensajes', vars.conversacionDocumentId] });
    },
  });
}
