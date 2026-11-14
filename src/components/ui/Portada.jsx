import paisaje from "../../assets/fondos/paisaje-fusagasuga.svg";
import { fotoDe } from "../../utils/fotos";
import Onda from "./Onda";

// Portada grande con fondo de foto (si existe) o del paisaje ilustrado de Fusagasugá.
function Portada({ foto, className = "", children }) {
    const imagen = fotoDe(foto) ?? paisaje;

    return (
        <section className={`relative isolate overflow-hidden text-white ${className}`}>
            <div
                aria-hidden="true"
                data-testid="portada-fondo"
                className="absolute inset-0 -z-10 bg-cover bg-bottom"
                style={{ backgroundImage: `url("${imagen}")` }}
            />
            <div aria-hidden="true" className="velo-calido absolute inset-0 -z-10 opacity-70" />
            <div className="relative">{children}</div>
            <Onda className="absolute inset-x-0 bottom-0 text-gray-50" />
        </section>
    );
}

export default Portada;
