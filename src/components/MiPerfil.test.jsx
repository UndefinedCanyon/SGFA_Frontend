import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({
    consultarMiPerfil: vi.fn(),
    actualizarMiPerfil: vi.fn(),
    subirLogoArtesano: vi.fn(),
    quitarLogoArtesano: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("./SelectorImagen", () => ({
    default: ({ imagen, onSubir, onQuitar, onError }) => (
        <div data-testid="selector">
            <span>{`logo:${imagen ?? "ninguno"}`}</span>
            <button onClick={() => onSubir("archivo-nuevo")}>subir</button>
            <button onClick={() => onQuitar()}>quitar</button>
            <button onClick={() => onError("Error de logo")}>fallar</button>
        </div>
    ),
}));

import MiPerfil from "./MiPerfil";
import {
    actualizarMiPerfil, consultarMiPerfil, quitarLogoArtesano, subirLogoArtesano,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const perfil = {
    nombre: "Ana Gómez",
    telefono: "300",
    nombreEmprendimiento: "Cerámicas Ana",
    descripcionCorta: "Vasijas",
    correoElectronico: "ana@correo.com",
    cc: "1010",
    logo: "logo.png",
};

let actualizarUsuario;

beforeEach(() => {
    vi.clearAllMocks();
    actualizarUsuario = vi.fn();
    useAuth.mockReturnValue({ usuario: { token: "tok" }, actualizarUsuario });
    consultarMiPerfil.mockResolvedValue(perfil);
});

describe("MiPerfil", () => {
    it("carga el perfil con el token y rellena el formulario", async () => {
        render(<MiPerfil />);

        expect(await screen.findByLabelText("Nombre completo")).toHaveValue("Ana Gómez");
        expect(consultarMiPerfil).toHaveBeenCalledWith("tok");
        expect(screen.getByLabelText("Teléfono")).toHaveValue("300");
        expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
        expect(screen.getByLabelText("Cédula")).toHaveValue("1010");
        expect(screen.getByText("7/300 caracteres")).toBeInTheDocument();
        expect(screen.getByText("logo:logo.png")).toBeInTheDocument();
    });

    it("los campos nulos del servidor se muestran vacíos", async () => {
        consultarMiPerfil.mockResolvedValue({
            ...perfil, nombre: null, telefono: null, nombreEmprendimiento: null, descripcionCorta: null,
        });
        render(<MiPerfil />);

        expect(await screen.findByLabelText("Teléfono")).toHaveValue("");
        expect(screen.getByText("0/300 caracteres")).toBeInTheDocument();
    });

    it("sin cambios el botón Guardar está deshabilitado y lo explica", async () => {
        render(<MiPerfil />);

        expect(await screen.findByRole("button", { name: "Guardar cambios" })).toBeDisabled();
        expect(screen.getByText("No hay cambios por guardar.")).toBeInTheDocument();
    });

    it("si falla la carga muestra el error y no el formulario", async () => {
        consultarMiPerfil.mockRejectedValue(new Error("No se pudo cargar el perfil."));
        render(<MiPerfil />);

        expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el perfil.");
        expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument();
    });

    it("al editar habilita Guardar, guarda, actualiza la sesión y confirma", async () => {
        actualizarMiPerfil.mockResolvedValue({ ...perfil, nombre: "Ana G." });
        render(<MiPerfil />);
        const nombre = await screen.findByLabelText("Nombre completo");

        fireEvent.change(nombre, { target: { value: "Ana G." } });
        const guardar = screen.getByRole("button", { name: "Guardar cambios" });
        expect(guardar).toBeEnabled();
        fireEvent.click(guardar);

        expect(await screen.findByText("Perfil actualizado correctamente.")).toBeInTheDocument();
        expect(actualizarMiPerfil).toHaveBeenCalledWith(
            { nombre: "Ana G.", telefono: "300", nombreEmprendimiento: "Cerámicas Ana", descripcionCorta: "Vasijas" },
            "tok"
        );
        expect(actualizarUsuario).toHaveBeenCalledWith({ nombre: "Ana G." });
        await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
    });

    it("si guardar falla muestra el error", async () => {
        actualizarMiPerfil.mockRejectedValue(new Error("Teléfono inválido."));
        render(<MiPerfil />);
        fireEvent.change(await screen.findByLabelText("Teléfono"), { target: { value: "abc" } });

        fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Teléfono inválido.");
    });

    it("subir el logo actualiza el perfil mostrado", async () => {
        subirLogoArtesano.mockResolvedValue({ ...perfil, logo: "nuevo.png" });
        render(<MiPerfil />);
        await screen.findByTestId("selector");

        fireEvent.click(screen.getByText("subir"));

        expect(await screen.findByText("logo:nuevo.png")).toBeInTheDocument();
        expect(subirLogoArtesano).toHaveBeenCalledWith("archivo-nuevo", "tok");
    });

    it("quitar el logo actualiza el perfil mostrado", async () => {
        quitarLogoArtesano.mockResolvedValue({ ...perfil, logo: null });
        render(<MiPerfil />);
        await screen.findByTestId("selector");

        fireEvent.click(screen.getByText("quitar"));

        expect(await screen.findByText("logo:ninguno")).toBeInTheDocument();
        expect(quitarLogoArtesano).toHaveBeenCalledWith("tok");
    });

    it("muestra el error del logo que informa el selector", async () => {
        render(<MiPerfil />);
        await screen.findByTestId("selector");

        fireEvent.click(screen.getByText("fallar"));

        expect(await screen.findByRole("alert")).toHaveTextContent("Error de logo");
    });
});
