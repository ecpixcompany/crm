import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchLeads,
  fetchLead,
  createLead,
  updateLead,
  deleteLead,
  type Lead,
} from '../lib/api';

export function useLeads() {
  return useQuery({ queryKey: ['leads'], queryFn: fetchLeads });
}

export function useLead(documentId: string | undefined) {
  return useQuery({
    queryKey: ['leads', documentId],
    queryFn: () => fetchLead(documentId!),
    enabled: documentId !== undefined,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => updateLead(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads', vars.id] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
