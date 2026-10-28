import { useEffect, useState } from "react";

function BarraCupo({ ocupacion }) {
    const [llena, setLlena] = useState(false);
    const hayDatos = Boolean(ocupacion);

    // Un cuadro después de montarse, la barra pasa de 0 a su valor y se anima.
    useEffect(() => {
        if (!hayDatos) return;
        const cuadro = requestAnimationFrame(() => setLlena(true));
        return () => cancelAnimationFrame(cuadro);
    }, [hayDatos]);

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
            <div
                role="progressbar"
                aria-label="Cupo ocupado"
                aria-valuemin={0}
                aria-valuemax={cupoMaximo}
                aria-valuenow={aprobados}
                className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"
            >
                <div
                    className={`h-full rounded-full ${lleno ? "bg-red-500" : "bg-green-600"}`}
                    style={{
                        width: `${llena ? porcentaje : 0}%`,
                        transition: "width 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
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