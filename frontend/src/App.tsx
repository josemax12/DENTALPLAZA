import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import PortalLayout from './layouts/PortalLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Patients from './pages/Patients';
import Logistics from './pages/Logistics';
import Reports from './pages/Reports';
import Doctors from './pages/Doctors';
import Treatments from './pages/Treatments';
import MisCitas from './pages/portal/MisCitas';
import MiHistorial from './pages/portal/MiHistorial';
import SolicitarCita from './pages/portal/SolicitarCita';
import MiPerfil from './pages/portal/MiPerfil';
import PortalDashboard from './pages/portal/PortalDashboard';
import Prescriptions from './pages/Prescriptions';
import MisRecetas from './pages/portal/MisRecetas';
import Payments from './pages/Payments';
import MiCuenta from './pages/portal/MiCuenta';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Panel de administración (staff) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/logistica" element={<Logistics />} />
          <Route path="/tratamientos" element={<Treatments />} />
          <Route path="/reportes" element={<Reports />} />
          <Route path="/doctores" element={<Doctors />} />
          <Route path="/recetas" element={<Prescriptions />} />
          <Route path="/pagos" element={<Payments />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Portal del paciente */}
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<PortalDashboard />} />
          <Route path="/portal/citas" element={<MisCitas />} />
          <Route path="/portal/historial" element={<MiHistorial />} />
          <Route path="/portal/solicitar" element={<SolicitarCita />} />
          <Route path="/portal/perfil" element={<MiPerfil />} />
          <Route path="/portal/recetas" element={<MisRecetas />} />
          <Route path="/portal/cuenta" element={<MiCuenta />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
