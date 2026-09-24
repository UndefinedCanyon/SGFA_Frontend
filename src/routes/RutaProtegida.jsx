import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RutaProtegida({ rolPermitido, children }) {
    const { usuario } = useAuth();

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    if (rolPermitido && usuario.rol !== rolPermitido) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RutaProtegida;