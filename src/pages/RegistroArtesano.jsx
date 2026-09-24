import { useState } from "react";
import { Link } from "react-router-dom";
import { registrarArtesano } from "../services/api";

function RegistroArtesano() {
    const [formulario, setFormulario] = useState({
        nombre: "",
        correoElectronico: "",
        contrasena: "",
        cc: "",
        telefono: "",
        nombreEmprendimiento: "",
        descripcionCorta: "",
    });

    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setMensaje(null);
        setError(null);
        setCargando(true);

        try {
            const artesanoCreado = await registrarArtesano(formulario);
            setMensaje(`Artesano "${artesanoCreado.nombreEmprendimiento}" registrado con éxito.`);
            setFormulario({
                nombre: "",
                correoElectronico: "",
                contrasena: "",
                cc: "",
                telefono: "",
                nombreEmprendimiento: "",
                descripcionCorta: "",
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    const campoClase =
        "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
    const labelClase = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-10">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-md border border-green-100 p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">Registro de Artesano</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Únete a las ferias artesanales de Fusagasugá
                </p>

                <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
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
                        <label className={labelClase}>Correo electrónico</label>
                        <input
                            type="email"
                            name="correoElectronico"
                            value={formulario.correoElectronico}
                            onChange={manejarCambio}
                            required
                            className={campoClase}
                        />
                    </div>

                    <div>
                        <label className={labelClase}>Contraseña</label>
                        <input
                            type="password"
                            name="contrasena"
                            value={formulario.contrasena}
                            onChange={manejarCambio}
                            required
                            className={campoClase}
                        />
                    </div>

                    <div>
                        <label className={labelClase}>Cédula</label>
                        <input
                            type="text"
                            name="cc"
                            value={formulario.cc}
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
                        disabled={cargando}
                        className="sm:col-span-2 mt-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {cargando ? "Registrando..." : "Registrarse"}
                    </button>
                </form>

                {mensaje && (
                    <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3">{mensaje}</p>
                )}
                {error && (
                    <p className="mt-4 text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>
                )}

                <p className="mt-6 text-sm text-gray-500 text-center">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-green-600 font-medium hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegistroArtesano;