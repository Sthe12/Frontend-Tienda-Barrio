import axios from 'axios';

// Configuración de interceptores
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

axios.interceptors.response.use(response => response, error => {
    // Manejar errores globales aquí
    if (error.response && error.response.status === 401) {
        // Aquí puedes manejar casos de autorización
        console.error('No autorizado', error.response.data);
    } else if (error.response && error.response.status >= 500) {
        // Manejar errores del servidor
        console.error('Error del servidor', error.response.data);
    }
    return Promise.reject(error);
});

export default axios;
