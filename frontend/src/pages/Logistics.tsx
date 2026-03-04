import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    Boxes, AlertTriangle, Plus, History, X, Save, Edit2, Trash2, Package
} from 'lucide-react';
import './Logistics.css';

interface Supply {
    id?: string;
    nombre: string;
    sku: string;
    categoria: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo: number;
    precioUnitario: number;
    fechaCaducidad: string;
    proveedor: string;
}

const emptySupply: Supply = {
    nombre: '', sku: '', categoria: 'dental', unidadMedida: 'unidad',
    stockActual: 0, stockMinimo: 5, precioUnitario: 0, fechaCaducidad: '', proveedor: '',
};

const Logistics = () => {
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Supply>(emptySupply);
    const queryClient = useQueryClient();

    const { data: supplies, isLoading } = useQuery({
        queryKey: ['logistics', filter],
        queryFn: () => api.get(`/logistica/insumos${filter === 'stock' ? '?stock_bajo=true' : ''}`).then(res => res.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data: Supply) =>
            data.id ? api.put(`/logistica/insumos/${data.id}`, data) : api.post('/logistica/insumos', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistics'] });
            setShowModal(false);
            setEditing(emptySupply);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/logistica/insumos/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logistics'] }),
    });

    const openNew = () => { setEditing(emptySupply); setShowModal(true); };
    const openEdit = (s: any) => { setEditing({ ...s }); setShowModal(true); };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(editing);
    };

    const lowStockCount = supplies?.filter((i: any) => Number(i.stockActual) <= Number(i.stockMinimo)).length || 0;
    const totalItems = supplies?.length || 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Inventario de Logística</h1>
                    <p className="text-slate-500">Kardex de materiales, stock de insumos y alertas de caducidad</p>
                </div>
                <button className="btn-primary" onClick={openNew}>
                    <Plus size={18} />
                    Agregar Insumo
                </button>
            </div>

            <div className="logistics-stats-grid">
                <div className={`card stat-mini ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                    <div className="stat-mini-icon blue"><Boxes size={20} /></div>
                    <div>
                        <p className="text-xs text-slate-500">Total Items</p>
                        <p className="font-bold">{totalItems}</p>
                    </div>
                </div>
                <div className={`card stat-mini ${filter === 'stock' ? 'active' : ''}`} onClick={() => setFilter('stock')}>
                    <div className="stat-mini-icon orange"><AlertTriangle size={20} /></div>
                    <div>
                        <p className="text-xs text-slate-500">Stock Bajo</p>
                        <p className="font-bold">{lowStockCount}</p>
                    </div>
                </div>
                <div className="card stat-mini">
                    <div className="stat-mini-icon red"><History size={20} /></div>
                    <div>
                        <p className="text-xs text-slate-500">Por Vencer</p>
                        <p className="font-bold">{supplies?.filter((i: any) => {
                            if (!i.fechaCaducidad) return false;
                            const diff = new Date(i.fechaCaducidad).getTime() - Date.now();
                            return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
                        }).length || 0}</p>
                    </div>
                </div>
            </div>

            <div className="card table-card">
                <div className="table-header-tabs">
                    <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        Todos los Insumos
                    </button>
                    <button className={`tab-btn ${filter === 'stock' ? 'active' : ''}`} onClick={() => setFilter('stock')}>
                        Sólo Stock Bajo
                    </button>
                </div>

                {isLoading ? (
                    <div className="loading-state">Cargando inventario...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Material / SKU</th>
                                <th>Categoría</th>
                                <th>Stock Actual</th>
                                <th>Mínimo</th>
                                <th>Precio Unit.</th>
                                <th>Vencimiento</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplies?.map((item: any) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="item-cell">
                                            <p className="font-semibold">{item.nombre}</p>
                                            <p className="text-xs text-slate-400">{item.sku || 'SIN-SKU'}</p>
                                        </div>
                                    </td>
                                    <td><span className="badge-category">{item.categoria || 'Dental'}</span></td>
                                    <td>
                                        <span className={`stock-val ${Number(item.stockActual) <= Number(item.stockMinimo) ? 'critical' : ''}`}>
                                            {item.stockActual} {item.unidadMedida}
                                        </span>
                                    </td>
                                    <td>{item.stockMinimo}</td>
                                    <td>S/ {Number(item.precioUnitario || 0).toFixed(2)}</td>
                                    <td>
                                        <span className="text-sm">
                                            {item.fechaCaducidad ? new Date(item.fechaCaducidad).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="text-right actions-cell">
                                        <button className="icon-btn" title="Editar" onClick={() => openEdit(item)}><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" title="Eliminar"
                                            onClick={() => { if (confirm('¿Eliminar insumo?')) deleteMutation.mutate(item.id); }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!supplies || supplies.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="empty-state">
                                        <Package size={40} />
                                        <p>No hay insumos registrados</p>
                                        <button className="btn-primary btn-sm" onClick={openNew}>Agregar primer insumo</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Crear/Editar Insumo */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing.id ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Nombre del Insumo *</label>
                                    <input type="text" required value={editing.nombre}
                                        onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} placeholder="Ej: Resina compuesta A2" />
                                </div>
                                <div className="form-group">
                                    <label>SKU / Código</label>
                                    <input type="text" value={editing.sku}
                                        onChange={(e) => setEditing({ ...editing, sku: e.target.value })} placeholder="RES-A2-001" />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select value={editing.categoria}
                                        onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}>
                                        <option value="dental">Dental</option>
                                        <option value="limpieza">Limpieza</option>
                                        <option value="instrumentos">Instrumentos</option>
                                        <option value="medicamentos">Medicamentos</option>
                                        <option value="proteccion">Protección</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unidad de Medida</label>
                                    <select value={editing.unidadMedida}
                                        onChange={(e) => setEditing({ ...editing, unidadMedida: e.target.value })}>
                                        <option value="unidad">Unidad</option>
                                        <option value="ml">ml</option>
                                        <option value="gr">gr</option>
                                        <option value="caja">Caja</option>
                                        <option value="paquete">Paquete</option>
                                        <option value="rollo">Rollo</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Stock Actual *</label>
                                    <input type="number" required min="0" value={editing.stockActual}
                                        onChange={(e) => setEditing({ ...editing, stockActual: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Stock Mínimo</label>
                                    <input type="number" min="0" value={editing.stockMinimo}
                                        onChange={(e) => setEditing({ ...editing, stockMinimo: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Precio Unitario (S/)</label>
                                    <input type="number" step="0.01" min="0" value={editing.precioUnitario}
                                        onChange={(e) => setEditing({ ...editing, precioUnitario: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Fecha Caducidad</label>
                                    <input type="date" value={editing.fechaCaducidad ? editing.fechaCaducidad.split('T')[0] : ''}
                                        onChange={(e) => setEditing({ ...editing, fechaCaducidad: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                                    <Save size={16} />
                                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Insumo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logistics;
