import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversaciones,
  fetchConversacion,
  createConversacion,
  updateConversacion,
  type Conversacion,
} from '../lib/api';

export function useConversaciones(pollInterval?: number | false) {
  return useQuery({
    queryKey: ['conversaciones'],
    queryFn: fetchConversaciones,
    refetchInterval: pollInterval,
  });
}

export function useConversacion(documentId: string | undefined, pollInterval?: number | false) {
  return useQuery({
    queryKey: ['conversaciones', documentId],
    queryFn: () => fetchConversacion(documentId!),
    enabled: documentId !== undefined,
    refetchInterval: pollInterval,
  });
}

export function useCreateConversacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConversacion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversaciones'] }),
  });
}

export function useUpdateConversacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: Partial<Conversacion> }) => updateConversacion(documentId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
      qc.invalidateQueries({ queryKey: ['conversaciones', vars.documentId] });
    },
  });
}
