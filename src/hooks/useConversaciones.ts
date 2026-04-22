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

export function useConversacion(id: number | undefined, pollInterval?: number | false) {
  return useQuery({
    queryKey: ['conversaciones', id],
    queryFn: () => fetchConversacion(id!),
    enabled: id !== undefined,
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
    mutationFn: ({ id, data }: { id: number; data: Partial<Conversacion> }) => updateConversacion(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
      qc.invalidateQueries({ queryKey: ['conversaciones', vars.id] });
    },
  });
}
