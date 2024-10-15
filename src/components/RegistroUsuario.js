import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from "reactstrap";
import Swal from 'sweetalert2';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Users, Eye, EyeOff, PlusCircle, Mail, User, Key, Edit, Trash2 } from 'react-feather';

const modeloUsuario = {
    idUsuario: '',
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    role: ""
};

function RegistroUsuario() {
    const [usuario, setUsuario] = useState(modeloUsuario);
    const [usuarios, setUsuarios] = useState([]);
    const [roles] = useState(["admin", "empleado"]);
    const [verModal, setVerModal] = useState(false);
    const [token] = useState(localStorage.getItem('token'));
    const [pendiente, setPendiente] = useState(false);
    const [verPassword, setVerPassword] = useState(false);
    const [esAdmin, setEsAdmin] = useState(false);
    const [esSuperAdmin, setEsSuperAdmin] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
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
        Swal.fire('Acceso Denegado', 'No tienes permisos para ver esta información.', 'error');
        return false;
    }, []);

    const obtenerUsuarios = useCallback(async () => {
        if (!esAdmin && !esSuperAdmin) return;
        setPendiente(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:3600/get-users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(response.data.users);
        } catch (error) {
            setError("No se pudieron cargar los usuarios. Inténtalo nuevamente más tarde.");
        } finally {
            setPendiente(false);
        }
    }, [token, esAdmin, esSuperAdmin]);

    useEffect(() => {
        verificarAdmin();
    }, [verificarAdmin]);

    useEffect(() => {
        if (token && (esAdmin || esSuperAdmin)) {
            obtenerUsuarios();
        }
    }, [token, esAdmin, esSuperAdmin, obtenerUsuarios]);

    const abrirEditarModal = (data) => {
        if (!esAdmin && !esSuperAdmin) return;
        setUsuario({ ...data, _id: data._id });
        setModoEdicion(true);
        setVerModal(true);
    };

    const abrirCrearModal = () => {
        setUsuario(modeloUsuario);
        setModoEdicion(false);
        setVerModal(true);
    };

    const cerrarModal = () => {
        setUsuario(modeloUsuario);
        setVerPassword(false);
        setModoEdicion(false);
        setVerModal(false);
        setError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUsuario(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCrear = async () => {
        if (!esAdmin && !esSuperAdmin) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para realizar esta acción.', 'error');
            return;
        }

        if (!usuario.nombre || !usuario.apellido || !usuario.email || !usuario.password || !usuario.role) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        try {
            await axios.post('http://localhost:3600/create-user', usuario, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Éxito', 'Usuario creado correctamente', 'success');
            obtenerUsuarios();
            cerrarModal();
        } catch (error) {
            console.error('Error al guardar el usuario:', error);
            setError("No se pudo guardar el usuario. Inténtalo nuevamente.");
        }
    };

    const handleEliminar = async (id) => {
        if (!esAdmin && !esSuperAdmin) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para realizar esta acción.', 'error');
            return;
        }
    
        if (!id) {
            setError("ID de usuario no válido");
            return;
        }
    
        try {
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "Desea eliminar el usuario",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, continuar',
                cancelButtonText: 'No, volver'
            });
    
            if (result.isConfirmed) {
                const response = await axios.delete(`http://localhost:3600/delete-user/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.status === 200) {
                    Swal.fire('Éxito', 'Usuario eliminado correctamente', 'success');
                    obtenerUsuarios();
                } else {
                    setError(response.data.message || 'No se pudo eliminar el usuario');
                }
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            setError('No se pudo eliminar el usuario');
        }
    };

    const handleActualizar = async () => {
        if (!esAdmin && !esSuperAdmin) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para realizar esta acción.', 'error');
            return;
        }

        const userId = usuario._id;

        if (!userId) {
            setError("ID de usuario no válido");
            return;
        }

        if (!usuario.nombre || !usuario.apellido || !usuario.email || !usuario.role) {
            setError("Todos los campos son obligatorios para actualizar el usuario.");
            return;
        }

        try {
            const updateResponse = await axios.put(`http://localhost:3600/update-user/${userId}`, usuario, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (updateResponse.status === 200) {
                Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
                obtenerUsuarios();
                cerrarModal();
            } else {
                setError(updateResponse.data.message || 'No se pudo actualizar el usuario');
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            setError('No se pudo actualizar el usuario: ' + (error.response?.data?.message || error.message));
        }
    };

    const togglePasswordVisibility = () => {
        setVerPassword(prevState => !prevState);
    };

    const columns = [
        {
            name: 'Nombre',
            selector: row => row.nombre,
            sortable: true,
        },
        {
            name: 'Apellido',
            selector: row => row.apellido,
            sortable: true,
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true,
        },
        {
            name: 'Rol',
            selector: row => row.role,
            sortable: true,
        },
        {
            name: 'Acciones',
            cell: row => (
                <div className="d-flex justify-content-start">
                    <Button color="info" className="me-2" onClick={() => abrirEditarModal(row)}>
                        <Edit size={16} />
                    </Button>
                    {(esAdmin || esSuperAdmin) && (
                        <Button color="danger" onClick={() => handleEliminar(row._id)}>
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
                    <h3><Users className="mr-2" /> Gestión de Usuarios</h3>
                </CardHeader>
                <CardBody>
                    <Row>
                        <Col sm="6">
                            <div className="d-flex justify-content-start">
                                <Button color="success" className="me-2" onClick={abrirCrearModal}>
                                    <PlusCircle size={16} className="mr-2" /> Crear Usuario
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                    <hr />
                    <h4><Users className="mr-2" /> Usuarios Registrados</h4>
                    {pendiente ? (
                        <div className="text-center mt-4">
                            <Spinner color="primary" />
                            <p className="mt-2">Cargando...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={usuarios}
                            pagination
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center p-4">
                                    <Users size={48} className="mb-3 text-muted" />
                                    <p>No hay usuarios registrados</p>
                                </div>
                            }
                        />
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={verModal} toggle={cerrarModal}>
                <ModalHeader toggle={cerrarModal}>{modoEdicion ? 'Editar Usuario' : 'Crear Usuario'}</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="nombre"><User className="mr-2" /> Nombre</Label>
                        <Input type="text" id="nombre" name="nombre" value={usuario.nombre} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="apellido"><User className="mr-2" /> Apellido</Label>
                        <Input type="text" id="apellido" name="apellido" value={usuario.apellido} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="email"><Mail className="mr-2" /> Email</Label>
                        <Input type="email" id="email" name="email" value={usuario.email} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="role"><Users className="mr-2" /> Rol</Label>
                        <Input type="select" id="role" name="role" value={usuario.role} onChange={handleChange}>
                            <option value="">Seleccione un rol</option>
                            {roles.map((rol, index) => (
                                <option key={index} value={rol}>{rol}</option>
                            ))}
                        </Input>
                    </FormGroup>
                    <FormGroup>
                        <Label for="password"><Key className="mr-2" /> Contraseña</Label>
                        <div className="input-group">
                            <Input
                                type={verPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={usuario.password}
                                onChange={handleChange}
                            />
                            <Button color="secondary" onClick={togglePasswordVisibility}>
                                {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                        </div>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={cerrarModal}>Cancelar</Button>
                    <Button color="primary" onClick={modoEdicion ? handleActualizar : handleCrear}>
                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}

export default RegistroUsuario;