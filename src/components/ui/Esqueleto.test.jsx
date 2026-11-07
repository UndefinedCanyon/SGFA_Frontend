import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Esqueleto from "./Esqueleto";

describe("Esqueleto", () => {
    it("se oculta a los lectores de pantalla", () => {
        const { container } = render(<Esqueleto />);

        expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("usa un tamaño por defecto", () => {
        const { container } = render(<Esqueleto />);

        expect(container.firstChild).toHaveClass("esqueleto", "h-4", "w-full");
    });

    it("acepta un tamaño propio que reemplaza al de por defecto", () => {
        const { container } = render(<Esqueleto className="h-10 w-20" />);

        expect(container.firstChild).toHaveClass("h-10", "w-20");
        expect(container.firstChild).not.toHaveClass("w-full");
    });
});