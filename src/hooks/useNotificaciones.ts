import { useMemo } from 'react';
import { useLeads } from './useLeads';
import type { Lead } from '../lib/api';

export type NotificacionUrgencia = 'vencido' | 'hoy' | 'manana' | 'proximo';

export interface Notificacion {
  id: string;
  lead: Lead;
  urgencia: NotificacionUrgencia;
  fechaProximaAccion: string;
  diasDiferencia: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(target: Date, base: Date): number {
  return Math.round((startOfDay(target).getTime() - startOfDay(base).getTime()) / MS_PER_DAY);
}

function clasificarUrgencia(dias: number): NotificacionUrgencia | null {
  if (dias < 0) return 'vencido';
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'manana';
  if (dias >= 2 && dias <= 7) return 'proximo';
  return null;
}

export function useNotificaciones() {
  const { data: leads = [] } = useLeads();

  const notificaciones = useMemo<Notificacion[]>(() => {
    const hoy = new Date();

    return leads
      .filter((lead) => lead.estado !== 'cerrado' && lead.fecha_proxima_accion)
      .map((lead) => {
        const fecha = new Date(lead.fecha_proxima_accion!);
        const dias = diffDays(fecha, hoy);
        const urgencia = clasificarUrgencia(dias);
        if (!urgencia) return null;
        return {
          id: lead.documentId,
          lead,
          urgencia,
          fechaProximaAccion: lead.fecha_proxima_accion!,
          diasDiferencia: dias,
        };
      })
      .filter((n): n is Notificacion => n !== null)
      .sort((a, b) => a.diasDiferencia - b.diasDiferencia);
  }, [leads]);

  const count = notificaciones.length;
  const countVencidos = notificaciones.filter((n) => n.urgencia === 'vencido').length;
  const countHoy = notificaciones.filter((n) => n.urgencia === 'hoy').length;

  return {
    notificaciones,
    count,
    countVencidos,
    countHoy,
  };
}
