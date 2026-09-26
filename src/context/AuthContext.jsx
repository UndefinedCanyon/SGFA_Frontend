import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function obtenerUsuarioGuardado() {
    const guardado = localStorage.getItem("sgfa_usuario");
    return guardado ? JSON.parse(guardado) : null;
}

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(obtenerUsuarioGuardado);

    function iniciarSesionContexto(sesion) {
        setUsuario(sesion);
        localStorage.setItem("sgfa_usuario", JSON.stringify(sesion));
    }

    function cerrarSesion() {
        setUsuario(null);
        localStorage.removeItem("sgfa_usuario");
    }

    return (
        <AuthContext.Provider value={{ usuario, iniciarSesionContexto, cerrarSesion }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}