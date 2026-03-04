import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
    LayoutDashboard, CalendarDays, ClipboardList, CalendarPlus,
    User, LogOut, FileText, CreditCard, Sun, Moon
} from 'lucide-react';
import api from '../services/api';
import PortalNotifications from '../components/PortalNotifications';
import './PortalLayout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const menu = [
    { path: '/portal', label: 'Panel Principal', icon: LayoutDashboard, end: true },
    { path: '/portal/citas', label: 'Mis Citas', icon: CalendarDays },
    { path: '/portal/historial', label: 'Historial de Tratamientos', icon: ClipboardList },
    { path: '/portal/recetas', label: 'Mis Recetas', icon: FileText },
    { path: '/portal/cuenta', label: 'Mi Cuenta', icon: CreditCard },
    { path: '/portal/solicitar', label: 'Solicitar Cita', icon: CalendarPlus },
    { path: '/portal/perfil', label: 'Mi Perfil', icon: User },
];

const PortalLayout = () => {
    const { user, logout } = useAuthStore();
    const { isDark, toggle } = useThemeStore();
    const navigate = useNavigate();
    const pacienteId = (user as any)?.pacienteId;
    const initials = (user?.nombre || 'P').charAt(0).toUpperCase();

    const { data: paciente } = useQuery({
        queryKey: ['mi-perfil', pacienteId],
        queryFn: () => api.get(`/pacientes/${pacienteId}`).then(r => r.data),
        enabled: !!pacienteId,
    });

    const fotoUrl = paciente?.fotoPerfil ? `${API_URL}${paciente.fotoPerfil}` : null;

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="portal-layout">
            {/* SIDEBAR */}
            <aside className="portal-sidebar">
                <div className="portal-sidebar-top">
                    {/* Avatar + Name + Notifications */}
                    <div className="portal-avatar-section">
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {fotoUrl ? (
                                <img src={fotoUrl} alt="Foto" className="portal-avatar-img" />
                            ) : (
                                <div className="portal-avatar">{initials}</div>
                            )}
                            <div>
                                <div className="portal-avatar-name">{user?.nombre || 'Paciente'}</div>
                                <div className="portal-avatar-role">Paciente de Dental Plaza</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
                            <PortalNotifications />
                            <button
                                className="portal-theme-toggle"
                                onClick={toggle}
                                title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="portal-sidebar-nav">
                        {menu.map(item => (
                            <NavLink key={item.path} to={item.path} end={item.end}
                                className={({ isActive }) => `portal-sidebar-link ${isActive ? 'active' : ''}`}>
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="portal-sidebar-bottom">
                    <button className="portal-sidebar-link" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <button className="portal-reservar-btn" onClick={() => navigate('/portal/solicitar')}>
                        <CalendarPlus size={18} />
                        Reservar Cita
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="portal-main">
                <Outlet />
            </main>
        </div>
    );
};

export default PortalLayout;
