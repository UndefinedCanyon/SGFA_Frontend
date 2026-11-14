import paisaje from "../../assets/fondos/paisaje-fusagasuga.svg";
import { fotoDe } from "../../utils/fotos";

const ANCHOS = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
};

// Fondo de las páginas de acceso (login, registro, recuperar contraseña): paisaje o foto con un
// panel crema translúcido en el centro para que los formularios siempre se lean bien.
function FondoAcceso({ ancho = "sm", children }) {
    const imagen = fotoDe("acceso") ?? paisaje;

    return (
        <section className="relative isolate flex min-h-[calc(100vh-11rem)] items-center justify-center overflow-hidden px-4 py-12">
            <div
                aria-hidden="true"
                data-testid="acceso-fondo"
                className="absolute inset-0 -z-10 bg-cover bg-bottom"
                style={{ backgroundImage: `url("${imagen}")` }}
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gray-900/20" />
            <div
                className={`w-full ${ANCHOS[ancho] ?? ANCHOS.sm} rounded-3xl bg-gray-50/90 p-6 shadow-2xl ring-1 ring-white/40 backdrop-blur-sm sm:p-8`}
            >
                {children}
            </div>
        </section>
    );
}

export default FondoAcceso;
