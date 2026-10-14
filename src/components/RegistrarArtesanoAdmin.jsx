import { useState } from "react";
import { registrarArtesano } from "../services/api";

const FORMULARIO_VACIO = {
    nombre: "",
    correoElectronico: "",
    contrasena: "",
    cc: "",
    telefono: "",
    nombreEmprendimiento: "",
    descripcionCorta: "",
};

function RegistrarArtesanoAdmin({ onArtesanoCreado }) {
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

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
            const creado = await registrarArtesano(formulario);
            setMensaje(
                `Artesano "${creado.nombreEmprendimiento}" registrado. Entrégale su correo y la contraseña inicial para que pueda iniciar sesión.`
            );
            setFormulario(FORMULARIO_VACIO);
            if (onArtesanoCreado) await onArtesanoCreado();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    const campoClase =
        "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
    const labelClase = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar artesano</h3>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
            )}

            <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClase}>Nombre completo</label>
                    <input type="text" name="nombre" value={formulario.nombre}
                        onChange={manejarCambio} required className={campoClase} />
                </div>
                <div>
                    <label className={labelClase}>Cédula</label>
                    <input type="text" name="cc" value={formulario.cc}
                        onChange={manejarCambio} required className={campoClase} />
                </div>

                <div>
                    <label className={labelClase}>Correo electrónico</label>
                    <input type="email" name="correoElectronico" value={formulario.correoElectronico}
                        onChange={manejarCambio} required className={campoClase} />
                </div>
                <div>
                    <label className={labelClase}>Contraseña inicial</label>
                    <input type="text" name="contrasena" value={formulario.contrasena}
                        onChange={manejarCambio} required className={campoClase} />
                </div>

                <div>
                    <label className={labelClase}>Teléfono</label>
                    <input type="text" name="telefono" value={formulario.telefono}
                        onChange={manejarCambio} className={campoClase} />
                </div>
                <div>
                    <label className={labelClase}>Nombre del emprendimiento</label>
                    <input type="text" name="nombreEmprendimiento" value={formulario.nombreEmprendimiento}
                        onChange={manejarCambio} required className={campoClase} />
                </div>

                <div className="sm:col-span-2">
                    <label className={labelClase}>Descripción corta</label>
                    <textarea name="descripcionCorta" value={formulario.descripcionCorta}
                        onChange={manejarCambio} rows={2} className={campoClase} />
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="sm:col-span-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {guardando ? "Registrando..." : "Registrar artesano"}
                </button>
            </form>

            {mensaje && (
                <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3">{mensaje}</p>
            )}
        </div>
    );
}

export default RegistrarArtesanoAdmin;