import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    CircleAlert, TrendingUp, ArrowRight, Download,
    CalendarCheck, UserPlus, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ESTADO_CITAS, getStatusStyle } from '../constants/status';
import './Dashboard.css';


const Dashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const { data: resumenCitas } = useQuery({
        queryKey: ['resumen-hoy'],
        queryFn: () => api.get('/citas/resumen-hoy').then(res => res.data),
    });

    const { data: stockBajo } = useQuery({
        queryKey: ['stock-bajo'],
        queryFn: () => api.get('/logistica/insumos?stock_bajo=true').then(res => res.data),
    });

    const { data: patients } = useQuery({
        queryKey: ['dash-patients'],
        queryFn: () => api.get('/pacientes').then(res => res.data),
    });

    // Citas de hoy (reales)
    const { data: citasHoyList } = useQuery({
        queryKey: ['citas-hoy', format(new Date(), 'yyyy-MM-dd')],
        queryFn: () => api.get(`/citas?fecha=${format(new Date(), 'yyyy-MM-dd')}`).then(res => res.data),
    });

    const today = new Date();
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dateStr = `Hoy es ${dayNames[today.getDay()]}, ${today.getDate()} de ${monthNames[today.getMonth()]}`;

    const citasHoy = resumenCitas?.total || citasHoyList?.length || 0;



    const stats = [
        { title: 'Citas Hoy', value: citasHoy, icon: CalendarCheck, color: 'blue', change: '+5%' },
        { title: 'Pacientes Nuevos', value: patients?.length || 0, icon: UserPlus, color: 'green', change: '-2%' },
        { title: 'Ingresos Estimados', value: 'S/ 1,240', icon: TrendingUp, color: 'cyan', change: '+10%' },
        { title: 'Alertas Inventario', value: stockBajo?.length || 0, icon: AlertTriangle, color: 'orange', change: '+1%' },
    ];

    const chartData = [
        { name: 'Lun', ingresos: 1200, citas: 8 },
        { name: 'Mar', ingresos: 2100, citas: 12 },
        { name: 'Mie', ingresos: 800, citas: 6 },
        { name: 'Jue', ingresos: 1600, citas: 10 },
        { name: 'Vie', ingresos: 1900, citas: 11 },
        { name: 'Sab', ingresos: 1400, citas: 7 },
        { name: 'Dom', ingresos: 400, citas: 2 },
    ];

    // Próximas citas reales - si no hay, mostrar mensaje vacío
    const proximasCitas = (citasHoyList || [])
        .sort((a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
        .slice(0, 5);

    return (
        <div className="dashboard-wrapper animate-fade">
            {/* Welcome */}
            <div className="welcome-section">
                <div>
                    <h1>¡Bienvenido de nuevo, {user?.nombre || 'Doctor'}!</h1>
                    <p>{dateStr} — Tienes <strong>{citasHoy}</strong> citas programadas para hoy.</p>
                </div>
                <button className="btn-export" onClick={() => navigate('/agenda')}>
                    <Download size={16} /> Exportar Hoy
                </button>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card stat-${stat.color}`}>
                        <div className="stat-top">
                            <div className={`stat-icon`}>
                                <stat.icon size={20} />
                            </div>
                            <span className={`stat-change ${stat.change.startsWith('+') ? 'up' : 'down'}`}>
                                {stat.change} <TrendingUp size={12} />
                            </span>
                        </div>
                        <p className="stat-label">{stat.title}</p>
                        <p className="stat-value">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="dashboard-main-grid">
                {/* Chart */}
                <div className="card chart-container">
                    <div className="card-header">
                        <div>
                            <h2>Rendimiento Semanal</h2>
                            <p className="text-muted">Ingresos vs Citas completadas</p>
                        </div>
                        <select className="select-sm">
                            <option>Últimos 7 días</option>
                            <option>Últimos 30 días</option>
                        </select>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface-2)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-md)',
                                        color: 'var(--text)'
                                    }}
                                    itemStyle={{ color: 'var(--text)' }}
                                />
                                <Legend iconType="square" wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="ingresos" name="Ingresos" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                                <Bar dataKey="citas" name="Citas" radius={[4, 4, 0, 0]} fill="var(--primary-light, #93c5fd)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Próximas Citas - DATOS REALES */}
                <div className="card appointments-card">
                    <div className="card-header">
                        <h2>Próximas Citas</h2>
                        <button className="link-btn" onClick={() => navigate('/agenda')}>Ver todas <ArrowRight size={14} /></button>
                    </div>
                    <div className="appointments-list">
                        {proximasCitas.length > 0 ? proximasCitas.map((cita: any) => {
                            const color = ESTADO_CITAS[cita.estado]?.color || '#3b82f6';
                            const hora = cita.fechaHora ? format(new Date(cita.fechaHora), 'hh:mm a') : '--:--';
                            return (
                                <div key={cita.id} className="appointment-item">
                                    <div className="appt-avatar" style={{ background: color }}>
                                        {(cita.paciente?.nombreCompleto || 'C').charAt(0)}
                                    </div>
                                    <div className="appt-info">
                                        <p className="appt-patient">{cita.paciente?.nombreCompleto || 'Paciente'}</p>
                                        <p className="appt-treatment">{cita.motivo || 'Consulta general'}</p>
                                    </div>
                                    <div className="appt-right">
                                        <span className="appt-time">{hora}</span>
                                        <span className="status-badge" style={getStatusStyle(color)}>
                                            {ESTADO_CITAS[cita.estado]?.label || cita.estado}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (

                            <div className="no-citas">
                                <p>No hay citas programadas para hoy</p>
                                <button className="btn-primary btn-sm" onClick={() => navigate('/agenda')}>
                                    Crear primera cita
                                </button>
                            </div>
                        )}
                    </div>
                    <button className="link-btn calendar-link" onClick={() => navigate('/agenda')}>Gestionar Calendario</button>
                </div>
            </div>

            {/* Stock Alert Banner */}
            {(stockBajo?.length || 0) > 0 && (
                <div className="alert-banner">
                    <div className="alert-icon"><CircleAlert size={22} /></div>
                    <div className="alert-text">
                        <strong>Alerta de Inventario: Stock Bajo</strong>
                        <p>{stockBajo?.length} insumo(s) requieren reabastecimiento inmediato</p>
                    </div>
                    <button className="btn-alert" onClick={() => navigate('/logistica')}>Reabastecer Ahora</button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
