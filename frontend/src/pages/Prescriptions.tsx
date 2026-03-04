import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    Plus, FileText, Download, Trash2, X, Save,
    Search, ChevronDown, Stethoscope, Pill
} from 'lucide-react';
import './Prescriptions.css';

interface Medicamento {
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
}

const emptyMed: Medicamento = { nombre: '', dosis: '', frecuencia: '', duracion: '' };

const Prescriptions = () => {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        doctorId: '',
        diagnostico: '',
        indicaciones: '',
        proximaRevision: '',
        medicamentos: [{ ...emptyMed }] as Medicamento[],
    });

    const { data: patients = [] } = useQuery({
        queryKey: ['patients-list'],
        queryFn: () => api.get('/pacientes').then(r => r.data),
    });

    const { data: doctors = [] } = useQuery({
        queryKey: ['doctors-list'],
        queryFn: () => api.get('/usuarios/doctores').then(r => r.data).catch(() => []),
    });

    const { data: recetas = [], isLoading } = useQuery({
        queryKey: ['recetas'],
        queryFn: () => api.get('/recetas').then(r => r.data),
    });

    const selectedPatient = patients.find((p: any) => p.id === selectedPatientId);
    const filteredPatients = patients.filter((p: any) =>
        p.nombreCompleto?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.dni?.includes(patientSearch)
    );

    const filteredRecetas = selectedPatientId
        ? recetas.filter((r: any) => r.paciente?.id === selectedPatientId)
        : recetas;

    const crearMutation = useMutation({
        mutationFn: (data: any) => api.post('/recetas', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recetas'] });
            setShowModal(false);
            resetForm();
        },
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/recetas/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recetas'] }),
    });

    const resetForm = () => {
        setForm({ doctorId: '', diagnostico: '', indicaciones: '', proximaRevision: '', medicamentos: [{ ...emptyMed }] });
    };

    const addMed = () => setForm(f => ({ ...f, medicamentos: [...f.medicamentos, { ...emptyMed }] }));
    const removeMed = (i: number) => setForm(f => ({ ...f, medicamentos: f.medicamentos.filter((_, idx) => idx !== i) }));
    const updateMed = (i: number, field: keyof Medicamento, value: string) => {
        setForm(f => {
            const meds = [...f.medicamentos];
            meds[i] = { ...meds[i], [field]: value };
            return { ...f, medicamentos: meds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return;
        crearMutation.mutate({
            pacienteId: selectedPatientId,
            doctorId: form.doctorId || undefined,
            diagnostico: form.diagnostico,
            medicamentos: form.medicamentos.filter(m => m.nombre),
            indicaciones: form.indicaciones,
            proximaRevision: form.proximaRevision,
        });
    };

    const handleDownload = async (receta: any) => {
        setDownloadingId(receta.id);
        try {
            const response = await api.get(`/recetas/${receta.id}/pdf`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receta-${receta.id.substring(0, 8)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error descargando PDF:', err);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="page-container animate-fade">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Recetas Digitales</h1>
                    <p className="text-slate-500">Genera y gestiona recetas médicas en PDF</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nueva Receta
                </button>
            </div>

            {/* Patient Filter */}
            <div className="card rx-filter-bar">
                <div className="rx-filter-search">
                    <Search size={16} className="rx-search-icon" />
                    <input
                        type="text"
                        placeholder="Filtrar por paciente..."
                        value={selectedPatient ? selectedPatient.nombreCompleto : patientSearch}
                        onChange={e => { setPatientSearch(e.target.value); setSelectedPatientId(''); setShowPatientDropdown(true); }}
                        onFocus={() => setShowPatientDropdown(true)}
                    />
                    <ChevronDown size={16} />
                    {showPatientDropdown && (
                        <div className="rx-dropdown">
                            <div className="rx-dropdown-item" onClick={() => { setSelectedPatientId(''); setPatientSearch(''); setShowPatientDropdown(false); }}>
                                <span style={{ color: '#94a3b8' }}>— Todos los pacientes —</span>
                            </div>
                            {filteredPatients.map((p: any) => (
                                <div key={p.id} className={`rx-dropdown-item ${p.id === selectedPatientId ? 'selected' : ''}`}
                                    onClick={() => { setSelectedPatientId(p.id); setShowPatientDropdown(false); setPatientSearch(''); }}>
                                    <div className="rx-avatar">{p.nombreCompleto?.charAt(0)}</div>
                                    <div>
                                        <p>{p.nombreCompleto}</p>
                                        <span>DNI: {p.dni || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="rx-filter-count">
                    <FileText size={16} /> {filteredRecetas.length} receta{filteredRecetas.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            <div className="card rx-table-card">
                {isLoading ? (
                    <div className="rx-loading">Cargando recetas...</div>
                ) : filteredRecetas.length === 0 ? (
                    <div className="rx-empty">
                        <FileText size={48} />
                        <p>No hay recetas registradas</p>
                        <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
                            Crear primera receta
                        </button>
                    </div>
                ) : (
                    <table className="rx-table">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Diagnóstico</th>
                                <th>Médicos</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecetas.map((r: any) => (
                                <tr key={r.id}>
                                    <td>
                                        <div className="rx-patient-cell">
                                            <div className="rx-avatar">{r.paciente?.nombreCompleto?.charAt(0)}</div>
                                            <div>
                                                <p className="fw-600">{r.paciente?.nombreCompleto}</p>
                                                <span className="text-muted-sm">DNI: {r.paciente?.dni || '—'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="fw-500">{r.diagnostico}</p>
                                        <span className="text-muted-sm">
                                            {JSON.parse(r.medicamentos || '[]').length} medicamento(s)
                                        </span>
                                    </td>
                                    <td>{r.doctor?.usuario?.nombre || '—'}</td>
                                    <td>{new Date(r.creadaEn).toLocaleDateString('es-PE')}</td>
                                    <td>
                                        <span className={`rx-badge ${r.descargada ? 'descargada' : 'pendiente'}`}>
                                            {r.descargada ? '✓ Descargada' : '● Pendiente'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="rx-actions">
                                            <button
                                                className="rx-btn-download"
                                                onClick={() => handleDownload(r)}
                                                disabled={downloadingId === r.id}
                                                title="Descargar PDF"
                                            >
                                                {downloadingId === r.id ? (
                                                    <span className="rx-spinner" />
                                                ) : (
                                                    <Download size={16} />
                                                )}
                                            </button>
                                            <button
                                                className="rx-btn-delete"
                                                onClick={() => eliminarMutation.mutate(r.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="rx-modal" onClick={e => e.stopPropagation()}>
                        <div className="rx-modal-header">
                            <div>
                                <h2>Nueva Receta Digital</h2>
                                <p>Completa los datos para generar la receta en PDF</p>
                            </div>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="rx-modal-body">
                            {/* Patient */}
                            <div className="rx-form-section">
                                <h4><Stethoscope size={16} /> Paciente</h4>
                                <div className="rx-patient-selector">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Buscar paciente..."
                                        value={selectedPatient ? selectedPatient.nombreCompleto : patientSearch}
                                        onChange={e => { setPatientSearch(e.target.value); setSelectedPatientId(''); setShowPatientDropdown(true); }}
                                        onFocus={() => setShowPatientDropdown(true)}
                                        required={!selectedPatientId}
                                    />
                                    {showPatientDropdown && filteredPatients.length > 0 && (
                                        <div className="rx-dropdown small">
                                            {filteredPatients.map((p: any) => (
                                                <div key={p.id} className="rx-dropdown-item"
                                                    onClick={() => { setSelectedPatientId(p.id); setShowPatientDropdown(false); setPatientSearch(''); }}>
                                                    <div className="rx-avatar">{p.nombreCompleto?.charAt(0)}</div>
                                                    <div><p>{p.nombreCompleto}</p><span>DNI: {p.dni}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {doctors.length > 0 && (
                                    <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                                        <option value="">— Seleccionar doctor —</option>
                                        {doctors.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.usuario?.nombre || d.nombre}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Diagnóstico */}
                            <div className="rx-form-section">
                                <h4>Diagnóstico *</h4>
                                <input
                                    type="text"
                                    placeholder="Ej: Caries múltiples, Gingivitis crónica..."
                                    value={form.diagnostico}
                                    onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))}
                                    required
                                />
                            </div>

                            {/* Medicamentos */}
                            <div className="rx-form-section">
                                <div className="rx-section-header">
                                    <h4><Pill size={16} /> Medicamentos</h4>
                                    <button type="button" className="rx-add-med-btn" onClick={addMed}>
                                        <Plus size={14} /> Agregar
                                    </button>
                                </div>
                                {form.medicamentos.map((med, i) => (
                                    <div key={i} className="rx-med-row">
                                        <input placeholder="Nombre del medicamento *" value={med.nombre}
                                            onChange={e => updateMed(i, 'nombre', e.target.value)} required />
                                        <input placeholder="Dosis (ej: 500mg)" value={med.dosis}
                                            onChange={e => updateMed(i, 'dosis', e.target.value)} />
                                        <input placeholder="Frecuencia (ej: Cada 8h)" value={med.frecuencia}
                                            onChange={e => updateMed(i, 'frecuencia', e.target.value)} />
                                        <input placeholder="Duración (ej: 5 días)" value={med.duracion}
                                            onChange={e => updateMed(i, 'duracion', e.target.value)} />
                                        {form.medicamentos.length > 1 && (
                                            <button type="button" className="rx-remove-med" onClick={() => removeMed(i)}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Indicaciones y Próxima revisión */}
                            <div className="rx-form-section rx-two-col">
                                <div>
                                    <h4>Indicaciones Generales</h4>
                                    <textarea
                                        placeholder="Instrucciones para el paciente..."
                                        rows={3}
                                        value={form.indicaciones}
                                        onChange={e => setForm(f => ({ ...f, indicaciones: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <h4>Próxima Revisión</h4>
                                    <input
                                        type="text"
                                        placeholder="Ej: 2 semanas, 11 de Abril 2026..."
                                        value={form.proximaRevision}
                                        onChange={e => setForm(f => ({ ...f, proximaRevision: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="rx-modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={crearMutation.isPending || !selectedPatientId}>
                                    <Save size={16} />
                                    {crearMutation.isPending ? 'Guardando...' : 'Crear Receta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Prescriptions;
