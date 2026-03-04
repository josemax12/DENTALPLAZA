import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    Search, UserPlus, Phone, FileText, Edit2, Trash2, X, Save, User, CheckCircle, Loader2
} from 'lucide-react';
import './Patients.css';

interface Patient {
    id?: string;
    nombreCompleto: string;
    dni: string;
    telefono: string;
    email: string;
    fechaNacimiento: string;
    direccion: string;
    alertasMedicas: string[];
}

const emptyPatient: Patient = {
    nombreCompleto: '', dni: '', telefono: '', email: '',
    fechaNacimiento: '', direccion: '', alertasMedicas: [],
};

const Patients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [editing, setEditing] = useState<Patient>(emptyPatient);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [alertInput, setAlertInput] = useState('');
    const [dniVerified, setDniVerified] = useState(false);
    const [dniLoading, setDniLoading] = useState(false);
    const [dniError, setDniError] = useState('');
    const queryClient = useQueryClient();

    const { data: patients, isLoading } = useQuery({
        queryKey: ['patients', searchTerm],
        queryFn: () => api.get(`/pacientes?busqueda=${searchTerm}`).then(res => res.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data: Patient) =>
            data.id ? api.put(`/pacientes/${data.id}`, data) : api.post('/pacientes', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            setShowModal(false);
            setEditing(emptyPatient);
            setDniVerified(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/pacientes/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
    });

    const openNew = () => { setEditing(emptyPatient); setDniVerified(false); setDniError(''); setShowModal(true); };
    const openEdit = (p: any) => { setEditing({ ...p }); setDniVerified(false); setDniError(''); setShowModal(true); };
    const openDetail = (p: any) => { setSelectedPatient(p); setShowDetail(true); };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(editing);
    };

    const verificarDNI = async () => {
        const dni = editing.dni.trim();
        if (dni.length !== 8) {
            setDniError('El DNI debe tener 8 dígitos');
            return;
        }
        setDniLoading(true);
        setDniError('');
        setDniVerified(false);
        try {
            // Consulta RENIEC vía el proxy del backend (evita CORS)
            const resp = await api.get(`/pacientes/reniec/${dni}`);
            const data = resp.data;
            if (data.nombres && !data.error) {
                const nombre = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
                setEditing({ ...editing, nombreCompleto: nombre });
                setDniVerified(true);
            } else {
                setDniError(data.message || 'DNI no encontrado en RENIEC');
            }
        } catch {
            setDniError('Error al consultar RENIEC. Ingrese el nombre manualmente.');
        } finally {
            setDniLoading(false);
        }
    };

    const addAlert = () => {
        if (alertInput.trim()) {
            setEditing({ ...editing, alertasMedicas: [...(editing.alertasMedicas || []), alertInput.trim()] });
            setAlertInput('');
        }
    };

    const removeAlert = (idx: number) => {
        setEditing({ ...editing, alertasMedicas: editing.alertasMedicas.filter((_, i) => i !== idx) });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Pacientes</h1>
                    <p className="text-slate-500">Administra la base de datos de pacientes y sus historias clínicas</p>
                </div>
                <button className="btn-primary" onClick={openNew}>
                    <UserPlus size={18} />
                    Nuevo Paciente
                </button>
            </div>

            <div className="card filters-card">
                <div className="search-group">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="patient-count">
                    <span>{patients?.length || 0} pacientes</span>
                </div>
            </div>

            <div className="card table-card">
                {isLoading ? (
                    <div className="loading-state">Cargando pacientes...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>DNI</th>
                                <th>Contacto</th>
                                <th>Dirección</th>
                                <th>Alertas</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients?.map((p: any) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-sm">{p.nombreCompleto?.charAt(0)}</div>
                                            <div className="user-meta">
                                                <p className="font-semibold">{p.nombreCompleto}</p>
                                                <p className="text-xs text-slate-400">{p.email || 'Sin correo'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge-outline">{p.dni || 'N/A'}</span></td>
                                    <td>
                                        <div className="contact-cell">
                                            {p.telefono ? <p><Phone size={12} /> {p.telefono}</p> : <p className="text-slate-400">Sin teléfono</p>}
                                        </div>
                                    </td>
                                    <td><span className="text-sm">{p.direccion || '—'}</span></td>
                                    <td>
                                        {p.alertasMedicas?.length > 0 ? (
                                            <span className="alert-badge">{p.alertasMedicas.length} alerta(s)</span>
                                        ) : (
                                            <span className="text-slate-400 text-sm">Sin alertas</span>
                                        )}
                                    </td>
                                    <td className="text-right actions-cell">
                                        <button className="icon-btn" title="Ver ficha" onClick={() => openDetail(p)}><FileText size={16} /></button>
                                        <button className="icon-btn" title="Editar" onClick={() => openEdit(p)}><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" title="Eliminar"
                                            onClick={() => { if (confirm('¿Eliminar paciente?')) deleteMutation.mutate(p.id); }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!patients || patients.length === 0) && (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <User size={40} />
                                            <p>No hay pacientes registrados</p>
                                            <button className="btn-primary btn-sm" onClick={openNew}>Registrar primer paciente</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing.id ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    {/* DNI con verificación RENIEC */}
                                    <div className="form-group full">
                                        <label>DNI (Documento Nacional de Identidad)</label>
                                        <div className="dni-row">
                                            <input type="text" maxLength={8} value={editing.dni}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setEditing({ ...editing, dni: val });
                                                    setDniVerified(false);
                                                    setDniError('');
                                                }}
                                                placeholder="Ej: 12345678"
                                                className={dniVerified ? 'verified' : ''} />
                                            <button type="button" className="btn-reniec" onClick={verificarDNI} disabled={dniLoading || editing.dni.length !== 8}>
                                                {dniLoading ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                                                {dniLoading ? 'Verificando...' : 'Verificar RENIEC'}
                                            </button>
                                        </div>
                                        {dniVerified && <span className="dni-success">✅ DNI verificado con RENIEC</span>}
                                        {dniError && <span className="dni-error">{dniError}</span>}
                                    </div>

                                    <div className="form-group full">
                                        <label>Nombre Completo *</label>
                                        <input type="text" required value={editing.nombreCompleto}
                                            onChange={(e) => setEditing({ ...editing, nombreCompleto: e.target.value })}
                                            placeholder={dniVerified ? '' : 'Se autocompleta al verificar DNI'}
                                            className={dniVerified ? 'verified' : ''} />
                                    </div>

                                    <div className="form-group">
                                        <label>Fecha Nacimiento</label>
                                        <input type="date" value={editing.fechaNacimiento ? editing.fechaNacimiento.split('T')[0] : ''}
                                            onChange={(e) => setEditing({ ...editing, fechaNacimiento: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input type="tel" value={editing.telefono}
                                            onChange={(e) => setEditing({ ...editing, telefono: e.target.value })} placeholder="+51 999 999 999" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" value={editing.email}
                                            onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="correo@ejemplo.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Dirección</label>
                                        <input type="text" value={editing.direccion}
                                            onChange={(e) => setEditing({ ...editing, direccion: e.target.value })} placeholder="Calle, Distrito, Ciudad" />
                                    </div>

                                    <div className="form-group full">
                                        <label>Alertas Médicas</label>
                                        <div className="alert-tags">
                                            {editing.alertasMedicas?.map((a, i) => (
                                                <span key={i} className="alert-tag">{a} <button type="button" onClick={() => removeAlert(i)}>×</button></span>
                                            ))}
                                        </div>
                                        <div className="emergency-row">
                                            <input type="text" value={alertInput}
                                                onChange={(e) => setAlertInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAlert(); } }}
                                                placeholder="Ej: Alergia a penicilina, Diabetes, etc." />
                                            <button type="button" className="btn-secondary btn-sm" onClick={addAlert}>Agregar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                                    <Save size={16} />
                                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Paciente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalle */}
            {showDetail && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                    <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Ficha del Paciente</h2>
                            <button className="icon-btn" onClick={() => setShowDetail(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-avatar">
                                <div className="avatar-lg">{selectedPatient.nombreCompleto?.charAt(0)}</div>
                                <h3>{selectedPatient.nombreCompleto}</h3>
                                <p className="text-slate-400">{selectedPatient.email || 'Sin correo'}</p>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item"><span>DNI</span><strong>{selectedPatient.dni || 'N/A'}</strong></div>
                                <div className="detail-item"><span>Teléfono</span><strong>{selectedPatient.telefono || 'N/A'}</strong></div>
                                <div className="detail-item"><span>Nacimiento</span><strong>{selectedPatient.fechaNacimiento ? new Date(selectedPatient.fechaNacimiento).toLocaleDateString() : 'N/A'}</strong></div>
                                <div className="detail-item"><span>Dirección</span><strong>{selectedPatient.direccion || 'N/A'}</strong></div>
                            </div>
                            {selectedPatient.alertasMedicas?.length > 0 && (
                                <div className="detail-alerts">
                                    <h4>⚠️ Alertas Médicas</h4>
                                    <div className="alert-tags">
                                        {selectedPatient.alertasMedicas.map((a: string, i: number) => (
                                            <span key={i} className="alert-tag danger">{a}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => { setShowDetail(false); openEdit(selectedPatient); }}>
                                <Edit2 size={16} /> Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Patients;
