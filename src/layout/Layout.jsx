import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alerta, Boton } from "../components/ui";
import Header from "./Header";
import Footer from "./Footer";

function Layout() {
    const { pathname } = useLocation();
    const { sesionExpirada, descartarAvisoSesion } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="min-h-screen flex flex-col">
            <a
                href="#contenido"
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
            >
                Saltar al contenido
            </a>
            <Header />

            {sesionExpirada && (
                <div className="max-w-6xl w-full mx-auto px-6 pt-4">
                    <Alerta tipo="aviso">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span>Tu sesión expiró. Inicia sesión de nuevo para continuar.</span>
                            <div className="flex gap-2">
                                {pathname !== "/login" && (
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                    >
                                        Iniciar sesión
                                    </Link>
                                )}
                                <Boton variante="secundario" tamano="sm" onClick={descartarAvisoSesion}>
                                    Cerrar aviso
                                </Boton>
                            </div>
                        </div>
                    </Alerta>
                </div>
            )}

            <main id="contenido" className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default Layout;