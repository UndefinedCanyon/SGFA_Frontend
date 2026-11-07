import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";

function respuesta(status, cuerpo) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (cuerpo === undefined ? "" : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)),
    };
}

let fetchMock;

beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    api.registrarManejadorSesionExpirada(null);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function ultimaLlamada() {
    const [url, opciones] = fetchMock.mock.calls.at(-1);
    return { url, ...opciones };
}

describe("solicitar (a través de las funciones públicas)", () => {
    it("hace un GET sin cuerpo ni cabeceras cuando no hay datos ni token", async () => {
        fetchMock.mockResolvedValue(respuesta(200, [{ id: 1 }]));

        const datos = await api.consultarFerias();

        const llamada = ultimaLlamada();
        expect(datos).toEqual([{ id: 1 }]);
        expect(llamada.url).toMatch(/\/ferias$/);
        expect(llamada.method).toBe("GET");
        expect(llamada.headers).toEqual({});
        expect(llamada.body).toBeUndefined();
    });

    it("envía el cuerpo como JSON con su Content-Type", async () => {
        fetchMock.mockResolvedValue(respuesta(201, { id: 9 }));

        await api.registrarArtesano({ nombre: "Ana" });

        const llamada = ultimaLlamada();
        expect(llamada.method).toBe("POST");
        expect(llamada.headers["Content-Type"]).toBe("application/json");
        expect(llamada.body).toBe(JSON.stringify({ nombre: "Ana" }));
    });

    it("agrega el token como Bearer cuando se entrega", async () => {
        fetchMock.mockResolvedValue(respuesta(200, []));

        await api.consultarMisProductos("abc123");

        expect(ultimaLlamada().headers.Authorization).toBe("Bearer abc123");
    });

    it("no agrega Authorization cuando no hay token", async () => {
        fetchMock.mockResolvedValue(respuesta(200, []));

        await api.consultarLugares();

        expect(ultimaLlamada().headers.Authorization).toBeUndefined();
    });

    it("devuelve null si la respuesta no trae cuerpo", async () => {
        fetchMock.mockResolvedValue(respuesta(204));

        expect(await api.cambiarEstadoFeria(1, false, "t")).toBeNull();
    });

    it("devuelve null si el cuerpo de una respuesta exitosa no es JSON", async () => {
        fetchMock.mockResolvedValue(respuesta(200, "esto no es json"));

        expect(await api.consultarFerias()).toBeNull();
    });
});

describe("manejo de errores", () => {
    it("convierte un fallo de red en un mensaje comprensible", async () => {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(api.consultarFerias()).rejects.toThrow(/conectar con el servidor/);
    });

    it("usa el mensaje y el código que manda el servidor", async () => {
        fetchMock.mockResolvedValue(respuesta(409, { error: "Correo ya registrado", codigo: "CORREO_DUPLICADO" }));

        const error = await api.registrarArtesano({}).catch((e) => e);

        expect(error.message).toBe("Correo ya registrado");
        expect(error.codigo).toBe("CORREO_DUPLICADO");
    });

    it("deja el código en null cuando el servidor no lo manda", async () => {
        fetchMock.mockResolvedValue(respuesta(400, { error: "Dato inválido" }));

        const error = await api.registrarArtesano({}).catch((e) => e);

        expect(error.codigo).toBeNull();
    });

    it.each([
        [400, /datos enviados no son válidos/],
        [401, /sesión expiró/],
        [403, /No tienes permiso/],
        [404, /No encontramos/],
        [409, /conflicto/],
        [413, /demasiado pesada/],
    ])("traduce el estado %i cuando el servidor no da mensaje", async (estado, patron) => {
        fetchMock.mockResolvedValue(respuesta(estado, {}));

        await expect(api.consultarFerias()).rejects.toThrow(patron);
    });

    it("usa un mensaje de servidor para los errores 5xx", async () => {
        fetchMock.mockResolvedValue(respuesta(503));

        await expect(api.consultarFerias()).rejects.toThrow(/error en el servidor/);
    });

    it("usa un mensaje genérico para estados desconocidos", async () => {
        fetchMock.mockResolvedValue(respuesta(418));

        await expect(api.consultarFerias()).rejects.toThrow(/error inesperado/);
    });
});

describe("sesión expirada", () => {
    it("avisa al manejador cuando un 401 llega con token", async () => {
        const manejador = vi.fn();
        api.registrarManejadorSesionExpirada(manejador);
        fetchMock.mockResolvedValue(respuesta(401, {}));

        await api.consultarMiPerfil("vencido").catch(() => {});

        expect(manejador).toHaveBeenCalledTimes(1);
    });

    it("no avisa en un 401 sin token (credenciales incorrectas en el login)", async () => {
        const manejador = vi.fn();
        api.registrarManejadorSesionExpirada(manejador);
        fetchMock.mockResolvedValue(respuesta(401, { error: "Credenciales incorrectas" }));

        await expect(api.iniciarSesion("a@b.com", "mala")).rejects.toThrow("Credenciales incorrectas");

        expect(manejador).not.toHaveBeenCalled();
    });

    it("no falla si llega un 401 y no hay manejador registrado", async () => {
        fetchMock.mockResolvedValue(respuesta(401, {}));

        await expect(api.consultarMiPerfil("vencido")).rejects.toThrow(/sesión expiró/);
    });

    it("no avisa en errores que no son 401", async () => {
        const manejador = vi.fn();
        api.registrarManejadorSesionExpirada(manejador);
        fetchMock.mockResolvedValue(respuesta(403, {}));

        await api.consultarMiPerfil("t").catch(() => {});

        expect(manejador).not.toHaveBeenCalled();
    });
});

describe("rutas, métodos y cuerpos de cada función", () => {
    const T = "tok";

    // [función, argumentos, método, ruta final, cuerpo esperado]
    const casos = [
        ["registrarArtesano", [{ a: 1 }], "POST", "/artesanos", { a: 1 }],
        ["iniciarSesion", ["a@b.com", "x"], "POST", "/auth/login", { correoElectronico: "a@b.com", contrasena: "x" }],
        ["consultarFerias", [], "GET", "/ferias"],
        ["consultarLugares", [], "GET", "/lugares"],
        ["consultarParticipantes", [5], "GET", "/edicionesferia/5/participantes"],
        ["consultarOcupacion", [5], "GET", "/edicionesferia/5/ocupacion"],
        ["crearFeria", ["Feria", 2, T], "POST", "/ferias", { nombreFeria: "Feria", idAdmin: 2 }],
        ["actualizarFeria", [3, "Nueva", T], "PUT", "/ferias/3", { nombreFeria: "Nueva" }],
        ["consultarTodasLasFerias", [T], "GET", "/ferias/todas"],
        ["cambiarEstadoFeria", [3, false, T], "PUT", "/ferias/3/estado", { activo: false }],
        ["crearEdicionFeria", [{ x: 1 }, T], "POST", "/edicionesferia", { x: 1 }],
        ["consultarTodasLasEdiciones", [T], "GET", "/edicionesferia/todas"],
        ["cambiarEstadoEdicion", [4, true, T], "PUT", "/edicionesferia/4/estado", { activo: true }],
        ["configurarCupoEdicion", [4, 30, T], "PUT", "/edicionesferia/4/cupo", { cupoMaximo: 30 }],
        ["crearLugar", [{ n: 1 }, T], "POST", "/lugares", { n: 1 }],
        ["actualizarLugar", [6, { n: 2 }, T], "PUT", "/lugares/6", { n: 2 }],
        ["cambiarEstadoLugar", [6, false, T], "PUT", "/lugares/6/estado", { activo: false }],
        ["consultarTodosLosArtesanos", [T], "GET", "/artesanos"],
        ["cambiarEstadoArtesano", [7, true, T], "PUT", "/artesanos/7/estado", { activo: true }],
        ["registrarArtesanoAdmin", [{ k: 1 }, T], "POST", "/artesanos/admin", { k: 1 }],
        ["consultarTodasLasSolicitudes", [T], "GET", "/inscripciones"],
        ["aprobarSolicitud", [8, T], "PUT", "/inscripciones/8/aprobar"],
        ["rechazarSolicitud", [8, T], "PUT", "/inscripciones/8/rechazar"],
        ["consultarMiPerfil", [T], "GET", "/artesanos/perfil"],
        ["actualizarMiPerfil", [{ p: 1 }, T], "PUT", "/artesanos/perfil", { p: 1 }],
        ["consultarMisProductos", [T], "GET", "/productos"],
        ["crearProducto", [{ nombre: "Vasija" }, T], "POST", "/productos", { nombre: "Vasija" }],
        ["actualizarProducto", [9, { nombre: "Taza" }, T], "PUT", "/productos/9", { nombre: "Taza" }],
        ["eliminarProducto", [9, T], "DELETE", "/productos/9"],
        ["solicitarParticipacion", [4, T], "POST", "/inscripciones", { idEdicionFeria: 4 }],
        ["consultarMisSolicitudes", [T], "GET", "/inscripciones/mias"],
        ["quitarImagenProducto", [9, T], "DELETE", "/productos/9/imagen"],
        ["quitarLogoArtesano", [T], "DELETE", "/artesanos/perfil/logo"],
        ["verificarCorreo", ["tk"], "POST", "/auth/verificar-correo", { token: "tk" }],
        ["reenviarVerificacion", ["a@b.com"], "POST", "/auth/reenviar-verificacion", { correoElectronico: "a@b.com" }],
        ["solicitarRecuperacion", ["a@b.com"], "POST", "/auth/olvide-contrasena", { correoElectronico: "a@b.com" }],
        ["restablecerContrasena", ["tk", "nueva"], "POST", "/auth/restablecer-contrasena", { token: "tk", contrasena: "nueva" }],
    ];

    it.each(casos)("%s", async (nombre, args, metodo, ruta, cuerpo) => {
        fetchMock.mockResolvedValue(respuesta(200, {}));

        await api[nombre](...args);

        const llamada = ultimaLlamada();
        expect(llamada.method).toBe(metodo);
        expect(llamada.url.endsWith(ruta)).toBe(true);
        if (cuerpo === undefined) {
            expect(llamada.body).toBeUndefined();
        } else {
            expect(JSON.parse(llamada.body)).toEqual(cuerpo);
        }
        if (args.includes(T)) {
            expect(llamada.headers.Authorization).toBe(`Bearer ${T}`);
        }
    });

    it("consultarEdicionesFeria filtra por feria cuando se entrega el id", async () => {
        fetchMock.mockResolvedValue(respuesta(200, []));

        await api.consultarEdicionesFeria(12);

        expect(ultimaLlamada().url).toMatch(/\/edicionesferia\?idFeria=12$/);
    });

    it("consultarEdicionesFeria trae todas cuando no hay id", async () => {
        fetchMock.mockResolvedValue(respuesta(200, []));

        await api.consultarEdicionesFeria();

        expect(ultimaLlamada().url).toMatch(/\/edicionesferia$/);
    });

    it.each([
        ["subirImagenProducto", [9, "archivo", T], "/productos/9/imagen"],
        ["subirLogoArtesano", ["archivo", T], "/artesanos/perfil/logo"],
    ])("%s envía el archivo como FormData sin Content-Type propio", async (nombre, args, ruta) => {
        fetchMock.mockResolvedValue(respuesta(200, {}));
        const archivo = new File(["contenido"], "foto.png", { type: "image/png" });
        const argumentos = args.map((a) => (a === "archivo" ? archivo : a));

        await api[nombre](...argumentos);

        const llamada = ultimaLlamada();
        expect(llamada.method).toBe("PUT");
        expect(llamada.url.endsWith(ruta)).toBe(true);
        expect(llamada.body).toBeInstanceOf(FormData);
        expect(llamada.body.get("archivo")).toBe(archivo);
        expect(llamada.headers["Content-Type"]).toBeUndefined();
        expect(llamada.headers.Authorization).toBe(`Bearer ${T}`);
    });
});