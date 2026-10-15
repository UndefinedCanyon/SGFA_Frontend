import Spinner from "./Spinner";

const VARIANTES = {
    primario: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600",
    secundario: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400",
    peligro: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
    fantasma: "text-green-700 hover:bg-green-50 focus-visible:ring-green-600",
};

const TAMANOS = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
};

function Boton({
    variante = "primario",
    tamano = "md",
    cargando = false,
    disabled = false,
    type = "button",
    className = "",
    children,
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || cargando}
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
            {...props}
        >
            {cargando && <Spinner />}
            {children}
        </button>
    );
}

export default Boton;