function BarraCupo({ ocupacion }) {
    if (!ocupacion) return null;

    const { cupoMaximo, aprobados, disponibles } = ocupacion;

    if (cupoMaximo === null || cupoMaximo === undefined) {
        return (
            <p className="text-xs text-gray-500">
                Sin límite de cupo · {aprobados} {aprobados === 1 ? "artesano aprobado" : "artesanos aprobados"}
            </p>
        );
    }

    const porcentaje = Math.min(100, Math.round((aprobados / cupoMaximo) * 100));
    const lleno = disponibles === 0;

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs text-gray-500">Artesanos aprobados</p>
                <p className={`text-xs font-semibold ${lleno ? "text-red-600" : "text-green-700"}`}>
                    {porcentaje}%
                </p>
            </div>
            <p className="text-sm text-gray-800 mb-1">
                <span className="text-lg font-semibold">{aprobados}</span> de {cupoMaximo}
            </p>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${lleno ? "bg-red-500" : "bg-green-600"}`}
                    style={{ width: `${porcentaje}%` }}
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">
                {lleno
                    ? "Sin cupos disponibles"
                    : `${disponibles} ${disponibles === 1 ? "cupo disponible" : "cupos disponibles"}`}
            </p>
        </div>
    );
}

export default BarraCupo;