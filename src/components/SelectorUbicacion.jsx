import { useEffect, useRef } from "react";
import { crearMapa, crearMarcador } from "../utils/leafletBase";
import { CENTRO_FUSAGASUGA, redondearCoordenada } from "../utils/mapa";

function actualizarMarcador(mapa, marcadorRef, latitud, longitud) {
    if (latitud != null && longitud != null) {
        const posicion = [latitud, longitud];

        if (marcadorRef.current) {
            marcadorRef.current.setLatLng(posicion);
        } else {
            marcadorRef.current = crearMarcador(posicion).addTo(mapa);
        }

        if (!mapa.getBounds().contains(posicion)) {
            mapa.panTo(posicion);
        }
    } else if (marcadorRef.current) {
        marcadorRef.current.remove();
        marcadorRef.current = null;
    }
}

function SelectorUbicacion({ valor, onCambio, altura = "16rem" }) {
    const contenedor = useRef(null);
    const mapaRef = useRef(null);
    const marcadorRef = useRef(null);
    const alCambiarRef = useRef(onCambio);
    const valorRef = useRef({ latitud: valor?.latitud, longitud: valor?.longitud });

    const latitud = valor?.latitud;
    const longitud = valor?.longitud;

    useEffect(() => {
        alCambiarRef.current = onCambio;
        valorRef.current = { latitud, longitud };
    });

    // El mapa se crea cuando el contenedor ya tiene tamaño real. Si la pestaña está oculta
    // (tamaño 0) se espera, y cuando se muestra el observador lo crea. Si cambia el tamaño
    // después, se le avisa a Leaflet. Para cambiar de lugar, el padre usa "key" y lo remonta.
    useEffect(() => {
        const elemento = contenedor.current;

        const observador = new ResizeObserver(() => {
            if (!mapaRef.current) {
                if (elemento.clientWidth === 0 || elemento.clientHeight === 0) return;

                const { latitud: lat, longitud: lng } = valorRef.current;
                const tieneValor = lat != null && lng != null;

                const mapa = crearMapa(
                    elemento,
                    tieneValor ? [lat, lng] : CENTRO_FUSAGASUGA,
                    tieneValor ? 16 : 14
                );
                mapa.getContainer().style.cursor = "crosshair";

                mapa.on("click", (evento) => {
                    const punto = evento.latlng.wrap();
                    alCambiarRef.current({
                        latitud: redondearCoordenada(punto.lat),
                        longitud: redondearCoordenada(punto.lng),
                    });
                });

                mapaRef.current = mapa;
                actualizarMarcador(mapa, marcadorRef, lat, lng);
            } else {
                mapaRef.current.invalidateSize();
            }
        });

        observador.observe(elemento);

        return () => {
            observador.disconnect();
            if (mapaRef.current) {
                mapaRef.current.remove();
            }
            mapaRef.current = null;
            marcadorRef.current = null;
        };
    }, []);

    // Mantiene el marcador sincronizado con las coordenadas.
    useEffect(() => {
        if (mapaRef.current) {
            actualizarMarcador(mapaRef.current, marcadorRef, latitud, longitud);
        }
    }, [latitud, longitud]);

    return (
        <div
            ref={contenedor}
            role="region"
            aria-label="Mapa para elegir la ubicación del lugar"
            style={{ height: altura }}
            className="relative z-0 w-full overflow-hidden rounded-xl border border-gray-300"
        />
    );
}

export default SelectorUbicacion;