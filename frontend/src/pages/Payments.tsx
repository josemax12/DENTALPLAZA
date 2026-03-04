import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    Plus, DollarSign, TrendingUp, Clock, CheckCircle2,
    AlertCircle, Search, X, ChevronDown, CreditCard,
    Banknote, Smartphone, Trash2, Edit2, ArrowUpCircle
} from 'lucide-react';
import './Payments.css';

const metodos = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: ArrowUpCircle },
    { value: 'yape', label: 'Yape', icon: Smartphone },
    { value: 'plin', label: 'Plin', icon: Smartphone },
];

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
    pendiente: { label: 'Pendiente', color: '#f59e0b', bg: '#fffbeb' },
    parcial: { label: 'Parcial', color: '#3b82f6', bg: '#eff6ff' },
    completado: { label: 'Completado', color: '#22c55e', bg: '#f0fdf4' },
    cancelado: { label: 'Cancelado', color: '#ef4444', bg: '#fef2f2' },
};

const Payments = () => {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [showAbonarModal, setShowAbonarModal] = useState<any>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [form, setForm] = useState({
        concepto: '', montoTotal: '', montoPagado: '0',
        metodoPago: 'efectivo', notas: '', numeroComprobante: '',
    });
    const [abonoForm, setAbonoForm] = useState({ monto: '', metodoPago: 'efectivo', notas: '' });

    const { data: patients = [] } = useQuery({
        queryKey: ['patients-list'],
        queryFn: () => api.get('/pacientes').then(r => r.data),
    });

    const { data: resumen } = useQuery({
        queryKey: ['pagos-resumen'],
        queryFn: () => api.get('/pagos/resumen').then(r => r.data),
    });

    const { data: pagos = [], isLoading } = useQuery({
        queryKey: ['pagos', selectedPatientId],
        queryFn: () => selectedPatientId
            ? api.get(`/pagos/paciente/${selectedPatientId}`).then(r => r.data)
            : api.get('/pagos').then(r => r.data),
    });

    const selectedPatient = patients.find((p: any) => p.id === selectedPatientId);
    const filteredPatients = patients.filter((p: any) =>
        p.nombreCompleto?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.dni?.includes(patientSearch)
    );

    const crearMutation = useMutation({
        mutationFn: (data: any) => api.post('/pagos', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pagos'] }); queryClient.invalidateQueries({ queryKey: ['pagos-resumen'] }); setShowModal(false); resetForm(); },
    });

    const abonarMutation = useMutation({
        mutationFn: ({ id, data }: any) => api.patch(`/pagos/${id}/abonar`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pagos'] }); queryClient.invalidateQueries({ queryKey: ['pagos-resumen'] }); setShowAbonarModal(null); setAbonoForm({ monto: '', metodoPago: 'efectivo', notas: '' }); },
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/pagos/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pagos'] }); queryClient.invalidateQueries({ queryKey: ['pagos-resumen'] }); },
    });

    const resetForm = () => setForm({ concepto: '', montoTotal: '', montoPagado: '0', metodoPago: 'efectivo', notas: '', numeroComprobante: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return;
        crearMutation.mutate({
            pacienteId: selectedPatientId,
            concepto: form.concepto,
            montoTotal: parseFloat(form.montoTotal),
            montoPagado: parseFloat(form.montoPagado) || 0,
            metodoPago: form.metodoPago,
            notas: form.notas,
            numeroComprobante: form.numeroComprobante,
        });
    };

    const handleAbonar = (e: React.FormEvent) => {
        e.preventDefault();
        abonarMutation.mutate({
            id: showAbonarModal.id,
            data: { monto: parseFloat(abonoForm.monto), metodoPago: abonoForm.metodoPago, notas: abonoForm.notas },
        });
    };

    const saldo = (p: any) => Number(p.montoTotal) - Number(p.montoPagado);

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Pagos y Facturación</h1>
                    <p className="text-slate-500">Gestión de cobros y estado de cuenta por paciente</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nuevo Cobro
                </button>
            </div>

            {/* Stats Cards */}
            <div className="pay-stats">
                <div className="card pay-stat-card green">
                    <div className="pay-stat-icon"><TrendingUp size={22} /></div>
                    <div>
                        <p>Total Facturado</p>
                        <h3>S/ {Number(resumen?.totalFacturado || 0).toFixed(2)}</h3>
                    </div>
                </div>
                <div className="card pay-stat-card blue">
                    <div className="pay-stat-icon"><CheckCircle2 size={22} /></div>
                    <div>
                        <p>Total Cobrado</p>
                        <h3>S/ {Number(resumen?.totalCobrado || 0).toFixed(2)}</h3>
                    </div>
                </div>
                <div className="card pay-stat-card orange">
                    <div className="pay-stat-icon"><Clock size={22} /></div>
                    <div>
                        <p>Por Cobrar</p>
                        <h3>S/ {Number(resumen?.totalPendiente || 0).toFixed(2)}</h3>
                    </div>
                </div>
                <div className="card pay-stat-card purple">
                    <div className="pay-stat-icon"><DollarSign size={22} /></div>
                    <div>
                        <p>Cobrado Este Mes</p>
                        <h3>S/ {Number(resumen?.pagosMes || 0).toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="card pay-filter">
                <Search size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Filtrar por paciente..."
                    value={selectedPatient ? selectedPatient.nombreCompleto : patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setSelectedPatientId(''); setShowPatientDropdown(true); }}
                    onFocus={() => setShowPatientDropdown(true)}
                />
                <ChevronDown size={16} style={{ color: '#94a3b8' }} />
                {selectedPatientId && (
                    <button className="pay-clear-btn" onClick={() => { setSelectedPatientId(''); setPatientSearch(''); }}>
                        <X size={14} />
                    </button>
                )}
                {showPatientDropdown && (
                    <div className="pay-dropdown">
                        <div className="pay-dropdown-item muted" onClick={() => { setSelectedPatientId(''); setPatientSearch(''); setShowPatientDropdown(false); }}>
                            — Todos los pacientes —
                        </div>
                        {filteredPatients.map((p: any) => (
                            <div key={p.id} className={`pay-dropdown-item ${p.id === selectedPatientId ? 'selected' : ''}`}
                                onClick={() => { setSelectedPatientId(p.id); setShowPatientDropdown(false); setPatientSearch(''); }}>
                                <div className="pay-avatar">{p.nombreCompleto?.charAt(0)}</div>
                                <div><p>{p.nombreCompleto}</p><span>DNI: {p.dni || 'N/A'}</span></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="card pay-table-card">
                {isLoading ? (
                    <div className="pay-empty">Cargando...</div>
                ) : pagos.length === 0 ? (
                    <div className="pay-empty">
                        <DollarSign size={48} />
                        <p>No hay pagos registrados</p>
                        <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>Registrar cobro</button>
                    </div>
                ) : (
                    <table className="pay-table">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Concepto</th>
                                <th>Total</th>
                                <th>Pagado</th>
                                <th>Saldo</th>
                                <th>Método</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagos.map((p: any) => {
                                const est = estadoConfig[p.estado] || estadoConfig.pendiente;
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="pay-patient-cell">
                                                <div className="pay-avatar sm">{p.paciente?.nombreCompleto?.charAt(0)}</div>
                                                <div>
                                                    <div className="fw-600">{p.paciente?.nombreCompleto}</div>
                                                    <div className="text-muted-sm">DNI: {p.paciente?.dni || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="fw-500">{p.concepto}</span>{p.numeroComprobante && <div className="text-muted-sm">#{p.numeroComprobante}</div>}</td>
                                        <td className="fw-600">S/ {Number(p.montoTotal).toFixed(2)}</td>
                                        <td style={{ color: '#22c55e' }} className="fw-600">S/ {Number(p.montoPagado).toFixed(2)}</td>
                                        <td style={{ color: saldo(p) > 0 ? '#ef4444' : '#22c55e' }} className="fw-600">
                                            S/ {saldo(p).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className="pay-method-badge">
                                                {metodos.find(m => m.value === p.metodoPago)?.label || p.metodoPago}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="pay-status-badge" style={{ color: est.color, background: est.bg }}>
                                                {est.label}
                                            </span>
                                        </td>
                                        <td className="text-muted-sm">
                                            {p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-PE') : '—'}
                                        </td>
                                        <td>
                                            <div className="pay-actions">
                                                {saldo(p) > 0 && (
                                                    <button className="pay-btn teal" title="Registrar abono" onClick={() => setShowAbonarModal(p)}>
                                                        <DollarSign size={15} />
                                                    </button>
                                                )}
                                                <button className="pay-btn red" title="Eliminar" onClick={() => eliminarMutation.mutate(p.id)}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="pay-modal" onClick={e => e.stopPropagation()}>
                        <div className="pay-modal-header">
                            <div><h2>Nuevo Cobro</h2><p>Registra un nuevo concepto de pago</p></div>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="pay-modal-body">
                            {/* Select patient */}
                            <div className="pay-form-group">
                                <label>Paciente *</label>
                                <div className="pay-patient-selector">
                                    <Search size={14} style={{ color: '#94a3b8' }} />
                                    <input
                                        placeholder="Buscar paciente..."
                                        value={selectedPatient ? selectedPatient.nombreCompleto : patientSearch}
                                        onChange={e => { setPatientSearch(e.target.value); setSelectedPatientId(''); setShowPatientDropdown(true); }}
                                        onFocus={() => setShowPatientDropdown(true)}
                                        required={!selectedPatientId}
                                    />
                                    {showPatientDropdown && filteredPatients.length > 0 && (
                                        <div className="pay-dropdown small">
                                            {filteredPatients.map((p: any) => (
                                                <div key={p.id} className="pay-dropdown-item"
                                                    onClick={() => { setSelectedPatientId(p.id); setShowPatientDropdown(false); setPatientSearch(''); }}>
                                                    <div className="pay-avatar">{p.nombreCompleto?.charAt(0)}</div>
                                                    <div><p>{p.nombreCompleto}</p><span>DNI: {p.dni}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pay-form-group">
                                <label>Concepto *</label>
                                <input placeholder="Ej: Limpieza dental, Ortodoncia, Consulta..." value={form.concepto}
                                    onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} required />
                            </div>
                            <div className="pay-form-grid">
                                <div className="pay-form-group">
                                    <label>Monto Total (S/) *</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00" value={form.montoTotal}
                                        onChange={e => setForm(f => ({ ...f, montoTotal: e.target.value }))} required />
                                </div>
                                <div className="pay-form-group">
                                    <label>Pago Inicial (S/)</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00" value={form.montoPagado}
                                        onChange={e => setForm(f => ({ ...f, montoPagado: e.target.value }))} />
                                </div>
                            </div>
                            <div className="pay-form-grid">
                                <div className="pay-form-group">
                                    <label>Método de Pago</label>
                                    <div className="pay-method-grid">
                                        {metodos.map(m => (
                                            <button type="button" key={m.value}
                                                className={`pay-method-btn ${form.metodoPago === m.value ? 'selected' : ''}`}
                                                onClick={() => setForm(f => ({ ...f, metodoPago: m.value }))}>
                                                <m.icon size={14} /> {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pay-form-group">
                                    <label>N° Comprobante</label>
                                    <input placeholder="Boleta / Recibo..." value={form.numeroComprobante}
                                        onChange={e => setForm(f => ({ ...f, numeroComprobante: e.target.value }))} />
                                </div>
                            </div>
                            <div className="pay-form-group">
                                <label>Notas</label>
                                <textarea rows={2} placeholder="Observaciones..." value={form.notas}
                                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
                            </div>
                            <div className="pay-modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={crearMutation.isPending || !selectedPatientId}>
                                    <Plus size={16} /> {crearMutation.isPending ? 'Guardando...' : 'Registrar Cobro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Abonar Modal */}
            {showAbonarModal && (
                <div className="modal-overlay" onClick={() => setShowAbonarModal(null)}>
                    <div className="pay-modal small" onClick={e => e.stopPropagation()}>
                        <div className="pay-modal-header teal">
                            <div>
                                <h2>Registrar Abono</h2>
                                <p>{showAbonarModal.concepto} — Saldo: S/ {saldo(showAbonarModal).toFixed(2)}</p>
                            </div>
                            <button onClick={() => setShowAbonarModal(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAbonar} className="pay-modal-body">
                            <div className="pay-form-group">
                                <label>Monto del Abono (S/) *</label>
                                <input type="number" step="0.01" min="0.01"
                                    max={saldo(showAbonarModal)}
                                    placeholder={`Máx. S/ ${saldo(showAbonarModal).toFixed(2)}`}
                                    value={abonoForm.monto}
                                    onChange={e => setAbonoForm(f => ({ ...f, monto: e.target.value }))}
                                    required autoFocus />
                            </div>
                            <div className="pay-form-group">
                                <label>Método de Pago</label>
                                <div className="pay-method-grid">
                                    {metodos.map(m => (
                                        <button type="button" key={m.value}
                                            className={`pay-method-btn ${abonoForm.metodoPago === m.value ? 'selected' : ''}`}
                                            onClick={() => setAbonoForm(f => ({ ...f, metodoPago: m.value }))}>
                                            <m.icon size={14} /> {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pay-form-group">
                                <label>Nota (opcional)</label>
                                <input placeholder="Abono parcial, cuota..." value={abonoForm.notas}
                                    onChange={e => setAbonoForm(f => ({ ...f, notas: e.target.value }))} />
                            </div>
                            <div className="pay-modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAbonarModal(null)}>Cancelar</button>
                                <button type="submit" className="btn-teal" disabled={abonarMutation.isPending}>
                                    {abonarMutation.isPending ? 'Procesando...' : 'Registrar Abono'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
