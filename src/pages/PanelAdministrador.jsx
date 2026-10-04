import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    crearFeria, consultarTodasLasSolicitudes, aprobarSolicitud, rechazarSolicitud,
} from "../services/api";

function PanelAdministrador() {
    const { usuario } = useAuth();

    const [nombreFeria, setNombreFeria] = useState("");
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const [solicitudes, setSolicitudes] = useState([]);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
    const [procesandoId, setProcesandoId] = useState(null);

    async function cargarSolicitudes() {
        try {
            const datos = await consultarTodasLasSolicitudes(usuario.token);
            setSolicitudes(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargandoSolicitudes(false);
        }
    }

    useEffect(() => {
        cargarSolicitudes();
    }, []);

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setMensaje(null);
        setError(null);
        setCargando(true);

        try {
            const feriaCreada = await crearFeria(nombreFeria, usuario.id, usuario.token);
            setMensaje(`Feria "${feriaCreada.nombreFeria}" creada con éxito.`);
            setNombreFeria("");
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    async function manejarAprobar(idInscripcion) {
        setError(null);
        setProcesandoId(idInscripcion);
        try {
            await aprobarSolicitud(idInscripcion, usuario.token);
            await cargarSolicitudes();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesandoId(null);
        }
    }

    async function manejarRechazar(idInscripcion) {
        setError(null);
        setProcesandoId(idInscripcion);
        try {
            await rechazarSolicitud(idInscripcion, usuario.token);
            await cargarSolicitudes();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesandoId(null);
        }
    }

    function colorEstado(estado) {
        if (estado === "APROBADA") return "bg-green-100 text-green-800";
        if (estado === "RECHAZADA") return "bg-red-100 text-red-800";
        return "bg-amber-100 text-amber-800";
    }

    const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE");
    const resueltas = solicitudes.filter((s) => s.estado !== "PENDIENTE");

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Panel de Administrador</h2>
            <p className="text-gray-500 mb-8">Bienvenido, {usuario.nombre}</p>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-6">{error}</p>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Solicitudes pendientes {pendientes.length > 0 && `(${pendientes.length})`}
                </h3>

                {cargandoSolicitudes && <p className="text-gray-500 text-sm">Cargando...</p>}

                {!cargandoSolicitudes && pendientes.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay solicitudes pendientes por revisar.</p>
                )}

                <div className="flex flex-col gap-2">
                    {pendientes.map((solicitud) => (
                        <div
                            key={solicitud.id}
                            className="flex items-center justify-between border border-amber-100 bg-amber-50 rounded-lg px-4 py-3"
                        >
                            <span className="text-sm text-gray-700">
                                Artesano #{solicitud.idArtesano} — Edición #{solicitud.idEdicionFeria}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => manejarAprobar(solicitud.id)}
                                    disabled={procesandoId === solicitud.id}
                                    className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    Aprobar
                                </button>
                                <button
                                    onClick={() => manejarRechazar(solicitud.id)}
                                    disabled={procesandoId === solicitud.id}
                                    className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {resueltas.length > 0 && (
                    <>
                        <h4 className="text-sm font-semibold text-gray-600 mt-6 mb-2">Ya resueltas</h4>
                        <div className="flex flex-col gap-2">
                            {resueltas.map((solicitud) => (
                                <div
                                    key={solicitud.id}
                                    className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2"
                                >
                                    <span className="text-sm text-gray-500">
                                        Artesano #{solicitud.idArtesano} — Edición #{solicitud.idEdicionFeria}
                                    </span>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorEstado(solicitud.estado)}`}>
                                        {solicitud.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear nueva feria</h3>

                <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la feria
                        </label>
                        <input
                            type="text"
                            value={nombreFeria}
                            onChange={(e) => setNombreFeria(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {cargando ? "Creando..." : "Crear feria"}
                    </button>
                </form>

                {mensaje && (
                    <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3">{mensaje}</p>
                )}
            </div>
        </div>
    );
}

export default PanelAdministrador;