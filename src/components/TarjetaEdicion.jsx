import { Link } from "react-router-dom";
import { Alerta, Boton, Esqueleto, Insignia } from "./ui";
import BarraCupo from "./BarraCupo";
import UbicacionLugar from "./UbicacionLugar";
import { estadoEdicion, formatearFechaCorta, formatearPrecio } from "../utils/helpers";

const ETIQUETAS = {
    EN_CURSO: { texto: "En curso", tono: "verde" },
    PROXIMA: { texto: "Próxima", tono: "azul" },
    FINALIZADA: { texto: "Finalizada", tono: "gris" },
};

const SOLICITUDES = {
    PENDIENTE: { texto: "Solicitud pendiente", tono: "ambar" },
    APROBADA: { texto: "Participas en esta edición", tono: "verde" },
    RECHAZADA: { texto: "Solicitud rechazada", tono: "rojo" },
};

function IconoCalendario() {
    return (
        <svg
            className="h-5 w-5 text-green-600 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
    );
}

function IconoUbicacion() {
    return (
        <svg
            className="h-5 w-5 text-green-600 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );
}

function TarjetaEdicion({
    feria,
    edicion,
    lugar,
    ocupacion,
    rolUsuario,
    estadoSolicitud,
    solicitando,
    aviso,
    abierta,
    participantes,
    cargandoParticipantes,
    onSolicitar,
    onAlternar,
}) {
    if (!edicion) {
        return (
            <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{feria.nombreFeria}</h3>
                    <Insignia tono="gris">Sin ediciones</Insignia>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Aún no hay ediciones programadas para esta feria. Vuelve pronto.
                </p>
            </article>
        );
    }

    const estado = estadoEdicion(edicion);
    const etiqueta = ETIQUETAS[estado];
    const finalizada = estado === "FINALIZADA";
    const cupoLleno = ocupacion?.disponibles === 0;
    const puedeSolicitar = rolUsuario === "ARTESANO" && !estadoSolicitud && !finalizada;

    return (
        <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-[1fr_16rem]">
                <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{feria.nombreFeria}</h3>
                        <Insignia tono={etiqueta.tono}>{etiqueta.texto}</Insignia>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                            <IconoCalendario />
                            <div>
                                <p className="text-xs text-gray-500">Fecha de realización</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {formatearFechaCorta(edicion.fechaInicio)} — {formatearFechaCorta(edicion.fechaFin)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <IconoUbicacion />
                            <div>
                                <p className="text-xs text-gray-500">Lugar</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {lugar?.nombre ?? `Lugar #${edicion.idLugar}`}
                                </p>
                                {lugar?.direccion && (
                                    <p className="text-xs text-gray-500">{lugar.direccion}</p>
                                )}
                                <UbicacionLugar lugar={lugar} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50 p-6">
                    <BarraCupo ocupacion={ocupacion} />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-3">
                <div>
                    {rolUsuario === "ARTESANO" && estadoSolicitud ? (
                        <Insignia tono={SOLICITUDES[estadoSolicitud].tono}>
                            {SOLICITUDES[estadoSolicitud].texto}
                        </Insignia>
                    ) : finalizada ? (
                        <p className="text-xs text-gray-500">Esta edición ya finalizó.</p>
                    ) : !rolUsuario ? (
                        <p className="text-xs text-gray-500">
                            ¿Eres artesano?{" "}
                            <Link to="/login" className="text-green-700 font-medium hover:underline">
                                Inicia sesión
                            </Link>{" "}
                            para solicitar participación.
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Boton variante="secundario" tamano="sm" onClick={onAlternar} aria-expanded={abierta}>
                        {abierta ? "Ocultar participantes" : "Ver participantes"}
                    </Boton>

                    {puedeSolicitar && (
                        <Boton tamano="sm" onClick={onSolicitar} cargando={solicitando} disabled={cupoLleno}>
                            {cupoLleno ? "Cupo completo" : solicitando ? "Enviando..." : "Solicitar participación"}
                        </Boton>
                    )}
                </div>
            </div>

            {aviso && (
                <div className="px-6 pb-4">
                    <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>
                </div>
            )}

            {abierta && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Artesanos participantes</h4>

                    {cargandoParticipantes && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Esqueleto className="h-24 w-full" />
                            <Esqueleto className="h-24 w-full" />
                        </div>
                    )}

                    {!cargandoParticipantes && participantes.length === 0 && (
                        <p className="text-sm text-gray-500">
                            Aún no hay artesanos confirmados en esta edición.
                        </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        {participantes.map((participante) => (
                            <div
                                key={participante.id}
                                className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4"
                            >
                                <div
                                    className="h-12 w-12 shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg font-semibold"
                                    aria-hidden="true"
                                >
                                    {participante.nombreEmprendimiento.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h5 className="font-semibold text-gray-900 truncate">
                                        {participante.nombreEmprendimiento}
                                    </h5>
                                    {participante.descripcionCorta && (
                                        <p className="text-sm text-gray-500 mb-2">
                                            {participante.descripcionCorta}
                                        </p>
                                    )}

                                    {participante.productos.length === 0 ? (
                                        <p className="text-xs text-gray-400">Sin productos publicados.</p>
                                    ) : (
                                        <ul className="mt-1 flex flex-col gap-1">
                                            {participante.productos.map((producto) => (
                                                <li
                                                    key={producto.id}
                                                    className="flex justify-between gap-2 text-sm text-gray-600"
                                                >
                                                    <span className="truncate">{producto.nombre}</span>
                                                    <span className="text-gray-500 shrink-0">
                                                        ${formatearPrecio(producto.precio)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}

export default TarjetaEdicion;