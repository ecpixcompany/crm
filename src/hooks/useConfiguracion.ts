import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConfiguracion, updateConfiguracion } from '../lib/api';

export function useConfiguracion() {
  return useQuery({ queryKey: ['configuracion'], queryFn: fetchConfiguracion });
}

export function useUpdateConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateConfiguracion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracion'] }),
  });
}
