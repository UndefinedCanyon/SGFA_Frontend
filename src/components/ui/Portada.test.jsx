import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Portada from "./Portada";
import { fotoDe } from "../../utils/fotos";

vi.mock("../../utils/fotos", () => ({ fotoDe: vi.fn() }));

describe("Portada", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("muestra el contenido y el paisaje ilustrado si no hay foto", () => {
        fotoDe.mockReturnValue(null);
        render(<Portada foto="hero">Bienvenida</Portada>);

        expect(screen.getByText("Bienvenida")).toBeInTheDocument();
        expect(fotoDe).toHaveBeenCalledWith("hero");
        expect(screen.getByTestId("portada-fondo").style.backgroundImage).toContain("paisaje-fusagasuga");
    });

    it("usa la foto real cuando existe", () => {
        fotoDe.mockReturnValue("/assets/hero-real.webp");
        render(<Portada foto="hero">Texto</Portada>);

        expect(screen.getByTestId("portada-fondo").style.backgroundImage).toContain("hero-real.webp");
    });

    it("acepta clases extra", () => {
        fotoDe.mockReturnValue(null);
        const { container } = render(<Portada className="min-h-96">x</Portada>);

        expect(container.firstChild).toHaveClass("min-h-96");
    });
});
