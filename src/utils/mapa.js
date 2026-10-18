// Centro aproximado de Fusagasugá, para abrir el mapa cuando aún no hay ubicación.
export const CENTRO_FUSAGASUGA = [4.3369, -74.3639];

// Las teselas comunitarias de OpenStreetMap son para uso ligero. Si el tráfico crece,
// cambia esta URL por la de un proveedor de teselas.
export const URL_TESELAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// La atribución es obligatoria. No la quites.
export const ATRIBUCION =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export function tieneUbicacion(lugar) {
    return Boolean(lugar) && lugar.latitud != null && lugar.longitud != null;
}

export function enlaceComoLlegar(lugar) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}`;
}

export function redondearCoordenada(valor) {
    return Math.round(valor * 1e6) / 1e6;
}