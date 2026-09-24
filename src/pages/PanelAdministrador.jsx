import { useAuth } from "../context/AuthContext";

function PanelAdministrador() {
    const { usuario } = useAuth();

    return (
        <div>
            <h2>Panel de Administrador</h2>
            <p>Bienvenido, {usuario.nombre}.</p>
            <p>Aquí irán las opciones de gestión de ferias, lugares y solicitudes.</p>
        </div>
    );
}

export default PanelAdministrador;