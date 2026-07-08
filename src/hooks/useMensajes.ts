import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMensajesByConversacion,
  createMensaje,
  updateConversacion,
  type Mensaje,
  type Conversacion,
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

type CreateMensajeInput = {
  conversacionDocumentId: string;
  contenido: string;
  tipo: Mensaje['tipo'];
  canal: Mensaje['canal'];
  timestamp?: string;
};

type OptimisticContext = {
  previousMensajes: Mensaje[] | undefined;
  previousConversaciones: Conversacion[] | undefined;
  previousConversacion: Conversacion | undefined;
  tempId: string;
};

function buildOptimisticMensaje(input: CreateMensajeInput): Mensaje {
  const ts = input.timestamp || new Date().toISOString();
  return {
    id: -Date.now(),
    documentId: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contenido: input.contenido,
    tipo: input.tipo,
    canal: input.canal,
    timestamp: ts,
    createdAt: ts,
    updatedAt: ts,
    publishedAt: ts,
  };
}

export function useCreateMensaje() {
  const qc = useQueryClient();
  return useMutation<Mensaje, Error, CreateMensajeInput, OptimisticContext>({
    mutationFn: async (input) => {
      const mensaje = await createMensaje({
        conversacionDocumentId: input.conversacionDocumentId,
        contenido: input.contenido,
        tipo: input.tipo,
        canal: input.canal,
        timestamp: input.timestamp,
      });
      await updateConversacion(input.conversacionDocumentId, {
        ultimo_mensaje: input.contenido,
        ultimo_mensaje_at: input.timestamp || new Date().toISOString(),
        sin_respuesta: false,
      });
      return mensaje;
    },
    onMutate: async (input) => {
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
      const optimistic = buildOptimisticMensaje({ ...input });

      qc.setQueryData<Mensaje[]>(mensajesKey, (old) => [
        ...(old ?? []),
        { ...optimistic, documentId: tempId },
      ]);

      const newLast = optimistic.timestamp;
      const patchList = (c: Conversacion): Conversacion => ({
        ...c,
        ultimo_mensaje: optimistic.contenido,
        ultimo_mensaje_at: newLast,
        sin_respuesta: false,
      });

      qc.setQueryData<Conversacion[]>(convsKey, (old) =>
        (old ?? []).map((c) => (c.documentId === input.conversacionDocumentId ? patchList(c) : c)),
      );
      qc.setQueryData<Conversacion>(convKey, (old) => (old ? patchList(old) : old));

      return { previousMensajes, previousConversaciones, previousConversacion, tempId };
    },
    onError: (_err, input, ctx) => {
      if (!ctx) return;
      const mensajesKey = ['mensajes', input.conversacionDocumentId] as const;
      const convsKey = ['conversaciones'] as const;
      const convKey = ['conversaciones', input.conversacionDocumentId] as const;
      qc.setQueryData(mensajesKey, ctx.previousMensajes);
      qc.setQueryData(convsKey, ctx.previousConversaciones);
      qc.setQueryData(convKey, ctx.previousConversacion);
    },
    onSuccess: () => {
      // tempId ya no es necesario; la reconciliación la hace onSettled
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
      qc.invalidateQueries({ queryKey: ['conversaciones', input.conversacionDocumentId] });
      qc.invalidateQueries({ queryKey: ['mensajes', input.conversacionDocumentId] });
    },
  });
}
