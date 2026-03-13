import { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import './PortalNotifications.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://dentalplaza.onrender.com';

interface Notificacion {
    id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    leida: boolean;
    creadoEn: string;
}

const iconPorTipo: Record<string, string> = {
    cita_confirmada: '✅',
    cita_cancelada: '❌',
    cita_completada: '🎉',
    nuevo_tratamiento: '🦷',
    nueva_receta: '📝',
    nuevo_pago: '💳',
};

const PortalNotifications = () => {
    const { user } = useAuthStore();
    const pacienteId = (user as any)?.pacienteId;

    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notificacion[]>([]);
    const [unread, setUnread] = useState(0);
    const [animating, setAnimating] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cargar notificaciones históricas desde la API
    useEffect(() => {
        if (!pacienteId) return;
        api.get('/notificaciones', { params: { rol: 'paciente' } })
            .then(r => {
                const mine = r.data.filter((n: any) =>
                    n.destinatarioRol === 'paciente' && n.destinatarioId === pacienteId
                );
                setNotifs(mine);
                setUnread(mine.filter((n: any) => !n.leida).length);
            })
            .catch(() => { });
    }, [pacienteId]);

    // Conectar al WebSocket
    useEffect(() => {
        if (!pacienteId) return;

        const socket = io(`${API_URL}/notificaciones`, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_patient_room', pacienteId);
        });

        socket.on('notif_paciente', (notif: Notificacion) => {
            setNotifs(prev => [notif, ...prev]);
            setUnread(prev => prev + 1);
            // Bell animation
            setAnimating(true);
            setTimeout(() => setAnimating(false), 800);
        });

        return () => { socket.disconnect(); };
    }, [pacienteId]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const marcarLeida = async (id: string) => {
        try {
            await api.patch(`/notificaciones/${id}/leer`);
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const marcarTodas = async () => {
        try {
            await api.patch('/notificaciones/leer-todas', { rol: 'paciente' });
            setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
            setUnread(0);
        } catch { }
    };

    const relativeTime = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora mismo';
        if (mins < 60) return `Hace ${mins} min`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `Hace ${hrs}h`;
        return `Hace ${Math.floor(hrs / 24)}d`;
    };

    return (
        <div className="pn-wrapper" ref={dropdownRef}>
            <button
                className={`pn-bell-btn ${animating ? 'ring' : ''}`}
                onClick={() => setOpen(prev => !prev)}
                title="Notificaciones"
            >
                <Bell size={22} />
                {unread > 0 && (
                    <span className="pn-badge">{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {open && (
                <div className="pn-dropdown">
                    <div className="pn-header">
                        <span>Notificaciones</span>
                        {unread > 0 && (
                            <button className="pn-mark-all" onClick={marcarTodas}>
                                <CheckCheck size={14} /> Marcar todas
                            </button>
                        )}
                    </div>

                    <div className="pn-list">
                        {notifs.length === 0 ? (
                            <div className="pn-empty">
                                <Bell size={36} />
                                <p>Sin notificaciones</p>
                            </div>
                        ) : (
                            notifs.slice(0, 15).map(n => (
                                <div
                                    key={n.id}
                                    className={`pn-item ${!n.leida ? 'unread' : ''}`}
                                    onClick={() => !n.leida && marcarLeida(n.id)}
                                >
                                    <div className="pn-icon">{iconPorTipo[n.tipo] || '🔔'}</div>
                                    <div className="pn-content">
                                        <p className="pn-title">{n.titulo}</p>
                                        <p className="pn-msg">{n.mensaje}</p>
                                        <span className="pn-time">{relativeTime(n.creadoEn)}</span>
                                    </div>
                                    {!n.leida && <div className="pn-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortalNotifications;
