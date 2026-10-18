import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ATRIBUCION, URL_TESELAS } from "./mapa";

export const ES_MOVIL = L.Browser.mobile;

// Marcador dibujado con CSS: evita los problemas de rutas de imágenes de Leaflet con Vite.
const ICONO_MARCADOR = L.divIcon({
    className: "",
    html: '<div style="box-sizing:border-box;width:24px;height:24px;background:#16a34a;border:3px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 5px rgba(0,0,0,0.45);"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 29],
});

export function crearMapa(contenedor, centro, zoom, opciones = {}) {
    const mapa = L.map(contenedor, opciones).setView(centro, zoom);
    L.tileLayer(URL_TESELAS, { maxZoom: 19, attribution: ATRIBUCION }).addTo(mapa);
    return mapa;
}

export function crearMarcador(posicion) {
    return L.marker(posicion, { icon: ICONO_MARCADOR });
}