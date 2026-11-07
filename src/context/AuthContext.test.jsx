import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { consultarMiPerfil } from "../services/api";

const CLAVE = "sgfa_usuario";

// Fabrica un JWT mínimo; solo importa el campo exp (en segundos).
function crearToken(exp) {
    const carga = btoa(JSON.stringify({ exp }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    return `cabecera.${carga}.firma`;
}

const enSegundos = (offsetSegundos) => Math.floor(Date.now() / 1000) + offsetSegundos;

let ctx;

function Espia() {
    ctx = useAuth();
    return (
        <div>
            <p data-testid="usuario">{ctx.usuario ? ctx.usuario.nombre : "sin-usuario"}</p>
            <p data-testid="expirada">{String(ctx.sesionExpirada)}</p>
        </div>
    );
}

function montar() {
    return render(
        <AuthProvider>
            <Espia />
        </AuthProvider>
    );
}

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("AuthProvider: sesión inicial", () => {
    it("empieza sin usuario cuando no hay nada guardado", () => {
        montar();

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("false");
    });

    it("restaura la sesión guardada si el token sigue vigente", () => {
        localStorage.setItem(CLAVE, JSON.stringify({ nombre: "Ana", token: crearToken(enSegundos(3600)) }));

        montar();

        expect(screen.getByTestId("usuario")).toHaveTextContent("Ana");
        expect(screen.getByTestId("expirada")).toHaveTextContent("false");
    });

    it("descarta la sesión guardada si el token ya venció y avisa que expiró", () => {
        localStorage.setItem(CLAVE, JSON.stringify({ nombre: "Ana", token: crearToken(enSegundos(-60)) }));

        montar();

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("true");
        expect(localStorage.getItem(CLAVE)).toBeNull();
    });

    it("mantiene la sesión si el token no se puede leer como JWT", () => {
        localStorage.setItem(CLAVE, JSON.stringify({ nombre: "Ana", token: "token-opaco" }));

        montar();

        expect(screen.getByTestId("usuario")).toHaveTextContent("Ana");
    });

    it("descarta lo guardado si el contenido está corrupto, sin marcar expiración", () => {
        localStorage.setItem(CLAVE, "{esto no es json");

        montar();

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("false");
        expect(localStorage.getItem(CLAVE)).toBeNull();
    });

    it("descarta lo guardado si no trae token", () => {
        localStorage.setItem(CLAVE, JSON.stringify({ nombre: "Ana" }));

        montar();

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("true");
    });
});

describe("AuthProvider: acciones", () => {
    it("iniciarSesionContexto guarda al usuario en estado y en localStorage", () => {
        montar();
        const sesion = { nombre: "Luis", token: crearToken(enSegundos(3600)) };

        act(() => ctx.iniciarSesionContexto(sesion));

        expect(screen.getByTestId("usuario")).toHaveTextContent("Luis");
        expect(JSON.parse(localStorage.getItem(CLAVE))).toEqual(sesion);
    });

    it("iniciar sesión limpia el aviso de sesión expirada", () => {
        localStorage.setItem(CLAVE, JSON.stringify({ nombre: "Ana", token: crearToken(enSegundos(-60)) }));
        montar();
        expect(screen.getByTestId("expirada")).toHaveTextContent("true");

        act(() => ctx.iniciarSesionContexto({ nombre: "Ana", token: crearToken(enSegundos(3600)) }));

        expect(screen.getByTestId("expirada")).toHaveTextContent("false");
    });

    it("actualizarUsuario combina los cambios con los datos actuales y los guarda", () => {
        montar();
        const token = crearToken(enSegundos(3600));
        act(() => ctx.iniciarSesionContexto({ nombre: "Luis", token, rol: "ARTESANO" }));

        act(() => ctx.actualizarUsuario({ nombre: "Luis Pérez" }));

        expect(screen.getByTestId("usuario")).toHaveTextContent("Luis Pérez");
        expect(JSON.parse(localStorage.getItem(CLAVE))).toEqual({ nombre: "Luis Pérez", token, rol: "ARTESANO" });
    });

    it("cerrarSesion borra al usuario y lo guardado", () => {
        montar();
        act(() => ctx.iniciarSesionContexto({ nombre: "Luis", token: crearToken(enSegundos(3600)) }));

        act(() => ctx.cerrarSesion());

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("false");
        expect(localStorage.getItem(CLAVE)).toBeNull();
    });

    it("descartarAvisoSesion apaga el aviso de sesión expirada", () => {
        localStorage.setItem(CLAVE, JSON.stringify({ nombre: "Ana", token: crearToken(enSegundos(-60)) }));
        montar();

        act(() => ctx.descartarAvisoSesion());

        expect(screen.getByTestId("expirada")).toHaveTextContent("false");
    });
});

describe("AuthProvider: expiración del token", () => {
    it("cierra la sesión justo cuando vence el token", () => {
        vi.useFakeTimers();
        montar();
        act(() => ctx.iniciarSesionContexto({ nombre: "Luis", token: crearToken(enSegundos(10)) }));
        expect(screen.getByTestId("usuario")).toHaveTextContent("Luis");

        act(() => vi.advanceTimersByTime(11000));

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("true");
        expect(localStorage.getItem(CLAVE)).toBeNull();
    });

    it("cierra la sesión al instante si se inicia con un token ya vencido", () => {
        montar();

        act(() => ctx.iniciarSesionContexto({ nombre: "Luis", token: crearToken(enSegundos(-5)) }));

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("true");
    });

    it("cierra la sesión cuando el backend responde 401 a una petición con token", async () => {
        montar();
        act(() => ctx.iniciarSesionContexto({ nombre: "Luis", token: crearToken(enSegundos(3600)) }));
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "" })
        );

        await act(async () => {
            await consultarMiPerfil("token").catch(() => {});
        });

        expect(screen.getByTestId("usuario")).toHaveTextContent("sin-usuario");
        expect(screen.getByTestId("expirada")).toHaveTextContent("true");
    });
});

describe("useAuth", () => {
    it("devuelve null fuera de un AuthProvider", () => {
        let valor = "sin-leer";
        function Suelto() {
            valor = useAuth();
            return null;
        }

        render(<Suelto />);

        expect(valor).toBeNull();
    });
});