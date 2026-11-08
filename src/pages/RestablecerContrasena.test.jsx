import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RestablecerContrasena from "./RestablecerContrasena";
import { restablecerContrasena } from "../services/api";

vi.mock("../services/api", () => ({ restablecerContrasena: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
});

function LoginEspia() {
    const { state } = useLocation();
    return <p>login (restablecida: {String(state?.restablecida)})</p>;
}

function montar(ruta = "/restablecer?token=abc123") {
    return render(
        <MemoryRouter initialEntries={[ruta]}>
            <Routes>
                <Route path="/restablecer" element={<RestablecerContrasena />} />
                <Route path="/login" element={<LoginEspia />} />
            </Routes>
        </MemoryRouter>
    );
}

const nueva = () => screen.getByLabelText("Contraseña nueva");
const repetida = () => screen.getByLabelText("Repite la contraseña");

async function enviar(valorNueva, valorRepetida) {
    fireEvent.change(nueva(), { target: { value: valorNueva } });
    fireEvent.change(repetida(), { target: { value: valorRepetida } });
    await act(async () => {
        fireEvent.submit(nueva().closest("form"));
    });
}

describe("RestablecerContrasena sin token", () => {
    it("avisa que el enlace está incompleto y no muestra el formulario", () => {
        montar("/restablecer");

        expect(screen.getByRole("alert")).toHaveTextContent(/enlace está incompleto/);
        expect(screen.queryByLabelText("Contraseña nueva")).not.toBeInTheDocument();
    });

    it("ofrece pedir un enlace nuevo", () => {
        montar("/restablecer");

        expect(screen.getByRole("link", { name: "Solicitar uno nuevo" })).toHaveAttribute(
            "href",
            "/olvide-contrasena"
        );
    });
});

describe("RestablecerContrasena con token", () => {
    it("muestra el formulario con sus dos campos", () => {
        montar();

        expect(screen.getByRole("heading", { name: "Elige una contraseña nueva" })).toBeInTheDocument();
        expect(nueva()).toHaveAttribute("type", "password");
        expect(repetida()).toHaveAttribute("type", "password");
        expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeInTheDocument();
    });

    it("«Mostrar contraseñas» destapa los dos campos a la vez", () => {
        montar();

        fireEvent.click(screen.getByLabelText("Mostrar contraseñas"));

        expect(nueva()).toHaveAttribute("type", "text");
        expect(repetida()).toHaveAttribute("type", "text");
    });

    it("rechaza una contraseña de menos de 8 caracteres sin llamar al servidor", async () => {
        montar();

        await enviar("corta", "corta");

        expect(screen.getByRole("alert")).toHaveTextContent("al menos 8 caracteres");
        expect(restablecerContrasena).not.toHaveBeenCalled();
    });

    it("rechaza si las dos contraseñas no coinciden", async () => {
        montar();

        await enviar("Segura1234", "Segura9999");

        expect(screen.getByRole("alert")).toHaveTextContent("no coinciden");
        expect(restablecerContrasena).not.toHaveBeenCalled();
    });

    it("si todo es válido cambia la contraseña con el token y lleva al login", async () => {
        restablecerContrasena.mockResolvedValue({});
        montar();

        await enviar("Segura1234", "Segura1234");

        expect(restablecerContrasena).toHaveBeenCalledWith("abc123", "Segura1234");
        expect(screen.getByText("login (restablecida: true)")).toBeInTheDocument();
    });

    it("mientras espera al servidor muestra «Guardando...» y bloquea el botón", async () => {
        let resolver;
        restablecerContrasena.mockReturnValue(new Promise((r) => (resolver = r)));
        montar();

        await enviar("Segura1234", "Segura1234");

        expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled();

        await act(async () => resolver({}));
    });

    it("si el servidor falla muestra el error y deja volver a intentar", async () => {
        restablecerContrasena.mockRejectedValue(new Error("El enlace ya venció."));
        montar();

        await enviar("Segura1234", "Segura1234");

        expect(screen.getByRole("alert")).toHaveTextContent("El enlace ya venció.");
        expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeEnabled();
    });

    it("al corregir y reenviar desaparece el error anterior", async () => {
        restablecerContrasena.mockResolvedValue({});
        montar();
        await enviar("corta", "corta");
        expect(screen.getByRole("alert")).toBeInTheDocument();

        await enviar("Segura1234", "Segura1234");

        expect(screen.queryByText(/al menos 8 caracteres/)).not.toBeInTheDocument();
    });
});