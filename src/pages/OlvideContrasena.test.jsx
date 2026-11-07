import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OlvideContrasena from "./OlvideContrasena";
import { solicitarRecuperacion } from "../services/api";

vi.mock("../services/api", () => ({ solicitarRecuperacion: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

function montar() {
    return render(
        <MemoryRouter>
            <OlvideContrasena />
        </MemoryRouter>
    );
}

async function enviar(valor = "ana@correo.com") {
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: valor } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));
    });
}

describe("OlvideContrasena", () => {
    it("muestra el formulario inicial y el enlace para volver al login", () => {
        montar();

        expect(screen.getByRole("heading", { name: "Recupera tu contraseña" })).toBeInTheDocument();
        expect(screen.getByLabelText("Correo electrónico")).toBeRequired();
        expect(screen.getByRole("button", { name: "Enviar enlace" })).toBeEnabled();
        expect(screen.getByRole("link", { name: "Volver a iniciar sesión" })).toHaveAttribute("href", "/login");
    });

    it("solicita la recuperación con el correo escrito y muestra el mensaje del servidor", async () => {
        solicitarRecuperacion.mockResolvedValue({ mensaje: "Te enviamos un correo." });
        montar();

        await enviar("ana@correo.com");

        expect(solicitarRecuperacion).toHaveBeenCalledWith("ana@correo.com");
        expect(screen.getByText(/Te enviamos un correo\./)).toBeInTheDocument();
        expect(screen.getByText(/El enlace vence en 1 hora/)).toBeInTheDocument();
    });

    it("tras enviar, bloquea el botón con una cuenta regresiva de 60 segundos", async () => {
        solicitarRecuperacion.mockResolvedValue({ mensaje: "Listo." });
        montar();

        await enviar();

        const boton = screen.getByRole("button", { name: "Reenviar en 60 s" });
        expect(boton).toBeDisabled();

        act(() => vi.advanceTimersByTime(1000));
        expect(screen.getByRole("button", { name: "Reenviar en 59 s" })).toBeDisabled();
    });

    it("al terminar la espera permite enviar de nuevo", async () => {
        solicitarRecuperacion.mockResolvedValue({ mensaje: "Listo." });
        montar();
        await enviar();

        // Cada segundo programa el siguiente al renderizar, así que se avanza de uno en uno.
        for (let segundo = 0; segundo < 60; segundo += 1) {
            act(() => vi.advanceTimersByTime(1000));
        }

        expect(screen.getByRole("button", { name: "Enviar de nuevo" })).toBeEnabled();
    });

    it("si falla, muestra el error y no activa la espera", async () => {
        solicitarRecuperacion.mockRejectedValue(new Error("No pudimos conectar con el servidor."));
        montar();

        await enviar();

        expect(screen.getByRole("alert")).toHaveTextContent("No pudimos conectar con el servidor.");
        expect(screen.getByRole("button", { name: "Enviar enlace" })).toBeEnabled();
    });

    it("un reintento limpia el error anterior", async () => {
        solicitarRecuperacion
            .mockRejectedValueOnce(new Error("Falló"))
            .mockResolvedValueOnce({ mensaje: "Listo." });
        montar();
        await enviar();
        expect(screen.getByRole("alert")).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByText(/Listo\./)).toBeInTheDocument();
    });
});