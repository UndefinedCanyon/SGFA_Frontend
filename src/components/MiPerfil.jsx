import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { consultarMiPerfil, actualizarMiPerfil } from "../services/api";

function MiPerfil() {
    const { usuario, actualizarUsuario } = useAuth();

    const [perfil, setPerfil] = useState(null);
    const [formulario, setFormulario] = useState({
        nombre: "",
        telefono: "",
        nombreEmprendimiento: "",
        descripcionCorta: "",
    });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        async function cargarPerfil() {
            try {
                const datos = await consultarMiPerfil(usuario.token);
                setPerfil(datos);
                setFormulario({
                    nombre: datos.nombre ?? "",
                    telefono: datos.telefono ?? "",
                    nombreEmprendimiento: datos.nombreEmprendimiento ?? "",
                    descripcionCorta: datos.descripcionCorta ?? "",
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarPerfil();
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
            const actualizado = await actualizarMiPerfil(formulario, usuario.token);
            setPerfil(actualizado);
            actualizarUsuario({ nombre: actualizado.nombre });
            setMensaje("Perfil actualizado correctamente.");
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    const campoClase =
        "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
    const campoBloqueadoClase =
        "w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm";
    const labelClase = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mi perfil</h3>

            {cargando && <p className="text-gray-500 text-sm">Cargando...</p>}

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
            )}

            {perfil && (
                <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClase}>Correo electrónico</label>
                        <input type="text" value={perfil.correoElectronico} disabled className={campoBloqueadoClase} />
                    </div>
                    <div>
                        <label className={labelClase}>Cédula</label>
                        <input type="text" value={perfil.cc} disabled className={campoBloqueadoClase} />
                    </div>

                    <div>
                        <label className={labelClase}>Nombre completo</label>
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
                        <label className={labelClase}>Teléfono</label>
                        <input
                            type="text"
                            name="telefono"
                            value={formulario.telefono}
                            onChange={manejarCambio}
                            className={campoClase}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelClase}>Nombre del emprendimiento</label>
                        <input
                            type="text"
                            name="nombreEmprendimiento"
                            value={formulario.nombreEmprendimiento}
                            onChange={manejarCambio}
                            required
                            className={campoClase}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelClase}>Descripción corta</label>
                        <textarea
                            name="descripcionCorta"
                            value={formulario.descripcionCorta}
                            onChange={manejarCambio}
                            rows={3}
                            className={campoClase}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={guardando}
                        className="sm:col-span-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </button>

                    <p className="sm:col-span-2 text-xs text-gray-400">
                        El correo y la cédula no se pueden modificar desde aquí.
                    </p>
                </form>
            )}

            {mensaje && (
                <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3">{mensaje}</p>
            )}
        </div>
    );
}

export default MiPerfil;