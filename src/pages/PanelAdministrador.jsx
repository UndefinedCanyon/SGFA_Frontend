import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { crearFeria } from "../services/api";

function PanelAdministrador() {
    const { usuario } = useAuth();
    const [nombreFeria, setNombreFeria] = useState("");
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

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

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Panel de Administrador</h2>
            <p className="text-gray-500 mb-8">Bienvenido, {usuario.nombre}</p>

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
                {error && (
                    <p className="mt-4 text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>
                )}
            </div>
        </div>
    );
}

export default PanelAdministrador;