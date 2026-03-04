import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    UserPlus, Edit2, Trash2, X, Save, Shield, Stethoscope, Mail
} from 'lucide-react';
import './Doctors.css';

interface UserDto {
    id?: string;
    nombre: string;
    email: string;
    contrasena?: string;
    rol: string;
    esActivo?: boolean;
}

const emptyUser: UserDto = {
    nombre: '', email: '', contrasena: '', rol: 'doctor',
};

const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    doctor: 'Doctor',
    asistente: 'Asistente',
    recepcionista: 'Recepcionista',
};

const rolColors: Record<string, string> = {
    admin: 'red',
    doctor: 'blue',
    asistente: 'green',
    recepcionista: 'orange',
};

const Doctors = () => {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<UserDto>(emptyUser);
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/usuarios').then(r => r.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data: UserDto) => {
            if (data.id) {
                const { contrasena, ...rest } = data;
                return api.put(`/usuarios/${data.id}`, contrasena ? data : rest);
            }
            return api.post('/auth/registrar', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowModal(false);
            setEditing(emptyUser);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/usuarios/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const openNew = () => { setEditing(emptyUser); setShowModal(true); };
    const openEdit = (u: any) => { setEditing({ ...u, contrasena: '' }); setShowModal(true); };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(editing);
    };

    const doctorCount = users?.filter((u: any) => u.rol === 'doctor').length || 0;
    const activeCount = users?.filter((u: any) => u.esActivo !== false).length || 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Doctores y Usuarios</h1>
                    <p className="text-slate-500">Administra el equipo de la clínica y sus permisos</p>
                </div>
                <button className="btn-primary" onClick={openNew}>
                    <UserPlus size={18} />
                    Nuevo Usuario
                </button>
            </div>

            <div className="doctor-stats">
                <div className="card stat-mini">
                    <div className="stat-mini-icon blue"><Stethoscope size={20} /></div>
                    <div><p className="text-xs text-slate-500">Doctores</p><p className="font-bold">{doctorCount}</p></div>
                </div>
                <div className="card stat-mini">
                    <div className="stat-mini-icon green"><Shield size={20} /></div>
                    <div><p className="text-xs text-slate-500">Usuarios Activos</p><p className="font-bold">{activeCount}</p></div>
                </div>
                <div className="card stat-mini">
                    <div className="stat-mini-icon purple"><Mail size={20} /></div>
                    <div><p className="text-xs text-slate-500">Total Usuarios</p><p className="font-bold">{users?.length || 0}</p></div>
                </div>
            </div>

            <div className="card table-card">
                {isLoading ? (
                    <div className="loading-state">Cargando usuarios...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((u: any) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className={`avatar-sm role-${u.rol}`}>{u.nombre?.charAt(0)}</div>
                                            <div className="user-meta">
                                                <p className="font-semibold">{u.nombre}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="text-sm text-slate-400">{u.email}</span></td>
                                    <td><span className={`role-badge ${rolColors[u.rol] || 'blue'}`}>{rolLabels[u.rol] || u.rol}</span></td>
                                    <td>
                                        <span className={`status-dot ${u.esActivo !== false ? 'active' : 'inactive'}`}>
                                            {u.esActivo !== false ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="text-right actions-cell">
                                        <button className="icon-btn" title="Editar" onClick={() => openEdit(u)}><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" title="Eliminar"
                                            onClick={() => { if (confirm(`¿Eliminar a ${u.nombre}?`)) deleteMutation.mutate(u.id); }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!users || users.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="empty-state">
                                        <Stethoscope size={40} />
                                        <p>No hay usuarios registrados</p>
                                        <button className="btn-primary btn-sm" onClick={openNew}>Agregar primer usuario</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Nombre Completo *</label>
                                    <input type="text" required value={editing.nombre}
                                        onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                                        placeholder="Dr. Juan Pérez" />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input type="email" required value={editing.email}
                                        onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                                        placeholder="doctor@odontosync.com" />
                                </div>
                                <div className="form-group">
                                    <label>{editing.id ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}</label>
                                    <input type="password" required={!editing.id} value={editing.contrasena}
                                        onChange={(e) => setEditing({ ...editing, contrasena: e.target.value })}
                                        placeholder="••••••••" />
                                </div>
                                <div className="form-group">
                                    <label>Rol *</label>
                                    <select required value={editing.rol}
                                        onChange={(e) => setEditing({ ...editing, rol: e.target.value })}>
                                        <option value="doctor">Doctor</option>
                                        <option value="asistente">Asistente</option>
                                        <option value="recepcionista">Recepcionista</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Estado</label>
                                    <select value={editing.esActivo !== false ? 'true' : 'false'}
                                        onChange={(e) => setEditing({ ...editing, esActivo: e.target.value === 'true' })}>
                                        <option value="true">Activo</option>
                                        <option value="false">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                                    <Save size={16} />
                                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Doctors;
