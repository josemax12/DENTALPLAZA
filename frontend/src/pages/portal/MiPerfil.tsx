import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { User, Mail, Phone, MapPin, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import api from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MiPerfil = () => {
    const { user } = useAuthStore();
    const pacienteId = (user as any)?.pacienteId;
    const fileRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    const { data: paciente } = useQuery({
        queryKey: ['mi-perfil', pacienteId],
        queryFn: () => api.get(`/pacientes/${pacienteId}`).then(r => r.data),
        enabled: !!pacienteId,
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pacienteId) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('foto', file);
            await api.post(`/ pacientes / ${pacienteId}/foto`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            queryClient.invalidateQueries({ queryKey: ['mi-perfil'] });
        } catch (err) {
            console.error('Error subiendo foto:', err);
        } finally {
            setUploading(false);
        }
    };

    const fotoUrl = paciente?.fotoPerfil ? `${API_URL}${paciente.fotoPerfil}` : null;

    return (
        <div>
            <div className="portal-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Avatar con upload */}
                    <div className="perfil-avatar-wrapper" onClick={() => fileRef.current?.click()}>
                        {fotoUrl ? (
                            <img src={fotoUrl} alt="Foto" className="perfil-avatar-img" />
                        ) : (
                            <div className="portal-profile-avatar">
                                {(paciente?.nombreCompleto || user?.nombre || 'P').charAt(0)}
                            </div>
                        )}
                        <div className="perfil-avatar-overlay">
                            {uploading ? <Loader2 size={20} className="spinner" /> : <Camera size={20} />}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload}
                            style={{ display: 'none' }} />
                    </div>

                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text)' }}>{paciente?.nombreCompleto || user?.nombre}</h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            DNI: {paciente?.dni || 'N/A'}
                        </p>
                        <p style={{ margin: '0.15rem 0 0', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                            onClick={() => fileRef.current?.click()}>
                            📷 Cambiar foto de perfil
                        </p>
                    </div>
                </div>

                <div className="portal-profile-grid">
                    <div className="portal-profile-item">
                        <label><Mail size={12} /> Email</label>
                        <p>{paciente?.email || user?.email || 'No registrado'}</p>
                    </div>
                    <div className="portal-profile-item">
                        <label><Phone size={12} /> Teléfono</label>
                        <p>{paciente?.telefono || 'No registrado'}</p>
                    </div>
                    <div className="portal-profile-item">
                        <label><MapPin size={12} /> Dirección</label>
                        <p>{paciente?.direccion || 'No registrada'}</p>
                    </div>
                    <div className="portal-profile-item">
                        <label><User size={12} /> Fecha de Nacimiento</label>
                        <p>{paciente?.fechaNacimiento || 'No registrada'}</p>
                    </div>
                </div>

                {(paciente?.alertasMedicas?.length || 0) > 0 && (
                    <div className="portal-alert warning" style={{ marginTop: '1.5rem' }}>
                        <div style={{ width: '100%' }}>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <AlertTriangle size={16} /> Alertas Médicas
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                {paciente.alertasMedicas.map((a: string, i: number) => (
                                    <li key={i} style={{ color: 'inherit', fontSize: '0.85rem' }}>{a}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MiPerfil;
