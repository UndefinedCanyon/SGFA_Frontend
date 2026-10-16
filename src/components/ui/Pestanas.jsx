import { useRef } from "react";

export function PanelPestana({ idBase, id, activa, children }) {
    return (
        <div
            id={`${idBase}-panel-${id}`}
            role="tabpanel"
            aria-labelledby={`${idBase}-tab-${id}`}
            hidden={activa !== id}
        >
            {children}
        </div>
    );
}

function Pestanas({ idBase, pestanas, activa, onCambiar }) {
    const refs = useRef({});

    function manejarTeclas(evento, indice) {
        let nuevo = null;
        if (evento.key === "ArrowRight") nuevo = (indice + 1) % pestanas.length;
        if (evento.key === "ArrowLeft") nuevo = (indice - 1 + pestanas.length) % pestanas.length;
        if (evento.key === "Home") nuevo = 0;
        if (evento.key === "End") nuevo = pestanas.length - 1;
        if (nuevo === null) return;

        evento.preventDefault();
        const destino = pestanas[nuevo].id;
        onCambiar(destino);
        refs.current[destino]?.focus();
    }

    return (
        <div
            role="tablist"
            aria-label="Secciones del panel"
            className="flex gap-1 overflow-x-auto shadow-[inset_0_-2px_0_0_#e5e7eb]"
        >
            {pestanas.map((pestana, indice) => {
                const seleccionada = pestana.id === activa;

                return (
                    <button
                        key={pestana.id}
                        ref={(elemento) => {
                            refs.current[pestana.id] = elemento;
                        }}
                        id={`${idBase}-tab-${pestana.id}`}
                        type="button"
                        role="tab"
                        aria-selected={seleccionada}
                        aria-controls={`${idBase}-panel-${pestana.id}`}
                        tabIndex={seleccionada ? 0 : -1}
                        onClick={() => onCambiar(pestana.id)}
                        onKeyDown={(evento) => manejarTeclas(evento, indice)}
                        className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                            seleccionada
                                ? "border-green-600 text-green-700"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        {pestana.etiqueta}
                        {pestana.contador !== undefined && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                    seleccionada ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                {pestana.contador}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default Pestanas;