import { useAuth } from "../context/AuthContext";

function PanelArtesano() {
    const { usuario } = useAuth();

    return (
        <div>
            <h2>Panel de Artesano</h2>
            <p>Bienvenido, {usuario.nombre}.</p>
            <p>Aquí irán tus productos y el estado de tus solicitudes de participación.</p>
        </div>
    );
}

export default PanelArtesano;