import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { aprobarSolicitud, rechazarSolicitud } from "../services/api";
import { formatearFechaCorta } from "../utils/helpers";
import {
    Alerta, Boton, ConfirmarDialogo, EstadoVacio, Esqueleto, Insignia, Tarjeta,
} from "./ui";

const ESTADOS = {
    PENDIENTE: { texto: "Pendiente", tono: "ambar" },
    APROBADA: { texto: "Aprobada", tono: "verde" },
    RECHAZADA: { texto: "Rechazada", tono: "rojo" },
};

const RANGO = { PENDIENTE: 0, APROBADA: 1, RECHAZADA: 2 };

const FILTROS = [
    { valor: "PENDIENTE", texto: "Pendientes" },
    { valor: "APROBADA", texto: "Aprobadas" },
    { valor: "RECHAZADA", texto: "Rechazadas" },
    { valor: "TODAS", texto: "Todas" },
];

function GestionSolicitudes({
    solicitudes, artesanos, ediciones, ferias, lugares, ocupaciones, cargando, onCambio,
}) {
    const { usuario } = useAuth();

    const [filtro, setFiltro] = useState("PENDIENTE");
    const [procesandoId, setProcesandoId] = useState(null);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [aRechazar, setARechazar] = useState(null);

    function conteo(valor) {
        return valor === "TODAS"
            ? solicitudes.length
            : solicitudes.filter((s) => s.estado === valor).length;
    }

    function nombreEmprendimiento(idArtesano) {
        const artesano = artesanos.find((a) => a.id === idArtesano);
        return artesano ? artesano.nombreEmprendimiento : `Artesano #${idArtesano}`;
    }

    function describirEdicion(idEdicion) {
        const edicion = ediciones.find((e) => e.id === idEdicion);
        if (!edicion) {
            return { titulo: `Edición #${idEdicion}`, detalle: "No se encontró la edición.", inactiva: false };
        }

        const feria = ferias.find((f) => f.id === edicion.idFeria);
        const lugar = lugares.find((l) => l.id === edicion.idLugar);

        return {
            titulo: feria ? feria.nombreFeria : `Feria #${edicion.idFeria}`,
            detalle: `${formatearFechaCorta(edicion.fechaInicio)} — ${formatearFechaCorta(edicion.fechaFin)} · ${
                lugar ? lugar.nombre : `Lugar #${edicion.idLugar}`
            }`,
            inactiva: !edicion.activo,
        };
    }

    async function ejecutar(solicitud, accion) {
        setError(null);
        setMensaje(null);
        setProcesandoId(solicitud.id);
        const nombre = nombreEmprendimiento(solicitud.idArtesano);

        try {
            if (accion === "aprobar") {
                await aprobarSolicitud(solicitud.id, usuario.token);
                setMensaje(`Solicitud de "${nombre}" aprobada. El artesano recibirá un aviso por correo.`);
            } else {
                await rechazarSolicitud(solicitud.id, usuario.token);
                setMensaje(`Solicitud de "${nombre}" rechazada. El artesano recibirá un aviso por correo.`);
            }
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesandoId(null);
        }
    }

    async function confirmarRechazo() {
        const solicitud = aRechazar;
        await ejecutar(solicitud, "rechazar");
        setARechazar(null);
    }

    const visibles = solicitudes
        .filter((s) => filtro === "TODAS" || s.estado === filtro)
        .sort((a, b) => {
            if (filtro === "PENDIENTE") {
                return a.fechaInscripcion.localeCompare(b.fechaInscripcion) || a.id - b.id;
            }
            if (filtro === "TODAS" && RANGO[a.estado] !== RANGO[b.estado]) {
                return RANGO[a.estado] - RANGO[b.estado];
            }
            return b.fechaInscripcion.localeCompare(a.fechaInscripcion) || b.id - a.id;
        });

    function textoVacio() {
        if (solicitudes.length === 0) {
            return {
                titulo: "Aún no hay solicitudes",
                descripcion: "Cuando un artesano solicite participar en una edición, aparecerá aquí.",
            };
        }
        if (filtro === "PENDIENTE") {
            return { titulo: "No hay solicitudes pendientes", descripcion: "Todo está al día." };
        }
        return { titulo: "No hay solicitudes en este estado", descripcion: "Prueba con otro filtro." };
    }

    return (
        <>
            <Tarjeta
                titulo="Solicitudes de participación"
                descripcion="Revisa quién quiere participar en cada edición. Las pendientes aparecen en orden de llegada."
            >
                <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar solicitudes">
                    {FILTROS.map((f) => (
                        <button
                            key={f.valor}
                            type="button"
                            aria-pressed={filtro === f.valor}
                            onClick={() => setFiltro(f.valor)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                filtro === f.valor
                                    ? "border-green-600 bg-green-600 text-white"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {f.texto} <span className="ml-1 opacity-80">{conteo(f.valor)}</span>
                        </button>
                    ))}
                </div>

                <Alerta tipo="error" className="mb-4">{error}</Alerta>
                <Alerta tipo="exito" className="mb-4">{mensaje}</Alerta>

                {cargando ? (
                    <div className="flex flex-col gap-3">
                        <Esqueleto className="h-28 w-full rounded-xl" />
                        <Esqueleto className="h-28 w-full rounded-xl" />
                    </div>
                ) : visibles.length === 0 ? (
                    <EstadoVacio {...textoVacio()} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {visibles.map((solicitud) => {
                            const artesano = artesanos.find((a) => a.id === solicitud.idArtesano);
                            const estado = ESTADOS[solicitud.estado];
                            const { titulo, detalle, inactiva } = describirEdicion(solicitud.idEdicionFeria);
                            const ocupacion = ocupaciones[solicitud.idEdicionFeria];
                            const limitado =
                                ocupacion && ocupacion.cupoMaximo !== null && ocupacion.cupoMaximo !== undefined;
                            const cupoLleno = Boolean(limitado) && ocupacion.disponibles === 0;
                            const avisarCupo = cupoLleno && solicitud.estado !== "APROBADA";
                            const ocupado = procesandoId !== null;

                            return (
                                <article
                                    key={solicitud.id}
                                    className={`rounded-xl border p-4 ${
                                        solicitud.estado === "PENDIENTE"
                                            ? "border-amber-200 bg-amber-50/40"
                                            : "border-gray-100 bg-white"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">
                                                    {nombreEmprendimiento(solicitud.idArtesano)}
                                                </h4>
                                                <Insignia tono={estado.tono}>{estado.texto}</Insignia>
                                            </div>

                                            {artesano && (
                                                <>
                                                    <p className="text-sm text-gray-600">
                                                        {artesano.nombre}
                                                        {!artesano.activo && " (inactivo)"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {artesano.correoElectronico}
                                                        {artesano.telefono ? ` · ${artesano.telefono}` : ""}
                                                    </p>
                                                </>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-gray-800">{titulo}</p>
                                                {inactiva && <Insignia tono="gris">Edición inactiva</Insignia>}
                                            </div>
                                            <p className="text-xs text-gray-500">{detalle}</p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Solicitada el {formatearFechaCorta(solicitud.fechaInscripcion)}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-start gap-2 sm:items-end">
                                            {limitado && (
                                                <p
                                                    className={`text-xs ${
                                                        avisarCupo ? "font-medium text-red-600" : "text-gray-500"
                                                    }`}
                                                >
                                                    Cupo: {ocupacion.aprobados} de {ocupacion.cupoMaximo}
                                                    {avisarCupo && " · completo"}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {solicitud.estado === "PENDIENTE" && (
                                                    <>
                                                        <Boton
                                                            tamano="sm"
                                                            onClick={() => ejecutar(solicitud, "aprobar")}
                                                            cargando={procesandoId === solicitud.id}
                                                            disabled={ocupado || cupoLleno}
                                                        >
                                                            Aprobar
                                                        </Boton>
                                                        <Boton
                                                            variante="peligro"
                                                            tamano="sm"
                                                            onClick={() => ejecutar(solicitud, "rechazar")}
                                                            disabled={ocupado}
                                                        >
                                                            Rechazar
                                                        </Boton>
                                                    </>
                                                )}

                                                {solicitud.estado === "RECHAZADA" && (
                                                    <Boton
                                                        variante="secundario"
                                                        tamano="sm"
                                                        onClick={() => ejecutar(solicitud, "aprobar")}
                                                        cargando={procesandoId === solicitud.id}
                                                        disabled={ocupado || cupoLleno}
                                                    >
                                                        Aprobar
                                                    </Boton>
                                                )}

                                                {solicitud.estado === "APROBADA" && (
                                                    <Boton
                                                        variante="peligroSuave"
                                                        tamano="sm"
                                                        onClick={() => setARechazar(solicitud)}
                                                        disabled={ocupado}
                                                    >
                                                        Cambiar a rechazada
                                                    </Boton>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </Tarjeta>

            <ConfirmarDialogo
                abierto={Boolean(aRechazar)}
                titulo="¿Cambiar a rechazada?"
                mensaje={
                    aRechazar
                        ? `Se rechazará la solicitud ya aprobada de "${nombreEmprendimiento(aRechazar.idArtesano)}". Su cupo quedará libre, dejará de aparecer como participante y recibirá un aviso por correo.`
                        : ""
                }
                textoConfirmar="Rechazar"
                peligro
                cargando={procesandoId !== null && aRechazar?.id === procesandoId}
                onConfirmar={confirmarRechazo}
                onCancelar={() => setARechazar(null)}
            />
        </>
    );
}

export default GestionSolicitudes;