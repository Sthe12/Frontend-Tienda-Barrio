import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function RecuperarContraseña() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const response = await axios.post('http://localhost:3600/forgot-password', { email });
            if (response.data.verified) {
                setMessage('Correo electrónico verificado. Ingrese la nueva contraseña');
                setEmailVerified(true);
            } else {
                setMessage('Correo electrónico no encontrado. Verifique e intente nuevamente.');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error al verificar el correo electrónico. Por favor, intente más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        if (newPassword !== confirmPassword) {
            setMessage('Las contraseñas no coinciden.Inténtelo de nuevo.');
            return;
        }
        if (newPassword.length < 6) {
            setMessage('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:3600/forgot-password', { 
                email, 
                newPassword, 
                confirmPassword 
            });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error al restablecer la contraseña. Por favor, intente más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#d0e7eb' }}>
            <div className="p-5 rounded" style={{
                backgroundColor: 'rgba(32, 132, 147, 0.25)',
                boxShadow: 'inset 0px 0px 10px 2px rgba(0, 0, 0, 0.1)',
                maxWidth: '800px',  // Aumenta el tamaño máximo del contenedor
                width: '200%',
                
            }}>
                <h1 className="text-center mb-4">Recuperar Contraseña</h1>
                <hr className='text-secondary d-none d-sm-block mt-5'></hr>
                {/* Mensaje de retroalimentación */}
                {message && (
                    <div className={`alert ${message.includes('Error') || message.includes('no') ? 'alert-danger' : 'alert-info'} text-center`} style={{ fontSize: '25px' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={emailVerified ? handleResetPassword : handleVerifyEmail}>
                    {/* Mostrar siempre el campo de correo, deshabilitado si ya fue verificado */}
                    <div className="mb-4">
                        <label htmlFor="email" className="form-label fs-4">Correo Electrónico</label>
                        <input
                            type="email"
                            className="form-control form-control-lg mt-4" // Tamaño grande para el input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={emailVerified}
                        />
                    </div>

                    {emailVerified && (
                        <>
                            <div className="mb-4">
                                <label htmlFor="newPassword" className="form-label fs-4">Nueva Contraseña</label>
                                <div className="input-group input-group-lg"> {/* Tamaño grande para el grupo de input */}
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        className="form-control"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button className="btn btn-secondary" type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                                        <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className="form-label fs-4">Confirmar Contraseña</label>
                                <div className="input-group input-group-lg"> {/* Tamaño grande para el grupo de input */}
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-control"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button className="btn btn-secondary" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="d-grid">
                        <button type="submit" className="btn btn-primary btn-lg mt-3 fs-4" disabled={isLoading}>
                            {isLoading ? 'Procesando...' : (emailVerified ? 'Guardar Contraseña' : 'Verificar Correo')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RecuperarContraseña;
