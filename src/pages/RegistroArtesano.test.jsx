import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegistroArtesano from "./RegistroArtesano";
import { registrarArtesano } from "../services/api";
import { useAuth } from "../context/AuthContext";

vi.mock("../services/api", () => ({ registrarArtesano: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../components/ReenviarVerificacion", () => ({
    default: ({ correo }) => <div data-testid="reenviar">{correo}</div>,
}));

beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ usuario: null });
});

function montar() {
    return render(
        <MemoryRouter initialEntries={["/registro"]}>
            <Routes>
                <Route path="/registro" element={<RegistroArtesano />} />
                <Route path="/admin" element={<p>Panel de administración</p>} />
                <Route path="/mi-panel" element={<p>Panel del artesano</p>} />
            </Routes>
        </MemoryRouter>
    );
}

const DATOS = {
    nombre: "Ana Gómez",
    correoElectronico: "ana@correo.com",
    contrasena: "Segura1234",
    cc: "1010101010",
    telefono: "3001234567",
    nombreEmprendimiento: "Cerámicas Ana",
    descripcionCorta: "Vasijas hechas a mano.",
};

function llenarFormulario() {
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: DATOS.nombre } });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: DATOS.correoElectronico } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: DATOS.contrasena } });
    fireEvent.change(screen.getByLabelText("Cédula"), { target: { value: DATOS.cc } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: DATOS.telefono } });
    fireEvent.change(screen.getByLabelText("Nombre del emprendimiento"), {
        target: { value: DATOS.nombreEmprendimiento },
    });
    fireEvent.change(screen.getByLabelText("Descripción corta"), { target: { value: DATOS.descripcionCorta } });
}

async function enviar() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
    });
}

describe("RegistroArtesano: formulario", () => {
    it("muestra todos los campos y el enlace para quien ya tiene cuenta", () => {
        montar();

        expect(screen.getByRole("heading", { name: "Registro de artesano" })).toBeInTheDocument();
        for (const etiqueta of [
            "Nombre completo",
            "Correo electrónico",
            "Contraseña",
            "Cédula",
            "Teléfono",
            "Nombre del emprendimiento",
            "Descripción corta",
        ]) {
            expect(screen.getByLabelText(etiqueta)).toBeInTheDocument();
        }
        expect(screen.getByRole("link", { name: "Inicia sesión" })).toHaveAttribute("href", "/login");
    });

    it("marca como obligatorios los campos que lo son y deja opcional el teléfono", () => {
        montar();

        expect(screen.getByLabelText("Nombre completo")).toBeRequired();
        expect(screen.getByLabelText("Correo electrónico")).toBeRequired();
        expect(screen.getByLabelText("Contraseña")).toBeRequired();
        expect(screen.getByLabelText("Cédula")).toBeRequired();
        expect(screen.getByLabelText("Nombre del emprendimiento")).toBeRequired();
        expect(screen.getByLabelText("Teléfono")).not.toBeRequired();
        expect(screen.getByLabelText("Descripción corta")).not.toBeRequired();
    });

    it("explica los requisitos de la contraseña y del correo", () => {
        montar();

        expect(screen.getByText("Mínimo 8 caracteres.")).toBeInTheDocument();
        expect(screen.getByText(/Usa un correo real/)).toBeInTheDocument();
    });

    it("la contraseña empieza oculta y se puede mostrar", () => {
        montar();
        expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");

        fireEvent.click(screen.getByLabelText("Mostrar contraseña"));

        expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "text");
    });

    it("lo que se escribe queda en cada campo", () => {
        montar();

        llenarFormulario();

        expect(screen.getByLabelText("Nombre completo")).toHaveValue(DATOS.nombre);
        expect(screen.getByLabelText("Descripción corta")).toHaveValue(DATOS.descripcionCorta);
    });
});

describe("RegistroArtesano: envío", () => {
    it("envía todos los datos escritos al servidor", async () => {
        registrarArtesano.mockResolvedValue({ correoElectronico: DATOS.correoElectronico });
        montar();

        llenarFormulario();
        await enviar();

        expect(registrarArtesano).toHaveBeenCalledWith(DATOS);
    });

    it("al registrarse muestra la pantalla «Revisa tu correo» con el correo confirmado", async () => {
        registrarArtesano.mockResolvedValue({ correoElectronico: "ana@correo.com" });
        montar();

        llenarFormulario();
        await enviar();

        expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
        expect(screen.getByText("ana@correo.com", { selector: "span" })).toBeInTheDocument();
        expect(screen.getByTestId("reenviar")).toHaveTextContent("ana@correo.com");
        expect(screen.getByRole("link", { name: /Ya confirmé mi correo/ })).toHaveAttribute("href", "/login");
        expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument();
    });

    it("mientras espera muestra «Registrando...» y bloquea el botón", async () => {
        let resolver;
        registrarArtesano.mockReturnValue(new Promise((r) => (resolver = r)));
        montar();

        llenarFormulario();
        await enviar();

        expect(screen.getByRole("button", { name: /Registrando/ })).toBeDisabled();

        await act(async () => resolver({ correoElectronico: "ana@correo.com" }));
    });

    it("si el servidor rechaza el registro muestra el error y conserva lo escrito", async () => {
        registrarArtesano.mockRejectedValue(new Error("Ese correo ya está registrado."));
        montar();

        llenarFormulario();
        await enviar();

        expect(screen.getByRole("alert")).toHaveTextContent("Ese correo ya está registrado.");
        expect(screen.getByLabelText("Nombre completo")).toHaveValue(DATOS.nombre);
        expect(screen.getByRole("button", { name: "Crear mi cuenta" })).toBeEnabled();
    });

    it("al reintentar con éxito desaparece el error anterior", async () => {
        registrarArtesano
            .mockRejectedValueOnce(new Error("Falló"))
            .mockResolvedValueOnce({ correoElectronico: "ana@correo.com" });
        montar();
        llenarFormulario();
        await enviar();
        expect(screen.getByRole("alert")).toBeInTheDocument();

        await enviar();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
    });
});

describe("RegistroArtesano: usuario con sesión iniciada", () => {
    it("un artesano es enviado a su panel", () => {
        useAuth.mockReturnValue({ usuario: { rol: "ARTESANO" } });

        montar();

        expect(screen.getByText("Panel del artesano")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Registro de artesano" })).not.toBeInTheDocument();
    });

    it("un administrador es enviado a su panel", () => {
        useAuth.mockReturnValue({ usuario: { rol: "ADMINISTRADOR" } });

        montar();

        expect(screen.getByText("Panel de administración")).toBeInTheDocument();
    });
});