import MiPerfil from "../components/MiPerfil";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    consultarMisProductos, crearProducto, actualizarProducto, eliminarProducto,
    consultarMisSolicitudes, consultarFerias, consultarEdicionesFeria, consultarLugares,
} from "../services/api";
import { describirEdicion, formatearFecha } from "../utils/helpers";

function PanelArtesano() {
    const { usuario } = useAuth();

    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [error, setError] = useState(null);

    const [formulario, setFormulario] = useState({ nombre: "", precio: "", cantidad: "" });
    const [editandoId, setEditandoId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const [solicitudes, setSolicitudes] = useState([]);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);

    const [ferias, setFerias] = useState([]);
    const [ediciones, setEdiciones] = useState([]);
    const [lugares, setLugares] = useState([]);

    async function cargarProductos() {
        try {
            const datos = await consultarMisProductos(usuario.token);
            setProductos(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargandoProductos(false);
        }
    }

    async function cargarSolicitudes() {
        try {
            const datos = await consultarMisSolicitudes(usuario.token);
            setSolicitudes(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargandoSolicitudes(false);
        }
    }

    async function cargarReferencias() {
        try {
            const [datosFerias, datosEdiciones, datosLugares] = await Promise.all([
                consultarFerias(),
                consultarEdicionesFeria(),
                consultarLugares(),
            ]);
            setFerias(datosFerias);
            setEdiciones(datosEdiciones);
            setLugares(datosLugares);
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        cargarProductos();
        cargarSolicitudes();
        cargarReferencias();
    }, []);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    function iniciarEdicion(producto) {
        setEditandoId(producto.id);
        setFormulario({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: producto.cantidad,
        });
    }

    function cancelarEdicion() {
        setEditandoId(null);
        setFormulario({ nombre: "", precio: "", cantidad: "" });
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setGuardando(true);

        const datos = {
            nombre: formulario.nombre,
            precio: Number(formulario.precio),
            cantidad: Number(formulario.cantidad),
        };

        try {
            if (editandoId) {
                await actualizarProducto(editandoId, datos, usuario.token);
            } else {
                await crearProducto(datos, usuario.token);
            }
            cancelarEdicion();
            await cargarProductos();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    async function manejarEliminar(idProducto) {
        setError(null);
        try {
            await eliminarProducto(idProducto, usuario.token);
            await cargarProductos();
        } catch (err) {
            setError(err.message);
        }
    }

    function colorEstado(estado) {
        if (estado === "APROBADA") return "bg-green-100 text-green-800";
        if (estado === "RECHAZADA") return "bg-red-100 text-red-800";
        return "bg-amber-100 text-amber-800";
    }

    const campoClase =
        "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Mi panel</h2>
            <p className="text-gray-500 mb-8">Bienvenido, {usuario.nombre}</p>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-6">{error}</p>
            )}
            <MiPerfil />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Mis solicitudes de participación</h3>

                {cargandoSolicitudes && <p className="text-gray-500 text-sm">Cargando...</p>}

                {!cargandoSolicitudes && solicitudes.length === 0 && (
                    <p className="text-gray-500 text-sm">Aún no has solicitado participar en ninguna feria.</p>
                )}

                <div className="flex flex-col gap-2">
                    {solicitudes.map((solicitud) => (
                        <div
                            key={solicitud.id}
                            className="flex items-center justify-between gap-4 border border-gray-100 rounded-lg px-4 py-3"
                        >
                            <div>
                                <p className="text-sm text-gray-700">
                                    {describirEdicion(solicitud.idEdicionFeria, ediciones, ferias, lugares)}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Solicitada el {formatearFecha(solicitud.fechaInscripcion)}
                                </p>
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${colorEstado(solicitud.estado)}`}>
                                {solicitud.estado}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {editandoId ? "Editar producto" : "Agregar producto"}
                </h3>

                <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            required
                            className={campoClase}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                        <input
                            type="number"
                            name="precio"
                            value={formulario.precio}
                            onChange={manejarCambio}
                            required
                            min="0"
                            step="0.01"
                            className={campoClase}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input
                            type="number"
                            name="cantidad"
                            value={formulario.cantidad}
                            onChange={manejarCambio}
                            required
                            min="0"
                            className={campoClase}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {guardando ? "Guardando..." : editandoId ? "Actualizar" : "Agregar"}
                        </button>
                        {editandoId && (
                            <button
                                type="button"
                                onClick={cancelarEdicion}
                                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mis productos</h3>

            {cargandoProductos && <p className="text-gray-500 text-sm">Cargando productos...</p>}

            {!cargandoProductos && productos.length === 0 && (
                <p className="text-gray-500 text-sm">Aún no has registrado productos.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productos.map((producto) => (
                    <div key={producto.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <h4 className="font-semibold text-gray-800 mb-1">{producto.nombre}</h4>
                        <p className="text-sm text-gray-500">Precio: ${producto.precio}</p>
                        <p className="text-sm text-gray-500 mb-3">Cantidad: {producto.cantidad}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => iniciarEdicion(producto)}
                                className="text-sm text-green-600 font-medium hover:underline"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => manejarEliminar(producto.id)}
                                className="text-sm text-red-600 font-medium hover:underline"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PanelArtesano;