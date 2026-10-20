import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";
import Inicio from "../pages/Inicio";
import RegistroArtesano from "../pages/RegistroArtesano";
import Login from "../pages/Login";
import VerificarCorreo from "../pages/VerificarCorreo";
import OlvideContrasena from "../pages/OlvideContrasena";
import RestablecerContrasena from "../pages/RestablecerContrasena";
import Ferias from "../pages/Ferias";
import PanelAdministrador from "../pages/PanelAdministrador";
import PanelArtesano from "../pages/PanelArtesano";
import NoEncontrado from "../pages/NoEncontrado";
import RutaProtegida from "./RutaProtegida";
import { ProveedorAvisos } from "../context/AvisosContext";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/registro" element={<RegistroArtesano />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/verificar-correo" element={<VerificarCorreo />} />
                    <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
                    <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
                    <Route path="/ferias" element={<Ferias />} />

                    <Route
                        path="/admin"
                        element={
                            <RutaProtegida rolPermitido="ADMINISTRADOR">
                                <ProveedorAvisos>
                                    <PanelAdministrador />
                                </ProveedorAvisos>
                            </RutaProtegida>
                        }
                    />

                    <Route
                        path="/mi-panel"
                        element={
                            <RutaProtegida rolPermitido="ARTESANO">
                                <ProveedorAvisos>
                                    <PanelArtesano />
                                </ProveedorAvisos>
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