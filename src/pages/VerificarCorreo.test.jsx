import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerificarCorreo from "./VerificarCorreo";
import { verificarCorreo } from "../services/api";

vi.mock("../services/api", () => ({ verificarCorreo: vi.fn() }));
vi.mock("../components/ReenviarVerificacion", () => ({
    default: () => <div data-testid="reenviar" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

function montar(ruta) {
    return render(
        <MemoryRouter initialEntries={[ruta]}>
            <VerificarCorreo />
        </MemoryRouter>
    );
}

describe("VerificarCorreo", () => {
    it("sin token explica que el enlace está incompleto y no llama al servidor", () => {
        montar("/verificar-correo");

        expect(screen.getByRole("heading", { name: "No pudimos confirmar tu correo" })).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(/enlace está incompleto/);
        expect(screen.getByTestId("reenviar")).toBeInTheDocument();
        expect(verificarCorreo).not.toHaveBeenCalled();
    });

    it("con token muestra primero que está confirmando", () => {
        verificarCorreo.mockReturnValue(new Promise(() => {}));

        montar("/verificar-correo?token=abc123");

        expect(screen.getByRole("heading", { name: /Confirmando tu correo/ })).toBeInTheDocument();
        expect(verificarCorreo).toHaveBeenCalledWith("abc123");
    });

    it("si el servidor acepta el token, confirma el correo y lleva al login", async () => {
        verificarCorreo.mockResolvedValue({ mensaje: "Tu cuenta quedó activa." });

        montar("/verificar-correo?token=abc123");

        expect(await screen.findByRole("heading", { name: "¡Correo confirmado!" })).toBeInTheDocument();
        expect(screen.getByText("Tu cuenta quedó activa.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    });

    it("si el servidor rechaza el token, muestra el motivo y ofrece un enlace nuevo", async () => {
        verificarCorreo.mockRejectedValue(new Error("El enlace ya venció."));

        montar("/verificar-correo?token=viejo");

        expect(await screen.findByRole("heading", { name: "No pudimos confirmar tu correo" })).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("El enlace ya venció.");
        expect(screen.getByText("¿Necesitas un enlace nuevo?")).toBeInTheDocument();
        expect(screen.getByTestId("reenviar")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute("href", "/login");
    });

    it("verifica el token una sola vez", async () => {
        verificarCorreo.mockResolvedValue({ mensaje: "Listo." });

        montar("/verificar-correo?token=abc123");
        await waitFor(() => expect(screen.getByText("Listo.")).toBeInTheDocument());

        expect(verificarCorreo).toHaveBeenCalledTimes(1);
    });
});