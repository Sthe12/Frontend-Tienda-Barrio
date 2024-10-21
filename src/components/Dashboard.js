import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaDollarSign, FaCalendarAlt, FaShoppingCart } from 'react-icons/fa';  
import { Card, CardContent, CardHeader, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Alert } from '@mui/material';
import './Dashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

function Dashboard() {
        const [dashboardData, setDashboardData] = useState(null);
        const [topProducts, setTopProducts] = useState([]);
        const [dateRange, setDateRange] = useState({ fechaIn: '', fechaFin: '' });
        const [token] = useState(localStorage.getItem('token')); 
        const [role, setRole] = useState(null);  // Estado para el rol del usuario
        const [error, setError] = useState("");
        const [loading, setLoading] = useState(false);
        const [loadingProducts, setLoadingProducts] = useState(false);

    // Obtener el rol del usuario del localStorage
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user')); // Suponiendo que tienes el usuario almacenado en localStorage
        if (user && user.role) {
        setRole(user.role);
        }
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
        const response = await axios.get(`http://localhost:3600/dashboard-ventas`, {
            params: {
            fechaIn: dateRange.fechaIn,
            fechaFin: dateRange.fechaFin
            },
            headers: {
            'Authorization': `Bearer ${token}`
            }
        });
        const data = response.data.dashboardVentas[0];
        if (!data) {
            setError("No se encontraron datos para mostrar.");
        } else {
            setDashboardData(data);
        }
        } catch (error) {
        setError('Error al cargar los datos del dashboard');
        } finally {
        setLoading(false);
        }
    }, [dateRange, token]);

    const fetchTopProducts = useCallback(async () => {
        if (!token || (role !== 'admin' && role !== 'Super-admin')) {
        // Si el rol no es admin o Super-admin, no hacemos la llamada a la API
        return;
        }
        setLoadingProducts(true);
        setError("");
        try {
        const response = await axios.get(`http://localhost:3600/top-ventas`, {
            headers: {
            'Authorization': `Bearer ${token}`
            }
        });
        setTopProducts(response.data.productosTop);
        } catch (error) {
        setError('Error al cargar los productos top');
        } finally {
        setLoadingProducts(false);
        }
    }, [token, role]);

    useEffect(() => {
        if (token) {
        fetchDashboardData();
        fetchTopProducts();
        }
    }, [token, fetchDashboardData, fetchTopProducts]);

    // Si los datos están en proceso de carga
    if (loading) {
        return (
        <div className="text-center">
            <div className="loader"></div>
            <Typography variant="body1" className="loading-text">Cargando datos...</Typography>
        </div>
        );
    }

    // Si no hay datos y no hubo error
    if (!dashboardData && !error) return <div>No se encontraron datos para mostrar.</div>;

    // Verificación de que los datos existen antes de usarlos
    const totalDeTodasLasVentas = dashboardData?.totalDeTodasLasVentas || 0;
    const ventasPorDia = dashboardData?.ventasPorDia || [];

    return (
        <div className="dashboard-container">
        <Typography variant="h4" component="h1" gutterBottom>Panel de Ventas</Typography>

        {error && <Alert severity="error">{error}</Alert>}
        <Button color="primary" onClick={fetchDashboardData}>Actualizar Ventas</Button>
        
        <Grid container spacing={3}>
            {/* Tarjetas de Totales */}
            <Grid item xs={12} md={4}>
            <Card className="dashboard-card green-card">
                <CardHeader title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaCalendarAlt className="icon-style" />
                    <Typography variant="h6">Rango de Fechas</Typography>
                </div>
                } />
                <CardContent>
                <input
                    type="date"
                    value={dateRange.fechaIn}
                    onChange={(e) => setDateRange({ ...dateRange, fechaIn: e.target.value })}
                    className="date-input"
                />
                <input
                    type="date"
                    value={dateRange.fechaFin}
                    onChange={(e) => setDateRange({ ...dateRange, fechaFin: e.target.value })}
                    className="date-input"
                />
                
                </CardContent>
            </Card>
            </Grid>

            <Grid item xs={12} md={4}>
            <Card className="dashboard-card blue-card">
                <CardHeader title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaDollarSign className="icon-style" />
                    <Typography variant="h6">Ventas Totales</Typography>
                </div>
                } />
                <CardContent>
                <Typography variant="h3" color="textPrimary">
                    ${totalDeTodasLasVentas.toFixed(2)}
                </Typography>
                </CardContent>
            </Card>
            </Grid>

            <Grid item xs={12} md={4}>
            <Card className="dashboard-card yellow-card">
                <CardHeader title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaShoppingCart className="icon-style" />
                    <Typography variant="h6">Número de Ventas</Typography>
                </div>
                } />
                <CardContent>
                <Typography variant="h3" color="textPrimary">
                    {ventasPorDia.length}
                </Typography>
                </CardContent>
            </Card>
            </Grid>
        </Grid>

        <br />

        {/* Gráfico de Barras para Ventas Diarias */}
        <Card className="dashboard-card mb-4">
            <CardHeader title="Ventas Diarias" />
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Bar dataKey="totalVentas" fill="#8884d8" name="Ventas Totales" />
                <Bar dataKey="numeroVentas" fill="#82ca9d" name="Número de Ventas" />
                </BarChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Mostrar productos top solo si el rol es admin o Super-admin */}
        {(loadingProducts && (role === 'admin' || role === 'Super-admin')) ? (
        <div className="text-center">
            <div className="loader"></div>
            <Typography variant="body1" className="loading-text">Cargando productos top...</Typography>
        </div>
        ) : (
        (role === 'admin' || role === 'Super-admin') && (
            <Card className="dashboard-card mb-4">
            <CardHeader title="Top 5 Productos" />
            <CardContent>
                <Grid container spacing={2}>
                {/* Gráfico de Pastel */}
                <Grid item xs={12} md={6}>
                    <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                        data={topProducts}
                        dataKey="total"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                        >
                        {topProducts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                    </ResponsiveContainer>
                </Grid>

                {/* Tabla de Productos */}
                <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} className="table-container">
                    <Table>
                        <TableHead>
                        <TableRow>
                            <TableCell>Nombre del Producto</TableCell>
                            <TableCell>Cantidad Vendida</TableCell>
                            <TableCell>Ventas Totales</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {topProducts.map((product) => (
                            <TableRow key={product._id}>
                            <TableCell>{product.nombre}</TableCell>
                            <TableCell>{product.cantidad}</TableCell>
                            <TableCell>${product.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </TableContainer>
                </Grid>
                </Grid>
            </CardContent>
            </Card>
        )
        )}

        </div>
    );
}

export default Dashboard;

