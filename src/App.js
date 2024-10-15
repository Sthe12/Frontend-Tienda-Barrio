import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomeAdmin from './components/HomeAdmin';
import HomeEmpleado from './components/HomeEmpleado';
import RegistroUsuario from './components/RegistroUsuario';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/collapse';
import Productos from './components/Productos';
import RecuperarContraseña from './components/RecuperarContraseña';
import HomeSuperAdmin from './components/HomeSuperAdmin';
import Ventas from './components/Ventas';
import HistorialVentas from './components/HistorialVentas';
import Canastos from './components/Canastos';


// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contraseña" element={<RecuperarContraseña/>} />
        {/* Ruta protegida para Home, que contiene rutas anidadas */}
        <Route 
          path="/admin-home" 
          element={
            <ProtectedRoute>
              <HomeAdmin />
            </ProtectedRoute>
          }
        >
          {/* Ruta anidada para la sección de Usuarios */}
          <Route path="usuarios" element={<RegistroUsuario />} />
          <Route path="productos" element={<Productos />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="historial-ventas" element={<HistorialVentas />} />
          <Route path="canastos" element={<Canastos />} />
        </Route>
        <Route 
          path="/empleado-home" 
          element={
            <ProtectedRoute>
              <HomeEmpleado />
            </ProtectedRoute>
          }
        > 
        {/* Ruta anidada para la sección de Usuarios */}
        {/*<Route path="usuarios" element={<RegistroUsuario />} />*/}
        <Route path="productos" element={<Productos />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="historial-ventas" element={<HistorialVentas />} />
        <Route path="canastos" element={<Canastos />} />
        </Route>
        {/* Ruta protegida para Home, que contiene rutas anidadas */}
        <Route 
          path="/superadmin-home" 
          element={
            <ProtectedRoute>
              <HomeSuperAdmin />
            </ProtectedRoute>
          }
        >
          {/* Ruta anidada para la sección de Usuarios */}
          <Route path="usuarios" element={<RegistroUsuario />} />
          <Route path="productos" element={<Productos />} />
          <Route path="ventas" element={<Ventas />} />
        </Route>
        {/* Redirección por defecto a login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
