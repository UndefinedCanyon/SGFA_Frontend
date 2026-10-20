import { useEffect } from "react";
import { useAvisos } from "../../context/AvisosContext";

const TIPOS = {
    exito: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    aviso: "bg-amber-50 text-amber-800 border-amber-200",
};

function Alerta({ tipo = "info", className = "", children }) {
    const avisos = useAvisos();
    const mostrar = avisos?.mostrar;

    // Los éxitos de los paneles se muestran como aviso flotante. Los errores y avisos se quedan
    // en la página, junto a lo que hay que corregir.
    const comoAviso = Boolean(avisos) && tipo === "exito" && typeof children === "string";

    useEffect(() => {
        if (comoAviso && children) {
            mostrar("exito", children);
        }
    }, [comoAviso, children, mostrar]);

    if (!children || comoAviso) return null;

    return (
        <div
            role={tipo === "error" ? "alert" : "status"}
            className={`rounded-lg border px-4 py-3 text-sm ${TIPOS[tipo]} ${className}`}
        >
            {children}
        </div>
    );
}

export default Alerta;