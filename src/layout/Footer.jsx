import { Link } from "react-router-dom";
import logo from "../assets/logo-sgfa.png";
import tejidoClaro from "../assets/fondos/patron-tejido-claro.svg";

function Footer() {
    return (
        <footer className="relative isolate overflow-hidden bg-gray-900 text-gray-200">
            <div
                aria-hidden="true"
                className="patron absolute inset-0 -z-10"
                style={{ backgroundImage: `url("${tejidoClaro}")` }}
            />
            <div
                aria-hidden="true"
                className="h-1 bg-gradient-to-r from-brand-600 via-ocre-400 to-bosque-600"
            />
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="" className="h-9 w-9 rounded-full bg-gray-50 p-1" />
                    <div>
                        <p className="font-display text-sm font-semibold text-white">SGFA</p>
                        <p className="text-xs text-gray-300">
                            Software de Gestión para Ferias Artesanales · Fusagasugá
                        </p>
                    </div>
                </div>

                <nav aria-label="Pie de página" className="flex gap-4 text-sm text-gray-200">
                    <Link to="/" className="hover:text-ocre-300">Inicio</Link>
                    <Link to="/ferias" className="hover:text-ocre-300">Ferias</Link>
                </nav>
            </div>

            <div className="border-t border-white/10 py-3 text-center text-xs text-gray-300">
                © {new Date().getFullYear()} Universidad de Cundinamarca · Ingeniería de Sistemas y Computación
            </div>
        </footer>
    );
}

export default Footer;
