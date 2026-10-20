import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { iniciarSesion } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { destinoPorRol } from "../utils/helpers";
import { Boton, Campo, Alerta } from "../components/ui";
import ReenviarVerificacion from "../components/ReenviarVerificacion";
import logo from "../assets/logo-sgfa.png";

function Login() {
    const { usuario, iniciarSesionContexto } = useAuth();
    const { state } = useLocation();

    const [correoElectronico, setCorreoElectronico] = useState(state?.correo ?? "");
    const [contrasena, setContrasena] = useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState(null);
    const [sinConfirmar, setSinConfirmar] = useState(false);
    const [cargando, setCargando] = useState(false);

    if (usuario) {
        return <Navigate to={destinoPorRol(usuario.rol)} replace />;
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setSinConfirmar(false);
        setCargando(true);

        try {
            const resultado = await iniciarSesion(correoElectronico, contrasena);
            iniciarSesionContexto(resultado);
        } catch (err) {
            setError(err.message);
            setSinConfirmar(err.codigo === "CORREO_NO_VERIFICADO");
            setCargando(false);
        }
    }

    return (
        <div className="flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <img src={logo} alt="" className="h-14 w-14 mx-auto mb-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h2>
                    <p className="text-sm text-gray-500 mt-1">Accede a tu cuenta de SGFA</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    {state?.verificado && (
                        <Alerta tipo="exito" className="mb-4">
                            Tu correo fue confirmado. Ya puedes iniciar sesión.
                        </Alerta>
                    )}
                    {state?.restablecida && (
                        <Alerta tipo="exito" className="mb-4">
                            Tu contraseña fue actualizada. Inicia sesión con la nueva.
                        </Alerta>
                    )}

                    <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                        <Campo
                            etiqueta="Correo electrónico"
                            type="email"
                            value={correoElectronico}
                            onChange={(e) => setCorreoElectronico(e.target.value)}
                            required
                            autoComplete="email"
                            autoFocus={!state?.correo}
                        />

                        <Campo
                            etiqueta="Contraseña"
                            type={verContrasena ? "text" : "password"}
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                            autoComplete="current-password"
                            autoFocus={Boolean(state?.correo)}
                        />

                        <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={verContrasena}
                                    onChange={(e) => setVerContrasena(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                Mostrar contraseña
                            </label>
                            <Link
                                to="/olvide-contrasena"
                                className="text-sm font-medium text-green-700 hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <Alerta tipo={sinConfirmar ? "aviso" : "error"}>{error}</Alerta>

                        <Boton type="submit" cargando={cargando} className="w-full">
                            {cargando ? "Ingresando..." : "Ingresar"}
                        </Boton>
                    </form>

                    {sinConfirmar && <ReenviarVerificacion correo={correoElectronico} />}
                </div>

                <p className="mt-6 text-sm text-gray-500 text-center">
                    ¿No tienes cuenta?{" "}
                    <Link to="/registro" className="text-green-700 font-medium hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;