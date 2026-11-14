import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo-sgfa.png";

const ENLACE = "rounded-md px-1 py-1 transition-colors hover:text-brand-700";

function Header() {
    const { usuario, cerrarSesion } = useAuth();

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/90 backdrop-blur">
            <div
                aria-hidden="true"
                className="h-1 bg-gradient-to-r from-brand-600 via-ocre-400 to-bosque-600"
            />
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="SGFA" className="h-10 w-10" />
                    <span className="hidden font-display text-xl font-semibold text-brand-700 sm:inline">SGFA</span>
                </Link>

                <nav className="flex items-center gap-3 text-sm sm:gap-6 font-medium text-gray-600">
                    <Link to="/" className={ENLACE}>
                        Inicio
                    </Link>
                    <Link to="/ferias" className={ENLACE}>
                        Ferias
                    </Link>

                    {!usuario && (
                        <>
                            <Link to="/registro" className={ENLACE}>
                                Registrarse
                            </Link>
                            <Link
                                to="/login"
                                className="bg-brand-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-brand-700 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                        </>
                    )}

                    {usuario?.rol === "ADMINISTRADOR" && (
                        <Link to="/admin" className={ENLACE}>
                            Panel Admin
                        </Link>
                    )}
                    {usuario?.rol === "ARTESANO" && (
                        <Link to="/mi-panel" className={ENLACE}>
                            Mi Panel
                        </Link>
                    )}
                </nav>

                {usuario && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            Hola, <span className="font-semibold text-brand-700">{usuario.nombre}</span>
                        </span>
                        <button
                            onClick={cerrarSesion}
                            className="text-sm border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
