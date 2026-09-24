import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo-sgfa.png";

function Header() {
    const { usuario, cerrarSesion } = useAuth();

    return (
        <header className="bg-white border-b border-green-100 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="SGFA" className="h-10 w-10" />
                    <span className="text-xl font-semibold text-green-700">SGFA</span>
                </Link>

                <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
                    <Link to="/" className="hover:text-green-600 transition-colors">
                        Inicio
                    </Link>
                    <Link to="/ferias" className="hover:text-green-600 transition-colors">
                        Ferias
                    </Link>

                    {!usuario && (
                        <>
                            <Link to="/registro" className="hover:text-green-600 transition-colors">
                                Registrarse
                            </Link>
                            <Link
                                to="/login"
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                        </>
                    )}

                    {usuario?.rol === "ADMINISTRADOR" && (
                        <Link to="/admin" className="hover:text-green-600 transition-colors">
                            Panel Admin
                        </Link>
                    )}
                    {usuario?.rol === "ARTESANO" && (
                        <Link to="/mi-panel" className="hover:text-green-600 transition-colors">
                            Mi Panel
                        </Link>
                    )}
                </nav>

                {usuario && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            Hola, <span className="font-semibold text-green-700">{usuario.nombre}</span>
                        </span>
                        <button
                            onClick={cerrarSesion}
                            className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
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