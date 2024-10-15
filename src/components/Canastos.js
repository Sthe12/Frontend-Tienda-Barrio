import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Col, Row, Button, Spinner, Alert } from "reactstrap";
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Package, PieChart, DollarSign, Percent } from 'react-feather';

function Canastos() {
    const [canastas, setCanastas] = useState([]);
    const [token] = useState(localStorage.getItem('token'));
    const [pendiente, setPendiente] = useState(false);
    const [error, setError] = useState("");

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

    useEffect(() => {
        if (token) {
            obtenerCanastas();
        }
    }, [token, obtenerCanastas]);

    const columns = [
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
            selector: row => `$${row.ventaTotales.toFixed(2)}`,
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
                            <PieChart size={16} className="mr-2" /> Actualizar Datos
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
                        columns={columns}
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
            </CardBody>
        </Card>
    );
}

export default Canastos;