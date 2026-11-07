import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NoEncontrado from "./NoEncontrado";

describe("NoEncontrado", () => {
    function montar() {
        return render(
            <MemoryRouter>
                <NoEncontrado />
            </MemoryRouter>
        );
    }

    it("muestra el código 404 y un mensaje claro", () => {
        montar();

        expect(screen.getByText("404")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "No encontramos esta página" })).toBeInTheDocument();
    });

    it("ofrece volver al inicio o ver las ferias", () => {
        montar();

        expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Ver ferias" })).toHaveAttribute("href", "/ferias");
    });
});