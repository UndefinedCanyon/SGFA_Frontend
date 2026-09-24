import { Link } from "react-router-dom";
import logo from "../assets/logo-sgfa.png";

function Inicio() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <img src={logo} alt="SGFA" className="h-24 w-24 mb-6" />
            <h1 className="text-4xl font-semibold text-gray-800 mb-3">
                Bienvenido a <span className="text-green-600">SGFA</span>
            </h1>
            <p className="text-gray-500 max-w-md mb-8">
                Software de Gestión para Ferias Artesanales de Fusagasugá. Conectamos
                artesanos con las ferias de la ciudad.
            </p>
            <div className="flex gap-4">
                <Link
                    to="/ferias"
                    className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                    Ver ferias
                </Link>
                <Link
                    to="/registro"
                    className="border border-green-600 text-green-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                >
                    Registrarme como artesano
                </Link>
            </div>
        </div>
    );
}

export default Inicio;