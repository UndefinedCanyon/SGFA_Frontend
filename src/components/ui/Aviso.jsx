import { useEffect, useRef, useState } from "react";

const ESTILOS = {
    exito: {
        titulo: "Listo",
        rol: "status",
        borde: "border-l-green-500",
        icono: "bg-green-100 text-green-700",
        barra: "bg-green-500",
    },
    error: {
        titulo: "Algo salió mal",
        rol: "alert",
        borde: "border-l-red-500",
        icono: "bg-red-100 text-red-700",
        barra: "bg-red-500",
    },
    aviso: {
        titulo: "Atención",
        rol: "status",
        borde: "border-l-amber-500",
        icono: "bg-amber-100 text-amber-700",
        barra: "bg-amber-500",
    },
    info: {
        titulo: "Información",
        rol: "status",
        borde: "border-l-blue-500",
        icono: "bg-blue-100 text-blue-700",
        barra: "bg-blue-500",
    },
};

function Icono({ tipo }) {
    const comun = {
        className: "h-4 w-4",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2.2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    if (tipo === "exito") {
        return (
            <svg {...comun}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
        );
    }
    if (tipo === "error") {
        return (
            <svg {...comun}>
                <path d="M12 7v6M12 17h.01" />
            </svg>
        );
    }
    if (tipo === "aviso") {
        return (
            <svg {...comun}>
                <path d="M12 8v5M12 17h.01" />
            </svg>
        );
    }
    return (
        <svg {...comun}>
            <path d="M12 11v6M12 7h.01" />
        </svg>
    );
}

function Aviso({ aviso, onCerrar }) {
    const estilo = ESTILOS[aviso.tipo] ?? ESTILOS.info;

    const [sobre, setSobre] = useState(false);
    const [enfocado, setEnfocado] = useState(false);
    const pausado = sobre || enfocado;

    const restante = useRef(aviso.duracion);
    const inicio = useRef(0);

    // El aviso se cierra solo cuando se acaba el tiempo. Si se pausa (ratón o teclado encima),
    // se descuenta lo ya transcurrido y se continúa con lo que falta.
    useEffect(() => {
        if (pausado) return;

        inicio.current = Date.now();
        const temporizador = setTimeout(() => onCerrar(aviso.id), Math.max(restante.current, 0));

        return () => {
            clearTimeout(temporizador);
            restante.current -= Date.now() - inicio.current;
        };
    }, [pausado, onCerrar, aviso.id]);

    return (
        <div
            role={estilo.rol}
            onMouseEnter={() => setSobre(true)}
            onMouseLeave={() => setSobre(false)}
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            className={`aviso-entrada pointer-events-auto overflow-hidden rounded-xl border border-gray-200 border-l-4 bg-white shadow-lg ring-1 ring-black/5 ${estilo.borde}`}
        >
            <div className="flex items-start gap-3 p-3 pr-2">
                <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${estilo.icono}`}
                    aria-hidden="true"
                >
                    <Icono tipo={aviso.tipo} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{estilo.titulo}</p>
                    <p className="break-words text-sm text-gray-600">{aviso.texto}</p>
                </div>

                <button
                    type="button"
                    onClick={() => onCerrar(aviso.id)}
                    aria-label="Cerrar notificación"
                    className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </div>

            <div className="h-1 w-full bg-gray-100" aria-hidden="true">
                <div
                    className={`aviso-progreso h-full ${estilo.barra}`}
                    style={{
                        animationDuration: `${aviso.duracion}ms`,
                        animationPlayState: pausado ? "paused" : "running",
                    }}
                />
            </div>
        </div>
    );
}

export default Aviso;