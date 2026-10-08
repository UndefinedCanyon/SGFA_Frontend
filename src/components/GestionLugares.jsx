import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { consultarLugares, crearLugar } from "../services/api";

function GestionLugares({ onLugarCreado }) {
    const { usuario } = useAuth();

    const [lugares, setLugares] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [formulario, setFormulario] = useState({ nombre: "", direccion: "" });

    async function cargarLugares() {
        try {
            const datos = await consultarLugares();
            setLugares(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarLugares();
    }, []);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);
        setGuardando(true);

        try {
            const lugarCreado = await crearLugar(formulario.nombre, formulario.direccion, usuario.token);
            setMensaje(`Lugar "${lugarCreado.nombre}" creado con éxito.`);
            setFormulario({ nombre: "", direccion: "" });
            await cargarLugares();
            if (onLugarCreado) onLugarCreado();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    const campoClase =
        "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lugares</h3>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
            )}

            <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                        type="text"
                        name="direccion"
                        value={formulario.direccion}
                        onChange={manejarCambio}
                        required
                        className={campoClase}
                    />
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {guardando ? "Guardando..." : "Agregar lugar"}
                    </button>
                </div>
            </form>

            {mensaje && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">{mensaje}</p>
            )}

            {cargando && <p className="text-gray-500 text-sm">Cargando...</p>}

            <div className="flex flex-col gap-2">
                {lugares.map((lugar) => (
                    <div key={lugar.id} className="border border-gray-100 rounded-lg px-4 py-2">
                        <p className="text-sm font-medium text-gray-700">{lugar.nombre}</p>
                        <p className="text-xs text-gray-500">{lugar.direccion}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GestionLugares;