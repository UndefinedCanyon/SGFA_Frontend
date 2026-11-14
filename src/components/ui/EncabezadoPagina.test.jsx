import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EncabezadoPagina from "./EncabezadoPagina";
import { fotoDe } from "../../utils/fotos";

vi.mock("../../utils/fotos", () => ({ fotoDe: vi.fn() }));

describe("EncabezadoPagina", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fotoDe.mockReturnValue(null);
    });

    it("muestra título y descripción", () => {
        render(<EncabezadoPagina titulo="Ferias artesanales" descripcion="Consulta las ediciones." foto="ferias" />);

        expect(screen.getByRole("heading", { level: 2, name: "Ferias artesanales" })).toBeInTheDocument();
        expect(screen.getByText("Consulta las ediciones.")).toBeInTheDocument();
        expect(screen.queryByTestId("encabezado-foto")).not.toBeInTheDocument();
    });

    it("la descripción y los hijos son opcionales", () => {
        render(
            <EncabezadoPagina titulo="Panel" ancho="max-w-5xl">
                <button>Acción</button>
            </EncabezadoPagina>,
        );

        expect(screen.getByRole("button", { name: "Acción" })).toBeInTheDocument();
        expect(document.querySelector("p")).toBeNull();
    });

    it("pone la foto de fondo cuando existe", () => {
        fotoDe.mockReturnValue("/assets/ferias-real.webp");
        render(<EncabezadoPagina titulo="Ferias" foto="ferias" />);

        expect(screen.getByTestId("encabezado-foto").style.backgroundImage).toContain("ferias-real.webp");
    });
});
