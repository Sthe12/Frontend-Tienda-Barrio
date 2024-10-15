import React, { useState } from "react";
import { Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from "reactstrap";
import Swal from 'sweetalert2';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { ShoppingCart, Search, PlusCircle, XCircle, DollarSign, Package, Tag, Box, Archive, User, CreditCard, Phone, MapPin } from 'react-feather';

function Ventas() {
    const [codigoBarra, setCodigoBarra] = useState("");
    const [productoBuscado, setProductoBuscado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [productos, setProductos] = useState([]);
    const [total, setTotal] = useState(0);
    const [pendiente, setPendiente] = useState(false);
    const [verModal, setVerModal] = useState(false);
    const [token] = useState(localStorage.getItem('token'));
    const [error, setError] = useState("");
    const [ventaId, setVentaId] = useState(null);
    const [verClienteModal, setVerClienteModal] = useState(false);
    const [notaVenta, setNotaVenta] = useState({
        cliente: {
            nombre: '',
            ci: '',
            telefono: '',
            direccion: ''
        }
    });
    const [cedulaError, setCedulaError] = useState("");
    const [telefonoError, setTelefonoError] = useState("");
    const [productosVenta, setProductosVenta] = useState([]);
    const [totalVenta, setTotalVenta] = useState(0);
   
    // Función para redondear a dos decimales
    const roundToTwo = (num) => {
        return +(Math.round(num + "e+2")  + "e-2");
    };

    // Función para limpiar el estado del cliente
    const limpiarDatosCliente = () => {
        setNotaVenta({
            cliente: {
                nombre: '',
                ci: '',
                telefono: '',
                direccion: ''
            }
        });
        setCedulaError("");
        setTelefonoError("");
    };

    // Función para buscar el producto por código de barras
    const buscarProducto = async () => {
        if (!codigoBarra) {
            setError();
            Swal.fire('Error', 'Por favor, ingrese un código de barra.', 'error');
            return;
        }

        setPendiente(true);
        setError("");
        try {
            const response = await axios.get(`http://localhost:3600/get-product-barra/${codigoBarra}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.product) {
                setProductoBuscado(response.data.product);
                setVerModal(true);
            } else {
                setError("Producto no encontrado");
            }
        } catch (error) {
            console.error('Error al buscar el producto:', error);
            setError();
            Swal.fire('Error', 'Error al buscar el producto. Por favor, intente de nuevo.', 'error');
        } finally {
            setPendiente(false);
        }
    };

    // Función para agregar el producto a la lista de venta
    const agregarProducto = () => {
        if (!productoBuscado || cantidad <= 0) {
            setError();
            Swal.fire('Error', 'Por favor, seleccione un producto y una cantidad válida.', 'error');
            return;
        }

        if (productoBuscado.stock < cantidad) {
            setError();
            Swal.fire('Error',`Stock insuficiente para el producto ${productoBuscado.nombre}`, 'error');
            return;
        }

        const nuevoProducto = {
            idProducto: productoBuscado.codigoBarra,
            descripcion: productoBuscado.nombre,
            cantidad: parseInt(cantidad),
            precio: roundToTwo(productoBuscado.precio),
            total: roundToTwo(productoBuscado.precio * cantidad),
        };

        setProductos(prevProductos => [...prevProductos, nuevoProducto]);
        calcularTotal([...productos, nuevoProducto]);
        setCodigoBarra("");
        setCantidad(1);
        setProductoBuscado(null);
        setVerModal(false);
        setError("");
    };

    // Función para calcular el total de la venta
    const calcularTotal = (arrayProductos) => {
        const nuevoTotal = arrayProductos.reduce((acc, item) => acc + roundToTwo(item.total), 0);
        const totalRedondeado = roundToTwo(nuevoTotal);
        setTotal(totalRedondeado.toFixed(2));
        return totalRedondeado;
    };

    // Función para terminar la venta y guardar en la base de datos
    const terminarVenta = async () => {
        if (productos.length < 1) {
            setError();
            Swal.fire('Error', 'No hay productos en la venta.', 'error');
            return;
        }

        const totalCalculado = calcularTotal(productos);

        const ventaData = {
            productos: productos.map(producto => ({
                codigoBarra: producto.idProducto,
                cantidad: producto.cantidad,
                precio: roundToTwo(producto.precio),
                total: roundToTwo(producto.total)
            })),
            total: totalCalculado,
        };

        try {
            const response = await axios.post("http://localhost:3600/create-venta", ventaData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setVentaId(response.data.venta._id);
                setProductosVenta(productos.map(p => ({
                    ...p,
                    precio: roundToTwo(p.precio),
                    total: roundToTwo(p.total)
                })));
                setTotalVenta(totalCalculado);
                Swal.fire({
                    icon: 'success',
                    title: 'Venta generada correctamente',
                    text: `Total: $${totalCalculado.toFixed(2)}`,
                    showCancelButton: true,
                    confirmButtonText: 'Sí, generar Nota de Venta',
                    cancelButtonText: 'No',
                }).then((result) => {
                    if (result.isConfirmed) {
                        setVerClienteModal(true);
                    }
                });
                setProductos([]);
                setTotal(0);
            } else {
                setError("No se pudo generar la venta");
            }
        } catch (error) {
            console.error('Error al generar la venta:', error.response?.data || error.message);
            setError();
            Swal.fire('Error', error.response?.data?.message || 'No se pudo generar la venta', 'error');
        }
    };

    // Función para eliminar un producto de la lista
    const eliminarProducto = (index) => {
        const nuevosProductos = productos.filter((_, i) => i !== index);
        setProductos(nuevosProductos);
        calcularTotal(nuevosProductos);
    };

    // Columnas para la tabla de productos
    const columns = [
        {
            name: 'Código',
            selector: row => row.idProducto,
            sortable: true,
        },
        {
            name: 'Descripción',
            selector: row => row.descripcion,
            sortable: true,
        },
        {
            name: 'Cantidad',
            selector: row => row.cantidad,
            sortable: true,
        },
        {
            name: 'Precio Unitario',
            selector: row => `$${row.precio.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Total',
            selector: row => `$${row.total.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Acciones',
            cell: (row, index) => (
                <Button color="danger" size="sm" onClick={() => eliminarProducto(index)}>
                    <XCircle size={16} />
                </Button>
            ),
        },
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

    // Función para manejar cambios en los campos del cliente
    const handleClienteChange = (e) => {
        const { name, value } = e.target;
if (name === 'ci') {
    // Validar que la cédula tenga solo números
    if (/^\d*$/.test(value)) {
        // Verificar la longitud de la cédula
        if (value.length > 10) {
            setCedulaError();
            Swal.fire('Error', 'Se excedió de los 10 dígitos', 'error');
        } else {
            // Actualizar el estado con el valor de la cédula
            setNotaVenta(prevState => ({
                ...prevState,
                cliente: {
                    ...prevState.cliente,
                    [name]: value
                }
            }));

            // Validar si la cédula tiene exactamente 10 dígitos
            if (value.length === 10) {
                setCedulaError("");  // Limpiar cualquier error si tiene 10 dígitos
            } 
        }
        } else {
                setCedulaError();
                Swal.fire('Error', 'La cédula debe contener solo números.', 'error');
        }

        
        } else if (name === 'telefono') {
            // Validar que el teléfono tenga solo números
            if (/^\d*$/.test(value)) {
                setNotaVenta(prevState => ({
                    ...prevState,
                    cliente: {
                        ...prevState.cliente,
                        [name]: value
                    }
                }));
                setTelefonoError("");
            } else {
                setTelefonoError();
                Swal.fire('Error', 'Solo se permiten números en el teléfono.', 'error');
            }
        } else {
            setNotaVenta(prevState => ({
                ...prevState,
                cliente: {
                    ...prevState.cliente,
                    [name]: value
                }
            }));
        }
    };
    const handleBlurCedula = () => {
        const ci = notaVenta.cliente.ci;
        // Mostrar mensaje solo si tiene menos de 10 dígitos
        if (ci.length < 10 && ci.length > 0) {
            Swal.fire('Error', 'La cédula debe ser de 10 dígitos', 'error');
            setCedulaError();
        }
    };

     // Función para verificar si el cliente existe en la base de datos
     const verificarCliente = async () => {
        if (!notaVenta.cliente.ci || cedulaError) {
            Swal.fire('Error', 'Por favor, ingresa una cédula válida antes de continuar.', 'error');
            return;
        }
    
        try {
            const response = await axios.get(`http://localhost:3600/verificar-cliente/${notaVenta.cliente.ci}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            if (response.status === 200 && response.data.cliente) {
                const cliente = response.data.cliente;
                setNotaVenta(prevState => ({
                    ...prevState,
                    cliente: {
                        nombre: cliente.nombre,
                        ci: cliente.ci,
                        telefono: cliente.telefono,
                        direccion: cliente.direccion
                    }
                }));
                Swal.fire('Cliente encontrado', 'La información del cliente ha sido cargada.', 'success');
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                Swal.fire({
                    title: 'Cliente no encontrado',
                    text: 'No se encontró un cliente con esa cédula. Por favor, ingresa los datos del cliente.',
                    icon: 'info'
                });
            } else {
                Swal.fire('Error', 'Ocurrió un error al buscar el cliente. Inténtalo nuevamente.', 'error');
            }
            console.error('Error al buscar el cliente:', error);
        }
    };

    // Función para crear la nota de venta
    const crearNotaVenta = async () => {
        // Verificar que los campos del cliente estén completos antes de continuar
        if (!notaVenta.cliente.nombre || !notaVenta.cliente.ci || !notaVenta.cliente.telefono || !notaVenta.cliente.direccion) {
            Swal.fire('Error', 'Por favor, completa todos los campos para crear la nota de venta.', 'error');
            return;
        }
    
        // Verificar que no haya errores en la cédula o el teléfono
        if (cedulaError || telefonoError) {
            Swal.fire('Error', 'Hay errores en los datos del cliente, por favor revisa.', 'error');
            return;
        }
    
        try {
            // Realizar la solicitud al backend para crear la nota de venta
            const response = await axios.post(`http://localhost:3600/create-nota`, {
                ventaId: ventaId, // Pasar el ID de la venta
                cliente: notaVenta.cliente, // Pasar los datos del cliente
                total: roundToTwo(totalVenta) // Redondear el total de la venta
            }, {
                headers: { Authorization: `Bearer ${token}` } // Incluir el token de autorización
            });
    
            // Verificar si hay errores de validación del backend
            if (response.data.errors) {
                const validationErrors = response.data.errors.map(err => err.msg).join(', ');
                Swal.fire('Error', validationErrors, 'error');
                return;
            }
    
            // Mostrar un mensaje de éxito si la nota de venta se creó correctamente
            Swal.fire('Éxito', 'Nota de venta creada exitosamente.', 'success');
            
            // Generar el PDF de la nota de venta
            generarPDF(response.data.notaVenta._id);
    
            // Limpiar los campos del cliente y cerrar el modal
            limpiarDatosCliente();
            setVerClienteModal(false);
        } catch (error) {
            // Manejar cualquier error que ocurra durante la creación de la nota de venta
            console.error('Error al crear la nota de venta:', error);
            Swal.fire('Error', 'No se pudo crear la nota de venta. Inténtalo nuevamente.', 'error');
        }
    };
    
    // Función para generar el PDF de la nota de venta
    const generarPDF = async (notaVentaId) => {
        try {
            const response = await axios.get(`http://localhost:3600/nota-pdf/${notaVentaId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `NotaVenta_${notaVentaId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al generar el PDF:', error);
            Swal.fire('Error', 'No se pudo generar el PDF. Inténtalo nuevamente.', 'error');
        }
    };

    return (
        <>
            <Card className="shadow-lg">
                <CardHeader className="bg-primary text-white">
                    <h3><ShoppingCart className="mr-2" /> Nueva Venta</h3>
                </CardHeader>
                <CardBody>
                    <Row>
                        <Col sm="6">
                            <FormGroup>
                                <Label for="codigoBarra">Código de Barras:</Label>
                                <div className="d-flex justify-content-start">
                                    <Input
                                        id="codigoBarra"
                                        type="text"
                                        value={codigoBarra}
                                        onChange={(e) => setCodigoBarra(e.target.value)}
                                        placeholder="Ingrese código de barras"
                                        onKeyPress={(e) => e.key === 'Enter' && buscarProducto()}
                                    />
                                    <Button color="primary" onClick={buscarProducto} className="ms-2">
                                        <Search size={16} /> Buscar
                                    </Button>
                                </div>
                            </FormGroup>
                        </Col>
                        <Col sm="6">
                            <Card className="bg-light p-3 text-center">
                                <h4><DollarSign className="mr-2" /> Total: ${total}</h4>
                                <Button color="success" onClick={terminarVenta} disabled={productos.length === 0}>
                                    Terminar Venta
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                    {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                    <hr />
                    <h4><ShoppingCart className="mr-2" /> Productos Seleccionados</h4>
                    {pendiente ? (
                        <div className="text-center mt-4">
                            <Spinner color="primary" />
                            <p className="mt-2">Cargando...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={productos}
                            pagination
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center p-4">
                                    <ShoppingCart size={48} className="mb-3 text-muted" />
                                    <p>No hay productos seleccionados</p>
                                </div>
                            }
                        />
                    )}
                </CardBody>
            </Card>

            {/* Modal para detalles del producto */}
            <Modal isOpen={verModal} toggle={() => setVerModal(false)}>
                <ModalHeader toggle={() => setVerModal(false)}>Detalles del Producto</ModalHeader>
                <ModalBody>
                    {productoBuscado && (
                        <>
                            <p><Package className="mr-2" /> Nombre: {productoBuscado.nombre}</p>
                            <p><DollarSign className="mr-2" /> Precio: ${productoBuscado.precio.toFixed(2)}</p>
                            <p><Archive className="mr-2" /> Stock disponible: {productoBuscado.stock}</p>
                            <p><Tag className="mr-2" /> Categoría: {productoBuscado.categoria || "No especificada"}</p>
                            <FormGroup>
                                <Label for="cantidad"><Box className="mr-2" /> Cantidad:</Label>
                                <Input
                                    id="cantidad"
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Math.max(1, Math.min(e.target.value, productoBuscado.stock)))}
                                    min="1"
                                    max={productoBuscado.stock}
                                />
                            </FormGroup>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setVerModal(false)}>Cancelar</Button>
                    <Button color="primary" onClick={agregarProducto}>
                        <PlusCircle size={16} className="mr-2" /> Agregar Producto
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Modal para ingresar datos del cliente */}
            <Modal isOpen={verClienteModal} toggle={() => setVerClienteModal(false)} size="xl">
                <ModalHeader toggle={() => setVerClienteModal(false)}>Nota de Venta</ModalHeader>
                <ModalBody>
                    <h4>Datos del Cliente</h4>
                    <Row>
                        <Col md={6}>
                        <FormGroup>
                                <Label for="ci"><CreditCard className="mr-2" /> CI del Cliente</Label>
                                <div className="d-flex align-items-center">
                                    <Input
                                        type="text"
                                        id="ci"
                                        name="ci"
                                        value={notaVenta.cliente.ci}
                                        onChange={handleClienteChange}
                                        onBlur={handleBlurCedula}
                                        className="flex-grow-1"
                                        placeholder="Ingrese cédula"
                                    />
                                    <Button
                                        color="primary"
                                        onClick={verificarCliente}
                                        className="ms-2"
                                        style={{ height: '38px', padding: '0 12px', fontSize: '14px' }}
                                    >
                                        Verificar
                                    </Button>
                                </div>
                                {cedulaError && <Alert color="danger" className="mt-2">{cedulaError}</Alert>}
                            </FormGroup>
                            <FormGroup>
                                <Label for="nombre"><User className="mr-2" /> Nombre del Cliente</Label>
                                <Input type="text" id="nombre" name="nombre" value={notaVenta.cliente.nombre} onChange={handleClienteChange} />
                            </FormGroup>
                            
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="telefono"><Phone className="mr-2" /> Teléfono del Cliente</Label>
                                <Input type="text" id="telefono" name="telefono" value={notaVenta.cliente.telefono} onChange={handleClienteChange} />
                                {telefonoError && <Alert color="danger" className="mt-2">{telefonoError}</Alert>}
                            </FormGroup>
                            <FormGroup>
                                <Label for="direccion"><MapPin className="mr-2" /> Dirección del Cliente</Label>
                                <Input type="text" id="direccion" name="direccion" value={notaVenta.cliente.direccion} onChange={handleClienteChange} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <h4 className="mt-4">Detalles de la Venta</h4>
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosVenta.map((producto, index) => (
                                    <tr key={index}>
                                        <td>{producto.descripcion}</td>
                                        <td>{producto.cantidad}</td>
                                        <td>${producto.precio.toFixed(2)}</td>
                                        <td>${producto.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="text-right"><strong>Total a Pagar:</strong></td>
                                    <td><strong>${totalVenta.toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => { setVerClienteModal(false); limpiarDatosCliente(); }}>Cancelar</Button>
                    <Button color="primary" onClick={crearNotaVenta} disabled={cedulaError || telefonoError}>
                        <PlusCircle size={16} className="mr-2" /> Crear Nota de Venta
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}

export default Ventas;
