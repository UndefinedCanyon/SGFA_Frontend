import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";
import { iniciarSesion } from "../services/api";
import { useAuth } from "../context/AuthContext";

vi.mock("../services/api", () => ({ iniciarSesion: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../components/ReenviarVerificacion", () => ({
    default: ({ correo }) => <div data-testid="reenviar">{correo ?? "sin-correo"}</div>,
}));

let iniciarSesionContexto;

beforeEach(() => {
    vi.clearAllMocks();
    iniciarSesionContexto = vi.fn();
    useAuth.mockReturnValue({ usuario: null, iniciarSesionContexto });
});

function montar(estado) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state: estado }]}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<p>Panel de administración</p>} />
                <Route path="/mi-panel" element={<p>Panel del artesano</p>} />
            </Routes>
        </MemoryRouter>
    );
}

const correo = () => screen.getByLabelText("Correo electrónico");
const contrasena = () => screen.getByLabelText("Contraseña");

function llenarYEnviar(valorCorreo = "ana@correo.com", valorContrasena = "Secreta123") {
    fireEvent.change(correo(), { target: { value: valorCorreo } });
    fireEvent.change(contrasena(), { target: { value: valorContrasena } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("Login: pantalla", () => {
    it("muestra el formulario y los enlaces de ayuda", () => {
        montar();

        expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
        expect(correo()).toBeRequired();
        expect(contrasena()).toBeRequired();
        expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute(
            "href",
            "/olvide-contrasena"
        );
        expect(screen.getByRole("link", { name: "Regístrate aquí" })).toHaveAttribute("href", "/registro");
    });

    it("la contraseña empieza oculta y se puede mostrar", () => {
        montar();
        expect(contrasena()).toHaveAttribute("type", "password");

        fireEvent.click(screen.getByLabelText("Mostrar contraseña"));
        expect(contrasena()).toHaveAttribute("type", "text");

        fireEvent.click(screen.getByLabelText("Mostrar contraseña"));
        expect(contrasena()).toHaveAttribute("type", "password");
    });

    it("no muestra avisos de éxito en una visita normal", () => {
        montar();

        expect(screen.queryByText(/correo fue confirmado/)).not.toBeInTheDocument();
        expect(screen.queryByText(/contraseña fue actualizada/)).not.toBeInTheDocument();
    });

    it("avisa que el correo fue confirmado cuando viene de verificarlo", () => {
        montar({ verificado: true });

        expect(screen.getByText(/Tu correo fue confirmado/)).toBeInTheDocument();
    });

    it("avisa que la contraseña fue actualizada cuando viene de restablecerla", () => {
        montar({ restablecida: true });

        expect(screen.getByText(/Tu contraseña fue actualizada/)).toBeInTheDocument();
    });

    it("rellena el correo si llega desde otra pantalla", () => {
        montar({ correo: "luis@correo.com" });

        expect(correo()).toHaveValue("luis@correo.com");
    });

    it("pone el foco en el correo, o en la contraseña si el correo ya viene escrito", () => {
        const { unmount } = montar();
        expect(correo()).toHaveFocus();
        unmount();

        montar({ correo: "luis@correo.com" });
        expect(contrasena()).toHaveFocus();
    });
});

describe("Login: envío", () => {
    it("inicia sesión con los datos escritos y guarda la sesión", async () => {
        const sesion = { nombre: "Ana", rol: "ARTESANO", token: "t" };
        iniciarSesion.mockResolvedValue(sesion);
        montar();

        await act(async () => llenarYEnviar());

        expect(iniciarSesion).toHaveBeenCalledWith("ana@correo.com", "Secreta123");
        expect(iniciarSesionContexto).toHaveBeenCalledWith(sesion);
    });

    it("mientras espera la respuesta muestra «Ingresando...» y bloquea el botón", async () => {
        let resolver;
        iniciarSesion.mockReturnValue(new Promise((r) => (resolver = r)));
        montar();

        await act(async () => llenarYEnviar());

        const boton = screen.getByRole("button", { name: /Ingresando/ });
        expect(boton).toBeDisabled();

        await act(async () => resolver({ nombre: "Ana" }));
    });

    it("muestra el error del servidor como alerta y deja volver a intentar", async () => {
        iniciarSesion.mockRejectedValue(new Error("Credenciales incorrectas"));
        montar();

        await act(async () => llenarYEnviar());

        expect(screen.getByRole("alert")).toHaveTextContent("Credenciales incorrectas");
        expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
        expect(screen.queryByTestId("reenviar")).not.toBeInTheDocument();
        expect(iniciarSesionContexto).not.toHaveBeenCalled();
    });

    it("si el correo no está verificado, muestra un aviso y ofrece reenviar la verificación", async () => {
        const error = new Error("Debes confirmar tu correo");
        error.codigo = "CORREO_NO_VERIFICADO";
        iniciarSesion.mockRejectedValue(error);
        montar();

        await act(async () => llenarYEnviar("ana@correo.com"));

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Debes confirmar tu correo");
        expect(screen.getByTestId("reenviar")).toHaveTextContent("ana@correo.com");
    });

    it("al reintentar se limpian el error y la oferta de reenvío anteriores", async () => {
        const error = new Error("Debes confirmar tu correo");
        error.codigo = "CORREO_NO_VERIFICADO";
        iniciarSesion.mockRejectedValueOnce(error).mockResolvedValueOnce({ nombre: "Ana" });
        montar();
        await act(async () => llenarYEnviar());
        expect(screen.getByTestId("reenviar")).toBeInTheDocument();

        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Ingresar" })));

        expect(screen.queryByTestId("reenviar")).not.toBeInTheDocument();
        expect(screen.queryByText("Debes confirmar tu correo")).not.toBeInTheDocument();
    });
});

describe("Login: usuario con sesión iniciada", () => {
    it("un administrador es enviado a su panel", () => {
        useAuth.mockReturnValue({ usuario: { rol: "ADMINISTRADOR" }, iniciarSesionContexto });

        montar();

        expect(screen.getByText("Panel de administración")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Iniciar sesión" })).not.toBeInTheDocument();
    });

    it("un artesano es enviado a su panel", () => {
        useAuth.mockReturnValue({ usuario: { rol: "ARTESANO" }, iniciarSesionContexto });

        montar();

        expect(screen.getByText("Panel del artesano")).toBeInTheDocument();
    });
});