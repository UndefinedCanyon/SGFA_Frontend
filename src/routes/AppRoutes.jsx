import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RegistroArtesano from "../pages/RegistroArtesano";
import Login from "../pages/Login";
import Ferias from "../pages/Ferias";

function AppRoutes() {
    return (
        <BrowserRouter>
            <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #ccc" }}>
                <Link to="/">Inicio</Link>
                <Link to="/registro">Registrarse</Link>
                <Link to="/login">Iniciar sesión</Link>
                <Link to="/ferias">Ferias</Link>
            </nav>

            <Routes>
                <Route path="/" element={<h2>Bienvenido a SGFA</h2>} />
                <Route path="/registro" element={<RegistroArtesano />} />
                <Route path="/login" element={<Login />} />
                <Route path="/ferias" element={<Ferias />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;