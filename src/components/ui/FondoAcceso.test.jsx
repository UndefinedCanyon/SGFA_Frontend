import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FondoAcceso from "./FondoAcceso";
import { fotoDe } from "../../utils/fotos";

vi.mock("../../utils/fotos", () => ({ fotoDe: vi.fn() }));

describe("FondoAcceso", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fotoDe.mockReturnValue(null);
    });

    it("envuelve el formulario sobre el paisaje ilustrado", () => {
        render(
            <FondoAcceso>
                <h2>Iniciar sesión</h2>
            </FondoAcceso>,
        );

        expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
        expect(fotoDe).toHaveBeenCalledWith("acceso");
        expect(screen.getByTestId("acceso-fondo").style.backgroundImage).toContain("paisaje-fusagasuga");
    });

    it("usa la foto real y el ancho pedido", () => {
        fotoDe.mockReturnValue("/assets/acceso-real.webp");
        render(
            <FondoAcceso ancho="lg">
                <p>Contenido</p>
            </FondoAcceso>,
        );

        expect(screen.getByTestId("acceso-fondo").style.backgroundImage).toContain("acceso-real.webp");
        expect(screen.getByText("Contenido").parentElement).toHaveClass("max-w-2xl");
    });

    it("cae al ancho pequeño si el tamaño no existe", () => {
        render(
            <FondoAcceso ancho="enorme">
                <p>Contenido</p>
            </FondoAcceso>,
        );

        expect(screen.getByText("Contenido").parentElement).toHaveClass("max-w-md");
    });
});
