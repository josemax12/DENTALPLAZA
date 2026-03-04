import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { FileText, Download, Pill, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useState } from 'react';

const MisRecetas = () => {
    const { user } = useAuthStore();
    const pacienteId = (user as any)?.pacienteId;
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const { data: recetas = [], isLoading } = useQuery({
        queryKey: ['mis-recetas', pacienteId],
        queryFn: () => api.get(`/recetas/paciente/${pacienteId}`).then(r => r.data),
        enabled: !!pacienteId,
    });

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
        } catch {
            console.error('Error al descargar');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div>
            <div className="portal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: 'var(--text)' }}>📄 Mis Recetas Digitales</h2>
                    <span className="portal-badge accent">
                        {recetas.length} receta{recetas.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {isLoading ? (
                    <div className="portal-empty">
                        <p>Cargando recetas digitales...</p>
                    </div>
                ) : recetas.length === 0 ? (
                    <div className="portal-empty">
                        <FileText size={44} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                        <p>No tienes recetas registradas aún</p>
                    </div>
                ) : (
                    recetas.map((r: any) => {
                        const meds = JSON.parse(r.medicamentos || '[]');
                        return (
                            <div key={r.id} className="portal-historial-item" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                            <FileText size={18} color="var(--accent)" />
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>
                                                {r.diagnostico}
                                            </h4>
                                            <span className={`portal-badge ${r.descargada ? 'success' : 'warning'}`}>
                                                {r.descargada ? '✓ Descargada' : '● Nueva'}
                                            </span>
                                        </div>

                                        {/* Medications */}
                                        {meds.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                                                {meds.map((m: any, i: number) => (
                                                    <div key={i} className="portal-badge accent" style={{ background: 'rgba(59, 130, 246, 0.1)', textTransform: 'none' }}>
                                                        <Pill size={12} />
                                                        {m.nombre} {m.dosis ? `· ${m.dosis}` : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Meta */}
                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Clock size={12} />
                                                {new Date(r.creadaEn).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span>
                                            {r.doctor?.usuario?.nombre && (
                                                <span>Dr. {r.doctor.usuario.nombre}</span>
                                            )}
                                            {r.proximaRevision && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)' }}>
                                                    <CheckCircle size={12} />
                                                    Revisión: {r.proximaRevision}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => handleDownload(r)}
                                        disabled={downloadingId === r.id}
                                        className="btn-portal"
                                        style={{
                                            padding: '0.6rem 1.1rem',
                                            cursor: downloadingId === r.id ? 'not-allowed' : 'pointer',
                                            opacity: downloadingId === r.id ? 0.7 : 1,
                                            flexShrink: 0, whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <Download size={15} />
                                        {downloadingId === r.id ? 'Descargando...' : 'Descargar PDF'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MisRecetas;
