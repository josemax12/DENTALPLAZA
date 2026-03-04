import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    format, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameDay, addWeeks, subWeeks, addDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronLeft, ChevronRight, Plus,
    Clock, X, Save, Trash2, User
} from 'lucide-react';
import { ESTADO_CITAS, getStatusStyle } from '../constants/status';
import api from '../services/api';
import './Agenda.css';

interface CitaForm {
    id?: string;
    pacienteId: string;
    doctorId: string;
    fechaHora: string;
    duracionMinutos: number;
    motivo: string;
    costo: number;
}

const emptyCita: CitaForm = {
    pacienteId: '', doctorId: '', fechaHora: '',
    duracionMinutos: 45, motivo: '', costo: 0,
};


const Agenda = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'day'>('week');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<CitaForm>(emptyCita);
    const [selectedCita, setSelectedCita] = useState<any>(null);
    const queryClient = useQueryClient();

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = view === 'week'
        ? eachDayOfInterval({ start: startDate, end: endDate })
        : [currentDate];

    // Fetch citas de toda la semana
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
        queryFn: async () => {
            const all: any[] = [];
            for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
                try {
                    const res = await api.get(`/citas?fecha=${format(d, 'yyyy-MM-dd')}`);
                    if (Array.isArray(res.data)) all.push(...res.data);
                } catch { /* skip */ }
            }
            return all;
        },
    });

    const { data: patients } = useQuery({
        queryKey: ['agenda-patients'],
        queryFn: () => api.get('/pacientes').then(r => r.data),
    });

    const { data: users } = useQuery({
        queryKey: ['agenda-doctors'],
        queryFn: () => api.get('/usuarios').then(r => r.data),
    });

    const doctors = users?.filter((u: any) => u.rol === 'doctor' || u.rol === 'admin') || [];

    const saveMutation = useMutation({
        mutationFn: (data: CitaForm) =>
            data.id ? api.put(`/citas/${data.id}`, data) : api.post('/citas', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['resumen-hoy'] });
            setShowModal(false);
            setEditing(emptyCita);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/citas/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setSelectedCita(null);
        },
    });

    const nextWeek = () => setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1));
    const prevWeek = () => setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : addDays(currentDate, -1));
    const goToToday = () => setCurrentDate(new Date());

    const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

    const openNew = (day?: Date, hour?: number) => {
        const date = day || new Date();
        const h = hour || 9;
        const dateStr = format(date, 'yyyy-MM-dd');
        setEditing({
            ...emptyCita,
            fechaHora: `${dateStr}T${String(h).padStart(2, '0')}:00`,
            doctorId: doctors[0]?.id || '',
        });
        setShowModal(true);
        setSelectedCita(null);
    };

    const openEdit = (cita: any) => {
        setEditing({
            id: cita.id,
            pacienteId: cita.paciente?.id || '',
            doctorId: cita.doctor?.id || '',
            fechaHora: cita.fechaHora ? format(new Date(cita.fechaHora), "yyyy-MM-dd'T'HH:mm") : '',
            duracionMinutos: cita.duracionMinutos || 45,
            motivo: cita.motivo || '',
            costo: cita.costo || 0,
        });
        setShowModal(true);
        setSelectedCita(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(editing);
    };

    const getApptStyle = (appt: any) => {
        const date = new Date(appt.fechaHora);
        const hourOffset = date.getHours() - 8;
        const minOffset = date.getMinutes();
        const top = hourOffset * 60 + minOffset + 4;
        const height = Math.max((appt.duracionMinutos || 45) - 4, 20);
        const color = ESTADO_CITAS[appt.estado]?.color || '#3b82f6';
        return {
            top: `${top}px`,
            height: `${height}px`,
            borderLeft: `3px solid ${color}`,
            background: `${color}15`
        };
    };

    return (
        <div className="page-container agenda-page">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Agenda de Citas</h1>
                    <p className="text-slate-500 capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </p>
                </div>

                <div className="agenda-controls">
                    <div className="view-selector">
                        <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Semana</button>
                        <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Día</button>
                    </div>
                    <div className="navigation-group">
                        <button onClick={prevWeek} className="btn-secondary btn-icon-only"><ChevronLeft size={20} /></button>
                        <button onClick={goToToday} className="btn-secondary">Hoy</button>
                        <button onClick={nextWeek} className="btn-secondary btn-icon-only"><ChevronRight size={20} /></button>
                    </div>
                    <button className="btn-primary" onClick={() => openNew()}>
                        <Plus size={18} /> Nueva Cita
                    </button>
                </div>
            </div>

            <div className="calendar-card card">
                <div className="calendar-grid" style={{ '--day-count': days.length } as any}>
                    <div className="time-column">
                        <div className="grid-header-spacer"></div>
                        {timeSlots.map(hour => (
                            <div key={hour} className="time-slot">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    <div className="days-columns">
                        <div className="grid-header">
                            {days.map(day => (
                                <div key={day.toString()} className={`day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
                                    <span className="day-name">{format(day, 'eee', { locale: es }).toUpperCase()}</span>
                                    <span className="day-number">{format(day, 'd')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid-body">
                            {isLoading && <div className="loading-overlay">Cargando...</div>}
                            {days.map(day => (
                                <div key={day.toString()} className="day-column">
                                    {timeSlots.map(hour => (
                                        <div key={hour} className="cell-slot"
                                            onClick={() => openNew(day, hour)}
                                            title={`Crear cita a las ${hour}:00`} />
                                    ))}

                                    {appointments?.filter((a: any) => isSameDay(new Date(a.fechaHora), day)).map((a: any) => (
                                        <div key={a.id}
                                            className={`appointment-card-float ${selectedCita?.id === a.id ? 'selected' : ''}`}
                                            style={getApptStyle(a)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedCita(selectedCita?.id === a.id ? null : a); }}>
                                            <p className="appt-p-name">{a.paciente?.nombreCompleto || 'Cita'}</p>
                                            <div className="appt-p-meta">
                                                <Clock size={10} /> {format(new Date(a.fechaHora), 'HH:mm')}
                                                <span className="appt-status-mini" style={{ color: ESTADO_CITAS[a.estado]?.color }}>
                                                    {ESTADO_CITAS[a.estado]?.label || a.estado}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detalle de cita seleccionada */}
            {selectedCita && (
                <div className="cita-detail card animate-slide-in">
                    <div className="cita-detail-header">
                        <h3>{selectedCita.paciente?.nombreCompleto || 'Cita'}</h3>
                        <button className="icon-btn" onClick={() => setSelectedCita(null)}><X size={18} /></button>
                    </div>
                    <div className="cita-detail-body">
                        <p><Clock size={14} /> <strong>{format(new Date(selectedCita.fechaHora), 'dd/MM/yyyy HH:mm')}</strong></p>
                        <p><User size={14} /> Doctor: {selectedCita.doctor?.nombre || 'N/A'}</p>
                        {selectedCita.motivo && <p>📋 {selectedCita.motivo}</p>}
                        {selectedCita.costo > 0 && <p>💰 S/ {Number(selectedCita.costo).toFixed(2)}</p>}
                        <span className="status-badge" style={getStatusStyle(ESTADO_CITAS[selectedCita.estado]?.color || '#94a3b8')}>
                            {ESTADO_CITAS[selectedCita.estado]?.label || selectedCita.estado}
                        </span>
                    </div>
                    <div className="cita-detail-actions">
                        <button className="btn-primary btn-sm" onClick={() => openEdit(selectedCita)}>Editar</button>
                        <button className="btn-danger btn-sm" onClick={() => { if (confirm('¿Eliminar esta cita?')) deleteMutation.mutate(selectedCita.id); }}>
                            <Trash2 size={14} /> Eliminar
                        </button>
                    </div>
                </div>
            )}


            {/* Modal Nueva/Editar Cita */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing.id ? 'Editar Cita' : 'Nueva Cita'}</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Paciente *</label>
                                        <select required value={editing.pacienteId}
                                            onChange={(e) => setEditing({ ...editing, pacienteId: e.target.value })}>
                                            <option value="">Seleccionar paciente...</option>
                                            {patients?.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.nombreCompleto} ({p.dni || 'Sin DNI'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group full">
                                        <label>Doctor *</label>
                                        <select required value={editing.doctorId}
                                            onChange={(e) => setEditing({ ...editing, doctorId: e.target.value })}>
                                            <option value="">Seleccionar doctor...</option>
                                            {doctors?.map((d: any) => (
                                                <option key={d.id} value={d.id}>{d.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha y Hora *</label>
                                        <input type="datetime-local" required value={editing.fechaHora}
                                            onChange={(e) => setEditing({ ...editing, fechaHora: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Duración (min)</label>
                                        <select value={editing.duracionMinutos}
                                            onChange={(e) => setEditing({ ...editing, duracionMinutos: Number(e.target.value) })}>
                                            <option value={15}>15 minutos</option>
                                            <option value={30}>30 minutos</option>
                                            <option value={45}>45 minutos</option>
                                            <option value={60}>1 hora</option>
                                            <option value={90}>1.5 horas</option>
                                            <option value={120}>2 horas</option>
                                        </select>
                                    </div>
                                    <div className="form-group full">
                                        <label>Motivo / Tratamiento</label>
                                        <input type="text" value={editing.motivo}
                                            onChange={(e) => setEditing({ ...editing, motivo: e.target.value })}
                                            placeholder="Ej: Limpieza dental, Ortodoncia, Revisión..." />
                                    </div>
                                    <div className="form-group">
                                        <label>Costo (S/)</label>
                                        <input type="number" step="0.01" min="0" value={editing.costo}
                                            onChange={(e) => setEditing({ ...editing, costo: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                                    <Save size={16} />
                                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Cita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Agenda;
