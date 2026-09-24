import { useAuth } from "../context/AuthContext";

function PanelAdministrador() {
    const { usuario } = useAuth();

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Panel de Administrador</h2>
            <p className="text-gray-500 mb-8">Bienvenido, {usuario.nombre}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-500 mb-1">Gestión</p>
                    <p className="font-medium text-gray-800">Ferias y lugares</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-500 mb-1">Consulta</p>
                    <p className="font-medium text-gray-800">Artesanos registrados</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <p className="text-sm text-gray-500 mb-1">Pendiente</p>
                    <p className="font-medium text-gray-800">Solicitudes de participación</p>
                </div>
            </div>

            <p className="text-sm text-gray-400 mt-8">
                Estas funcionalidades se habilitarán en próximas iteraciones del proyecto.
            </p>
        </div>
    );
}

export default PanelAdministrador;