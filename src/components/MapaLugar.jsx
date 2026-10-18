import { useEffect, useRef } from "react";
import { crearMapa, crearMarcador, ES_MOVIL } from "../utils/leafletBase";

function MapaLugar({ latitud, longitud, nombre, altura = "14rem" }) {
    const contenedor = useRef(null);

    useEffect(() => {
        const mapa = crearMapa(contenedor.current, [latitud, longitud], 16, {
            scrollWheelZoom: false,
            dragging: !ES_MOVIL,
        });
        crearMarcador([latitud, longitud]).addTo(mapa);

        return () => mapa.remove();
    }, [latitud, longitud]);

    return (
        <div
            ref={contenedor}
            role="region"
            aria-label={`Mapa con la ubicación de ${nombre}`}
            style={{ height: altura }}
            className="relative z-0 w-full overflow-hidden rounded-xl border border-gray-200"
        />
    );
}

export default MapaLugar;