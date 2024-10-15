import React, { useState } from 'react';
import './Home.css';
import { useNavigate, Link } from 'react-router-dom';
import RegistroUsuario from './RegistroUsuario';
import Productos from './Productos';
import Ventas from './Ventas';
import HistorialVentas from './HistorialVentas';
import Canastos from './Canastos';
import axios from 'axios';

function HomeAdmin() {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null); // Estado para controlar qué menú está abierto
    const [selectedComponent, setSelectedComponent] = useState(null); // Estado para controlar el componente seleccionado
    const [successMessage, setSuccessMessage] = useState(''); // Estado para el mensaje de éxito
    const [error, setError] = useState('');
    // Alterna entre abierto y cerrado
    const toggleDropdown = (menuId) => {
        setOpenMenu(openMenu === menuId ? null : menuId); 
    };
    // Actualiza el componente seleccionado
    const handleSelectComponent = (component) => {
        setSelectedComponent(component); 
    };
    //Genera el cierre de sesion del usuario
    const handleLogout = async () => {
        setSuccessMessage(''); // Resetea el mensaje de éxito al enviar el formulario
        setError('');
        try {
            // Obtiene el token almacenado del usuario al inicar sesion
            const token = localStorage.getItem('token');
    
            if (!token) {
                alert('No hay un token disponible para cerrar sesión.');
                return;
            }
            // Realizar la solicitud al backend para cerrar sesión
            const response = await axios.get('http://localhost:3600/logout', {
                headers: {
                    'Authorization': `Bearer ${token}` // Enviar el token JWT
                }
            });
            if (response.status === 200) {
                // Elimina el token y el usuario del almacenamiento local
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Establece el mensaje de éxito
                setSuccessMessage('Cierre de Sesión Exitosa');
                // Se redirige a la pagina de login
                // Navega después de un breve retraso para que se vea el mensaje
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            } else {
                console.error('Error al cerrar sesión:', response.status);
                alert('Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error de red al intentar cerrar sesión');
        }
    };
    
    return (
        <div className='container-fluid' style={{ backgroundColor: '#d0e7eb' }}>
            <div className='row'>
                {/* Sidebar */}
                <div className='bg-dark col-auto col-md-2 min-vh-100 d-flex justify-content-between flex-column'>
                    <div className='mt-5'>
                        <a className='text-decoration-none text-white d-none d-sm-inline d-flex align-items-center ms-4 mt-5' role='button'>
                            <span className='fs-4 d-none d-sm-inline'>
                                <i className='bi bi-shop'></i><span className='ms-3'>Víveres Ronaldo</span>
                            </span>
                        </a>
                        <hr className='text-secondary d-none d-sm-block mt-5'></hr>
                        <ul className="nav nav-pills flex-column mt-3 mt-sm-0" id='parentM'>
                            <li className="nav-item text-white fs-4 my-1 py-2 py-sm-0">
                                <a className="nav-link text-white fs-5 text-center text-sm-start" aria-current='page'>
                                    <i className='bi bi-speedometer2'></i>
                                    <span className='ms-3 d-none d-sm-inline'>Dashboard</span>
                                </a>
                            </li>
                            <hr className='text-secondary d-none d-sm-block'></hr>
                            <li className="nav-item text-white fs-4 my-1 py-2 py-sm-0">
                                <a
                                    href="#submenu1"
                                    className="nav-link text-white fs-5 text-center text-sm-start"
                                    data-bs-toggle='collapse'
                                    aria-current='page'
                                    onClick={() => toggleDropdown('submenu1')}
                                >
                                    <i className='bi bi-gear-fill'></i>
                                    <span className='ms-3 d-none d-sm-inline'>Administrar</span>
                                    <i className={`bi ${openMenu === 'submenu1' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'} ms-6`}></i>
                                </a>
                                <ul
                                    className={`nav collapse ms-4 flex-column ${openMenu === 'submenu1' ? 'show' : ''}`}
                                    id='submenu1'
                                    style={{ transition: 'height 0s ease' }}
                                    data-bs-parent="#parentM"
                                >
                                    <br></br>
                                    <li className="nav-item">
                                        <Link
                                            className="nav-link text-white fs-5"
                                            to="/admin-home/usuarios"
                                            onClick={() => handleSelectComponent('Usuarios')}
                                        >
                                            <span className='d-none d-sm-inline bi bi-people-fill'></span>
                                            <span className='ms-3'>Usuarios</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                            <hr className='text-secondary d-none d-sm-block'></hr>
                            <li className="nav-item text-white fs-4 my-1 py-2 py-sm-0">
                                <a
                                    href="#submenu2"
                                    className="nav-link text-white fs-5 text-center text-sm-start"
                                    data-bs-toggle='collapse'
                                    aria-current='page'
                                    onClick={() => toggleDropdown('submenu2')}
                                >
                                    <i className='bi bi-archive'></i>
                                    <span className='ms-3 d-none d-sm-inline'>Inventario</span>
                                    <i className={`bi ${openMenu === 'submenu2' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'} ms-7`}></i>
                                </a>
                                <ul
                                    className={`nav ms-4 flex-column collapse ${openMenu === 'submenu2' ? 'show' : ''}`}
                                    id='submenu2'
                                    style={{ transition: 'height 0s ease' }}
                                    data-bs-parent="#parentM"
                                >
                                    <br></br>
                                    <li className="nav-item">
                                        <Link
                                            className="nav-link text-white fs-5"
                                            to="/admin-home/productos"
                                            onClick={() => handleSelectComponent('Productos')}
                                        >
                                            <span className='d-none d-sm-inline bi bi-box-seam-fill'></span>
                                            <span className='ms-3'>Productos</span>
                                        </Link>
                                    </li>
                                    <br></br>
                                    <li className="nav-item">
                                    <Link 
                                            className="nav-link text-white fs-5" 
                                            to = "/admin-home/canastos"
                                            onClick={() => handleSelectComponent('Canastos')}
                                            >
                                            <span className='d-none d-sm-inline bi bi-bar-chart-line-fill'></span>
                                            <span className='ms-3'>Estadisticas</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                            <hr className='text-secondary d-none d-sm-block'></hr>
                            <li className="nav-item text-white fs-4 my-1 py-2 py-sm-0">
                                <a
                                    href="#submenu3"
                                    className="nav-link text-white fs-5 text-center text-sm-start"
                                    data-bs-toggle='collapse'
                                    aria-current='page'
                                    onClick={() => toggleDropdown('submenu3')}
                                >
                                    <i className='bi bi-cash-coin'></i>
                                    <span className='ms-3 d-none d-sm-inline'>Ventas</span>
                                    <i className={`bi ${openMenu === 'submenu3' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'} ms-8`}></i>
                                </a>
                                <ul
                                    className={`nav collapse ms-4 flex-column ${openMenu === 'submenu3' ? 'show' : ''}`}
                                    id='submenu3'
                                    style={{ transition: 'height 0s ease' }}
                                    data-bs-parent="#parentM"
                                >
                                    <br></br>
                                    <li className="nav-item">
                                        <Link 
                                            className="nav-link text-white fs-5"
                                            to="/admin-home/ventas"
                                            onClick={() => handleSelectComponent('Ventas')}
                                            >
                                            <span className='d-none d-sm-inline bi bi-cart4'></span>
                                            <span className='ms-3'>Nueva Venta</span>
                                        </Link>
                                    </li>
                                    <br></br>
                                    <li className="nav-item">
                                        <Link className="nav-link text-white fs-5" 
                                        to="/admin-home/historial-ventas"
                                        onClick={() => handleSelectComponent('HistorialVentas')}
                                        >
                                            <span className='d-none d-sm-inline bi bi-clipboard-check-fill'></span>
                                            <span className='ms-3'>Historial de Ventas</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                            {/*<hr className='text-secondary d-none d-sm-block'></hr>
                            <li className="nav-item text-white fs-4 my-1 py-2 py-sm-0">
                                <a
                                    href="#submenu4"
                                    className="nav-link text-white fs-5 text-center text-sm-start"
                                    data-bs-toggle='collapse'
                                    aria-current='page'
                                    onClick={() => toggleDropdown('submenu4')}
                                >
                                    <i className='bi bi-graph-up-arrow'></i>
                                    <span className='ms-3 d-none d-sm-inline'>Reportes</span>
                                    <i className={`bi ${openMenu === 'submenu4' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'} ms-9`}></i>
                                </a>
                                <ul
                                    className={`nav collapse ms-4 flex-column ${openMenu === 'submenu4' ? 'show' : ''}`}
                                    id='submenu4'
                                    style={{ transition: 'height 0s ease' }}
                                    data-bs-parent="#parentM"
                                >
                                    <br></br>
                                    <li className="nav-item">
                                        <a className="nav-link text-white fs-5" aria-current="page">
                                            <span className='d-none d-sm-inline bi bi-file-earmark-bar-graph'></span>
                                            <span className='ms-3'>Reportes de Ventas</span>
                                        </a>
                                    </li>
                                </ul>
                            </li>*/}
                            <hr className='text-secondary d-none d-sm-block'></hr>
                        </ul>
                    </div>
                    <div className="dropdown open mt-5">
                        <a
                            className="text-decoration-none text-white ms-3 fs-4 my-1 py-2 py-sm-0"
                            type="button"
                            id="triggerId"
                            data-bs-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <i className='bi bi-person-circle'></i>
                            <span className='ms-2 d-none d-sm-inline'>ADMINISTRADOR</span>
                        </a>
                        
                        <div className="dropdown-menu" aria-labelledby="triggerId" >
                            <button className="dropdown-item" onClick= {handleLogout}  >
                                <span className='d-sm-inline bi bi-box-arrow-in-right'></span>
                                <span className='ms-3'>Cerrar Sesión</span>
                            </button>
                        </div>
                       
                    </div>
                </div>
                {/* Contenido Principal */}
                <div className='col'>
                {/* Contenedor para los mensajes de éxito y error */}
                <div className="position-fixed top-0 start-50 translate-middle-x p-3" style={{ zIndex: 1050 }}>
                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}
                </div>

                {selectedComponent === 'Usuarios' && <RegistroUsuario/>}
                {selectedComponent === 'Productos' && <Productos/>}
                {selectedComponent === 'Ventas' && <Ventas/>}
                {selectedComponent === 'HistorialVentas' && <HistorialVentas/>}
                {selectedComponent === 'Canastos' && <Canastos/>}
                {/* Renderiza otros componentes según sea necesario */}
            </div>
            </div>
        </div>
    );
}

export default HomeAdmin;
