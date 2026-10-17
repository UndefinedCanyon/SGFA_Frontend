import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { registrarManejadorSesionExpirada } from "../services/api";

const AuthContext = createContext(null);

const CLAVE_ALMACEN = "sgfa_usuario";

// Lee la fecha de vencimiento (en milisegundos) que trae el propio token JWT.
function leerExpiracion(token) {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const texto = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        const { exp } = JSON.parse(texto);
        return typeof exp === "number" ? exp * 1000 : null;
    } catch {
        return null;
    }
}

function cargarSesionInicial() {
    try {
        const guardado = localStorage.getItem(CLAVE_ALMACEN);
        if (!guardado) return { usuario: null, expirada: false };

        const sesion = JSON.parse(guardado);
        const expiracion = sesion?.token ? leerExpiracion(sesion.token) : null;

        if (sesion?.token && (expiracion === null || expiracion > Date.now())) {
            return { usuario: sesion, expirada: false };
        }

        localStorage.removeItem(CLAVE_ALMACEN);
        return { usuario: null, expirada: true };
    } catch {
        localStorage.removeItem(CLAVE_ALMACEN);
        return { usuario: null, expirada: false };
    }
}

export function AuthProvider({ children }) {
    const [inicial] = useState(cargarSesionInicial);
    const [usuario, setUsuario] = useState(inicial.usuario);
    const [sesionExpirada, setSesionExpirada] = useState(inicial.expirada);

    const expirarSesion = useCallback(() => {
        setUsuario(null);
        setSesionExpirada(true);
        localStorage.removeItem(CLAVE_ALMACEN);
    }, []);

    const cerrarSesion = useCallback(() => {
        setUsuario(null);
        setSesionExpirada(false);
        localStorage.removeItem(CLAVE_ALMACEN);
    }, []);

    const descartarAvisoSesion = useCallback(() => {
        setSesionExpirada(false);
    }, []);

    function iniciarSesionContexto(sesion) {
        setUsuario(sesion);
        setSesionExpirada(false);
        localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(sesion));
    }

    function actualizarUsuario(cambios) {
        const actualizado = { ...usuario, ...cambios };
        setUsuario(actualizado);
        localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(actualizado));
    }

    // Si el backend responde 401 a una petición con token, la sesión terminó.
    useEffect(() => {
        registrarManejadorSesionExpirada(expirarSesion);
        return () => registrarManejadorSesionExpirada(null);
    }, [expirarSesion]);

    // Cierra la sesión justo cuando vence el token, sin esperar a que falle una petición.
    useEffect(() => {
        if (!usuario?.token) return;

        const expiracion = leerExpiracion(usuario.token);
        if (expiracion === null) return;

        const restante = expiracion - Date.now();
        if (restante <= 0) {
            expirarSesion();
            return;
        }

        const temporizador = setTimeout(expirarSesion, Math.min(restante, 2147483647));
        return () => clearTimeout(temporizador);
    }, [usuario?.token, expirarSesion]);

    return (
        <AuthContext.Provider
            value={{
                usuario,
                sesionExpirada,
                iniciarSesionContexto,
                actualizarUsuario,
                cerrarSesion,
                descartarAvisoSesion,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}