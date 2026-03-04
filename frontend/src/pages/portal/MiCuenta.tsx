import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { DollarSign, CheckCircle2, Clock, AlertCircle, CreditCard } from 'lucide-react';
import api from '../../services/api';

const estadoConfig: Record<string, { label: string; color: string; bg: string; icon: any; type: string }> = {
    pendiente: { label: 'Pendiente', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', icon: Clock, type: 'warning' },
    parcial: { label: 'Parcial', color: 'var(--accent)', bg: 'rgba(59, 130, 246, 0.1)', icon: DollarSign, type: 'accent' },
    completado: { label: 'Pagado', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle2, type: 'success' },
    cancelado: { label: 'Cancelado', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle, type: 'danger' },
};

const MiCuenta = () => {
    const { user } = useAuthStore();
    const pacienteId = (user as any)?.pacienteId;

    const { data: resumen, isLoading } = useQuery({
        queryKey: ['mi-cuenta', pacienteId],
        queryFn: () => api.get(`/pagos/paciente/${pacienteId}/resumen`).then(r => r.data),
        enabled: !!pacienteId,
    });

    const pagos = resumen?.pagos || [];

    return (
        <div>
            {/* Estado de cuenta */}
            <div className="portal-card" style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem' }}>💳 Mi Estado de Cuenta</h2>
                {isLoading ? (
                    <div className="portal-empty">
                        <p>Cargando información financiera...</p>
                    </div>
                ) : (
                    <div className="portal-finance-grid">
                        <div className="portal-finance-card success">
                            <DollarSign size={24} color="var(--success)" />
                            <p>Total Facturado</p>
                            <h3>S/ {Number(resumen?.totalDeuda || 0).toFixed(2)}</h3>
                        </div>
                        <div className="portal-finance-card accent">
                            <CheckCircle2 size={24} color="var(--accent)" />
                            <p>Total Pagado</p>
                            <h3>S/ {Number(resumen?.totalPagado || 0).toFixed(2)}</h3>
                        </div>
                        <div className={`portal-finance-card ${resumen?.saldoPendiente > 0 ? 'warning' : 'success'}`}>
                            <Clock size={24} color={resumen?.saldoPendiente > 0 ? 'var(--warning)' : 'var(--success)'} />
                            <p>Saldo Pendiente</p>
                            <h3>S/ {Number(resumen?.saldoPendiente || 0).toFixed(2)}</h3>
                        </div>
                    </div>
                )}
            </div>

            {/* Detalle de pagos */}
            <div className="portal-card">
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text)' }}>Detalle de Cobros</h3>
                {pagos.length === 0 ? (
                    <div className="portal-empty">
                        <CreditCard size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                        <p>No tienes cobros registrados</p>
                    </div>
                ) : (
                    pagos.map((p: any) => {
                        const est = estadoConfig[p.estado] || estadoConfig.pendiente;
                        const saldo = Number(p.montoTotal) - Number(p.montoPagado);
                        const Icon = est.icon;
                        return (
                            <div key={p.id} className="portal-historial-item" style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                                            <Icon size={16} color={est.color} />
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>{p.concepto}</h4>
                                            <span className={`portal-badge ${est.type}`}>{est.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                                            <span>
                                                {p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                                            </span>
                                            {p.numeroComprobante && <span>#{p.numeroComprobante}</span>}
                                            <span>Método: {p.metodoPago}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Total</div>
                                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>
                                            S/ {Number(p.montoTotal).toFixed(2)}
                                        </div>
                                        {saldo > 0 && (
                                            <>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>Pagado</div>
                                                <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.85rem' }}>
                                                    S/ {Number(p.montoPagado).toFixed(2)}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 700 }}>
                                                    Pendiente: S/ {saldo.toFixed(2)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MiCuenta;
