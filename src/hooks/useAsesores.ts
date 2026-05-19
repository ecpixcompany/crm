import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAsesores,
  createAsesor,
  updateAsesor,
  deleteAsesor,
  type Asesor,
} from '../lib/api';

export function useAsesores() {
  return useQuery({ queryKey: ['asesores'], queryFn: fetchAsesores });
}

export function useCreateAsesor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAsesor,
    onSuccess: (asesor) => {
      qc.invalidateQueries({ queryKey: ['asesores'] });
      return asesor;
    },
  });
}

export function useUpdateAsesor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: Partial<Asesor> }) => updateAsesor(documentId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asesores'] }),
  });
}

export function useDeleteAsesor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => deleteAsesor(documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asesores'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
