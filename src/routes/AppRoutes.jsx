import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";
import Inicio from "../pages/Inicio";
import RegistroArtesano from "../pages/RegistroArtesano";
import Login from "../pages/Login";
import Ferias from "../pages/Ferias";
import PanelAdministrador from "../pages/PanelAdministrador";
import PanelArtesano from "../pages/PanelArtesano";
import NoEncontrado from "../pages/NoEncontrado";
import RutaProtegida from "./RutaProtegida";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Inicio />} />
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

                    <Route path="*" element={<NoEncontrado />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;