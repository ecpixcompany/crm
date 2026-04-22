import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActividadesByLead, createActividad, updateActividad, deleteActividad } from '../lib/api';

export function useActividades(leadId: number | undefined) {
  return useQuery({
    queryKey: ['actividades', { leadId }],
    queryFn: () => fetchActividadesByLead(leadId!),
    enabled: leadId !== undefined,
  });
}

export function useCreateActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createActividad,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['actividades', { leadId: vars.lead }] });
      qc.invalidateQueries({ queryKey: ['leads', vars.lead] });
    },
  });
}

export function useUpdateActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: Parameters<typeof updateActividad>[1] }) =>
      updateActividad(documentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actividades'] });
    },
  });
}

export function useDeleteActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteActividad,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actividades'] });
    },
  });
}