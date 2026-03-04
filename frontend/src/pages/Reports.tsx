import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    TrendingUp, Users, Calendar, DollarSign, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity, PieChart
} from 'lucide-react';
import './Reports.css';

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const Reports = () => {
    const [period, setPeriod] = useState('month');

    const { data: patients } = useQuery({
        queryKey: ['report-patients'],
        queryFn: () => api.get('/pacientes').then(r => r.data),
    });

    const { data: supplies } = useQuery({
        queryKey: ['report-supplies'],
        queryFn: () => api.get('/logistica/insumos').then(r => r.data),
    });

    const totalPatients = patients?.length || 0;
    const totalSupplies = supplies?.length || 0;
    const lowStock = supplies?.filter((s: any) => Number(s.stockActual) <= Number(s.stockMinimo)).length || 0;

    // Datos simulados para gráficos (se conectarán con datos reales del backend)
    const revenueData = [12500, 18200, 15800, 22100, 19500, 24300, 21800, 26500, 23400, 28100, 25600, 31200];
    const appointmentsData = [45, 52, 48, 61, 55, 67, 59, 72, 63, 75, 68, 82];
    const currentMonth = new Date().getMonth();
    const revenue = revenueData[currentMonth];
    const prevRevenue = revenueData[currentMonth - 1] || revenueData[11];
    const revenueChange = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
    const appointments = appointmentsData[currentMonth];
    const prevAppointments = appointmentsData[currentMonth - 1] || appointmentsData[11];
    const appointmentChange = ((appointments - prevAppointments) / prevAppointments * 100).toFixed(1);

    const maxRevenue = Math.max(...revenueData);

    const serviceDistribution = [
        { name: 'Limpieza dental', pct: 28, color: '#38bdf8' },
        { name: 'Ortodoncia', pct: 22, color: '#6366f1' },
        { name: 'Endodoncia', pct: 18, color: '#f59e0b' },
        { name: 'Blanqueamiento', pct: 15, color: '#22c55e' },
        { name: 'Cirugía', pct: 10, color: '#f87171' },
        { name: 'Otros', pct: 7, color: '#64748b' },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Reportes y Análisis</h1>
                    <p className="text-slate-500">Métricas de rendimiento de la clínica dental</p>
                </div>
                <div className="period-selector">
                    <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Semana</button>
                    <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mes</button>
                    <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Año</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="card kpi-card">
                    <div className="kpi-icon green"><DollarSign size={22} /></div>
                    <div className="kpi-data">
                        <p className="kpi-label">Ingresos del Mes</p>
                        <h3 className="kpi-value">S/ {revenue.toLocaleString()}</h3>
                        <span className={`kpi-change ${Number(revenueChange) >= 0 ? 'positive' : 'negative'}`}>
                            {Number(revenueChange) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {revenueChange}% vs. mes anterior
                        </span>
                    </div>
                </div>

                <div className="card kpi-card">
                    <div className="kpi-icon blue"><Calendar size={22} /></div>
                    <div className="kpi-data">
                        <p className="kpi-label">Citas del Mes</p>
                        <h3 className="kpi-value">{appointments}</h3>
                        <span className={`kpi-change ${Number(appointmentChange) >= 0 ? 'positive' : 'negative'}`}>
                            {Number(appointmentChange) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {appointmentChange}% vs. mes anterior
                        </span>
                    </div>
                </div>

                <div className="card kpi-card">
                    <div className="kpi-icon purple"><Users size={22} /></div>
                    <div className="kpi-data">
                        <p className="kpi-label">Pacientes Registrados</p>
                        <h3 className="kpi-value">{totalPatients}</h3>
                        <span className="kpi-change neutral">Total en el sistema</span>
                    </div>
                </div>

                <div className="card kpi-card">
                    <div className="kpi-icon orange"><Activity size={22} /></div>
                    <div className="kpi-data">
                        <p className="kpi-label">Insumos Stock Bajo</p>
                        <h3 className="kpi-value">{lowStock} <span className="kpi-sub">/ {totalSupplies}</span></h3>
                        <span className={`kpi-change ${lowStock > 0 ? 'negative' : 'positive'}`}>
                            {lowStock > 0 ? '⚠️ Requiere atención' : '✅ Stock saludable'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="card chart-card wide">
                    <div className="chart-header">
                        <div>
                            <h3><BarChart3 size={18} /> Ingresos Mensuales</h3>
                            <p className="text-slate-500 text-sm">Evolución de ingresos del año actual</p>
                        </div>
                    </div>
                    <div className="bar-chart">
                        {revenueData.map((val, i) => (
                            <div className="bar-col" key={i}>
                                <div className="bar-tooltip">S/ {val.toLocaleString()}</div>
                                <div className={`bar ${i === currentMonth ? 'active' : ''}`}
                                    style={{ height: `${(val / maxRevenue) * 100}%` }} />
                                <span className="bar-label">{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card chart-card narrow">
                    <div className="chart-header">
                        <div>
                            <h3><PieChart size={18} /> Servicios Populares</h3>
                            <p className="text-slate-500 text-sm">Distribución por tipo</p>
                        </div>
                    </div>
                    <div className="donut-chart">
                        <svg viewBox="0 0 100 100" className="donut-svg">
                            {(() => {
                                let offset = 0;
                                return serviceDistribution.map((s, i) => {
                                    const dashArray = `${s.pct * 2.51327} ${251.327 - s.pct * 2.51327}`;
                                    const dashOffset = -offset * 2.51327;
                                    offset += s.pct;
                                    return (
                                        <circle key={i} cx="50" cy="50" r="40" fill="none"
                                            stroke={s.color} strokeWidth="12"
                                            strokeDasharray={dashArray}
                                            strokeDashoffset={dashOffset}
                                            className="donut-segment" />
                                    );
                                });
                            })()}
                        </svg>
                    </div>
                    <div className="legend">
                        {serviceDistribution.map((s, i) => (
                            <div className="legend-item" key={i}>
                                <span className="legend-dot" style={{ background: s.color }} />
                                <span className="legend-label">{s.name}</span>
                                <span className="legend-value">{s.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="card bottom-stats">
                <h3><TrendingUp size={18} /> Resumen de Rendimiento</h3>
                <div className="stats-grid">
                    <div className="stat-block">
                        <span className="stat-label">Tasa de Ocupación</span>
                        <div className="progress-row">
                            <div className="progress-bar"><div className="progress-fill" style={{ width: '78%' }} /></div>
                            <span>78%</span>
                        </div>
                    </div>
                    <div className="stat-block">
                        <span className="stat-label">Satisfacción Pacientes</span>
                        <div className="progress-row">
                            <div className="progress-bar"><div className="progress-fill green" style={{ width: '92%' }} /></div>
                            <span>92%</span>
                        </div>
                    </div>
                    <div className="stat-block">
                        <span className="stat-label">Cobro Efectivo</span>
                        <div className="progress-row">
                            <div className="progress-bar"><div className="progress-fill orange" style={{ width: '65%' }} /></div>
                            <span>65%</span>
                        </div>
                    </div>
                    <div className="stat-block">
                        <span className="stat-label">Citas Completadas</span>
                        <div className="progress-row">
                            <div className="progress-bar"><div className="progress-fill purple" style={{ width: '85%' }} /></div>
                            <span>85%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
