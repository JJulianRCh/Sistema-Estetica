'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Cuenta() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('register');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        if (mounted && typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        if (data.user.rol === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/cliente/dashboard');
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!registerData.nombre || !registerData.email || !registerData.password) {
      setError('Nombre, email y contraseña son obligatorios');
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: registerData.nombre,
          apellido: registerData.apellido,
          email: registerData.email,
          telefono: registerData.telefono,
          password: registerData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión para continuar con tu proceso de cita.');
        setActiveTab('login');
        setRegisterData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="cuenta-container">
      <header className="header">
        <h1>✨ Alice Fashion ✨</h1>
        <nav>
          <Link href="/">Inicio</Link>
          <Link href="/cuenta" className="active">Agendar Cita</Link>
        </nav>
      </header>

      <div className="cuenta-card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {setActiveTab('register'); setError(''); setSuccess('');}}
            disabled={loading}
          >
            Agendar Nueva Cita
          </button>
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {setActiveTab('login'); setError(''); setSuccess('');}}
            disabled={loading}
          >
            Ya tengo cuenta
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {activeTab === 'register' && (
          <div className="form-container">
            <h2>Registro para Cita</h2>
            <p className="subtitle">Completa tus datos para agendar tu cita en nuestra estética</p>
            
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={registerData.nombre}
                    onChange={handleRegisterChange}
                    disabled={loading}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={registerData.apellido}
                    onChange={handleRegisterChange}
                    disabled={loading}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={registerData.telefono}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  placeholder="55 1234 5678"
                />
              </div>

              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirmar Contraseña *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  placeholder="Confirma tu contraseña"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarme para Cita'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'login' && (
          <div className="form-container">
            <h2>Acceder a mi cuenta</h2>
            <p className="subtitle">Inicia sesión para ver el estado de tu cita</p>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  disabled={loading}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  disabled={loading}
                  placeholder="Tu contraseña"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Iniciando...' : 'Acceder a mi Panel'}
              </button>
            </form>
          </div>
        )}

        <div style={{
          background: '#ffeef2',
          padding: '20px',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#6c4a5c'
        }}>
          Una vez registrado, podrás ver tu panel personal y recibir instrucciones para coordinar tu cita presencial.
        </div>
      </div>
    </div>
  );
}