import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { ClipboardList } from 'lucide-react';
import api from '../../services/api';

const statusColors: Record<string, { bg: string; text: string }> = {
    en_progreso: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    completado: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
    planificado: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
};

const MiHistorial = () => {
    const { user } = useAuthStore();
    const pacienteId = (user as any)?.pacienteId;

    const { data: tratamientos, isLoading } = useQuery({
        queryKey: ['mi-historial', pacienteId],
        queryFn: () => api.get(`/tratamientos/paciente/${pacienteId}`).then(r => r.data),
        enabled: !!pacienteId,
    });

    return (
        <div>
            <div className="portal-card">
                <h2>🦷 Mi Historial Dental</h2>
                {isLoading ? <p style={{ color: '#94a3b8' }}>Cargando...</p> :
                    (tratamientos?.length || 0) > 0 ? tratamientos.map((t: any) => {
                        const sc = statusColors[t.estado] || statusColors.planificado;
                        return (
                            <div key={t.id} className="portal-historial-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4>{t.nombre} {t.numerosPiezas?.length > 0 ? `(Piezas ${t.numerosPiezas.join(', ')})` : ''}</h4>
                                        <p>{t.notas || 'Sin descripción'}</p>
                                        <p>💰 Costo Estimado: S/ {Number(t.costoEstimado || 0).toFixed(2)}</p>
                                    </div>
                                    <span className="portal-historial-badge" style={{ background: sc.bg, color: sc.text }}>
                                        {t.estado?.toUpperCase() || 'PENDIENTE'}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="portal-empty">
                            <ClipboardList size={40} />
                            <p>No tienes tratamientos registrados aún</p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default MiHistorial;
