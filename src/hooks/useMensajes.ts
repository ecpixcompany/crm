import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMensajesByConversacion,
  createMensaje,
  updateConversacion,
  type Mensaje,
} from '../lib/api';

export function useMensajes(conversacionId: number | undefined) {
  return useQuery({
    queryKey: ['mensajes', { conversacionId }],
    queryFn: () => fetchMensajesByConversacion(conversacionId!),
    enabled: conversacionId !== undefined,
  });
}

export function useCreateMensaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      conversacion: number;
      contenido: string;
      tipo: Mensaje['tipo'];
      canal: Mensaje['canal'];
      timestamp?: string;
    }) => {
      const mensaje = await createMensaje(input);
      await updateConversacion(input.conversacion, {
        ultimo_mensaje: input.contenido,
        ultimo_mensaje_at: input.timestamp || new Date().toISOString(),
      });
      return mensaje;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
      qc.invalidateQueries({ queryKey: ['conversaciones', vars.conversacion] });
      qc.invalidateQueries({ queryKey: ['mensajes', { conversacionId: vars.conversacion }] });
    },
  });
}
