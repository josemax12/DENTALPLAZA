import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { CalendarDays, Clock } from 'lucide-react';
import api from '../../services/api';

const estadoColors: Record<string, string> = {
    programada: 'var(--accent)',
    confirmada: 'var(--success)',
    en_progreso: 'var(--warning)',
    completada: 'var(--success)',
    cancelada: 'var(--danger)',
    no_asistio: 'var(--text-subtle)',
};
const estadoLabels: Record<string, string> = {
    programada: 'PROGRAMADA', confirmada: 'CONFIRMADA', en_progreso: 'EN PROGRESO',
    completada: 'COMPLETADA', cancelada: 'CANCELADA', no_asistio: 'NO ASISTIÓ',
};

const MisCitas = () => {
    const { user } = useAuthStore();

    const { data: citas, isLoading } = useQuery({
        queryKey: ['mis-citas', (user as any)?.pacienteId],
        queryFn: () => api.get('/citas').then(r => {
            const all = r.data || [];
            return all.filter((c: any) => c.paciente?.id === (user as any)?.pacienteId);
        }),
        enabled: !!(user as any)?.pacienteId,
    });

    const upcoming = (citas || []).filter((c: any) => new Date(c.fechaHora) >= new Date()).sort((a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
    const past = (citas || []).filter((c: any) => new Date(c.fechaHora) < new Date()).sort((a: any, b: any) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    return (
        <div>
            <div className="portal-welcome">
                <h1>Hola, {user?.nombre} 👋</h1>
                <p>Tienes {upcoming.length} cita(s) programada(s)</p>
            </div>

            <div className="portal-card" style={{ marginBottom: '1.5rem' }}>
                <h2>📅 Próximas Citas</h2>
                {isLoading ? <div className="portal-empty"><p>Cargando citas...</p></div> :
                    upcoming.length > 0 ? upcoming.map((cita: any) => {
                        const color = estadoColors[cita.estado] || 'var(--primary)';
                        return (
                            <div key={cita.id} className="portal-cita-item">
                                <div className="portal-cita-left">
                                    <div className="portal-cita-icon" style={{ background: color }}>
                                        <CalendarDays size={18} />
                                    </div>
                                    <div className="portal-cita-info">
                                        <h4>{cita.motivo || 'Consulta general'}</h4>
                                        <p><Clock size={12} /> {format(new Date(cita.fechaHora), 'dd/MM/yyyy')} • Dr. {cita.doctor?.nombre || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="portal-cita-right">
                                    <span className="portal-cita-time">{format(new Date(cita.fechaHora), 'hh:mm a')}</span>
                                    <span className="portal-cita-status" style={{
                                        color: color,
                                        background: color.includes('var') ? `rgba(6, 182, 212, 0.1)` : `${color}15`
                                    }}>
                                        {estadoLabels[cita.estado] || cita.estado}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="portal-empty">
                            <CalendarDays size={40} />
                            <p>No tienes citas programadas</p>
                        </div>
                    )}
            </div>

            {past.length > 0 && (
                <div className="portal-card">
                    <h2>📋 Citas Pasadas</h2>
                    {past.slice(0, 5).map((cita: any) => {
                        const color = estadoColors[cita.estado] || '#94a3b8';
                        return (
                            <div key={cita.id} className="portal-cita-item" style={{ opacity: 0.7 }}>
                                <div className="portal-cita-left">
                                    <div className="portal-cita-icon" style={{ background: color }}>
                                        <CalendarDays size={18} />
                                    </div>
                                    <div className="portal-cita-info">
                                        <h4>{cita.motivo || 'Consulta'}</h4>
                                        <p>{format(new Date(cita.fechaHora), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                </div>
                                <div className="portal-cita-right">
                                    <span className="portal-cita-status" style={{ color, background: `${color}15` }}>
                                        {estadoLabels[cita.estado] || cita.estado}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MisCitas;
