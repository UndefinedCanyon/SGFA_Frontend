const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const LADO_MAXIMO = 1280;
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;
const LIMITE_ENTRADA_BYTES = 25 * 1024 * 1024;

export function urlImagen(nombre) {
    return `${import.meta.env.VITE_API_URL}/imagenes/${encodeURIComponent(nombre)}`;
}

function aBlob(canvas, tipo, calidad) {
    return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
}

function dibujar(bitmap, ancho, alto, fondoBlanco) {
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;

    const contexto = canvas.getContext("2d");
    if (fondoBlanco) {
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, ancho, alto);
    }
    contexto.drawImage(bitmap, 0, 0, ancho, alto);
    return canvas;
}

// WebP conserva la transparencia (logos). Si el navegador no sabe crearlo, se usa JPG con fondo blanco.
async function codificar(bitmap, ancho, alto, calidad) {
    const webp = await aBlob(dibujar(bitmap, ancho, alto, false), "image/webp", calidad);
    if (webp && webp.type === "image/webp") return webp;
    return aBlob(dibujar(bitmap, ancho, alto, true), "image/jpeg", calidad);
}

/**
 * Valida la imagen elegida y, si hace falta, la reduce para que cumpla el límite del servidor.
 * Devuelve un File listo para subir, o lanza un Error con un mensaje para el usuario.
 */
export async function prepararImagen(archivo) {
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        throw new Error("Usa una imagen JPG, PNG o WebP.");
    }
    if (archivo.size > LIMITE_ENTRADA_BYTES) {
        throw new Error("La imagen es demasiado pesada. Elige una de menos de 25 MB.");
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    } catch {
        throw new Error("No pudimos leer esa imagen. Prueba con otra.");
    }

    try {
        const lado = Math.max(bitmap.width, bitmap.height);

        // Si ya cumple, se envía tal cual, sin recomprimir.
        if (archivo.size <= TAMANO_MAXIMO_BYTES && lado <= LADO_MAXIMO) {
            return archivo;
        }

        let escala = Math.min(1, LADO_MAXIMO / lado);
        let calidad = 0.85;

        for (let intento = 0; intento < 6; intento++) {
            const ancho = Math.max(1, Math.round(bitmap.width * escala));
            const alto = Math.max(1, Math.round(bitmap.height * escala));
            const blob = await codificar(bitmap, ancho, alto, calidad);

            if (blob && blob.size <= TAMANO_MAXIMO_BYTES) {
                const extension = blob.type === "image/webp" ? "webp" : "jpg";
                return new File([blob], `imagen.${extension}`, { type: blob.type });
            }

            escala *= 0.8;
            calidad = Math.max(0.5, calidad - 0.1);
        }

        throw new Error("No pudimos reducir la imagen lo suficiente. Prueba con otra.");
    } finally {
        bitmap.close();
    }
}