import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReenviarVerificacion from "./ReenviarVerificacion";
import { reenviarVerificacion } from "../services/api";

vi.mock("../services/api", () => ({ reenviarVerificacion: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

const BOTON = /Reenviar/;

async function enviar() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: BOTON }));
    });
}

describe("ReenviarVerificacion sin correo fijo", () => {
    it("pide el correo y mantiene el botón bloqueado mientras esté vacío", () => {
        render(<ReenviarVerificacion />);

        expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reenviar correo de confirmación" })).toBeDisabled();
    });

    it("un correo con solo espacios no desbloquea el botón", () => {
        render(<ReenviarVerificacion />);

        fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "   " } });

        expect(screen.getByRole("button", { name: BOTON })).toBeDisabled();
    });

    it("al escribir el correo habilita el botón y reenvía a ese correo", async () => {
        reenviarVerificacion.mockResolvedValue({ mensaje: "Te lo enviamos otra vez." });
        render(<ReenviarVerificacion />);

        fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "ana@correo.com" } });
        expect(screen.getByRole("button", { name: BOTON })).toBeEnabled();
        await enviar();

        expect(reenviarVerificacion).toHaveBeenCalledWith("ana@correo.com");
        expect(screen.getByText("Te lo enviamos otra vez.")).toBeInTheDocument();
    });
});

describe("ReenviarVerificacion con correo fijo", () => {
    it("no muestra el campo de correo y usa el correo recibido", async () => {
        reenviarVerificacion.mockResolvedValue({ mensaje: "Enviado." });
        render(<ReenviarVerificacion correo="luis@correo.com" />);

        expect(screen.queryByLabelText("Correo electrónico")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: BOTON })).toBeEnabled();
        await enviar();

        expect(reenviarVerificacion).toHaveBeenCalledWith("luis@correo.com");
    });
});

describe("ReenviarVerificacion: espera entre envíos", () => {
    it("tras enviar bloquea el botón con una cuenta regresiva de 60 segundos", async () => {
        reenviarVerificacion.mockResolvedValue({ mensaje: "Enviado." });
        render(<ReenviarVerificacion correo="luis@correo.com" />);

        await enviar();

        expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
        act(() => vi.advanceTimersByTime(1000));
        expect(screen.getByRole("button", { name: "Reenviar en 59 s" })).toBeDisabled();
    });

    it("al terminar la espera vuelve a permitir el reenvío", async () => {
        reenviarVerificacion.mockResolvedValue({ mensaje: "Enviado." });
        render(<ReenviarVerificacion correo="luis@correo.com" />);
        await enviar();

        // Cada segundo programa el siguiente al renderizar, así que se avanza de uno en uno.
        for (let segundo = 0; segundo < 60; segundo += 1) {
            act(() => vi.advanceTimersByTime(1000));
        }

        expect(screen.getByRole("button", { name: "Reenviar correo de confirmación" })).toBeEnabled();
    });
});

describe("ReenviarVerificacion: errores", () => {
    it("si falla muestra el error y no activa la espera", async () => {
        reenviarVerificacion.mockRejectedValue(new Error("Ese correo no está registrado."));
        render(<ReenviarVerificacion correo="luis@correo.com" />);

        await enviar();

        expect(screen.getByRole("alert")).toHaveTextContent("Ese correo no está registrado.");
        expect(screen.getByRole("button", { name: "Reenviar correo de confirmación" })).toBeEnabled();
    });

    it("un reintento exitoso limpia el error anterior", async () => {
        reenviarVerificacion
            .mockRejectedValueOnce(new Error("Falló"))
            .mockResolvedValueOnce({ mensaje: "Ahora sí." });
        render(<ReenviarVerificacion correo="luis@correo.com" />);
        await enviar();
        expect(screen.getByRole("alert")).toBeInTheDocument();

        await enviar();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByText("Ahora sí.")).toBeInTheDocument();
    });
});