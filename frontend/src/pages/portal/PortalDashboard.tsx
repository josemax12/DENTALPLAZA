import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock, DollarSign, CheckCircle, Stethoscope, Eye } from 'lucide-react';
import api from '../../services/api';

const estadoColors: Record<string, { bg: string; text: string }> = {
    programada: { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--accent)' },
    confirmada: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' },
    en_progreso: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)' },
    completada: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' },
    cancelada: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--danger)' },
    no_asistio: { bg: 'var(--surface-2)', text: 'var(--text-subtle)' },
};

const serviceDots = ['#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#22c55e'];

const PortalDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const pacienteId = (user as any)?.pacienteId;
    const today = new Date();

    const { data: citas } = useQuery({
        queryKey: ['portal-citas', pacienteId],
        queryFn: () => api.get('/citas').then(r => (r.data || []).filter((c: any) => c.paciente?.id === pacienteId)),
        enabled: !!pacienteId,
    });

    const { data: tratamientos } = useQuery({
        queryKey: ['portal-tratamientos', pacienteId],
        queryFn: () => api.get(`/tratamientos/paciente/${pacienteId}`).then(r => r.data || []),
        enabled: !!pacienteId,
    });

    const upcoming = (citas || [])
        .filter((c: any) => new Date(c.fechaHora) >= today)
        .sort((a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

    const nextCita = upcoming[0];
    const completedTreatments = (tratamientos || []).filter((t: any) => t.estado === 'completado');
    const activeTreatments = (tratamientos || []).filter((t: any) => t.estado === 'en_progreso');

    const recentCitas = (citas || [])
        .sort((a: any, b: any) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
        .slice(0, 5);

    return (
        <div>
            {/* Welcome Bar */}
            <div className="portal-welcome-bar">
                <div>
                    <h1>¡Hola de nuevo, {user?.nombre?.split(' ')[0]}!</h1>
                    <p>Bienvenido a tu panel de salud dental en Dental Plaza.</p>
                </div>
                <div className="portal-date-badge">
                    📅 <span>HOY ES <strong>{format(today, "EEEE, d 'de' MMMM", { locale: es })}</strong></span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="portal-stats">
                <div className="portal-stat-card">
                    <div>
                        <div className="portal-stat-label">Próxima Cita</div>
                        <div className="portal-stat-value">
                            {nextCita ? format(new Date(nextCita.fechaHora), "d MMM, h:mm a", { locale: es }) : 'Sin citas'}
                        </div>
                        <div className="portal-stat-sub">
                            {nextCita ? `En ${Math.ceil((new Date(nextCita.fechaHora).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} días` : '—'}
                        </div>
                    </div>
                    <div className="portal-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)' }}>
                        <Clock size={18} />
                    </div>
                </div>

                <div className="portal-stat-card">
                    <div>
                        <div className="portal-stat-label">Pagos Pendientes</div>
                        <div className="portal-stat-value">S/ 0.00</div>
                        <div className="portal-stat-sub">✅ Al día con tus pagos</div>
                    </div>
                    <div className="portal-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <DollarSign size={18} />
                    </div>
                </div>

                <div className="portal-stat-card">
                    <div>
                        <div className="portal-stat-label">Tratamientos Completados</div>
                        <div className="portal-stat-value">{completedTreatments.length}</div>
                        <div className="portal-stat-sub">
                            {completedTreatments.length > 0
                                ? `Último: ${completedTreatments[0]?.tipo || 'N/A'}`
                                : '—'}
                        </div>
                    </div>
                    <div className="portal-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                        <CheckCircle size={18} />
                    </div>
                </div>
            </div>

            {/* Active Treatment */}
            <h3 className="portal-section-title"><Stethoscope size={20} /> Mis Tratamientos Activos</h3>
            {activeTreatments.length > 0 ? activeTreatments.map((t: any) => (
                <div key={t.id} className="portal-treatment-card" style={{ marginBottom: '1rem' }}>
                    <div className="portal-treatment-img">
                        <img src="/consultorio.png" alt="Tratamiento" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div className="portal-treatment-body">
                        <div>
                            <span className="portal-treatment-phase">EN PROGRESO</span>
                            <h3>{t.nombre} {t.numerosPiezas?.length > 0 ? `(Piezas ${t.numerosPiezas.join(', ')})` : ''}</h3>
                            <p>{t.notas || 'Tu tratamiento actual se encuentra en progreso.'}</p>
                        </div>
                        <div className="portal-treatment-meta">
                            <span><CalendarDays size={14} /> Inicio: {t.fechaInicio ? format(new Date(t.fechaInicio), "d MMM, yyyy", { locale: es }) : 'Pendiente'}</span>
                            <span><DollarSign size={14} /> Costo: S/ {Number(t.costoEstimado || 0).toFixed(2)}</span>
                        </div>
                        <div className="portal-treatment-action">
                            <button className="btn-portal-action" onClick={() => navigate('/portal/solicitar')}>Agendar Revisión</button>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="portal-treatment-card">
                    <div className="portal-treatment-img" style={{ background: 'var(--surface-2)', color: 'var(--text-subtle)' }}>
                        <Stethoscope size={40} />
                    </div>
                    <div className="portal-treatment-body">
                        <div>
                            <span className="portal-treatment-phase">SIN TRATAMIENTO ACTIVO</span>
                            <h3>No tienes tratamientos en progreso</h3>
                            <p>Solicita una cita para iniciar un nuevo tratamiento dental.</p>
                            <div className="portal-treatment-action" style={{ marginTop: '1rem' }}>
                                <button className="btn-portal-action" onClick={() => navigate('/portal/solicitar')}>Agendar Ahora</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Appointments Table */}
            <div className="portal-table-header">
                <h3 className="portal-section-title" style={{ margin: 0 }}>
                    <CalendarDays size={20} /> Citas Recientes
                </h3>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/portal/citas'); }}>Ver todo el historial</a>
            </div>
            <div className="portal-table">
                <table>
                    <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Fecha</th>
                            <th>Especialista</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentCitas.length > 0 ? recentCitas.map((c: any, i: number) => {
                            const ec = estadoColors[c.estado] || estadoColors.programada;
                            return (
                                <tr key={c.id}>
                                    <td>
                                        <div className="service-cell">
                                            <span className="service-dot" style={{ background: serviceDots[i % serviceDots.length] }}></span>
                                            {c.motivo || 'Consulta General'}
                                        </div>
                                    </td>
                                    <td>{format(new Date(c.fechaHora), "dd MMM, yyyy", { locale: es })}</td>
                                    <td>Dr. {c.doctor?.nombre || 'N/A'}</td>
                                    <td>
                                        <span className="portal-table-status" style={{ background: ec.bg, color: ec.text }}>
                                            {c.estado?.replace('_', ' ').replace(/^\w/, (ch: string) => ch.toUpperCase())}
                                        </span>
                                    </td>
                                    <td>
                                        <Eye size={16} style={{ color: 'var(--text-subtle)', cursor: 'pointer' }} />
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    No tienes citas registradas aún
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PortalDashboard;
