import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { registrarArtesano } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { destinoPorRol } from "../utils/helpers";
import { Boton, Campo, Alerta } from "../components/ui";
import ReenviarVerificacion from "../components/ReenviarVerificacion";

const FORMULARIO_VACIO = {
    nombre: "",
    correoElectronico: "",
    contrasena: "",
    cc: "",
    telefono: "",
    nombreEmprendimiento: "",
    descripcionCorta: "",
};

function RegistroArtesano() {
    const { usuario } = useAuth();

    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [registrado, setRegistrado] = useState(null);

    if (usuario) {
        return <Navigate to={destinoPorRol(usuario.rol)} replace />;
    }

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setCargando(true);

        try {
            const creado = await registrarArtesano(formulario);
            setRegistrado(creado.correoElectronico);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    if (registrado) {
        return (
            <div className="flex justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                        <div
                            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600"
                            aria-hidden="true"
                        >
                            <svg
                                className="h-7 w-7"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="M3 7l9 6 9-6" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-semibold text-gray-900">Revisa tu correo</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Te enviamos un enlace de confirmación a{" "}
                            <span className="font-semibold text-gray-900">{registrado}</span>. Ábrelo para
                            activar tu cuenta. El enlace vence en 24 horas.
                        </p>
                        <p className="mt-3 text-xs text-gray-500">
                            ¿No lo ves? Mira en la carpeta de spam o pide otro.
                        </p>

                        <ReenviarVerificacion correo={registrado} />

                        <Link
                            to="/login"
                            state={{ correo: registrado }}
                            className="mt-5 inline-block text-sm font-medium text-green-700 hover:underline"
                        >
                            Ya confirmé mi correo, iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Registro de artesano</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Únete a las ferias artesanales de Fusagasugá
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Campo
                            className="sm:col-span-2"
                            etiqueta="Nombre completo"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            required
                            maxLength={100}
                            autoComplete="name"
                            autoFocus
                        />

                        <Campo
                            etiqueta="Correo electrónico"
                            type="email"
                            name="correoElectronico"
                            value={formulario.correoElectronico}
                            onChange={manejarCambio}
                            required
                            maxLength={150}
                            autoComplete="email"
                            ayuda="Usa un correo real: te enviaremos un enlace para confirmarlo."
                        />

                        <Campo
                            etiqueta="Contraseña"
                            type={verContrasena ? "text" : "password"}
                            name="contrasena"
                            value={formulario.contrasena}
                            onChange={manejarCambio}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            ayuda="Mínimo 8 caracteres."
                        />

                        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={verContrasena}
                                onChange={(e) => setVerContrasena(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            Mostrar contraseña
                        </label>

                        <Campo
                            etiqueta="Cédula"
                            name="cc"
                            value={formulario.cc}
                            onChange={manejarCambio}
                            required
                            maxLength={20}
                            inputMode="numeric"
                        />

                        <Campo
                            etiqueta="Teléfono"
                            type="tel"
                            name="telefono"
                            value={formulario.telefono}
                            onChange={manejarCambio}
                            maxLength={20}
                            autoComplete="tel"
                        />

                        <Campo
                            className="sm:col-span-2"
                            etiqueta="Nombre del emprendimiento"
                            name="nombreEmprendimiento"
                            value={formulario.nombreEmprendimiento}
                            onChange={manejarCambio}
                            required
                            maxLength={150}
                        />

                        <Campo
                            className="sm:col-span-2"
                            etiqueta="Descripción corta"
                            as="textarea"
                            name="descripcionCorta"
                            value={formulario.descripcionCorta}
                            onChange={manejarCambio}
                            rows={3}
                            maxLength={300}
                            ayuda="Cuéntale al público qué haces. Se muestra en las ferias en las que participes."
                        />

                        <Alerta tipo="error" className="sm:col-span-2">
                            {error}
                        </Alerta>

                        <Boton type="submit" cargando={cargando} className="sm:col-span-2">
                            {cargando ? "Registrando..." : "Crear mi cuenta"}
                        </Boton>
                    </form>
                </div>

                <p className="mt-6 text-sm text-gray-500 text-center">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-green-700 font-medium hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegistroArtesano;