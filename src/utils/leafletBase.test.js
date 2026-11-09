import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapaFalso, capaFalsa, marcadorFalso, L } = vi.hoisted(() => {
    const mapaFalso = { setView: vi.fn() };
    mapaFalso.setView.mockReturnValue(mapaFalso);
    const capaFalsa = { addTo: vi.fn() };
    const marcadorFalso = { id: "marcador" };
    const L = {
        Browser: { mobile: false },
        divIcon: vi.fn((opciones) => ({ ...opciones, esIcono: true })),
        map: vi.fn(() => mapaFalso),
        tileLayer: vi.fn(() => capaFalsa),
        marker: vi.fn(() => marcadorFalso),
    };
    return { mapaFalso, capaFalsa, marcadorFalso, L };
});

vi.mock("leaflet", () => ({ default: L }));
vi.mock("leaflet/dist/leaflet.css", () => ({}));

import { crearMapa, crearMarcador, ES_MOVIL } from "./leafletBase";
import { ATRIBUCION, URL_TESELAS } from "./mapa";

beforeEach(() => {
    L.map.mockClear();
    L.tileLayer.mockClear();
    L.marker.mockClear();
    mapaFalso.setView.mockClear();
    capaFalsa.addTo.mockClear();
});

describe("leafletBase", () => {
    it("expone si el navegador es móvil", () => {
        expect(ES_MOVIL).toBe(false);
    });

    it("crearMapa crea el mapa, lo centra y le agrega la capa de teselas con atribución", () => {
        const contenedor = document.createElement("div");

        const mapa = crearMapa(contenedor, [4.3, -74.3], 14, { dragging: false });

        expect(L.map).toHaveBeenCalledWith(contenedor, { dragging: false });
        expect(mapaFalso.setView).toHaveBeenCalledWith([4.3, -74.3], 14);
        expect(L.tileLayer).toHaveBeenCalledWith(URL_TESELAS, { maxZoom: 19, attribution: ATRIBUCION });
        expect(capaFalsa.addTo).toHaveBeenCalledWith(mapaFalso);
        expect(mapa).toBe(mapaFalso);
    });

    it("crearMapa funciona sin opciones", () => {
        crearMapa(document.createElement("div"), [1, 2], 10);

        expect(L.map).toHaveBeenCalledWith(expect.anything(), {});
    });

    it("crearMarcador usa el icono dibujado con CSS", () => {
        const marcador = crearMarcador([4.3, -74.3]);

        expect(L.marker).toHaveBeenCalledWith([4.3, -74.3], { icon: expect.objectContaining({ esIcono: true }) });
        expect(marcador).toBe(marcadorFalso);
    });
});
