import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./MapaLugar", () => ({
    default: ({ latitud, longitud, nombre }) => (
        <div data-testid="mapa">{`${nombre}:${latitud},${longitud}`}</div>
    ),
}));

import UbicacionLugar from "./UbicacionLugar";

const lugar = { nombre: "Plaza Mayor", latitud: 4.3369, longitud: -74.3636 };

describe("UbicacionLugar", () => {
    it("no muestra nada si el lugar no tiene coordenadas", () => {
        const { container, rerender } = render(<UbicacionLugar lugar={{ nombre: "Sin mapa" }} />);
        expect(container).toBeEmptyDOMElement();

        rerender(<UbicacionLugar lugar={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el enlace Cómo llegar con las coordenadas y el botón Ver mapa", () => {
        render(<UbicacionLugar lugar={lugar} />);

        expect(screen.getByRole("link", { name: /Cómo llegar/ })).toHaveAttribute(
            "href",
            "https://www.google.com/maps/dir/?api=1&destination=4.3369,-74.3636"
        );
        expect(screen.getByRole("button", { name: "Ver mapa" })).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByTestId("mapa")).not.toBeInTheDocument();
    });

    it("al pulsar Ver mapa lo muestra y al pulsar de nuevo lo oculta", () => {
        render(<UbicacionLugar lugar={lugar} />);

        fireEvent.click(screen.getByRole("button", { name: "Ver mapa" }));
        expect(screen.getByTestId("mapa")).toHaveTextContent("Plaza Mayor:4.3369,-74.3636");
        expect(screen.getByRole("button", { name: "Ocultar mapa" })).toHaveAttribute("aria-expanded", "true");

        fireEvent.click(screen.getByRole("button", { name: "Ocultar mapa" }));
        expect(screen.queryByTestId("mapa")).not.toBeInTheDocument();
    });
});
