import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { consultarFerias, consultarEdicionesFeria, consultarLugares } from "../services/api";
import { destinoPorRol, estadoEdicion, formatearFechaCorta } from "../utils/helpers";
import { Esqueleto, Insignia } from "../components/ui";
import logo from "../assets/logo-sgfa.png";

const BOTON_PRIMARIO =
    "inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700";
const BOTON_SECUNDARIO =
    "inline-flex items-center justify-center rounded-lg border border-green-600 bg-white px-5 py-3 text-sm font-medium text-green-700 transition-colors hover:bg-green-50";

const PASOS = [
    {
        titulo: "Crea tu cuenta",
        texto: "Regístrate con los datos de tu emprendimiento.",
    },
    {
        titulo: "Publica tus productos",
        texto: "Arma tu catálogo con precios y cantidades para que el público sepa qué ofreces.",
    },
    {
        titulo: "Solicita participar",
        texto: "Elige una edición con cupo y envía tu solicitud. El administrador la revisa y te responde.",
    },
];

const PERFILES = [
    {
        titulo: "Visitantes",
        texto: "Consulta las ferias, sus fechas, el lugar y los artesanos que participan, sin necesidad de registrarte.",
    },
    {
        titulo: "Artesanos",
        texto: "Registra tu emprendimiento, administra tus productos y sigue el estado de tus solicitudes.",
    },
    {
        titulo: "Administración",
        texto: "Gestiona ferias, ediciones, cupos, lugares y la aprobación de los artesanos participantes.",
    },
];

function Inicio() {
    const { usuario } = useAuth();

    const [proximas, setProximas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [fallo, setFallo] = useState(false);

    useEffect(() => {
        async function cargar() {
            try {
                const [ferias, ediciones, lugares] = await Promise.all([
                    consultarFerias(),
                    consultarEdicionesFeria(),
                    consultarLugares(),
                ]);

                const idsFerias = new Set(ferias.map((f) => f.id));

                const lista = ediciones
                    .filter((e) => idsFerias.has(e.idFeria) && estadoEdicion(e) !== "FINALIZADA")
                    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
                    .slice(0, 3)
                    .map((edicion) => ({
                        edicion,
                        feria: ferias.find((f) => f.id === edicion.idFeria),
                        lugar: lugares.find((l) => l.id === edicion.idLugar),
                    }));

                setProximas(lista);
            } catch {
                setFallo(true);
            } finally {
                setCargando(false);
            }
        }

        cargar();
    }, []);

    return (
        <div>
            <section className="bg-gradient-to-b from-green-50 to-white">
                <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                    <img src={logo} alt="" className="h-20 w-20 mx-auto mb-6" />
                    <h1 className="text-4xl font-semibold text-gray-900 sm:text-5xl">
                        Las ferias artesanales de Fusagasugá,{" "}
                        <span className="text-green-600">en un solo lugar</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        SGFA conecta a los artesanos con las ferias de la ciudad y le permite al público
                        conocer quién participa, cuándo y dónde.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/ferias" className={BOTON_PRIMARIO}>
                            Ver ferias
                        </Link>
                        {usuario ? (
                            <Link to={destinoPorRol(usuario.rol)} className={BOTON_SECUNDARIO}>
                                Ir a mi panel
                            </Link>
                        ) : (
                            <Link to="/registro" className={BOTON_SECUNDARIO}>
                                Registrarme como artesano
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 py-14" aria-labelledby="titulo-proximas">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                    <div>
                        <h2 id="titulo-proximas" className="text-2xl font-semibold text-gray-900">
                            Próximas ediciones
                        </h2>
                        <p className="text-gray-500 mt-1">Lo que viene en las ferias de Fusagasugá.</p>
                    </div>
                    <Link to="/ferias" className="text-sm font-medium text-green-700 hover:underline">
                        Ver todas las ferias →
                    </Link>
                </div>

                {cargando ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Esqueleto className="h-32 w-full rounded-2xl" />
                        <Esqueleto className="h-32 w-full rounded-2xl" />
                        <Esqueleto className="h-32 w-full rounded-2xl" />
                    </div>
                ) : fallo ? (
                    <p className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                        No pudimos cargar las próximas ediciones en este momento. Puedes consultarlas en la
                        sección{" "}
                        <Link to="/ferias" className="text-green-700 font-medium hover:underline">
                            Ferias
                        </Link>
                        .
                    </p>
                ) : proximas.length === 0 ? (
                    <p className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                        Aún no hay ediciones programadas. Vuelve pronto.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                        {proximas.map(({ edicion, feria, lugar }) => {
                            const enCurso = estadoEdicion(edicion) === "EN_CURSO";

                            return (
                                <article
                                    key={edicion.id}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {feria ? feria.nombreFeria : `Feria #${edicion.idFeria}`}
                                        </h3>
                                        <Insignia tono={enCurso ? "verde" : "azul"}>
                                            {enCurso ? "En curso" : "Próxima"}
                                        </Insignia>
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-gray-800">
                                        {formatearFechaCorta(edicion.fechaInicio)} — {formatearFechaCorta(edicion.fechaFin)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {lugar ? lugar.nombre : `Lugar #${edicion.idLugar}`}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="bg-white border-y border-gray-100" aria-labelledby="titulo-como">
                <div className="max-w-6xl mx-auto px-6 py-14">
                    <h2 id="titulo-como" className="text-2xl font-semibold text-gray-900">
                        ¿Cómo funciona para los artesanos?
                    </h2>
                    <p className="text-gray-500 mt-1 mb-8">Tres pasos para participar en una feria.</p>

                    <ol className="grid gap-6 sm:grid-cols-3">
                        {PASOS.map((paso, indice) => (
                            <li key={paso.titulo} className="flex gap-4">
                                <span
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-lg font-semibold text-white"
                                    aria-hidden="true"
                                >
                                    {indice + 1}
                                </span>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{paso.titulo}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{paso.texto}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 py-14" aria-labelledby="titulo-perfiles">
                <h2 id="titulo-perfiles" className="text-2xl font-semibold text-gray-900 mb-6">
                    Un sistema para cada perfil
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {PERFILES.map((perfil) => (
                        <article
                            key={perfil.titulo}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <h3 className="font-semibold text-green-700">{perfil.titulo}</h3>
                            <p className="mt-2 text-sm text-gray-600">{perfil.texto}</p>
                        </article>
                    ))}
                </div>
            </section>

            {!usuario && (
                <section className="max-w-6xl mx-auto px-6 pb-16">
                    <div className="rounded-2xl bg-green-600 px-6 py-10 text-center">
                        <h2 className="text-2xl font-semibold text-white">¿Tienes un emprendimiento artesanal?</h2>
                        <p className="mt-2 text-green-50">
                            Regístrate y solicita participar en la próxima edición.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/registro"
                                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
                            >
                                Crear mi cuenta
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center rounded-lg border border-white px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
                            >
                                Ya tengo cuenta
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default Inicio;