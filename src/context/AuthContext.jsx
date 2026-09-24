import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);

    function iniciarSesionContexto(sesion) {
        setUsuario(sesion);
    }

    function cerrarSesion() {
        setUsuario(null);
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