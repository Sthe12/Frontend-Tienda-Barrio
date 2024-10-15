import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Button, Spinner, Alert, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Table } from "reactstrap";
import DataTable from 'react-data-table-component';
import { Edit, Trash2, DollarSign, Calendar, User, ShoppingBag, Eye, Plus, X } from 'react-feather';
import axios from 'axios';
import Swal from 'sweetalert2';

const modeloVenta = {
    _id: '',
    fecha: new Date(),
    usuario: { _id: '', nombre: '', apellido: '' },
    total: 0,
    productos: []
};

function HistorialVentas() {
    const [ventas, setVentas] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(modeloVenta);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [token] = useState(localStorage.getItem('token'));
    const [modalVenta, setModalVenta] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [nuevoProducto, setNuevoProducto] = useState({ codigoBarra: '', cantidad: 1 });

    // Verificar permisos del usuario
    const verificarPermisos = useCallback(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && ['Super-admin', 'admin', 'empleado'].includes(user.role)) {
            setUserRole(user.role);
            setUserId(user._id);
            return true;
        }
        Swal.fire('Acceso Denegado', 'No tienes permisos para ver esta información.', 'error');
        return false;
    }, []);

    // Obtener ventas desde la API
    const obtenerVentas = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:3600/get-ventas", {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log("Respuesta del servidor (admin):", response.data); // Verificar la estructura
            
            if (response.data && Array.isArray(response.data.ventas)) {
                if (userRole === 'admin') {
                    const ventasAgrupadas = response.data.ventas.map(usuario => ({
                        usuario: { 
                            _id: usuario._id || '', 
                            nombre: usuario.nombre || 'Usuario', 
                            apellido: usuario.apellido || 'Desconocido' 
                        },
                        ventas: Array.isArray(usuario.ventas) ? usuario.ventas.map(venta => ({
                            _id: venta._id || '', 
                            productos: Array.isArray(venta.productos) ? venta.productos.map(prod => ({
                                producto: {
                                    _id: prod.producto?._id || prod._id,
                                    nombre: prod.producto?.nombre || prod.nombre,
                                    precio: prod.producto?.precio || prod.precio,
                                    categoria: prod.producto?.categoria || prod.categoria,
                                    codigoBarra: prod.producto?.codigoBarra || prod.codigoBarra
                                },
                                cantidad: prod.cantidad
                            })) : [],
                            total: venta.total,
                            fecha: venta.fecha,
                            usuario: {
                                _id: usuario._id || '',
                                nombre: usuario.nombre || 'Usuario',
                                apellido: usuario.apellido || 'Desconocido'
                            }
                        })) : [],
                        totalVentas: usuario.totalVentas || 0
                    }));
                    
                    setVentas(ventasAgrupadas);
                } else {
                    const ventasEmpleado = [{
                        usuario: { _id: userId, nombre: 'Mis', apellido: 'Ventas' },
                        ventas: response.data.ventas.map(venta => ({
                            _id: venta._id || '', 
                            productos: Array.isArray(venta.productos) ? venta.productos.map(prod => ({
                                producto: {
                                    _id: prod.producto?._id || prod._id,
                                    nombre: prod.producto?.nombre || prod.nombre,
                                    precio: prod.producto?.precio || prod.precio,
                                    categoria: prod.producto?.categoria || prod.categoria,
                                    codigoBarra: prod.producto?.codigoBarra || prod.codigoBarra
                                },
                                cantidad: prod.cantidad
                            })) : [],
                            total: venta.total,
                            fecha: venta.fecha,
                            usuario: { _id: userId, nombre: 'Mis', apellido: 'Ventas' }
                        }))
                    }];
                    
                    setVentas(ventasEmpleado);
                }
            } else {
                setError("No se encontraron ventas");
            }
        } catch (error) {
            setError("No se pudieron cargar las ventas. " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    }, [token, userRole, userId]);
    
    

    useEffect(() => {
        verificarPermisos();
    }, [verificarPermisos]);

    useEffect(() => {
        if (token) {
            obtenerVentas();
        }
    }, [token, obtenerVentas]);

    const abrirModal = useCallback(async (venta, edicion = false) => {
        console.log("Venta recibida en abrirModal:", venta);
        const ventaCopy = JSON.parse(JSON.stringify(venta));
    
        // Verificar y completar detalles de los productos si es necesario
        const productosConDetalle = await Promise.all(ventaCopy.productos.map(async (prod) => {
            if (prod.producto && prod.producto.nombre && prod.producto.precio) {
                return prod; // El producto ya tiene todos los detalles necesarios
            }
    
            const codigoIdentificador = prod.producto?.codigoBarra || prod.codigoBarra;
            
            if (!codigoIdentificador) {
                console.error('Producto sin identificador válido, no se puede obtener detalles.');
                return prod;
            }
    
            try {
                const response = await axios.get(`http://localhost:3600/get-product-barra/${codigoIdentificador}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.data && response.data.product) {
                    console.log(`Detalles del producto encontrados para el código: ${codigoIdentificador}`);
                    return { 
                        producto: response.data.product,
                        cantidad: prod.cantidad
                    };
                } else {
                    console.warn(`No se encontraron detalles del producto para el código: ${codigoIdentificador}`);
                    return prod;
                }
            } catch (error) {
                console.error(`Error al obtener detalles del producto con código ${codigoIdentificador}:`, error);
                return prod;
            }
        }));
    
        ventaCopy.productos = productosConDetalle;
        console.log("Venta procesada en abrirModal:", ventaCopy);
        setVentaSeleccionada(ventaCopy);
    
        const puedeEditar = edicion && (
            (userRole === 'Super-admin') || 
            (userRole === 'admin' && venta.usuario && venta.usuario._id === userId) || 
            (userRole === 'empleado' && venta.usuario && venta.usuario._id === userId)
        );
    
        setModoEdicion(puedeEditar);
        setModalVenta(true);
    }, [token, userRole, userId]);

    // Función para cerrar el modal
    const cerrarModal = () => {
        setVentaSeleccionada(modeloVenta);
        setModoEdicion(false);
        setModalVenta(false);
        setError("");
    };

    // Manejar cambios en la cantidad de un producto
    const handleChange = (e, productoIndex) => {
        const { value } = e.target;
        setVentaSeleccionada(prevState => {
            const nuevosProductos = [...prevState.productos];
            nuevosProductos[productoIndex].cantidad = parseInt(value, 10);
            const nuevoTotal = nuevosProductos.reduce((acc, prod) => acc + (prod.cantidad * prod.producto.precio), 0);
            return { ...prevState, productos: nuevosProductos, total: nuevoTotal };
        });
    };

    // Manejar eliminación de un producto de la venta
    const handleRemoveProduct = (index) => {
        setVentaSeleccionada(prevState => {
            const nuevosProductos = prevState.productos.filter((_, i) => i !== index);
            const nuevoTotal = nuevosProductos.reduce((acc, prod) => acc + (prod.cantidad * prod.producto.precio), 0);
            return { ...prevState, productos: nuevosProductos, total: nuevoTotal };
        });
    };

    // Manejar adición de un nuevo producto a la venta
    const handleAddProduct = async () => {
        if (!nuevoProducto.codigoBarra.trim()) {
            setError("El código de barras no puede estar vacío.");
            return;
        }
        try {
            const response = await axios.get(`http://localhost:3600/get-product-barra/${nuevoProducto.codigoBarra}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.product) {
                const product = response.data.product;
                setVentaSeleccionada(prevState => {
                    const productoExistente = prevState.productos.find(p => p.producto.codigoBarra === product.codigoBarra);
                    let nuevosProductos;
                    if (productoExistente) {
                        nuevosProductos = prevState.productos.map(p => 
                            p.producto.codigoBarra === product.codigoBarra 
                                ? { ...p, cantidad: p.cantidad + parseInt(nuevoProducto.cantidad, 10) }
                                : p
                        );
                    } else {
                        nuevosProductos = [...prevState.productos, { producto: product, cantidad: parseInt(nuevoProducto.cantidad, 10) }];
                    }
                    const nuevoTotal = nuevosProductos.reduce((acc, prod) => acc + (prod.cantidad * prod.producto.precio), 0);
                    return { ...prevState, productos: nuevosProductos, total: nuevoTotal };
                });
                setNuevoProducto({ codigoBarra: '', cantidad: 1 });
                setError(""); // Limpiar errores después de una adición exitosa
            } else {
                setError("Producto no encontrado");
            }
        } catch (error) {
            setError("Error al buscar el producto: " + (error.response?.data?.message || error.message));
        }
    };

    // Manejar eliminación de una venta
    const handleEliminar = async (ventaId) => {
        if (!['Super-admin', 'admin'].includes(userRole)) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para realizar esta acción.', 'error');
            return;
        }

        try {
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "Desea eliminar la venta seleccionada",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'No, cancelar'
            });

            if (result.isConfirmed) {
                const response = await axios.delete(`http://localhost:3600/delete-venta/${ventaId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.status === 200) {
                    Swal.fire('Éxito', 'Venta eliminada correctamente', 'success');
                    obtenerVentas(); // Actualizar la lista de ventas
                    cerrarModal(); // Cerrar el modal si está abierto
                } else {
                    setError(response.data.message || 'No se pudo eliminar la venta');
                }
            }
        } catch (error) {
            console.error('Error al eliminar venta:', error);
            setError('No se pudo eliminar la venta: ' + (error.response?.data?.message || error.message));
        }
    };

    // Manejar actualización de una venta
    const handleActualizar = async () => {
        if (!['Super-admin', 'admin', 'empleado'].includes(userRole)) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para realizar esta acción.', 'error');
            return;
        }

        if (!ventaSeleccionada || !ventaSeleccionada._id) {
            setError("No se ha seleccionado ninguna venta válida para actualizar.");
            return;
        }
        
        const ventaId = ventaSeleccionada._id;

        try {
            const productosActualizados = ventaSeleccionada.productos.map(prod => ({
                codigoBarra: prod.producto.codigoBarra,
                nombre: prod.producto.nombre,
                categoria: prod.producto.categoria,
                precio: prod.producto.precio,
                cantidad: prod.cantidad
            }));

            const updateResponse = await axios.put(`http://localhost:3600/update-venta/${ventaId}`, {
                productos: productosActualizados
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (updateResponse.status === 200) {
                Swal.fire('Éxito', 'Venta actualizada correctamente', 'success');
                obtenerVentas();
                cerrarModal();
            } else {
                setError(updateResponse.data.message || 'No se pudo actualizar la venta');
            }
        } catch (error) {
            setError('No se pudo actualizar la venta: ' + (error.response?.data?.message || error.message));
        }
    };


    // Formatear el total a formato monetario
    const formatTotal = (total) => {
        return typeof total === 'number' ? `$${total.toFixed(2)}` : 'N/A';
    };

    // Definir las columnas de la tabla de ventas
    const columns = [
        {
            name: 'Fecha',
            selector: row => new Date(row.fecha).toLocaleString(),
            sortable: true,
            cell: row => (
                <div>
                    <Calendar size={16} className="mr-2" />
                    {new Date(row.fecha).toLocaleString()}
                </div>
            ),
        },
        {
            name: 'Total',
            selector: row => row.total,
            sortable: true,
            cell: row => (
                <div>
                    {formatTotal(row.total)}
                </div>
            ),
        },
        {
            name: 'Acciones',
            cell: row => (
                <div className="d-flex justify-content-start">
                    <Button color="info" className="me-2" onClick={() => abrirModal(row)}>
                        <Eye size={16} />
                    </Button>
                    {((userRole === 'admin' && row.usuario && row.usuario._id === userId) || userRole === 'empleado' ) && (
                        <Button color="warning" className="me-2" onClick={() => abrirModal(row, true)}>
                            <Edit size={16} />
                        </Button>
                    )}
                    {['Super-admin', 'admin'].includes(userRole) && (
                        <Button color="danger" onClick={() => handleEliminar(row._id)}>
                            <Trash2 size={16} />
                        </Button>
                    )}
                </div>
            ),
        }
    ];

    // Estilos personalizados para la tabla
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
        <>
            <Card className="shadow-lg">
                <CardHeader className="bg-primary text-white">
                    <h3><ShoppingBag className="mr-2" /> Historial de Ventas</h3>
                </CardHeader>
                <CardBody>
                    {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                    {loading ? (
                        <div className="text-center mt-4">
                            <Spinner color="primary" />
                            <p className="mt-2">Cargando...</p>
                        </div>
                    ) : (
                        ventas.map((grupoVentas, index) => (
                            <div key={grupoVentas.usuario._id || index}>
                                <h4 className="mt-4 mb-3">
                                    <User size={20} className="mr-2" />
                                    {grupoVentas.usuario.nombre} {grupoVentas.usuario.apellido}
                                </h4>
                                <DataTable
                                    columns={columns}
                                    data={grupoVentas.ventas}
                                    pagination
                                    highlightOnHover
                                    customStyles={customStyles}
                                    noDataComponent={
                                        <div className="text-center p-4">
                                            <ShoppingBag size={48} className="mb-3 text-muted" />
                                            <p>No hay ventas registradas para este usuario</p>
                                        </div>
                                    }
                                />
                                {index < ventas.length - 1 && <hr className="my-4 border-dark" />}
                            </div>
                        ))
                    )}
                </CardBody>
            </Card>

            {/* Modal para detalles de la venta */}
            <Modal isOpen={modalVenta} toggle={cerrarModal} size="lg">
                <ModalHeader toggle={cerrarModal}>
                    {modoEdicion ? 'Editar Venta' : 'Detalle de Venta'} - {ventaSeleccionada.usuario?.nombre || ''} {ventaSeleccionada.usuario?.apellido || ''}
                </ModalHeader>
                <ModalBody>
                    <Card className="mb-3">
                        <CardHeader>
                            <Calendar className="mr-2" /> Fecha: {new Date(ventaSeleccionada.fecha).toLocaleString()}
                        </CardHeader>
                        <CardBody>
                            <FormGroup>
                            <Label><DollarSign className="mr-2" /> Total: {formatTotal(ventaSeleccionada.total)}</Label>
                            </FormGroup>
                            <FormGroup>
                                <Label><ShoppingBag className="mr-2" /> Productos</Label>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Precio Unitario</th>
                                            <th>Cantidad</th>
                                            <th>Precio Total</th>
                                            {modoEdicion && <th>Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventaSeleccionada.productos && ventaSeleccionada.productos.map((prod, index) => (
                                            <tr key={index}>
                                                <td>{prod.producto?.nombre || 'N/A'}</td>
                                                <td>{prod.producto?.categoria || 'N/A'}</td>
                                                <td>{prod.producto?.precio ? `$${prod.producto.precio.toFixed(2)}` : 'N/A'}</td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        value={prod.cantidad} 
                                                        onChange={(e) => handleChange(e, index)}
                                                        disabled={!modoEdicion}
                                                        min="1"
                                                    />
                                                </td>
                                                <td>{prod.producto?.precio ? `$${(prod.producto.precio * prod.cantidad).toFixed(2)}` : 'N/A'}</td>
                                                {modoEdicion && (
                                                    <td>
                                                        <Button color="danger" size="sm" onClick={() => handleRemoveProduct(index)}>
                                                            <X size={16} />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </FormGroup>
                            {modoEdicion && (
                                <FormGroup>
                                    <Label>Agregar Producto</Label>
                                    <div className="d-flex">
                                        <Input 
                                            type="text" 
                                            placeholder="Código de Barras" 
                                            value={nuevoProducto.codigoBarra}
                                            onChange={(e) => setNuevoProducto({...nuevoProducto, codigoBarra: e.target.value})}
                                            className="me-2"
                                        />
                                        <Input 
                                            type="number" 
                                            placeholder="Cantidad" 
                                            value={nuevoProducto.cantidad}
                                            onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad: e.target.value})}
                                            className="me-2"
                                            min="1"
                                        />
                                        <Button color="success" onClick={handleAddProduct}>
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </FormGroup>
                            )}
                        </CardBody>
                    </Card>
                </ModalBody>
                <ModalFooter>
                    {modoEdicion && (
                        <Button color="primary" onClick={handleActualizar}>
                            Actualizar Venta
                        </Button>
                    )}
                    <Button color="secondary" onClick={cerrarModal}>Cerrar</Button>
                </ModalFooter>
            </Modal>
        </>
    );
}

export default HistorialVentas;