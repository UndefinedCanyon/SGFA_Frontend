import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { consultarFerias, consultarEdicionesFeria, consultarLugares } from "../services/api";
import { destinoPorRol, estadoEdicion, formatearFechaCorta } from "../utils/helpers";
import { Esqueleto, Insignia, Portada } from "../components/ui";
import { fotoDe } from "../utils/fotos";
import logo from "../assets/logo-sgfa.png";
import tejido from "../assets/fondos/patron-tejido.svg";
import tejidoClaro from "../assets/fondos/patron-tejido-claro.svg";

const BOTON_PRIMARIO =
    "inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-md transition duration-150 hover:bg-brand-50 hover:shadow-lg active:scale-[0.97]";
const BOTON_SECUNDARIO =
    "inline-flex items-center justify-center rounded-lg border border-white/80 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition duration-150 hover:bg-white/20 active:scale-[0.97]";

const PASOS = [
    {
        titulo: "Crea tu cuenta",
        texto: "Regístrate con los datos de tu emprendimiento y confirma tu correo.",
    },
    {
        titulo: "Publica tus productos",
        texto: "Arma tu catálogo con fotos, precios y cantidades para que el público sepa qué ofreces.",
    },
    {
        titulo: "Solicita participar",
        texto: "Elige una edición con cupo y envía tu solicitud. El administrador la revisa y te avisa por correo.",
    },
];

const ICONOS_PERFIL = {
    Visitantes: (
        <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    Artesanos: (
        <>
            <path d="M8 3h8l1 5a5 5 0 01-1.5 4.4c-.6.6-.9 1.3-.9 2.1V21H9.4v-6.5c0-.8-.3-1.5-.9-2.1A5 5 0 017 8l1-5z" />
            <path d="M8 8h8" />
        </>
    ),
    Administración: (
        <>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 9h8M8 13h5M8 17h3" />
        </>
    ),
};

const TONOS_PERFIL = {
    Visitantes: { franja: "border-t-ocre-400", icono: "bg-ocre-100 text-ocre-700" },
    Artesanos: { franja: "border-t-brand-500", icono: "bg-brand-100 text-brand-700" },
    Administración: { franja: "border-t-bosque-600", icono: "bg-bosque-100 text-bosque-700" },
};

const PERFILES = [
    {
        titulo: "Visitantes",
        texto: "Consulta las ferias, sus fechas, el lugar en el mapa y los artesanos que participan, sin necesidad de registrarte.",
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

        void cargar();
    }, []);

    const fotoConvocatoria = fotoDe("convocatoria");

    return (
        <div>
            <Portada foto="hero">
                <div className="max-w-4xl mx-auto px-6 pb-28 pt-16 text-center sm:pb-36 sm:pt-24">
                    <img
                        src={logo}
                        alt=""
                        className="entrada mx-auto mb-6 h-20 w-20 rounded-full bg-gray-50 p-2 shadow-lg"
                    />
                    <h1 className="entrada retardo-1 text-4xl font-semibold text-white drop-shadow sm:text-5xl">
                        Las ferias artesanales de Fusagasugá,{" "}
                        <span className="text-ocre-200">en un solo lugar</span>
                    </h1>
                    <p className="entrada retardo-2 mt-4 text-lg text-brand-50 max-w-2xl mx-auto">
                        SGFA conecta a los artesanos con las ferias de la ciudad y le permite al público
                        conocer quién participa, cuándo y dónde.
                    </p>

                    <div className="entrada retardo-3 mt-8 flex flex-wrap justify-center gap-3">
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
            </Portada>

            <section className="revelar max-w-6xl mx-auto px-6 py-14" aria-labelledby="titulo-proximas">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                    <div>
                        <h2 id="titulo-proximas" className="text-2xl font-semibold text-gray-900">
                            Próximas ediciones
                        </h2>
                        <p className="text-gray-500 mt-1">Lo que viene en las ferias de Fusagasugá.</p>
                    </div>
                    <Link to="/ferias" className="text-sm font-medium text-brand-700 hover:underline">
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
                        <Link to="/ferias" className="text-brand-700 font-medium hover:underline">
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
                                    className={`rounded-2xl border border-gray-200 border-t-4 bg-white p-5 shadow-sm ${
                                        enCurso ? "border-t-bosque-500" : "border-t-ocre-400"
                                    }`}
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

            <section
                className="revelar bg-brand-50 border-y border-brand-100 patron"
                style={{ backgroundImage: `url("${tejido}")` }}
                aria-labelledby="titulo-como"
            >
                <div className="max-w-6xl mx-auto px-6 py-14">
                    <h2 id="titulo-como" className="text-2xl font-semibold text-gray-900">
                        ¿Cómo funciona para los artesanos?
                    </h2>
                    <p className="text-gray-600 mt-1 mb-8">Tres pasos para participar en una feria.</p>

                    <ol className="grid gap-6 sm:grid-cols-3">
                        {PASOS.map((paso, indice) => (
                            <li
                                key={paso.titulo}
                                className="flex gap-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-brand-100 backdrop-blur-sm"
                            >
                                <span
                                    className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white shadow-sm"
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

            <section className="revelar max-w-6xl mx-auto px-6 py-14" aria-labelledby="titulo-perfiles">
                <h2 id="titulo-perfiles" className="text-2xl font-semibold text-gray-900 mb-6">
                    Un sistema para cada perfil
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {PERFILES.map((perfil) => {
                        const tono = TONOS_PERFIL[perfil.titulo];

                        return (
                            <article
                                key={perfil.titulo}
                                className={`rounded-2xl border border-gray-200 border-t-4 bg-white p-6 shadow-sm ${tono.franja}`}
                            >
                                <span
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${tono.icono}`}
                                    aria-hidden="true"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        {ICONOS_PERFIL[perfil.titulo]}
                                    </svg>
                                </span>
                                <h3 className="mt-4 font-semibold text-gray-900">{perfil.titulo}</h3>
                                <p className="mt-2 text-sm text-gray-600">{perfil.texto}</p>
                            </article>
                        );
                    })}
                </div>
            </section>

            {!usuario && (
                <section className="revelar max-w-6xl mx-auto px-6 pb-16">
                    <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-600 px-6 py-12 text-center shadow-lg">
                        {fotoConvocatoria && (
                            <>
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0 -z-10 bg-cover bg-center"
                                    style={{ backgroundImage: `url("${fotoConvocatoria}")` }}
                                />
                                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand-900/70" />
                            </>
                        )}
                        <div
                            aria-hidden="true"
                            className="patron absolute inset-0 -z-10"
                            style={{ backgroundImage: `url("${tejidoClaro}")` }}
                        />
                        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                            ¿Tienes un emprendimiento artesanal?
                        </h2>
                        <p className="mt-2 text-brand-50">
                            Regístrate y solicita participar en la próxima edición.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/registro"
                                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-md transition duration-150 hover:bg-brand-50 active:scale-[0.97]"
                            >
                                Crear mi cuenta
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center rounded-lg border border-white px-5 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-white/15 active:scale-[0.97]"
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
