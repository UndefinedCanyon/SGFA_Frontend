import { Link } from "react-router-dom";

function NoEncontrado() {
    return (
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
            <p className="text-6xl font-semibold text-green-600 mb-4">404</p>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No encontramos esta página</h2>
            <p className="text-gray-500 mb-8">
                La dirección no existe o fue movida. Revisa la URL o vuelve al inicio.
            </p>
            <div className="flex justify-center gap-3">
                <Link
                    to="/"
                    className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                    Ir al inicio
                </Link>
                <Link
                    to="/ferias"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Ver ferias
                </Link>
            </div>
        </div>
    );
}

export default NoEncontrado;