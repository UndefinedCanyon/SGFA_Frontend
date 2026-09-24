import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegistroArtesano from "../pages/RegistroArtesano";
import Login from "../pages/Login";
import Ferias from "../pages/Ferias";
import PanelAdministrador from "../pages/PanelAdministrador";
import PanelArtesano from "../pages/PanelArtesano";
import Header from "../layout/Header";
import RutaProtegida from "./RutaProtegida";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Header />

            <Routes>
                <Route path="/" element={<h2>Bienvenido a SGFA</h2>} />
                <Route path="/registro" element={<RegistroArtesano />} />
                <Route path="/login" element={<Login />} />
                <Route path="/ferias" element={<Ferias />} />

                <Route
                    path="/admin"
                    element={
                        <RutaProtegida rolPermitido="ADMINISTRADOR">
                            <PanelAdministrador />
                        </RutaProtegida>
                    }
                />

                <Route
                    path="/mi-panel"
                    element={
                        <RutaProtegida rolPermitido="ARTESANO">
                            <PanelArtesano />
                        </RutaProtegida>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;