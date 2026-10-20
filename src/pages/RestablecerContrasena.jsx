import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { restablecerContrasena } from "../services/api";
import { Alerta, Boton, Campo } from "../components/ui";

function RestablecerContrasena() {
    const [parametros] = useSearchParams();
    const token = parametros.get("token");
    const navigate = useNavigate();

    const [contrasena, setContrasena] = useState("");
    const [confirmacion, setConfirmacion] = useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);

        if (contrasena.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (contrasena !== confirmacion) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setCargando(true);
        try {
            await restablecerContrasena(token, contrasena);
            navigate("/login", { state: { restablecida: true }, replace: true });
        } catch (err) {
            setError(err.message);
            setCargando(false);
        }
    }

    return (
        <div className="flex justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Elige una contraseña nueva</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    {!token ? (
                        <div className="text-center">
                            <Alerta tipo="error">
                                El enlace está incompleto. Abre el enlace completo del correo o pide uno nuevo.
                            </Alerta>
                        </div>
                    ) : (
                        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                            <Campo
                                etiqueta="Contraseña nueva"
                                type={verContrasena ? "text" : "password"}
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                autoFocus
                                ayuda="Mínimo 8 caracteres."
                            />
                            <Campo
                                etiqueta="Repite la contraseña"
                                type={verContrasena ? "text" : "password"}
                                value={confirmacion}
                                onChange={(e) => setConfirmacion(e.target.value)}
                                required
                                autoComplete="new-password"
                            />

                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={verContrasena}
                                    onChange={(e) => setVerContrasena(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                Mostrar contraseñas
                            </label>

                            <Alerta tipo="error">{error}</Alerta>

                            <Boton type="submit" cargando={cargando}>
                                {cargando ? "Guardando..." : "Cambiar contraseña"}
                            </Boton>
                        </form>
                    )}
                </div>

                <p className="mt-6 text-sm text-gray-500 text-center">
                    ¿El enlace venció?{" "}
                    <Link to="/olvide-contrasena" className="text-green-700 font-medium hover:underline">
                        Solicitar uno nuevo
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RestablecerContrasena;