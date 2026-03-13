import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const SolicitarCita = () => {
    const { user } = useAuthStore();
    const pacienteId = (user as any)?.pacienteId;
    const queryClient = useQueryClient();
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        fechaHora: '', motivo: '', duracionMinutos: 45, doctorId: '',
    });

    const { data: doctores } = useQuery({
        queryKey: ['portal-doctores'],
        queryFn: () => api.get('/usuarios').then(r => r.data?.filter((u: any) => u.rol === 'doctor' || u.rol === 'admin') || []),
    });

    const mutation = useMutation({
        mutationFn: (data: any) => api.post('/citas', data),
        onSuccess: () => {
            setSuccess(true);
            setForm({ fechaHora: '', motivo: '', duracionMinutos: 45, doctorId: '' });
            queryClient.invalidateQueries({ queryKey: ['mis-citas'] });
            setTimeout(() => setSuccess(false), 4000);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            pacienteId,
            doctorId: form.doctorId,
            fechaHora: form.fechaHora,
            duracionMinutos: form.duracionMinutos,
            motivo: form.motivo,
        });
    };

    return (
        <div>
            <div className="portal-card">
                <div className="portal-card-header">
                    <h2>🗓️ Solicitar Nueva Cita</h2>
                </div>

                {success && (
                    <div className="portal-alert success animate-fade-in">
                        <CheckCircle size={18} />
                        <div>
                            <strong>¡Cita solicitada con éxito!</strong> Te contactaremos para confirmar.
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="portal-form">
                    <div className="full">
                        <label>Doctor *</label>
                        <select required value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
                            <option value="">Selecciona un doctor...</option>
                            {doctores?.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Fecha y Hora *</label>
                        <input type="datetime-local" required value={form.fechaHora}
                            onChange={e => setForm({ ...form, fechaHora: e.target.value })} />
                    </div>
                    <div>
                        <label>Duración</label>
                        <select value={form.duracionMinutos} onChange={e => setForm({ ...form, duracionMinutos: Number(e.target.value) })}>
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>1 hora</option>
                        </select>
                    </div>
                    <div className="full">
                        <label>Motivo de la consulta</label>
                        <textarea value={form.motivo}
                            onChange={e => setForm({ ...form, motivo: e.target.value })}
                            placeholder="Describe el motivo de tu visita..." />
                    </div>
                    <div className="portal-form-actions">
                        <button type="submit" className="btn-portal" disabled={mutation.isPending}>
                            <Send size={16} />
                            {mutation.isPending ? 'Enviando...' : 'Solicitar Cita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SolicitarCita;
