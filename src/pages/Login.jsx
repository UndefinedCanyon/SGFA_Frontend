import { useState } from "react";
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
        <div>
            <h2>Iniciar sesión</h2>

            <form onSubmit={manejarEnvio}>
                <div>
                    <label>Correo electrónico</label>
                    <input
                        type="email"
                        value={correoElectronico}
                        onChange={(e) => setCorreoElectronico(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Contraseña</label>
                    <input
                        type="password"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={cargando}>
                    {cargando ? "Ingresando..." : "Ingresar"}
                </button>
            </form>

            {usuario && (
                <p style={{ color: "green" }}>
                    Bienvenido/a, {usuario.nombre} (rol: {usuario.rol})
                </p>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default Login;