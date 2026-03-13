import { useState, useEffect, useRef } from 'react';
import { Bell, User, Search, Calendar, MessageSquare, Clock, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import './Header.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Header = () => {
    const { user } = useAuthStore();
    const { isDark, toggle } = useThemeStore();
    const queryClient = useQueryClient();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [_, setSocket] = useState<Socket | null>(null);

    // Fetch notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notificaciones', user?.rol],
        queryFn: () => api.get(`/notificaciones?rol=${user?.rol}`).then(r => r.data),
        enabled: !!user?.rol,
    });

    // Count unread
    const unreadCount = notifications.filter((n: any) => !n.leida).length;

    // WebSocket connection
    useEffect(() => {
        if (!user) return;

        const newSocket = io(`${API_URL}/notificaciones`, {
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('✅ Conectado a WebSockets de notificaciones');
        });

        newSocket.on('nueva_notificacion', (notif) => {
            // Solo procesar si es para mi rol
            if (notif.destinatarioRol === user.rol || notif.destinatarioRol === 'todos') {
                queryClient.setQueryData(['notificaciones', user.rol], (old: any[] = []) => [notif, ...old]);

                // Reproducir sonido sutil opcional
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => { });
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user, queryClient]);

    // Mutation to mark as read
    const markReadMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/notificaciones/${id}/leer`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones', user?.rol] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.patch(`/notificaciones/leer-todas?rol=${user?.rol}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones', user?.rol] });
        },
    });

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'nueva_cita': return <Calendar size={18} />;
            case 'mensaje': return <MessageSquare size={18} />;
            default: return <Bell size={18} />;
        }
    };

    return (
        <header className="header glass">
            <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Buscar pacientes, citas..." />
            </div>

            <div className="header-actions">
                <div className="notifications-container" ref={dropdownRef}>
                    <button className="action-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notifications-dropdown">
                            <div className="notifications-header">
                                <h3>Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button onClick={() => markAllReadMutation.mutate()}>Marcar todo como leído</button>
                                )}
                            </div>

                            <div className="notifications-list">
                                {notifications.length > 0 ? (
                                    notifications.map((n: any) => (
                                        <div
                                            key={n.id}
                                            className={`notification-item ${!n.leida ? 'unread' : ''}`}
                                            onClick={() => !n.leida && markReadMutation.mutate(n.id)}
                                        >
                                            <div className="notification-icon">
                                                {getIcon(n.tipo)}
                                            </div>
                                            <div className="notification-content">
                                                <p className="notification-title">{n.titulo}</p>
                                                <p className="notification-message">{n.mensaje}</p>
                                                <div className="notification-time">
                                                    <Clock size={10} style={{ marginRight: '4px' }} />
                                                    {formatDistanceToNow(new Date(n.creadoEn), { addSuffix: true, locale: es })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-notifications">
                                        No tienes notificaciones
                                    </div>
                                )}
                            </div>

                            <div className="notifications-footer">
                                <a href="#">Ver todas las notificaciones</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                    className="action-btn theme-toggle"
                    onClick={toggle}
                    title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    <span className={`theme-icon ${isDark ? 'visible' : ''}`} style={{ position: 'absolute', transition: 'all 0.3s ease', opacity: isDark ? 1 : 0, transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(90deg)' }}>
                        <Sun size={20} />
                    </span>
                    <span className={`theme-icon ${!isDark ? 'visible' : ''}`} style={{ position: 'absolute', transition: 'all 0.3s ease', opacity: !isDark ? 1 : 0, transform: !isDark ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-90deg)' }}>
                        <Moon size={20} />
                    </span>
                </button>

                <div className="user-profile">
                    <div className="user-info">
                        <p className="user-name">{user?.nombre}</p>
                        <p className="user-role">{user?.rol.toUpperCase()}</p>
                    </div>
                    <div className="user-avatar">
                        <User size={24} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
