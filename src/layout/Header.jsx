import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Header() {
    const { usuario, cerrarSesion } = useAuth();

    return (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #ccc" }}>
            <nav style={{ display: "flex", gap: "1rem" }}>
                <Link to="/">Inicio</Link>
                <Link to="/ferias">Ferias</Link>

                {!usuario && (
                    <>
                        <Link to="/registro">Registrarse</Link>
                        <Link to="/login">Iniciar sesión</Link>
                    </>
                )}

                {usuario?.rol === "ADMINISTRADOR" && <Link to="/admin">Panel Admin</Link>}
                {usuario?.rol === "ARTESANO" && <Link to="/mi-panel">Mi Panel</Link>}
            </nav>

            {usuario && (
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span>Hola, {usuario.nombre} ({usuario.rol})</span>
                    <button onClick={cerrarSesion}>Cerrar sesión</button>
                </div>
            )}
        </header>
    );
}

export default Header;