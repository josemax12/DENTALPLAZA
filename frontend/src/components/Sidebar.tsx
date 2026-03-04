import { NavLink } from 'react-router-dom';
import {
    Calendar, Users, Package, BarChart3,
    LayoutDashboard, LogOut, ClipboardList, UserRoundSearch, FilePlus, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Sidebar.css';

const Sidebar = () => {
    const { logout, user } = useAuthStore();

    const menuItems = [
        { name: 'Panel Principal', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Agenda', icon: Calendar, path: '/agenda' },
        { name: 'Pacientes', icon: Users, path: '/pacientes' },
        { name: 'Logística', icon: Package, path: '/logistica' },
        { name: 'Tratamientos', icon: ClipboardList, path: '/tratamientos' },
        { name: 'Recetas', icon: FilePlus, path: '/recetas' },
        { name: 'Pagos', icon: DollarSign, path: '/pagos' },
        { name: 'Reportes', icon: BarChart3, path: '/reportes' },
    ];

    if (user?.rol === 'admin') {
        menuItems.push({ name: 'Gestión Doctores', icon: UserRoundSearch, path: '/doctores' });
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img src="/logo.jpg" alt="Dental Plaza" className="logo-img" />
                <div>
                    <span className="logo-text">Dental Plaza</span>
                    <span className="logo-sub">Dental Management</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="btn-logout">
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
