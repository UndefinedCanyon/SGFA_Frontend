import { Link } from "react-router-dom";
import logo from "../assets/logo-sgfa.png";

function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="" className="h-8 w-8" />
                    <div>
                        <p className="text-sm font-semibold text-gray-800">SGFA</p>
                        <p className="text-xs text-gray-500">
                            Software de Gestión para Ferias Artesanales · Fusagasugá
                        </p>
                    </div>
                </div>

                <nav aria-label="Pie de página" className="flex gap-4 text-sm text-gray-600">
                    <Link to="/" className="hover:text-green-700">Inicio</Link>
                    <Link to="/ferias" className="hover:text-green-700">Ferias</Link>
                </nav>
            </div>

            <div className="border-t border-gray-100 py-3 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Universidad de Cundinamarca · Ingeniería de Sistemas y Computación
            </div>
        </footer>
    );
}

export default Footer;