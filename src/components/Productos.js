import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from "reactstrap";
import Swal from 'sweetalert2';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Package, Search, PlusCircle, DollarSign, Tag, Box, Edit, Trash2 } from 'react-feather';

const modeloProducto = {
    codigoBarra: '',
    nombre: "",
    categoria: "",
    categoriaPersonalizada: "",
    precio: "",
    stock: ""
};
// Lista predefinida de categorías
const categorias = [
    "Bedidas",
    "Aseo",
    "Limpieza",
    "Snacks",
    "Embutidos",
    "Grasas",
    "Otros"
];
function Productos() {
    const [producto, setProducto] = useState(modeloProducto);
    const [productos, setProductos] = useState([]);
    const [verModal, setVerModal] = useState(false);
    const [verModalBusqueda, setVerModalBusqueda] = useState(false);
    const [token] = useState(localStorage.getItem('token'));
    const [pendiente, setPendiente] = useState(false);
    const [esAdmin, setEsAdmin] = useState(false);
    const [esSuperAdmin,setEsSuperAdmin] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [codigoBarraBusqueda, setCodigoBarraBusqueda] = useState('');
    const [productoBuscado, setProductoBuscado] = useState(null);
    const [error, setError] = useState("");

    const verificarAdmin = useCallback(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && (user.role === 'admin' || user.role === 'Super-admin')) {
            setEsAdmin(true);
            setEsSuperAdmin(user.role === 'Super-admin');
            return true;
        }
        setEsAdmin(false);
        setEsSuperAdmin(false);
        return false;
    }, []);

    const obtenerProductos = useCallback(async () => {
        if (!token) return;
        setPendiente(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:3600/get-products", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProductos(response.data.products);
        } catch (error) {
            setError("No se pudieron cargar los productos. Inténtalo nuevamente más tarde.");
        } finally {
            setPendiente(false);
        }
    }, [token]);

    useEffect(() => {
        verificarAdmin();
    }, [verificarAdmin]);

    useEffect(() => {
        if (token) {
            obtenerProductos();
        }
    }, [token, obtenerProductos]);

    useEffect(() => {
        if (modoEdicion && producto.categoria === 'Otros' && !producto.categoriaPersonalizada) {
            setProducto(prev => ({
                ...prev,
                categoriaPersonalizada: prev.categoria
            }));
        }
    }, [modoEdicion, producto]);

    const abrirEditarModal = (data) => {
        const categoriaEstandar = categorias.includes(data.categoria);
        setProducto({
            ...data,
            categoria: categoriaEstandar ? data.categoria : 'Otros',
            categoriaPersonalizada: categoriaEstandar ? '' : data.categoria
        });
        setModoEdicion(true);
        setVerModal(true);
    };

    const abrirCrearModal = () => {
        setProducto(modeloProducto);
        setModoEdicion(false);
        setVerModal(true);
    };

    const abrirBusquedaModal = () => {
        setVerModalBusqueda(true);
    };

    const cerrarModal = () => {
        setProducto(modeloProducto);
        setModoEdicion(false);
        setVerModal(false);
        setVerModalBusqueda(false);
        setProductoBuscado(null);
        setError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProducto(prevState => ({
            ...prevState,
            [name]: value,
            // Si la categoría cambia a algo que no sea "Otros", reiniciamos la categoría personalizada
            ...(name === 'categoria' && value !== 'Otros' ? { categoriaPersonalizada: '' } : {})
        }));
    };

    const handleBuscar = async () => {
        if (!codigoBarraBusqueda) {
            setError("Por favor, ingresa el código de barras para buscar.");
            return;
        }

        setPendiente(true);
        setError("");
        try {
            const response = await axios.get(`http://localhost:3600/get-product-barra/${codigoBarraBusqueda}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProductoBuscado(response.data.product);
        } catch (error) {
            console.error('Error al buscar el producto:', error);
            setError("No se pudo encontrar el producto. Verifica el código de barras e intenta nuevamente.");
        } finally {
            setPendiente(false);
        }
    };

    const handleCrear = async () => {
        if (!producto.nombre || !producto.categoria || !producto.precio || !producto.stock) {
            setError("Por favor, completa todos los campos para guardar el producto.");
            return;
        }
        if (producto.categoria === 'Otros' && !producto.categoriaPersonalizada) {
            setError("Por favor, ingresa una categoría personalizada.");
            return;
        }

        const productoAGuardar = {
            ...producto,
            categoria: producto.categoria === 'Otros' ? producto.categoriaPersonalizada : producto.categoria
        };
        try {
            await axios.post('http://localhost:3600/create-product', productoAGuardar, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Éxito', 'Producto creado exitosamente.', 'success');
            obtenerProductos();
            cerrarModal();
        } catch (error) {
            console.error('Error al guardar el producto:', error);
            setError("No se pudo guardar el producto. Inténtalo nuevamente.");
        }
    };

    const handleEliminar = async (codigoBarra) => {
        if (!esAdmin && !esSuperAdmin) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para realizar esta acción.', 'error');
            return;
        }
    
        try {
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "Desea eliminar el producto",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, continuar',
                cancelButtonText: 'No, volver'
            });
    
            if (result.isConfirmed) {
                const response = await axios.delete(`http://localhost:3600/delete-product/${codigoBarra}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.status === 200) {
                    Swal.fire('Éxito', 'Producto eliminado exitosamente.', 'success');
                    obtenerProductos();
                } else {
                    setError(response.data.message || 'No se pudo eliminar el producto.');
                }
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            setError('No se pudo eliminar el producto. Inténtalo nuevamente.');
        }
    };

    const handleActualizar = async () => {
        if (!producto.codigoBarra) {
            setError('El código de barras es necesario para actualizar el producto.');
            return;
        }

        if (!producto.nombre || !producto.categoria || !producto.precio || !producto.stock) {
            setError('Completa todos los campos para actualizar el producto.');
            return;
        }
        if (producto.categoria === 'Otros' && !producto.categoriaPersonalizada) {
            setError("Por favor, ingresa una categoría personalizada.");
            return;
        }

        const productoAActualizar = {
            ...producto,
            categoria: producto.categoria === 'Otros' ? producto.categoriaPersonalizada : producto.categoria
        };

        try {
            const updateResponse = await axios.put(`http://localhost:3600/update-product/${producto.codigoBarra}`,  productoAActualizar, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (updateResponse.status === 200) {
                Swal.fire('Éxito', 'Producto actualizado exitosamente.', 'success');
                obtenerProductos();
                cerrarModal();
            } else {
                setError(updateResponse.data.message || 'No se pudo actualizar el producto.');
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            setError('No se pudo actualizar el producto. Inténtalo nuevamente.');
        }
    };

    const columns = [
        {
            name: 'Código de Barra',
            selector: row => row.codigoBarra,
            sortable: true,
        },
        {
            name: 'Nombre',
            selector: row => row.nombre,
            sortable: true,
        },
        {
            name: 'Categoría',
            selector: row => row.categoria,
            sortable: true,
        },
        {
            name: 'Precio',
            selector: row => `$${row.precio.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Stock',
            selector: row => row.stock,
            sortable: true,
        },
        {
            name: 'Acciones',
            cell: row => (
                <div className="d-flex justify-content-start">
                    <Button color="info" className="me-2" onClick={() => abrirEditarModal(row)}>
                        <Edit size={16} />
                    </Button>
                    {esAdmin && (
                        <Button color="danger" onClick={() => handleEliminar(row.codigoBarra)}>
                            <Trash2 size={16} />
                        </Button>
                    )}
                </div>
            ),
        }
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
        <>
            <Card className="shadow-lg">
                <CardHeader className="bg-primary text-white">
                    <h3><Package className="mr-2" /> Gestión de Productos</h3>
                </CardHeader>
                <CardBody>
                    <Row>
                        <Col sm="6">
                            <div className="d-flex justify-content-start">
                                <Button color="success" className="me-2" onClick={abrirCrearModal}>
                                    <PlusCircle size={16} className="mr-2" /> Crear Producto
                                </Button>
                                <Button color="info" onClick={abrirBusquedaModal}>
                                    <Search size={16} className="mr-2" /> Buscar Producto
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                    <hr />
                    <h4><Package className="mr-2" /> Productos Registrados</h4>
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
                                    <Package size={48} className="mb-3 text-muted" />
                                    <p>No hay productos registrados</p>
                                </div>
                            }
                        />
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={verModal} toggle={cerrarModal}>
                <ModalHeader toggle={cerrarModal}>{modoEdicion ? 'Editar Producto' : 'Crear Producto'}</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="codigoBarra"><Package className="mr-2" /> Código de Barra</Label>
                        <Input type="text" id="codigoBarra" name="codigoBarra" value={producto.codigoBarra} onChange={handleChange} disabled={modoEdicion} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="nombre"><Tag className="mr-2" /> Nombre del Producto</Label>
                        <Input type="text" id="nombre" name="nombre" value={producto.nombre} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="categoria"><Box className="mr-2" /> Categoría</Label>
                        <Input 
                            type="select" 
                            id="categoria" 
                            name="categoria" 
                            value={producto.categoria} 
                            onChange={handleChange}
                        >
                            <option value="">Seleccione una categoría</option>
                            {categorias.map((cat, index) => (
                                <option key={index} value={cat}>{cat}</option>
                            ))}
                        </Input>
                    </FormGroup>
                    {producto.categoria === 'Otros' && (
                        <FormGroup>
                            <Label for="categoriaPersonalizada"><Box className="mr-2" /> Categoría Personalizada</Label>
                            <Input 
                                type="text" 
                                id="categoriaPersonalizada" 
                                name="categoriaPersonalizada" 
                                value={producto.categoriaPersonalizada} 
                                onChange={handleChange}
                                placeholder="Ingrese la categoría personalizada"
                            />
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label for="precio"><DollarSign className="mr-2" /> Precio</Label>
                        <Input type="number" id="precio" name="precio" value={producto.precio} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="stock"><Box className="mr-2" /> Stock</Label>
                        <Input type="number" id="stock" name="stock" value={producto.stock} onChange={handleChange} />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={cerrarModal}>Cancelar</Button>
                    <Button color="primary" onClick={modoEdicion ? handleActualizar : handleCrear}>
                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={verModalBusqueda} toggle={cerrarModal}>
                <ModalHeader toggle={cerrarModal}>Buscar Producto</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="codigoBarraBusqueda"><Package className="mr-2" /> Código de Barra</Label>
                        <div className="d-flex justify-content-start">
                            <Input
                                type="text"
                                id="codigoBarraBusqueda"
                                name="codigoBarraBusqueda"
                                value={codigoBarraBusqueda}
                                onChange={e => setCodigoBarraBusqueda(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                            />
                            <Button color="primary" onClick={handleBuscar} className="ms-2">
                                <Search size={16} /> Buscar
                            </Button>
                        </div>
                    </FormGroup>
                    {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                    {productoBuscado && (
                        <Card className="bg-light p-3 text-center mt-4">
                            <h4><Package className="mr-2" /> {productoBuscado.nombre}</h4>
                            <p><Tag className="mr-2" /> Categoría: {productoBuscado.categoria}</p>
                            <p><DollarSign className="mr-2" /> Precio: ${productoBuscado.precio.toFixed(2)}</p>
                            <p><Box className="mr-2" /> Stock: {productoBuscado.stock}</p>
                            <Button color="warning" onClick={() => abrirEditarModal(productoBuscado)}>
                                <Edit size={16} className="mr-2" /> Editar
                            </Button>
                        </Card>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={cerrarModal}>Cerrar</Button>
                    </ModalFooter>
            </Modal>
        </>
    );
}

export default Productos;