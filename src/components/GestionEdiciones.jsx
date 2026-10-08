import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    consultarTodasLasFerias, consultarLugares, consultarTodasLasEdiciones,
    crearEdicionFeria, cambiarEstadoEdicion,
} from "../services/api";

function GestionEdiciones({ version }) {
    const { usuario } = useAuth();

    const [ferias, setFerias] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [ediciones, setEdiciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [cambiandoId, setCambiandoId] = useState(null);
    const [formulario, setFormulario] = useState({
        idFeria: "", idLugar: "", fechaInicio: "", fechaFin: "",
    });

    async function cargarDatos() {
        try {
            const [datosFerias, datosLugares, datosEdiciones] = await Promise.all([
                consultarTodasLasFerias(usuario.token),
                consultarLugares(),
                consultarTodasLasEdiciones(usuario.token),
            ]);
            setFerias(datosFerias);
            setLugares(datosLugares);
            setEdiciones(datosEdiciones);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarDatos();
    }, [version]);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);

        if (formulario.fechaFin < formulario.fechaInicio) {
            setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
            return;
        }

        setGuardando(true);
        try {
            await crearEdicionFeria(
                {
                    idFeria: Number(formulario.idFeria),
                    idLugar: Number(formulario.idLugar),
                    fechaInicio: formulario.fechaInicio,
                    fechaFin: formulario.fechaFin,
                },
                usuario.token
            );
            setMensaje("Edición creada con éxito.");
            setFormulario({ idFeria: "", idLugar: "", fechaInicio: "", fechaFin: "" });
            await cargarDatos();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    async function manejarEstado(idEdicion, nuevoEstado) {
        setError(null);
        setCambiandoId(idEdicion);
        try {
            await cambiarEstadoEdicion(idEdicion, nuevoEstado, usuario.token);
            await cargarDatos();
        } catch (err) {
            setError(err.message);
        } finally {
            setCambiandoId(null);
        }
    }

    function nombreFeria(id) {
        return ferias.find((f) => f.id === id)?.nombreFeria ?? `Feria #${id}`;
    }

    function nombreLugar(id) {
        return lugares.find((l) => l.id === id)?.nombre ?? `Lugar #${id}`;
    }

    function formatearFecha(fechaISO) {
        const [anio, mes, dia] = fechaISO.split("-");
        return `${dia}/${mes}/${anio}`;
    }

    const campoClase =
        "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
    const labelClase = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ediciones de feria</h3>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
            )}

            <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className={labelClase}>Feria</label>
                    <select
                        name="idFeria"
                        value={formulario.idFeria}
                        onChange={manejarCambio}
                        required
                        className={campoClase}
                    >
                        <option value="">Selecciona una feria</option>
                        {ferias.filter((f) => f.activo).map((feria) => (
                            <option key={feria.id} value={feria.id}>{feria.nombreFeria}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClase}>Lugar</label>
                    <select
                        name="idLugar"
                        value={formulario.idLugar}
                        onChange={manejarCambio}
                        required
                        className={campoClase}
                    >
                        <option value="">Selecciona un lugar</option>
                        {lugares.map((lugar) => (
                            <option key={lugar.id} value={lugar.id}>{lugar.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClase}>Fecha de inicio</label>
                    <input
                        type="date"
                        name="fechaInicio"
                        value={formulario.fechaInicio}
                        onChange={manejarCambio}
                        required
                        className={campoClase}
                    />
                </div>
                <div>
                    <label className={labelClase}>Fecha de fin</label>
                    <input
                        type="date"
                        name="fechaFin"
                        value={formulario.fechaFin}
                        onChange={manejarCambio}
                        min={formulario.fechaInicio}
                        required
                        className={campoClase}
                    />
                </div>
                <button
                    type="submit"
                    disabled={guardando}
                    className="sm:col-span-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {guardando ? "Guardando..." : "Crear edición"}
                </button>
            </form>

            {mensaje && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">{mensaje}</p>
            )}

            {cargando && <p className="text-gray-500 text-sm">Cargando...</p>}

            <div className="flex flex-col gap-2">
                {ediciones.map((edicion) => (
                    <div
                        key={edicion.id}
                        className={`flex items-center justify-between border rounded-lg px-4 py-3 ${
                            edicion.activo ? "border-gray-100" : "border-red-100 bg-red-50"
                        }`}
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                {nombreFeria(edicion.idFeria)}{" "}
                                {!edicion.activo && (
                                    <span className="text-xs text-red-600 font-medium">(inactiva)</span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatearFecha(edicion.fechaInicio)} — {formatearFecha(edicion.fechaFin)}
                                {" · "}{nombreLugar(edicion.idLugar)}
                            </p>
                        </div>
                        <button
                            onClick={() => manejarEstado(edicion.id, !edicion.activo)}
                            disabled={cambiandoId === edicion.id}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                edicion.activo
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                        >
                            {edicion.activo ? "Desactivar" : "Reactivar"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GestionEdiciones;