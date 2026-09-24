import { useState, useEffect } from "react";
import { consultarFerias, consultarEdicionesFeria } from "../services/api";

function Ferias() {
    const [ferias, setFerias] = useState([]);
    const [feriaSeleccionada, setFeriaSeleccionada] = useState(null);
    const [ediciones, setEdiciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoEdiciones, setCargandoEdiciones] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function cargarFerias() {
            try {
                const datos = await consultarFerias();
                setFerias(datos);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarFerias();
    }, []);

    async function verEdiciones(feria) {
        setFeriaSeleccionada(feria);
        setEdiciones([]);
        setCargandoEdiciones(true);
        try {
            const datos = await consultarEdicionesFeria(feria.id);
            setEdiciones(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargandoEdiciones(false);
        }
    }

    function formatearFecha(fechaISO) {
        const [anio, mes, dia] = fechaISO.split("-");
        return `${dia}/${mes}/${anio}`;
    }

    if (cargando) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
                Cargando ferias...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <h2 className="text-3xl font-semibold text-gray-800 mb-1">Ferias artesanales</h2>
            <p className="text-gray-500 mb-8">
                Explora las ferias disponibles y sus próximas ediciones
            </p>

            {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-6">{error}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ferias.map((feria) => (
                    <div
                        key={feria.id}
                        className={`bg-white rounded-2xl shadow-sm border p-6 transition-all cursor-pointer hover:shadow-md ${
                            feriaSeleccionada?.id === feria.id
                                ? "border-green-500 ring-2 ring-green-100"
                                : "border-gray-200"
                        }`}
                        onClick={() => verEdiciones(feria)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                                {feria.nombreFeria.charAt(0)}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                {feria.nombreFeria}
                            </h3>
                        </div>
                        <button className="text-sm text-green-600 font-medium hover:underline">
                            Ver ediciones →
                        </button>
                    </div>
                ))}
            </div>

            {ferias.length === 0 && (
                <p className="text-gray-500 mt-6">Aún no hay ferias registradas.</p>
            )}

            {feriaSeleccionada && (
                <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Ediciones de "{feriaSeleccionada.nombreFeria}"
                    </h3>

                    {cargandoEdiciones && (
                        <p className="text-gray-500 text-sm">Cargando ediciones...</p>
                    )}

                    {!cargandoEdiciones && ediciones.length === 0 && (
                        <p className="text-gray-500 text-sm">
                            Esta feria no tiene ediciones registradas.
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ediciones.map((edicion) => (
                            <div
                                key={edicion.id}
                                className="border border-green-100 bg-green-50 rounded-xl p-4"
                            >
                                <p className="text-sm text-gray-500">Fechas</p>
                                <p className="font-medium text-gray-800 mb-2">
                                    {formatearFecha(edicion.fechaInicio)} — {formatearFecha(edicion.fechaFin)}
                                </p>
                                <p className="text-sm text-gray-500">Lugar</p>
                                <p className="font-medium text-gray-800">ID {edicion.idLugar}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ferias;