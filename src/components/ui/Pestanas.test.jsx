import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Pestanas, { PanelPestana } from "./Pestanas";

const PESTANAS = [
    { id: "a", etiqueta: "Productos", contador: 3 },
    { id: "b", etiqueta: "Solicitudes" },
    { id: "c", etiqueta: "Historial", contador: 0 },
];

function montar(activa = "a") {
    const onCambiar = vi.fn();
    render(<Pestanas idBase="panel" pestanas={PESTANAS} activa={activa} onCambiar={onCambiar} />);
    return {
        onCambiar,
        tab: (nombre) => screen.getByRole("tab", { name: new RegExp(nombre) }),
    };
}

describe("Pestanas", () => {
    it("muestra una lista de pestañas con su etiqueta", () => {
        montar();

        expect(screen.getByRole("tablist", { name: "Secciones del panel" })).toBeInTheDocument();
        expect(screen.getAllByRole("tab")).toHaveLength(3);
    });

    it("marca como seleccionada solo la pestaña activa", () => {
        const { tab } = montar("b");

        expect(tab("Solicitudes")).toHaveAttribute("aria-selected", "true");
        expect(tab("Productos")).toHaveAttribute("aria-selected", "false");
        expect(tab("Historial")).toHaveAttribute("aria-selected", "false");
    });

    it("solo la pestaña activa entra en el orden de tabulación", () => {
        const { tab } = montar("b");

        expect(tab("Solicitudes")).toHaveAttribute("tabindex", "0");
        expect(tab("Productos")).toHaveAttribute("tabindex", "-1");
    });

    it("enlaza cada pestaña con su panel mediante ids", () => {
        const { tab } = montar();

        expect(tab("Productos")).toHaveAttribute("id", "panel-tab-a");
        expect(tab("Productos")).toHaveAttribute("aria-controls", "panel-panel-a");
    });

    it("muestra el contador, incluso cuando es cero, y lo omite si no existe", () => {
        const { tab } = montar();

        expect(tab("Productos")).toHaveTextContent("3");
        expect(tab("Historial")).toHaveTextContent("0");
        expect(tab("Solicitudes")).toHaveTextContent(/^Solicitudes$/);
    });

    it("avisa la pestaña elegida al hacer clic", () => {
        const { tab, onCambiar } = montar();

        fireEvent.click(tab("Historial"));

        expect(onCambiar).toHaveBeenCalledWith("c");
    });

    it("la flecha derecha pasa a la siguiente y le da el foco", () => {
        const { tab, onCambiar } = montar("a");

        fireEvent.keyDown(tab("Productos"), { key: "ArrowRight" });

        expect(onCambiar).toHaveBeenCalledWith("b");
        expect(tab("Solicitudes")).toHaveFocus();
    });

    it("la flecha derecha en la última vuelve a la primera", () => {
        const { tab, onCambiar } = montar("c");

        fireEvent.keyDown(tab("Historial"), { key: "ArrowRight" });

        expect(onCambiar).toHaveBeenCalledWith("a");
        expect(tab("Productos")).toHaveFocus();
    });

    it("la flecha izquierda pasa a la anterior", () => {
        const { tab, onCambiar } = montar("b");

        fireEvent.keyDown(tab("Solicitudes"), { key: "ArrowLeft" });

        expect(onCambiar).toHaveBeenCalledWith("a");
        expect(tab("Productos")).toHaveFocus();
    });

    it("la flecha izquierda en la primera salta a la última", () => {
        const { tab, onCambiar } = montar("a");

        fireEvent.keyDown(tab("Productos"), { key: "ArrowLeft" });

        expect(onCambiar).toHaveBeenCalledWith("c");
        expect(tab("Historial")).toHaveFocus();
    });

    it("Home va a la primera y End a la última", () => {
        const { tab, onCambiar } = montar("b");

        fireEvent.keyDown(tab("Solicitudes"), { key: "Home" });
        expect(onCambiar).toHaveBeenLastCalledWith("a");

        fireEvent.keyDown(tab("Solicitudes"), { key: "End" });
        expect(onCambiar).toHaveBeenLastCalledWith("c");
    });

    it("ignora las teclas que no son de navegación", () => {
        const { tab, onCambiar } = montar();

        const evento = fireEvent.keyDown(tab("Productos"), { key: "a" });

        expect(onCambiar).not.toHaveBeenCalled();
        expect(evento).toBe(true);
    });

    it("evita el desplazamiento de la página al navegar con flechas", () => {
        const { tab } = montar();

        const noCancelado = fireEvent.keyDown(tab("Productos"), { key: "ArrowRight" });

        expect(noCancelado).toBe(false);
    });
});

describe("PanelPestana", () => {
    it("muestra su contenido cuando es la pestaña activa", () => {
        render(
            <PanelPestana idBase="panel" id="a" activa="a">
                <p>Contenido A</p>
            </PanelPestana>
        );

        const panel = screen.getByRole("tabpanel");
        expect(panel).toBeVisible();
        expect(panel).toHaveAttribute("id", "panel-panel-a");
        expect(panel).toHaveAttribute("aria-labelledby", "panel-tab-a");
        expect(screen.getByText("Contenido A")).toBeInTheDocument();
    });

    it("se oculta cuando otra pestaña está activa, pero conserva su contenido", () => {
        render(
            <PanelPestana idBase="panel" id="a" activa="b">
                <p>Contenido A</p>
            </PanelPestana>
        );

        expect(screen.getByRole("tabpanel", { hidden: true })).not.toBeVisible();
        expect(screen.getByText("Contenido A")).toBeInTheDocument();
    });
});