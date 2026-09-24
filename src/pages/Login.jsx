import { useState } from "react";
import { Link } from "react-router-dom";
import { iniciarSesion } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
    const [correoElectronico, setCorreoElectronico] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const { usuario, iniciarSesionContexto } = useAuth();

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setCargando(true);

        try {
            const resultado = await iniciarSesion(correoElectronico, contrasena);
            iniciarSesionContexto(resultado);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-green-100 p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">Iniciar sesión</h2>
                <p className="text-sm text-gray-500 mb-6">Accede a tu cuenta de SGFA</p>

                <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            value={correoElectronico}
                            onChange={(e) => setCorreoElectronico(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                {usuario && (
                    <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                        Bienvenido/a, {usuario.nombre} (rol: {usuario.rol})
                    </p>
                )}
                {error && (
                    <p className="mt-4 text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>
                )}

                <p className="mt-6 text-sm text-gray-500 text-center">
                    ¿No tienes cuenta?{" "}
                    <Link to="/registro" className="text-green-600 font-medium hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;