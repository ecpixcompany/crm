import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createConfiguracionAi, fetchConfiguracionAiByLead, updateConfiguracionAi } from '../lib/api';

export function useConfiguracionAiByLead(leadDocumentId: string | undefined) {
  return useQuery({
    queryKey: ['configuracion-ai', leadDocumentId],
    queryFn: () => fetchConfiguracionAiByLead(leadDocumentId!),
    enabled: !!leadDocumentId,
    staleTime: 0,
  });
}

export function useCreateConfiguracionAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConfiguracionAi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracion-ai'], refetchType: 'all' }),
  });
}

export function useUpdateConfiguracionAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: Parameters<typeof updateConfiguracionAi>[1] }) =>
      updateConfiguracionAi(documentId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracion-ai'], refetchType: 'all' }),
  });
}