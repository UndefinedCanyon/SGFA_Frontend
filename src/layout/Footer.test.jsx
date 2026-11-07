import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Footer from "./Footer";

function montar() {
    return render(
        <MemoryRouter>
            <Footer />
        </MemoryRouter>
    );
}

describe("Footer", () => {
    it("identifica el proyecto y la universidad", () => {
        montar();

        expect(screen.getByText("SGFA")).toBeInTheDocument();
        expect(screen.getByText(/Software de Gestión para Ferias Artesanales/)).toBeInTheDocument();
        expect(screen.getByText(/Universidad de Cundinamarca/)).toBeInTheDocument();
    });

    it("muestra el año actual", () => {
        montar();

        expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
    });

    it("tiene una navegación de pie de página con inicio y ferias", () => {
        montar();

        const navegacion = screen.getByRole("navigation", { name: "Pie de página" });
        expect(navegacion).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Ferias" })).toHaveAttribute("href", "/ferias");
    });
});