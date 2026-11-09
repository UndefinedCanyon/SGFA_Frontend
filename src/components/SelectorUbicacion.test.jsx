import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapa, marcador, crearMapa, crearMarcador, manejadores } = vi.hoisted(() => {
    const manejadores = {};
    const mapa = {
        getContainer: vi.fn(() => ({ style: {} })),
        on: vi.fn((evento, funcion) => {
            manejadores[evento] = funcion;
        }),
        getBounds: vi.fn(() => ({ contains: vi.fn(() => true) })),
        panTo: vi.fn(),
        invalidateSize: vi.fn(),
        remove: vi.fn(),
    };
    const marcador = { addTo: vi.fn(), setLatLng: vi.fn(), remove: vi.fn() };
    marcador.addTo.mockReturnValue(marcador);
    return {
        mapa,
        marcador,
        manejadores,
        crearMapa: vi.fn(() => mapa),
        crearMarcador: vi.fn(() => marcador),
    };
});

vi.mock("../utils/leafletBase", () => ({ crearMapa, crearMarcador }));

import SelectorUbicacion from "./SelectorUbicacion";
import { CENTRO_FUSAGASUGA } from "../utils/mapa";

let avisarTamano;
let tamano;

beforeEach(() => {
    vi.clearAllMocks();
    marcador.addTo.mockReturnValue(marcador);
    mapa.getBounds.mockReturnValue({ contains: vi.fn(() => true) });
    tamano = { ancho: 300, alto: 200 };

    globalThis.ResizeObserver = class {
        constructor(funcion) {
            avisarTamano = funcion;
        }
        observe() {}
        disconnect() {}
    };
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => tamano.ancho });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => tamano.alto });
});

function montar(propiedades = {}) {
    const onCambio = vi.fn();
    const resultado = render(<SelectorUbicacion onCambio={onCambio} {...propiedades} />);
    return { onCambio, ...resultado };
}

const mostrarMapa = () => act(() => avisarTamano());

describe("SelectorUbicacion", () => {
    it("muestra la región accesible y no crea el mapa hasta que el contenedor tiene tamaño", () => {
        tamano = { ancho: 0, alto: 0 };
        montar({ altura: "10rem" });

        expect(screen.getByRole("region", { name: "Mapa para elegir la ubicación del lugar" })).toBeInTheDocument();
        mostrarMapa();
        expect(crearMapa).not.toHaveBeenCalled();

        tamano = { ancho: 300, alto: 200 };
        mostrarMapa();
        expect(crearMapa).toHaveBeenCalledTimes(1);
    });

    it("sin valor abre el mapa en Fusagasugá y sin marcador", () => {
        montar();
        mostrarMapa();

        expect(crearMapa).toHaveBeenCalledWith(expect.any(HTMLElement), CENTRO_FUSAGASUGA, 14);
        expect(crearMarcador).not.toHaveBeenCalled();
    });

    it("con valor abre el mapa en ese punto con marcador y cursor de mira", () => {
        montar({ valor: { latitud: 4.5, longitud: -74.1 } });
        mostrarMapa();

        expect(crearMapa).toHaveBeenCalledWith(expect.any(HTMLElement), [4.5, -74.1], 16);
        expect(crearMarcador).toHaveBeenCalledWith([4.5, -74.1]);
        expect(marcador.addTo).toHaveBeenCalledWith(mapa);
    });

    it("si el punto queda fuera de la vista, mueve el mapa", () => {
        mapa.getBounds.mockReturnValue({ contains: vi.fn(() => false) });
        montar({ valor: { latitud: 4.5, longitud: -74.1 } });
        mostrarMapa();

        expect(mapa.panTo).toHaveBeenCalledWith([4.5, -74.1]);
    });

    it("al hacer clic en el mapa informa las coordenadas redondeadas", () => {
        const { onCambio } = montar();
        mostrarMapa();

        manejadores.click({ latlng: { wrap: () => ({ lat: 4.33691234567, lng: -74.36391234567 }) } });

        expect(onCambio).toHaveBeenCalledWith({ latitud: 4.336912, longitud: -74.363912 });
    });

    it("si el tamaño cambia con el mapa ya creado, le avisa a Leaflet", () => {
        montar();
        mostrarMapa();

        mostrarMapa();

        expect(mapa.invalidateSize).toHaveBeenCalledTimes(1);
    });

    it("cuando cambian las coordenadas mueve el marcador existente", () => {
        const { rerender, onCambio } = montar({ valor: { latitud: 4.5, longitud: -74.1 } });
        mostrarMapa();

        rerender(<SelectorUbicacion onCambio={onCambio} valor={{ latitud: 5, longitud: -75 }} />);

        expect(marcador.setLatLng).toHaveBeenCalledWith([5, -75]);
    });

    it("si aparecen coordenadas donde no había marcador, lo crea", () => {
        const { rerender, onCambio } = montar();
        mostrarMapa();

        rerender(<SelectorUbicacion onCambio={onCambio} valor={{ latitud: 5, longitud: -75 }} />);

        expect(crearMarcador).toHaveBeenCalledWith([5, -75]);
    });

    it("si las coordenadas se borran, quita el marcador", () => {
        const { rerender, onCambio } = montar({ valor: { latitud: 4.5, longitud: -74.1 } });
        mostrarMapa();

        rerender(<SelectorUbicacion onCambio={onCambio} valor={{}} />);

        expect(marcador.remove).toHaveBeenCalledTimes(1);
    });

    it("al desmontar elimina el mapa creado", () => {
        const { unmount } = montar();
        mostrarMapa();

        unmount();

        expect(mapa.remove).toHaveBeenCalledTimes(1);
    });

    it("al desmontar sin haber creado el mapa no falla", () => {
        const { unmount } = montar();

        expect(() => unmount()).not.toThrow();
        expect(mapa.remove).not.toHaveBeenCalled();
    });
});
