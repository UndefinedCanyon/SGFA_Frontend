import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Aviso from "./Aviso";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

function montar(propiedades = {}) {
    const onCerrar = vi.fn();
    const aviso = { id: 7, tipo: "exito", texto: "Mensaje de prueba", duracion: 5000, ...propiedades };
    const resultado = render(<Aviso aviso={aviso} onCerrar={onCerrar} />);
    return { onCerrar, ...resultado };
}

describe("Aviso", () => {
    it.each([
        ["exito", "Listo", "status"],
        ["error", "Algo salió mal", "alert"],
        ["aviso", "Atención", "status"],
        ["info", "Información", "status"],
    ])("el tipo %s muestra el título %s con el rol %s", (tipo, titulo, rol) => {
        montar({ tipo });

        expect(screen.getByRole(rol)).toBeInTheDocument();
        expect(screen.getByText(titulo)).toBeInTheDocument();
        expect(screen.getByText("Mensaje de prueba")).toBeInTheDocument();
    });

    it("usa el estilo informativo si el tipo no se conoce", () => {
        montar({ tipo: "otro-tipo" });

        expect(screen.getByText("Información")).toBeInTheDocument();
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("se cierra solo cuando termina su duración", () => {
        const { onCerrar } = montar({ duracion: 3000 });

        act(() => vi.advanceTimersByTime(2900));
        expect(onCerrar).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(200));
        expect(onCerrar).toHaveBeenCalledTimes(1);
        expect(onCerrar).toHaveBeenCalledWith(7);
    });

    it("se cierra con el botón de cerrar", () => {
        const { onCerrar } = montar();

        fireEvent.click(screen.getByRole("button", { name: /Cerrar notificación/ }));

        expect(onCerrar).toHaveBeenCalledWith(7);
    });

    it("pausa el cierre mientras el ratón está encima y sigue con lo que faltaba", () => {
        const { onCerrar } = montar({ duracion: 5000 });
        const aviso = screen.getByRole("status");

        act(() => vi.advanceTimersByTime(1000));
        fireEvent.mouseEnter(aviso);
        act(() => vi.advanceTimersByTime(20000));
        expect(onCerrar).not.toHaveBeenCalled();

        fireEvent.mouseLeave(aviso);
        act(() => vi.advanceTimersByTime(3900));
        expect(onCerrar).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(200));
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    it("también pausa el cierre mientras tiene el foco del teclado", () => {
        const { onCerrar } = montar({ duracion: 2000 });
        const aviso = screen.getByRole("status");

        fireEvent.focus(aviso);
        act(() => vi.advanceTimersByTime(10000));
        expect(onCerrar).not.toHaveBeenCalled();

        fireEvent.blur(aviso);
        act(() => vi.advanceTimersByTime(2100));
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    it("la barra de progreso dura lo mismo que el aviso", () => {
        const { container } = montar({ duracion: 4321 });

        const barra = container.querySelector(".aviso-progreso");

        expect(barra.style.animationDuration).toBe("4321ms");
    });

    it("no deja temporizadores pendientes al desmontarse", () => {
        const { onCerrar, unmount } = montar({ duracion: 1000 });

        unmount();
        act(() => vi.advanceTimersByTime(5000));

        expect(onCerrar).not.toHaveBeenCalled();
    });
});