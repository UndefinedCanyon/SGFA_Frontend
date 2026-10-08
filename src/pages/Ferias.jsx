import { useState, useEffect } from "react";
import {
    consultarFerias, consultarEdicionesFeria, consultarLugares,
    solicitarParticipacion, consultarParticipantes,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

function Ferias() {
    const { usuario } = useAuth();

    const [ferias, setFerias] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [feriaSeleccionada, setFeriaSeleccionada] = useState(null);
    const [ediciones, setEdiciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoEdiciones, setCargandoEdiciones] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [solicitandoId, setSolicitandoId] = useState(null);

    const [edicionAbiertaId, setEdicionAbiertaId] = useState(null);
    const [participantes, setParticipantes] = useState([]);
    const [cargandoParticipantes, setCargandoParticipantes] = useState(false);

    useEffect(() => {
        async function cargarDatos() {
            try {
                const [datosFerias, datosLugares] = await Promise.all([
                    consultarFerias(),
                    consultarLugares(),
                ]);
                setFerias(datosFerias);
                setLugares(datosLugares);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarDatos();
    }, []);

    async function verEdiciones(feria) {
        setFeriaSeleccionada(feria);
        setEdiciones([]);
        setEdicionAbiertaId(null);
        setParticipantes([]);
        setMensaje(null);
        setError(null);
        setCargandoEdiciones(true);
        try {
            const datos = await consultarEdicionesFeria(feria.id);
            setEdiciones(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargandoEdiciones(false);
        }
    }

    async function alternarParticipantes(idEdicion) {
        if (edicionAbiertaId === idEdicion) {
            setEdicionAbiertaId(null);
            setParticipantes([]);
            return;
        }

        setError(null);
        setEdicionAbiertaId(idEdicion);
        setParticipantes([]);
        setCargandoParticipantes(true);
        try {
            const datos = await consultarParticipantes(idEdicion);
            setParticipantes(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargandoParticipantes(false);
        }
    }

    async function manejarSolicitud(idEdicionFeria) {
        setMensaje(null);
        setError(null);
        setSolicitandoId(idEdicionFeria);
        try {
            await solicitarParticipacion(idEdicionFeria, usuario.token);
            setMensaje("Solicitud enviada correctamente. Queda pendiente de revisión.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSolicitandoId(null);
        }
    }

    function nombreLugar(id) {
        return lugares.find((l) => l.id === id)?.nombre ?? `Lugar #${id}`;
    }

    function formatearFecha(fechaISO) {
        const [anio, mes, dia] = fechaISO.split("-");
        return `${dia}/${mes}/${anio}`;
    }

    function formatearPrecio(valor) {
        return Number(valor).toLocaleString("es-CO");
    }

    if (cargando) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
                Cargando ferias...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <h2 className="text-3xl font-semibold text-gray-800 mb-1">Ferias artesanales</h2>
            <p className="text-gray-500 mb-8">
                Explora las ferias disponibles, sus próximas ediciones y los artesanos que participan
            </p>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-6">{error}</p>
            )}
            {mensaje && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-6">{mensaje}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ferias.map((feria) => (
                    <div
                        key={feria.id}
                        className={`bg-white rounded-2xl shadow-sm border p-6 transition-all cursor-pointer hover:shadow-md ${
                            feriaSeleccionada?.id === feria.id
                                ? "border-green-500 ring-2 ring-green-100"
                                : "border-gray-200"
                        }`}
                        onClick={() => verEdiciones(feria)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                                {feria.nombreFeria.charAt(0)}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                {feria.nombreFeria}
                            </h3>
                        </div>
                        <button className="text-sm text-green-600 font-medium hover:underline">
                            Ver ediciones →
                        </button>
                    </div>
                ))}
            </div>

            {ferias.length === 0 && (
                <p className="text-gray-500 mt-6">Aún no hay ferias registradas.</p>
            )}

            {feriaSeleccionada && (
                <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Ediciones de "{feriaSeleccionada.nombreFeria}"
                    </h3>

                    {cargandoEdiciones && (
                        <p className="text-gray-500 text-sm">Cargando ediciones...</p>
                    )}

                    {!cargandoEdiciones && ediciones.length === 0 && (
                        <p className="text-gray-500 text-sm">
                            Esta feria no tiene ediciones registradas.
                        </p>
                    )}

                    <div className="flex flex-col gap-4">
                        {ediciones.map((edicion) => (
                            <div
                                key={edicion.id}
                                className="border border-green-100 bg-green-50 rounded-xl p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {formatearFecha(edicion.fechaInicio)} — {formatearFecha(edicion.fechaFin)}
                                        </p>
                                        <p className="text-sm text-gray-500">{nombreLugar(edicion.idLugar)}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => alternarParticipantes(edicion.id)}
                                            className="text-sm border border-green-600 text-green-700 px-4 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                        >
                                            {edicionAbiertaId === edicion.id ? "Ocultar participantes" : "Ver participantes"}
                                        </button>

                                        {usuario?.rol === "ARTESANO" && (
                                            <button
                                                onClick={() => manejarSolicitud(edicion.id)}
                                                disabled={solicitandoId === edicion.id}
                                                className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {solicitandoId === edicion.id ? "Enviando..." : "Solicitar participación"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {edicionAbiertaId === edicion.id && (
                                    <div className="mt-4 pt-4 border-t border-green-100">
                                        {cargandoParticipantes && (
                                            <p className="text-gray-500 text-sm">Cargando participantes...</p>
                                        )}

                                        {!cargandoParticipantes && participantes.length === 0 && (
                                            <p className="text-gray-500 text-sm">
                                                Aún no hay artesanos confirmados en esta edición.
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {participantes.map((participante) => (
                                                <div
                                                    key={participante.id}
                                                    className="bg-white border border-gray-100 rounded-xl p-4"
                                                >
                                                    <h4 className="font-semibold text-gray-800">
                                                        {participante.nombreEmprendimiento}
                                                    </h4>
                                                    {participante.descripcionCorta && (
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            {participante.descripcionCorta}
                                                        </p>
                                                    )}

                                                    {participante.productos.length === 0 ? (
                                                        <p className="text-xs text-gray-400">
                                                            Sin productos publicados.
                                                        </p>
                                                    ) : (
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {participante.productos.map((producto) => (
                                                                <li
                                                                    key={producto.id}
                                                                    className="flex justify-between text-sm text-gray-600"
                                                                >
                                                                    <span>{producto.nombre}</span>
                                                                    <span className="text-gray-500">
                                                                        ${formatearPrecio(producto.precio)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ferias;