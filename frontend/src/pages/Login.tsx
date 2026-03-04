import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Lock, Mail, Loader2, CreditCard, LogIn, Shield, Clock, Users, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [tab, setTab] = useState<'staff' | 'paciente'>('staff');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dni, setDni] = useState('');
    const [dniPassword, setDniPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showDniPass, setShowDniPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleStaffLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/login', { email, contrasena: password });
            login(res.data.usuario, res.data.accessToken);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally { setLoading(false); }
    };

    const handlePacienteLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/login-paciente', { dni, contrasena: dniPassword });
            login(res.data.usuario, res.data.accessToken);
            navigate('/portal');
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se encontró un paciente con ese DNI');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-split">
            {/* LEFT PANEL */}
            <div className="login-left">
                <div className="login-left-content">
                    {/* Brand — LOGO */}
                    <div className="login-brand">
                        <img src="/logo.jpg" alt="Dental Plaza" className="login-brand-logo" />
                        <div>
                            <span className="login-brand-name">Dental Plaza</span>
                            <span className="login-brand-sub">Gestión Profesional</span>
                        </div>
                    </div>

                    {/* Welcome */}
                    <h1 className="login-welcome">¡Bienvenido de vuelta!</h1>
                    <p className="login-desc">Accede a tu panel de control para gestionar tus servicios dentales.</p>

                    {/* Tabs */}
                    <div className="login-tabs">
                        <button className={`login-tab ${tab === 'staff' ? 'active' : ''}`}
                            onClick={() => { setTab('staff'); setError(''); }}>Personal</button>
                        <button className={`login-tab ${tab === 'paciente' ? 'active' : ''}`}
                            onClick={() => { setTab('paciente'); setError(''); }}>Paciente</button>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {/* Staff Form */}
                    {tab === 'staff' ? (
                        <form onSubmit={handleStaffLogin} className="login-form">
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <div className="input-field">
                                    <Mail size={18} />
                                    <input type="email" placeholder="ejemplo@dentalplaza.com"
                                        value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <div className="input-field">
                                    <Lock size={18} />
                                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                                        value={password} onChange={e => setPassword(e.target.value)} required />
                                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <label className="remember-row">
                                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                                <span>Recordarme en este equipo</span>
                            </label>
                            <button type="submit" className="btn-login" disabled={loading}>
                                {loading ? <Loader2 className="spinner" size={18} /> : <>INGRESAR <LogIn size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePacienteLogin} className="login-form">
                            <div className="form-group">
                                <label>Número de DNI</label>
                                <div className="input-field">
                                    <CreditCard size={18} />
                                    <input type="text" placeholder="12345678" maxLength={8}
                                        value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, ''))} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <div className="input-field">
                                    <Lock size={18} />
                                    <input type={showDniPass ? 'text' : 'password'} placeholder="••••••••"
                                        value={dniPassword} onChange={e => setDniPassword(e.target.value)} required />
                                    <button type="button" className="eye-btn" onClick={() => setShowDniPass(!showDniPass)}>
                                        {showDniPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <p className="login-hint">La primera vez que ingresas, tu contraseña quedará registrada</p>
                            <button type="submit" className="btn-login" disabled={loading}>
                                {loading ? <Loader2 className="spinner" size={18} /> : <>INGRESAR <LogIn size={18} /></>}
                            </button>
                        </form>
                    )}

                    {/* Features */}
                    <div className="login-features">
                        <div className="login-feature">
                            <Shield size={20} />
                            <span>Seguro</span>
                        </div>
                        <div className="login-feature">
                            <Clock size={20} />
                            <span>Tiempo Real</span>
                        </div>
                        <div className="login-feature">
                            <Users size={20} />
                            <span>Colaborativo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — Doctor Image */}
            <div className="login-right">
                <div className="login-right-overlay">
                    <h2>Odontología Profesional</h2>
                    <p>Gestiona tu clínica con tecnología avanzada y diseño elegante.</p>
                    <a href="#" className="login-right-link">Descubre todas las funcionalidades →</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
