
export const ESTADO_CITAS: Record<string, { label: string; color: string }> = {
    programada: { label: 'PROGRAMADA', color: '#3b82f6' },
    confirmada: { label: 'CONFIRMADA', color: '#22c55e' },
    en_progreso: { label: 'EN PROGRESO', color: '#f59e0b' },
    completada: { label: 'COMPLETADA', color: '#8b5cf6' },
    cancelada: { label: 'CANCELADA', color: '#ef4444' },
    no_asistio: { label: 'NO ASISTIÓ', color: '#94a3b8' },
};

export const ESTADO_TRATAMIENTOS: Record<string, { label: string; color: string }> = {
    planificado: { label: 'PLANIFICADO', color: '#3b82f6' },
    en_progreso: { label: 'EN PROGRESO', color: '#f59e0b' },
    completado: { label: 'COMPLETADO', color: '#22c55e' },
    cancelado: { label: 'CANCELADO', color: '#ef4444' },
};

export const getStatusStyle = (color: string) => ({
    backgroundColor: `${color}15`,
    color: color,
    border: `1px solid ${color}30`
});
