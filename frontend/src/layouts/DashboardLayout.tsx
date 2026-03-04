import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuthStore } from '../store/authStore';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Header />
                <main className="content animate-fade">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
