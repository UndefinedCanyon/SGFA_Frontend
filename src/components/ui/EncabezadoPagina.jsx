import tejidoClaro from "../../assets/fondos/patron-tejido-claro.svg";
import { fotoDe } from "../../utils/fotos";
import Onda from "./Onda";

// Franja de título de cada página: degradado terracota con patrón de tejido (o foto si existe).
function EncabezadoPagina({ titulo, descripcion, foto, ancho = "max-w-6xl", children }) {
    const imagen = fotoDe(foto);

    return (
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
            {imagen && (
                <>
                    <div
                        aria-hidden="true"
                        data-testid="encabezado-foto"
                        className="absolute inset-0 -z-10 bg-cover bg-center"
                        style={{ backgroundImage: `url("${imagen}")` }}
                    />
                    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand-900/70" />
                </>
            )}
            <div
                aria-hidden="true"
                className="patron absolute inset-0 -z-10 opacity-80"
                style={{ backgroundImage: `url("${tejidoClaro}")` }}
            />
            <div className={`${ancho} mx-auto flex flex-wrap items-end justify-between gap-4 px-6 pb-14 pt-10`}>
                <div className="min-w-0">
                    <h2 className="text-3xl font-semibold sm:text-4xl">{titulo}</h2>
                    {descripcion && <p className="mt-2 max-w-2xl text-brand-50">{descripcion}</p>}
                </div>
                {children}
            </div>
            <Onda className="absolute inset-x-0 bottom-0 text-gray-50" />
        </section>
    );
}

export default EncabezadoPagina;
