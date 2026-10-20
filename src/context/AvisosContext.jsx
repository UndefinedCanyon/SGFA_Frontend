import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Aviso from "../components/ui/Aviso";

const ContextoAvisos = createContext(null);

const MAXIMO_VISIBLES = 3;
const DURACION_MINIMA_MS = 5000;
const DURACION_MAXIMA_MS = 12000;

function calcularDuracion(texto) {
    // Más tiempo para los mensajes largos, para que dé tiempo de leerlos.
    return Math.min(DURACION_MAXIMA_MS, Math.max(DURACION_MINIMA_MS, 3000 + texto.length * 60));
}

export function ProveedorAvisos({ children }) {
    const [avisos, setAvisos] = useState([]);
    const contador = useRef(0);
    const recientes = useRef(new Map());

    const cerrar = useCallback((id) => {
        setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
    }, []);

    const mostrar = useCallback((tipo, texto) => {
        const clave = `${tipo}|${texto}`;
        const ahora = Date.now();

        // Un mismo aviso repetido en menos de 400 ms se ignora.
        if (ahora - (recientes.current.get(clave) ?? 0) < 400) return;
        if (recientes.current.size > 50) recientes.current.clear();
        recientes.current.set(clave, ahora);

        contador.current += 1;
        const nuevo = { id: contador.current, tipo, texto, duracion: calcularDuracion(texto) };
        setAvisos((actuales) => [...actuales, nuevo].slice(-MAXIMO_VISIBLES));
    }, []);

    const valor = useMemo(() => ({ mostrar, cerrar }), [mostrar, cerrar]);

    return (
        <ContextoAvisos.Provider value={valor}>
            {children}

            <div
                role="region"
                aria-label="Notificaciones"
                aria-live="polite"
                className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
            >
                {avisos.map((aviso) => (
                    <Aviso key={aviso.id} aviso={aviso} onCerrar={cerrar} />
                ))}
            </div>
        </ContextoAvisos.Provider>
    );
}

// Devuelve null fuera de un panel. Quien lo use debe tenerlo en cuenta: avisos?.mostrar("exito", "...").
export function useAvisos() {
    return useContext(ContextoAvisos);
}