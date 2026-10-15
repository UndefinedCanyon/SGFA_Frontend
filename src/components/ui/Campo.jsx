import { useId } from "react";

function Campo({ etiqueta, as: Componente = "input", ayuda, error, className = "", children, ...props }) {
    const id = useId();
    const idAyuda = `${id}-ayuda`;

    const base =
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500";
    const estado = error
        ? "border-red-400 focus:ring-red-500"
        : "border-gray-300 focus:ring-green-500";

    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {etiqueta}
            </label>
            <Componente
                id={id}
                className={`${base} ${estado}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={error || ayuda ? idAyuda : undefined}
                {...props}
            >
                {children}
            </Componente>
            {(error || ayuda) && (
                <p id={idAyuda} className={`mt-1 text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
                    {error || ayuda}
                </p>
            )}
        </div>
    );
}

export default Campo;