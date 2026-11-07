import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Tarjeta from "./Tarjeta";

describe("Tarjeta", () => {
    it("muestra su contenido", () => {
        render(<Tarjeta>Contenido interno</Tarjeta>);

        expect(screen.getByText("Contenido interno")).toBeInTheDocument();
    });

    it("sin título ni acciones no dibuja encabezado", () => {
        const { container } = render(<Tarjeta>Contenido</Tarjeta>);

        expect(container.querySelector("header")).toBeNull();
    });

    it("muestra el título y la descripción", () => {
        render(
            <Tarjeta titulo="Mis productos" descripcion="Lo que vendes en la feria">
                Contenido
            </Tarjeta>
        );

        expect(screen.getByRole("heading", { name: "Mis productos" })).toBeInTheDocument();
        expect(screen.getByText("Lo que vendes en la feria")).toBeInTheDocument();
    });

    it("el título solo no dibuja descripción", () => {
        const { container } = render(<Tarjeta titulo="Solo título">Contenido</Tarjeta>);

        expect(container.querySelector("header p")).toBeNull();
    });

    it("muestra las acciones aunque no haya título", () => {
        const { container } = render(<Tarjeta acciones={<button>Nuevo</button>}>Contenido</Tarjeta>);

        expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
        expect(container.querySelector("header")).not.toBeNull();
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("aplica una clase adicional a la tarjeta", () => {
        const { container } = render(<Tarjeta className="mb-6">Contenido</Tarjeta>);

        expect(container.firstChild).toHaveClass("mb-6");
    });
});