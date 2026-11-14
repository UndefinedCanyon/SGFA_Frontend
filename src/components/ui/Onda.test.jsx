import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Onda from "./Onda";

describe("Onda", () => {
    it("es decorativa y acepta clases extra", () => {
        const { container } = render(<Onda className="text-gray-50" />);
        const svg = container.querySelector("svg");

        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg).toHaveClass("text-gray-50");
        expect(svg.querySelector("path")).toHaveAttribute("fill", "currentColor");
    });

    it("funciona sin clases extra", () => {
        const { container } = render(<Onda />);

        expect(container.querySelector("svg")).toBeInTheDocument();
    });
});
