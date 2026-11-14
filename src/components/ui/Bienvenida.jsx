import { useEffect } from "react";
import Boton from "./Boton";

const DURACION_MS = 3200;

const MENSAJES = {
    ADMINISTRADOR: "Tu panel está listo: gestiona ferias, solicitudes y artesanos.",
    ARTESANO: "Tu panel está listo: administra tu catálogo y sigue tus solicitudes.",
};

// Ventana de bienvenida al iniciar sesión (estilo "sweet alert"). No bloquea la página:
// se cierra sola, con la tecla Escape, tocando fuera o con el botón.
function Bienvenida({ nombre, rol, onCerrar }) {
    useEffect(() => {
        const temporizador = setTimeout(onCerrar, DURACION_MS);

        function alPulsarTecla(evento) {
            if (evento.key === "Escape") onCerrar();
        }
        window.addEventListener("keydown", alPulsarTecla);

        return () => {
            clearTimeout(temporizador);
            window.removeEventListener("keydown", alPulsarTecla);
        };
    }, [onCerrar]);

    return (
        <div
            className="fondo-bienvenida fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4 backdrop-blur-[2px]"
            onClick={onCerrar}
            data-testid="bienvenida-fondo"
        >
            <div
                role="status"
                aria-live="polite"
                aria-labelledby="titulo-bienvenida"
                onClick={(evento) => evento.stopPropagation()}
                className="bienvenida relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl"
            >
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-bosque-100 text-bosque-600">
                    <svg
                        viewBox="0 0 52 52"
                        className="h-12 w-12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle className="trazo-circulo" cx="26" cy="26" r="22" />
                        <path className="trazo-check" d="M15 27l8 8 14-16" />
                    </svg>
                </div>

                <h2 id="titulo-bienvenida" className="text-2xl font-semibold text-gray-900">
                    ¡Bienvenido a SGFA, {nombre}!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    {MENSAJES[rol] ?? "Qué bueno verte de nuevo."}
                </p>

                <Boton className="mt-6" onClick={onCerrar}>
                    Continuar
                </Boton>

                <div
                    aria-hidden="true"
                    className="aviso-progreso absolute inset-x-0 bottom-0 h-1 bg-brand-500"
                    style={{ animationDuration: `${DURACION_MS}ms` }}
                />
            </div>
        </div>
    );
}

export default Bienvenida;
