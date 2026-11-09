import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapa, marcador, crearMapa, crearMarcador } = vi.hoisted(() => {
    const mapa = { remove: vi.fn() };
    const marcador = { addTo: vi.fn() };
    return {
        mapa,
        marcador,
        crearMapa: vi.fn(() => mapa),
        crearMarcador: vi.fn(() => marcador),
    };
});

vi.mock("../utils/leafletBase", () => ({ crearMapa, crearMarcador, ES_MOVIL: true }));

import MapaLugar from "./MapaLugar";

beforeEach(() => vi.clearAllMocks());

describe("MapaLugar", () => {
    it("muestra una región accesible con el nombre del lugar y la altura pedida", () => {
        render(<MapaLugar latitud={4.3} longitud={-74.3} nombre="Plaza Mayor" altura="10rem" />);

        const region = screen.getByRole("region", { name: "Mapa con la ubicación de Plaza Mayor" });
        expect(region).toHaveStyle({ height: "160px" });
    });

    it("crea el mapa centrado en el lugar, sin zoom con rueda y con arrastre desactivado en móvil", () => {
        render(<MapaLugar latitud={4.3} longitud={-74.3} nombre="Plaza" />);

        expect(crearMapa).toHaveBeenCalledWith(expect.any(HTMLElement), [4.3, -74.3], 16, {
            scrollWheelZoom: false,
            dragging: false,
        });
        expect(crearMarcador).toHaveBeenCalledWith([4.3, -74.3]);
        expect(marcador.addTo).toHaveBeenCalledWith(mapa);
    });

    it("al desmontar elimina el mapa", () => {
        const { unmount } = render(<MapaLugar latitud={4.3} longitud={-74.3} nombre="Plaza" />);

        unmount();

        expect(mapa.remove).toHaveBeenCalledTimes(1);
    });

    it("si cambian las coordenadas recrea el mapa", () => {
        const { rerender } = render(<MapaLugar latitud={4.3} longitud={-74.3} nombre="Plaza" />);

        rerender(<MapaLugar latitud={5} longitud={-75} nombre="Plaza" />);

        expect(mapa.remove).toHaveBeenCalledTimes(1);
        expect(crearMapa).toHaveBeenCalledTimes(2);
    });
});
