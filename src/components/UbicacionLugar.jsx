import { useState } from "react";
import MapaLugar from "./MapaLugar";
import { enlaceComoLlegar, tieneUbicacion } from "../utils/mapa";

function UbicacionLugar({ lugar }) {
    const [abierto, setAbierto] = useState(false);

    if (!tieneUbicacion(lugar)) return null;

    return (
        <div className="mt-2">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => setAbierto((visible) => !visible)}
                    aria-expanded={abierto}
                    className="text-xs font-medium text-green-700 hover:underline"
                >
                    {abierto ? "Ocultar mapa" : "Ver mapa"}
                </button>
                <a
                    href={enlaceComoLlegar(lugar)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-green-700 hover:underline"
                >
                    Cómo llegar ↗
                </a>
            </div>

            {abierto && (
                <div className="mt-2 w-full">
                    <MapaLugar latitud={lugar.latitud} longitud={lugar.longitud} nombre={lugar.nombre} />
                </div>
            )}
        </div>
    );
}

export default UbicacionLugar;