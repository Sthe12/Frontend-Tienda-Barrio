import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Col, Row, Button, Spinner, Alert } from "reactstrap";
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Package, PieChart, DollarSign } from 'react-feather';

function Canastos() {
    const [canastas, setCanastas] = useState([]);
    const [productos, setProductos] = useState([]);  // Estado para los mejores productos
    const [token] = useState(localStorage.getItem('token'));
    const [pendiente, setPendiente] = useState(false);
    const [pendienteProductos, setPendienteProductos] = useState(false);  // Estado de carga para productos
    const [error, setError] = useState("");
    const [errorProductos, setErrorProductos] = useState("");  // Error para productos

    const obtenerCanastas = useCallback(async () => {
        if (!token) return;
        setPendiente(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:3600/canastos", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCanastas(response.data.porcentajes);
        } catch (error) {
            setError("No se pudieron cargar los datos de canastas. Inténtalo nuevamente más tarde.");
        } finally {
            setPendiente(false);
        }
    }, [token]);

    const obtenerMejoresProductos = useCallback(async () => {
        if (!token) return;
        setPendienteProductos(true);
        setErrorProductos("");
        try {
            const response = await axios.get("http://localhost:3600/mejores-productos", {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Datos recibidos:", response.data.productos);  // Verifica que los datos lleguen correctamente
            setProductos(response.data.productos);
        } catch (error) {
            setErrorProductos("No se pudieron cargar los datos de los mejores productos. Inténtalo nuevamente más tarde.");
        } finally {
            setPendienteProductos(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            obtenerCanastas();
            obtenerMejoresProductos();  // Llamada para obtener mejores productos
        }
    }, [token, obtenerCanastas, obtenerMejoresProductos]);

    const columnsCanastas = [
        {
            name: 'Categoría',
            selector: row => row._id,
            sortable: true,
        },
        {
            name: 'Cantidad Vendida',
            selector: row => row.cantidaVendida,
            sortable: true,
        },
        {
            name: 'Ventas Totales',
            selector: row => `$${row.ventaTotales?.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Porcentaje de Ventas',
            selector: row => `${row.porcentajeVentas}%`,
            sortable: true,
        },
    ];

    const columnsProductos = [
        {
            name: 'Producto',
            selector: row => row.nombre,
            sortable: true,
        },
        {
            name: 'Categoría',
            selector: row => row.categoria,
            sortable: true,
        },
        {
            name: 'Cantidad Vendida',
            selector: row => row.cantidadVendida,
            sortable: true,
        },
        {
            name: 'Ventas Totales',
            selector: row => `$${row.totalVentas?.toFixed(2)}`,  
            sortable: true,
        },
        {
            name: 'Porcentaje de Ventas',
            selector: row => `${row.porcentajeVentas}%`,
            sortable: true,
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: 800,
            },
        },
        headRow: {
            style: {
                backgroundColor: "#eee",
            }
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader className="bg-primary text-white">
                <h3><PieChart className="mr-2" /> Análisis de Canastas</h3>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col sm="6">
                        <Button color="info" onClick={obtenerCanastas}>
                            <PieChart size={16} className="mr-2" /> Actualizar Canastas
                        </Button>
                    </Col>
                </Row>
                {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                <hr />
                <h4><Package className="mr-2" /> Estadísticas por Categoría</h4>
                {pendiente ? (
                    <div className="text-center mt-4">
                        <Spinner color="primary" />
                        <p className="mt-2">Cargando...</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columnsCanastas}
                        data={canastas}
                        pagination
                        highlightOnHover
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="text-center p-4">
                                <PieChart size={48} className="mb-3 text-muted" />
                                <p>No hay datos de canastas disponibles</p>
                            </div>
                        }
                    />
                )}

                <hr />
                <Row>
                    <Col sm="6">
                        <Button color="info" onClick={obtenerMejoresProductos} className="ml-2">
                            <Package size={16} className="mr-2" /> Actualizar Productos
                        </Button>
                    </Col>
                </Row>
                <br />
                <h4><DollarSign className="mr-2" /> Mejores Productos Vendidos</h4>
                {errorProductos && <Alert color="danger" className="mt-3">{errorProductos}</Alert>}
                {pendienteProductos ? (
                    <div className="text-center mt-4">
                        <Spinner color="primary" />
                        <p className="mt-2">Cargando productos...</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columnsProductos}
                        data={productos}
                        pagination
                        highlightOnHover
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="text-center p-4">
                                <Package size={48} className="mb-3 text-muted" />
                                <p>No hay datos de productos disponibles</p>
                            </div>
                        }
                    />
                )}
            </CardBody>
        </Card>
    );
}

export default Canastos;
