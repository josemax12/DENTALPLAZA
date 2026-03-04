import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    Plus, Edit2, X, Save, Stethoscope, Clock, CheckCircle2,
    AlertCircle, Search, ChevronDown
} from 'lucide-react';
import { ESTADO_TRATAMIENTOS, getStatusStyle } from '../constants/status';
import './Treatments.css';

interface Treatment {
    id?: string;
    pacienteId: string;
    nombre: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
    notas: string;
    numerosPiezas: number[];
    costoEstimado: number;
}

const emptyTreatment: Treatment = {
    pacienteId: '', nombre: '', estado: 'en_progreso',
    fechaInicio: '', fechaFin: '', notas: '', numerosPiezas: [], costoEstimado: 0,
};

const estadoIcons: Record<string, any> = {
    planificado: Clock, en_progreso: AlertCircle,
    completado: CheckCircle2, abandonado: X,
    cancelado: X,
};


// Piezas dentales universales (numeración FDI)
const dentalQuadrants = [
    { label: 'Superior Derecha', pieces: [18, 17, 16, 15, 14, 13, 12, 11] },
    { label: 'Superior Izquierda', pieces: [21, 22, 23, 24, 25, 26, 27, 28] },
    { label: 'Inferior Izquierda', pieces: [31, 32, 33, 34, 35, 36, 37, 38] },
    { label: 'Inferior Derecha', pieces: [48, 47, 46, 45, 44, 43, 42, 41] },
];

const Treatments = () => {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Treatment>(emptyTreatment);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const queryClient = useQueryClient();

    const { data: patients } = useQuery({
        queryKey: ['patients-list'],
        queryFn: () => api.get('/pacientes').then(r => r.data),
    });

    const { data: treatments, isLoading } = useQuery({
        queryKey: ['treatments', selectedPatientId],
        queryFn: () => selectedPatientId
            ? api.get(`/tratamientos/paciente/${selectedPatientId}`).then(r => r.data)
            : Promise.resolve([]),
        enabled: !!selectedPatientId,
    });

    const saveMutation = useMutation({
        mutationFn: (data: Treatment) =>
            data.id ? api.put(`/tratamientos/${data.id}`, data) : api.post('/tratamientos', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            setShowModal(false);
            setEditing(emptyTreatment);
        },
    });

    const selectedPatient = patients?.find((p: any) => p.id === selectedPatientId);
    const filteredPatients = patients?.filter((p: any) =>
        p.nombreCompleto?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.dni?.includes(patientSearch)
    ) || [];

    const openNew = () => {
        setEditing({ ...emptyTreatment, pacienteId: selectedPatientId });
        setShowModal(true);
    };
    const openEdit = (t: any) => {
        setEditing({
            ...t,
            pacienteId: selectedPatientId,
            fechaInicio: t.fechaInicio ? t.fechaInicio.split('T')[0] : '',
            fechaFin: t.fechaFin ? t.fechaFin.split('T')[0] : '',
            numerosPiezas: t.numerosPiezas || [],
        });
        setShowModal(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(editing);
    };

    const togglePiece = (piece: number) => {
        const pieces = editing.numerosPiezas || [];
        setEditing({
            ...editing,
            numerosPiezas: pieces.includes(piece) ? pieces.filter(p => p !== piece) : [...pieces, piece],
        });
    };

    const activeCount = treatments?.filter((t: any) => t.estado === 'en_progreso').length || 0;
    const completedCount = treatments?.filter((t: any) => t.estado === 'completado').length || 0;


    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Historial de Tratamientos</h1>
                    <p className="text-slate-500">Gestiona los tratamientos dentales por paciente</p>
                </div>
                {selectedPatientId && (
                    <button className="btn-primary" onClick={openNew}>
                        <Plus size={18} /> Nuevo Tratamiento
                    </button>
                )}
            </div>

            {/* Selector de Paciente */}
            <div className="card patient-selector">
                <label>Seleccionar Paciente</label>
                <div className="patient-dropdown-wrapper">
                    <div className="patient-input-row" onClick={() => setShowPatientDropdown(!showPatientDropdown)}>
                        <Search size={16} />
                        <input type="text" placeholder="Buscar paciente por nombre o DNI..."
                            value={selectedPatient ? selectedPatient.nombreCompleto : patientSearch}
                            onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatientId(''); setShowPatientDropdown(true); }}
                            onFocus={() => setShowPatientDropdown(true)} />
                        <ChevronDown size={16} />
                    </div>
                    {showPatientDropdown && (
                        <div className="patient-dropdown">
                            {filteredPatients.length > 0 ? filteredPatients.map((p: any) => (
                                <div key={p.id} className={`dropdown-item ${p.id === selectedPatientId ? 'selected' : ''}`}
                                    onClick={() => { setSelectedPatientId(p.id); setShowPatientDropdown(false); setPatientSearch(''); }}>
                                    <div className="avatar-xs">{p.nombreCompleto?.charAt(0)}</div>
                                    <div>
                                        <p className="font-semibold">{p.nombreCompleto}</p>
                                        <p className="text-xs text-slate-400">DNI: {p.dni || 'N/A'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="dropdown-empty">No se encontraron pacientes</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedPatientId && (
                <>
                    {/* Stats */}
                    <div className="treatment-stats" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        <div className="card stat-mini">
                            <div className="stat-mini-icon blue"><Stethoscope size={20} /></div>
                            <div><p className="text-xs text-slate-500">Total</p><p className="font-bold">{treatments?.length || 0}</p></div>
                        </div>
                        <div className="card stat-mini">
                            <div className="stat-mini-icon yellow"><Clock size={20} /></div>
                            <div><p className="text-xs text-slate-500">Planificados</p><p className="font-bold">{treatments?.filter((t: any) => t.estado === 'planificado').length || 0}</p></div>
                        </div>
                        <div className="card stat-mini">
                            <div className="stat-mini-icon orange"><AlertCircle size={20} /></div>
                            <div><p className="text-xs text-slate-500">En Progreso</p><p className="font-bold">{activeCount}</p></div>
                        </div>
                        <div className="card stat-mini">
                            <div className="stat-mini-icon green"><CheckCircle2 size={20} /></div>
                            <div><p className="text-xs text-slate-500">Completados</p><p className="font-bold">{completedCount}</p></div>
                        </div>
                        <div className="card stat-mini">
                            <div className="stat-mini-icon red"><X size={20} /></div>
                            <div><p className="text-xs text-slate-500">Abandonados</p><p className="font-bold">{treatments?.filter((t: any) => t.estado === 'abandonado').length || 0}</p></div>
                        </div>
                    </div>

                    {/* Treatment List */}
                    <div className="treatments-list">
                        {isLoading ? (
                            <div className="card loading-state">Cargando tratamientos...</div>
                        ) : treatments?.length > 0 ? (
                            treatments.map((t: any) => {
                                const Icon = estadoIcons[t.estado] || Clock;
                                return (
                                    <div className="card treatment-card" key={t.id}>
                                        <div className="treatment-top">
                                            <div className="treatment-info">
                                                <h3>{t.nombre}</h3>
                                                <span className="status-badge" style={getStatusStyle(ESTADO_TRATAMIENTOS[t.estado]?.color || '#94a3b8')}>
                                                    <Icon size={12} /> {ESTADO_TRATAMIENTOS[t.estado]?.label || t.estado}
                                                </span>
                                            </div>
                                            <div className="treatment-actions">
                                                <button className="icon-btn" onClick={() => openEdit(t)}><Edit2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="treatment-details">
                                            <div className="detail-chip">
                                                <span>Inicio</span>
                                                <strong>{t.fechaInicio ? new Date(t.fechaInicio).toLocaleDateString() : '—'}</strong>
                                            </div>
                                            {t.fechaFin && (
                                                <div className="detail-chip">
                                                    <span>Fin</span>
                                                    <strong>{new Date(t.fechaFin).toLocaleDateString()}</strong>
                                                </div>
                                            )}
                                            <div className="detail-chip">
                                                <span>Costo</span>
                                                <strong>S/ {Number(t.costoEstimado || 0).toFixed(2)}</strong>
                                            </div>
                                            {t.numerosPiezas?.length > 0 && (
                                                <div className="detail-chip">
                                                    <span>Piezas</span>
                                                    <strong>{t.numerosPiezas.join(', ')}</strong>
                                                </div>
                                            )}
                                        </div>
                                        {t.notas && <p className="treatment-notes">{t.notas}</p>}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-state">
                                <Stethoscope size={40} />
                                <p>No hay tratamientos registrados para este paciente</p>
                                <button className="btn-primary btn-sm" onClick={openNew}>Registrar primer tratamiento</button>
                            </div>
                        )}
                    </div>

                </>
            )}

            {!selectedPatientId && (
                <div className="card empty-state" style={{ marginTop: '2rem' }}>
                    <Search size={40} />
                    <p>Selecciona un paciente para ver su historial de tratamientos</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing.id ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Nombre del Tratamiento *</label>
                                        <input type="text" required value={editing.nombre}
                                            onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                                            placeholder="Ej: Limpieza dental, Ortodoncia, Endodoncia..." />
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select value={editing.estado}
                                            onChange={(e) => setEditing({ ...editing, estado: e.target.value })}>
                                            {Object.entries(ESTADO_TRATAMIENTOS).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                            <option value="abandonado">ABANDONADO</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Costo Estimado (S/)</label>
                                        <input type="number" step="0.01" min="0" value={editing.costoEstimado}
                                            onChange={(e) => setEditing({ ...editing, costoEstimado: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha Inicio</label>
                                        <input type="date" value={editing.fechaInicio}
                                            onChange={(e) => setEditing({ ...editing, fechaInicio: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha Fin</label>
                                        <input type="date" value={editing.fechaFin}
                                            onChange={(e) => setEditing({ ...editing, fechaFin: e.target.value })} />
                                    </div>
                                    <div className="form-group full">
                                        <label>Notas Clínicas</label>
                                        <textarea rows={3} value={editing.notas}
                                            onChange={(e) => setEditing({ ...editing, notas: e.target.value })}
                                            placeholder="Observaciones del tratamiento..." />
                                    </div>
                                    <div className="form-group full">
                                        <label>Piezas Dentales (clic para seleccionar)</label>
                                        <div className="dental-chart">
                                            {dentalQuadrants.map((q, qi) => (
                                                <div className="quadrant" key={qi}>
                                                    <span className="quadrant-label">{q.label}</span>
                                                    <div className="pieces-row">
                                                        {q.pieces.map(p => (
                                                            <button type="button" key={p}
                                                                className={`piece-btn ${editing.numerosPiezas?.includes(p) ? 'selected' : ''}`}
                                                                onClick={() => togglePiece(p)}>
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                                    <Save size={16} />
                                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Tratamiento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Treatments;
