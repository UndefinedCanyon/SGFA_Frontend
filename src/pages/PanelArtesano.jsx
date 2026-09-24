import { useAuth } from "../context/AuthContext";

function PanelArtesano() {
    const { usuario } = useAuth();

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Mi Panel</h2>
            <p className="text-gray-500 mb-8">Bienvenido, {usuario.nombre}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-500 mb-1">Próximamente</p>
                    <p className="font-medium text-gray-800">Mis productos</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-500 mb-1">Próximamente</p>
                    <p className="font-medium text-gray-800">Estado de mis solicitudes</p>
                </div>
            </div>

            <p className="text-sm text-gray-400 mt-8">
                Estas funcionalidades se habilitarán en próximas iteraciones del proyecto.
            </p>
        </div>
    );
}

export default PanelArtesano;