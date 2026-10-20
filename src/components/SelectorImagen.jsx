import { useRef, useState } from "react";
import { prepararImagen } from "../utils/imagenes";
import { Spinner } from "./ui";
import Miniatura from "./Miniatura";

function SelectorImagen({
    imagen,
    nombre,
    redonda = false,
    tamano = "h-20 w-20 text-2xl",
    onSubir,
    onQuitar,
    onError,
}) {
    const entrada = useRef(null);
    const [ocupado, setOcupado] = useState(false);

    async function alElegir(evento) {
        const archivo = evento.target.files?.[0];
        evento.target.value = ""; // permite volver a elegir el mismo archivo
        if (!archivo) return;

        onError?.(null);
        setOcupado(true);
        try {
            const preparada = await prepararImagen(archivo);
            await onSubir(preparada);
        } catch (err) {
            onError?.(err.message);
        } finally {
            setOcupado(false);
        }
    }

    async function alQuitar() {
        onError?.(null);
        setOcupado(true);
        try {
            await onQuitar();
        } catch (err) {
            onError?.(err.message);
        } finally {
            setOcupado(false);
        }
    }

    return (
        <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="relative">
                <Miniatura imagen={imagen} nombre={nombre} redonda={redonda} className={tamano} />
                {ocupado && (
                    <div
                        className={`absolute inset-0 flex items-center justify-center bg-white/70 ${
                            redonda ? "rounded-full" : "rounded-xl"
                        }`}
                    >
                        <Spinner className="h-5 w-5 text-green-700" />
                    </div>
                )}
            </div>

            <input
                ref={entrada}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={alElegir}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
            />

            <button
                type="button"
                onClick={() => entrada.current?.click()}
                disabled={ocupado}
                aria-label={`${imagen ? "Cambiar" : "Subir"} imagen de ${nombre}`}
                className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
            >
                {imagen ? "Cambiar" : "Subir foto"}
            </button>

            {imagen && (
                <button
                    type="button"
                    onClick={alQuitar}
                    disabled={ocupado}
                    aria-label={`Quitar imagen de ${nombre}`}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                    Quitar
                </button>
            )}
        </div>
    );
}

export default SelectorImagen;