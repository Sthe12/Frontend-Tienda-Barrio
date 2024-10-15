import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // Estado para el mensaje de éxito

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage(''); // Resetea el mensaje de éxito al enviar el formulario

        try {
            const response = await axios.post('http://localhost:3600/login', {
                email,
                password
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Establece el mensaje de éxito
                setSuccessMessage('Inicio de Sesión Exitosa');

                // Redirección basada en el rol del usuario
                setTimeout(() => {
                    if (response.data.user.role === 'admin') {
                        navigate('/admin-home');
                    } else if (response.data.user.role === 'empleado') {
                        navigate('/empleado-home');
                    } else if (response.data.user.role === 'Super-admin'){
                         navigate('/superadmin-home');
                    }else {
                        // Si el rol no está definido o es diferente, redirige a una página por defecto
                        navigate('/home');
                    }
                }, 1000);
            }
        } catch (error) {
            if (error.response) {
                setError(error.response.data.message || 'Error en el inicio de sesión');
            } else if (error.request) {
                setError('No se pudo conectar con el servidor');
            } else {
                setError('Error al procesar la solicitud');
            }
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#d0e7eb' }}>
            <div className="row shadow-lg" style={{ maxWidth: '1075px', width: '100%', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden' }}>
                <div className="col-md-6 d-none d-md-block p-0" style={{ minHeight: '300px' }}>
                    <img src="./imagenes/login.jpg" alt="Store" className="img-fluid h-100 w-100" style={{ objectFit: 'cover', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }} />
                </div>
                <div className="col-md-6 p-4 d-flex flex-column justify-content-center">
                    <h2 className="text-center mb-4 fw-bold">BIENVENIDO</h2>
                    {successMessage && <div className="alert alert-success">{successMessage}</div>} {/* Mensaje de éxito */}
                    {error && <div className="alert alert-danger">{error}</div>} {/* Mensaje de error */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <img src="./imagenes/usuario.png" alt="Usuario" style={{ width: '30px' }} />
                                </span>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Correo"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group mb-3 position-relative">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <img src="./imagenes/contraseña.png" alt="Contraseña" style={{ width: '30px' }} />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                    className="toggle-password-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#6c757d'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end mb-4">
                            <p className="fs-5 mb-0">¿Olvidaste tu contraseña? <a href="/recuperar-contraseña" className="text-muted text-danger">Recuperar</a></p>
                        </div>
                        <div className="d-grid gap-2 ">
                            <button type="submit" className="btn btn-primary fw-bold fs-5" style={{ backgroundColor: 'rgba(32, 170, 177, 1)', padding: '15px' }}>Ingresar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
