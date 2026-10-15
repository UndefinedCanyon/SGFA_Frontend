import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { registrarArtesano } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { destinoPorRol } from "../utils/helpers";
import { Boton, Campo, Alerta } from "../components/ui";

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
    const navigate = useNavigate();

    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

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
            await registrarArtesano(formulario);
            navigate("/login", {
                state: { registrado: true, correo: formulario.correoElectronico },
            });
        } catch (err) {
            setError(err.message);
            setCargando(false);
        }
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
                            autoComplete="email"
                        />

                        <Campo
                            etiqueta="Contraseña"
                            type={verContrasena ? "text" : "password"}
                            name="contrasena"
                            value={formulario.contrasena}
                            onChange={manejarCambio}
                            required
                            autoComplete="new-password"
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
                            inputMode="numeric"
                        />

                        <Campo
                            etiqueta="Teléfono"
                            type="tel"
                            name="telefono"
                            value={formulario.telefono}
                            onChange={manejarCambio}
                            autoComplete="tel"
                        />

                        <Campo
                            className="sm:col-span-2"
                            etiqueta="Nombre del emprendimiento"
                            name="nombreEmprendimiento"
                            value={formulario.nombreEmprendimiento}
                            onChange={manejarCambio}
                            required
                        />

                        <Campo
                            className="sm:col-span-2"
                            etiqueta="Descripción corta"
                            as="textarea"
                            name="descripcionCorta"
                            value={formulario.descripcionCorta}
                            onChange={manejarCambio}
                            rows={3}
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