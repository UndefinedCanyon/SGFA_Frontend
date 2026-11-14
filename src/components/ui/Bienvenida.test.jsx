import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Bienvenida from "./Bienvenida";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Bienvenida", () => {
    it("saluda por el nombre y explica qué sigue según el rol", () => {
        render(<Bienvenida nombre="Carlos" rol="ARTESANO" onCerrar={vi.fn()} />);

        expect(screen.getByRole("status")).toHaveTextContent("¡Bienvenido a SGFA, Carlos!");
        expect(screen.getByText(/administra tu catálogo/)).toBeInTheDocument();
    });

    it("muestra el mensaje del administrador", () => {
        render(<Bienvenida nombre="Admin" rol="ADMINISTRADOR" onCerrar={vi.fn()} />);

        expect(screen.getByText(/gestiona ferias, solicitudes y artesanos/)).toBeInTheDocument();
    });

    it("usa un mensaje general si el rol no se conoce", () => {
        render(<Bienvenida nombre="Ana" rol="OTRO" onCerrar={vi.fn()} />);

        expect(screen.getByText("Qué bueno verte de nuevo.")).toBeInTheDocument();
    });

    it("se cierra sola pasado un momento", () => {
        const onCerrar = vi.fn();
        render(<Bienvenida nombre="Ana" rol="ARTESANO" onCerrar={onCerrar} />);

        expect(onCerrar).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(3300));

        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    it("se cierra con el botón, con Escape y tocando fuera, pero no al tocar la tarjeta", () => {
        const onCerrar = vi.fn();
        render(<Bienvenida nombre="Ana" rol="ARTESANO" onCerrar={onCerrar} />);

        fireEvent.click(screen.getByRole("status"));
        expect(onCerrar).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
        fireEvent.keyDown(window, { key: "Escape" });
        fireEvent.keyDown(window, { key: "Enter" });
        fireEvent.click(screen.getByTestId("bienvenida-fondo"));

        expect(onCerrar).toHaveBeenCalledTimes(3);
    });

    it("limpia el temporizador y el teclado al desmontarse", () => {
        const onCerrar = vi.fn();
        const { unmount } = render(<Bienvenida nombre="Ana" rol="ARTESANO" onCerrar={onCerrar} />);

        unmount();
        act(() => vi.advanceTimersByTime(5000));
        fireEvent.keyDown(window, { key: "Escape" });

        expect(onCerrar).not.toHaveBeenCalled();
    });
});
