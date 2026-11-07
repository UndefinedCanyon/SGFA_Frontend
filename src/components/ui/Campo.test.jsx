import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Campo from "./Campo";

describe("Campo", () => {
    it("asocia la etiqueta con el campo", () => {
        render(<Campo etiqueta="Correo" />);

        expect(screen.getByLabelText("Correo")).toBeInTheDocument();
        expect(screen.getByLabelText("Correo").tagName).toBe("INPUT");
    });

    it("pasa el resto de propiedades al campo", () => {
        render(<Campo etiqueta="Nombre" placeholder="Tu nombre" type="text" maxLength={20} required />);

        const campo = screen.getByLabelText("Nombre");
        expect(campo).toHaveAttribute("placeholder", "Tu nombre");
        expect(campo).toHaveAttribute("maxlength", "20");
        expect(campo).toBeRequired();
    });

    it("sin error ni ayuda no muestra texto adicional ni referencias ARIA", () => {
        render(<Campo etiqueta="Nombre" />);

        const campo = screen.getByLabelText("Nombre");
        expect(campo).not.toHaveAttribute("aria-invalid");
        expect(campo).not.toHaveAttribute("aria-describedby");
    });

    it("muestra la ayuda y la enlaza con aria-describedby", () => {
        render(<Campo etiqueta="Teléfono" ayuda="Solo números" />);

        const campo = screen.getByLabelText("Teléfono");
        const ayuda = screen.getByText("Solo números");
        expect(campo).toHaveAttribute("aria-describedby", ayuda.id);
        expect(campo).not.toHaveAttribute("aria-invalid");
        expect(ayuda).toHaveClass("text-gray-500");
    });

    it("muestra el error, lo marca como inválido y lo enlaza con el campo", () => {
        render(<Campo etiqueta="Correo" error="Correo no válido" />);

        const campo = screen.getByLabelText("Correo");
        const error = screen.getByText("Correo no válido");
        expect(campo).toHaveAttribute("aria-invalid", "true");
        expect(campo).toHaveAttribute("aria-describedby", error.id);
        expect(error).toHaveClass("text-red-600");
        expect(campo).toHaveClass("border-red-400");
    });

    it("el error tiene prioridad sobre la ayuda", () => {
        render(<Campo etiqueta="Correo" ayuda="Usa tu correo personal" error="Correo no válido" />);

        expect(screen.getByText("Correo no válido")).toBeInTheDocument();
        expect(screen.queryByText("Usa tu correo personal")).not.toBeInTheDocument();
    });

    it("sin error usa el borde normal", () => {
        render(<Campo etiqueta="Correo" />);

        expect(screen.getByLabelText("Correo")).toHaveClass("border-gray-300");
    });

    it("puede renderizarse como textarea", () => {
        render(<Campo etiqueta="Descripción" as="textarea" rows={3} />);

        expect(screen.getByLabelText("Descripción").tagName).toBe("TEXTAREA");
    });

    it("puede renderizarse como select con opciones", () => {
        render(
            <Campo etiqueta="Rol" as="select" defaultValue="b">
                <option value="a">Admin</option>
                <option value="b">Artesano</option>
            </Campo>
        );

        const select = screen.getByLabelText("Rol");
        expect(select.tagName).toBe("SELECT");
        expect(select).toHaveValue("b");
        expect(screen.getAllByRole("option")).toHaveLength(2);
    });

    it("aplica className al contenedor y no al campo", () => {
        const { container } = render(<Campo etiqueta="Nombre" className="mb-4" />);

        expect(container.firstChild).toHaveClass("mb-4");
        expect(screen.getByLabelText("Nombre")).not.toHaveClass("mb-4");
    });

    it("da un id distinto a cada campo", () => {
        render(
            <>
                <Campo etiqueta="Uno" />
                <Campo etiqueta="Dos" />
            </>
        );

        expect(screen.getByLabelText("Uno").id).not.toBe(screen.getByLabelText("Dos").id);
    });
});