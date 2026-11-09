import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({ registrarArtesanoAdmin: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

import RegistrarArtesanoAdmin from "./RegistrarArtesanoAdmin";
import { registrarArtesanoAdmin } from "../services/api";
import { useAuth } from "../context/AuthContext";

beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ usuario: { token: "tok-admin" } });
});

function llenar() {
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Ana Gómez" } });
    fireEvent.change(screen.getByLabelText("Cédula"), { target: { value: "1010" } });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "ana@correo.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña inicial"), { target: { value: "Segura1234" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText("Nombre del emprendimiento"), { target: { value: "Cerámicas Ana" } });
    fireEvent.change(screen.getByLabelText("Descripción corta"), { target: { value: "Vasijas" } });
}

const enviar = () => fireEvent.click(screen.getByRole("button", { name: "Registrar artesano" }));

describe("RegistrarArtesanoAdmin", () => {
    it("muestra todos los campos del formulario", () => {
        render(<RegistrarArtesanoAdmin />);

        expect(screen.getByLabelText("Nombre completo")).toBeRequired();
        expect(screen.getByLabelText("Contraseña inicial")).toHaveAttribute("minLength", "8");
        expect(screen.getByLabelText("Teléfono")).not.toBeRequired();
        expect(screen.getByRole("button", { name: "Registrar artesano" })).toBeInTheDocument();
    });

    it("no muestra el botón Cerrar si no se pasa onCerrar", () => {
        render(<RegistrarArtesanoAdmin />);

        expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    });

    it("el botón Cerrar llama a onCerrar", () => {
        const onCerrar = vi.fn();
        render(<RegistrarArtesanoAdmin onCerrar={onCerrar} />);

        fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    it("envía los datos con el token del administrador, avisa y limpia el formulario", async () => {
        registrarArtesanoAdmin.mockResolvedValue({ nombreEmprendimiento: "Cerámicas Ana" });
        const onCreado = vi.fn().mockResolvedValue(undefined);
        render(<RegistrarArtesanoAdmin onCreado={onCreado} />);

        llenar();
        enviar();

        expect(await screen.findByText(/Artesano "Cerámicas Ana" registrado y confirmado/)).toBeInTheDocument();
        expect(registrarArtesanoAdmin).toHaveBeenCalledWith(
            {
                nombre: "Ana Gómez",
                correoElectronico: "ana@correo.com",
                contrasena: "Segura1234",
                cc: "1010",
                telefono: "300",
                nombreEmprendimiento: "Cerámicas Ana",
                descripcionCorta: "Vasijas",
            },
            "tok-admin"
        );
        expect(onCreado).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText("Nombre completo")).toHaveValue("");
    });

    it("funciona aunque no se pase onCreado", async () => {
        registrarArtesanoAdmin.mockResolvedValue({ nombreEmprendimiento: "X" });
        render(<RegistrarArtesanoAdmin />);

        llenar();
        enviar();

        expect(await screen.findByText(/registrado y confirmado/)).toBeInTheDocument();
    });

    it("si falla, muestra el error y conserva lo escrito", async () => {
        registrarArtesanoAdmin.mockRejectedValue(new Error("Ese correo ya está registrado."));
        render(<RegistrarArtesanoAdmin />);

        llenar();
        enviar();

        expect(await screen.findByRole("alert")).toHaveTextContent("Ese correo ya está registrado.");
        expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Gómez");
        await waitFor(() => expect(screen.getByRole("button", { name: "Registrar artesano" })).toBeEnabled());
    });

    it("editar un campo después del éxito oculta el mensaje", async () => {
        registrarArtesanoAdmin.mockResolvedValue({ nombreEmprendimiento: "X" });
        render(<RegistrarArtesanoAdmin />);
        llenar();
        enviar();
        await screen.findByText(/registrado y confirmado/);

        fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Otro" } });

        expect(screen.queryByText(/registrado y confirmado/)).not.toBeInTheDocument();
    });
});
