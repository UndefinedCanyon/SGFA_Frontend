import { useState } from "react";
import { urlImagen } from "../utils/imagenes";

function Miniatura({ imagen, nombre, redonda = false, className = "h-12 w-12 text-lg" }) {
    // Se guarda cuál imagen falló: si el nombre cambia (nueva subida), se vuelve a intentar.
    const [imagenFallida, setImagenFallida] = useState(null);

    const forma = redonda ? "rounded-full" : "rounded-xl";
    const base = `shrink-0 overflow-hidden ${forma} ${className}`;

    if (imagen && imagenFallida !== imagen) {
        return (
            <span className={`block bg-gray-100 ${base}`}>
                <img
                    src={urlImagen(imagen)}
                    alt={nombre ? `Imagen de ${nombre}` : ""}
                    loading="lazy"
                    onError={() => setImagenFallida(imagen)}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-110"
                />
            </span>
        );
    }

    return (
        <div
            className={`${base} flex items-center justify-center bg-green-100 font-semibold text-green-700`}
            aria-hidden="true"
        >
            {(nombre ?? "?").charAt(0).toUpperCase()}
        </div>
    );
}

export default Miniatura;