import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Miniatura from "./Miniatura";

describe("Miniatura", () => {
    it("con imagen muestra la foto con su texto alternativo", () => {
        render(<Miniatura imagen="abc.png" nombre="Ana" />);

        const foto = screen.getByRole("img", { name: "Imagen de Ana" });
        expect(foto.getAttribute("src")).toContain("abc.png");
    });

    it("la foto sin nombre queda con texto alternativo vacío", () => {
        const { container } = render(<Miniatura imagen="abc.png" />);

        expect(container.querySelector("img")).toHaveAttribute("alt", "");
    });

    it("sin imagen muestra la inicial del nombre en mayúscula", () => {
        render(<Miniatura nombre="ana" />);

        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("sin imagen ni nombre muestra un signo de interrogación", () => {
        render(<Miniatura />);

        expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("si la imagen falla al cargar vuelve a la inicial", () => {
        const { container } = render(<Miniatura imagen="rota.png" nombre="Luis" />);

        fireEvent.error(container.querySelector("img"));

        expect(container.querySelector("img")).toBeNull();
        expect(screen.getByText("L")).toBeInTheDocument();
    });

    it("si después llega una imagen distinta, vuelve a intentarla", () => {
        const { container, rerender } = render(<Miniatura imagen="rota.png" nombre="Luis" />);
        fireEvent.error(container.querySelector("img"));

        rerender(<Miniatura imagen="nueva.png" nombre="Luis" />);

        expect(container.querySelector("img").getAttribute("src")).toContain("nueva.png");
    });

    it("usa la forma redonda o cuadrada según la propiedad", () => {
        const { container, rerender } = render(<Miniatura nombre="Ana" redonda />);
        expect(container.firstChild.className).toContain("rounded-full");

        rerender(<Miniatura nombre="Ana" />);
        expect(container.firstChild.className).toContain("rounded-xl");
    });
});
