import { useState, useEffect, useMemo } from "react";
import {
    consultarFerias, consultarEdicionesFeria, consultarLugares, consultarOcupacion,
    solicitarParticipacion, consultarParticipantes, consultarMisSolicitudes,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { estadoEdicion, normalizarTexto } from "../utils/helpers";
import { Alerta, Boton, Campo, EstadoVacio, Esqueleto } from "../components/ui";
import TarjetaEdicion from "../components/TarjetaEdicion";

const OPCIONES_ESTADO = [
    { valor: "TODAS", texto: "Todas" },
    { valor: "EN_CURSO", texto: "En curso" },
    { valor: "PROXIMA", texto: "Próximas" },
    { valor: "FINALIZADA", texto: "Finalizadas" },
];

const ORDEN_ESTADO = { EN_CURSO: 0, PROXIMA: 1, FINALIZADA: 2 };

function Ferias() {
    const { usuario } = useAuth();

    const [ferias, setFerias] = useState([]);
    const [ediciones, setEdiciones] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [ocupaciones, setOcupaciones] = useState({});
    const [misSolicitudes, setMisSolicitudes] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODAS");
    const [fecha, setFecha] = useState("");

    const [avisos, setAvisos] = useState({});
    const [solicitandoId, setSolicitandoId] = useState(null);
    const [abiertaId, setAbiertaId] = useState(null);
    const [participantes, setParticipantes] = useState([]);
    const [cargandoParticipantes, setCargandoParticipantes] = useState(false);

    useEffect(() => {
        async function cargar() {
            try {
                const [datosFerias, datosEdiciones, datosLugares] = await Promise.all([
                    consultarFerias(),
                    consultarEdicionesFeria(),
                    consultarLugares(),
                ]);

                const idsFerias = new Set(datosFerias.map((f) => f.id));
                const visibles = datosEdiciones.filter((e) => idsFerias.has(e.idFeria));

                const listaOcupaciones = await Promise.all(
                    visibles.map((edicion) => consultarOcupacion(edicion.id))
                );
                const mapa = {};
                visibles.forEach((edicion, i) => {
                    mapa[edicion.id] = listaOcupaciones[i];
                });

                setFerias(datosFerias);
                setEdiciones(visibles);
                setLugares(datosLugares);
                setOcupaciones(mapa);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargar();
    }, []);

    useEffect(() => {
        if (usuario?.rol !== "ARTESANO") return;

        consultarMisSolicitudes(usuario.token)
            .then((lista) => {
                const mapa = {};
                lista.forEach((solicitud) => {
                    mapa[solicitud.idEdicionFeria] = solicitud.estado;
                });
                setMisSolicitudes(mapa);
            })
            .catch((err) => setError(err.message));
    }, [usuario?.rol, usuario?.token]);

    const tarjetas = useMemo(() => {
        const termino = normalizarTexto(busqueda.trim());
        const items = [];

        ferias.forEach((feria) => {
            const deLaFeria = ediciones.filter((e) => e.idFeria === feria.id);
            if (deLaFeria.length === 0) {
                items.push({ feria, edicion: null, lugar: null });
            } else {
                deLaFeria.forEach((edicion) => {
                    items.push({
                        feria,
                        edicion,
                        lugar: lugares.find((l) => l.id === edicion.idLugar) ?? null,
                    });
                });
            }
        });

        function rango(item) {
            return item.edicion ? ORDEN_ESTADO[estadoEdicion(item.edicion)] : 3;
        }

        return items
            .filter((item) => {
                const texto = normalizarTexto(
                    `${item.feria.nombreFeria} ${item.lugar?.nombre ?? ""} ${item.lugar?.direccion ?? ""}`
                );
                if (termino && !texto.includes(termino)) return false;

                if (!item.edicion) return filtroEstado === "TODAS" && !fecha;

                if (filtroEstado !== "TODAS" && estadoEdicion(item.edicion) !== filtroEstado) return false;
                if (fecha && !(item.edicion.fechaInicio <= fecha && fecha <= item.edicion.fechaFin)) return false;
                return true;
            })
            .sort((a, b) => {
                const ra = rango(a);
                const rb = rango(b);
                if (ra !== rb) return ra - rb;
                if (!a.edicion) return a.feria.nombreFeria.localeCompare(b.feria.nombreFeria, "es");
                if (ra === 0) return a.edicion.fechaFin.localeCompare(b.edicion.fechaFin);
                if (ra === 1) return a.edicion.fechaInicio.localeCompare(b.edicion.fechaInicio);
                return b.edicion.fechaFin.localeCompare(a.edicion.fechaFin);
            });
    }, [ferias, ediciones, lugares, busqueda, filtroEstado, fecha]);

    const hayFiltros = busqueda !== "" || filtroEstado !== "TODAS" || fecha !== "";

    function limpiarFiltros() {
        setBusqueda("");
        setFiltroEstado("TODAS");
        setFecha("");
    }

    function definirAviso(idEdicion, valor) {
        setAvisos((anterior) => {
            const copia = { ...anterior };
            if (valor) copia[idEdicion] = valor;
            else delete copia[idEdicion];
            return copia;
        });
    }

    async function manejarSolicitud(idEdicion) {
        definirAviso(idEdicion, null);
        setSolicitandoId(idEdicion);
        try {
            await solicitarParticipacion(idEdicion, usuario.token);
            setMisSolicitudes((anterior) => ({ ...anterior, [idEdicion]: "PENDIENTE" }));
            definirAviso(idEdicion, {
                tipo: "exito",
                texto: "Solicitud enviada. Queda pendiente de revisión por el administrador.",
            });
        } catch (err) {
            definirAviso(idEdicion, { tipo: "error", texto: err.message });
        } finally {
            setSolicitandoId(null);
        }
    }

    async function alternarParticipantes(idEdicion) {
        if (abiertaId === idEdicion) {
            setAbiertaId(null);
            setParticipantes([]);
            return;
        }

        definirAviso(idEdicion, null);
        setAbiertaId(idEdicion);
        setParticipantes([]);
        setCargandoParticipantes(true);
        try {
            setParticipantes(await consultarParticipantes(idEdicion));
        } catch (err) {
            definirAviso(idEdicion, { tipo: "error", texto: err.message });
        } finally {
            setCargandoParticipantes(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-900">Ferias artesanales</h2>
                <p className="text-gray-500 mt-1">
                    Consulta las ediciones programadas, su cupo y los artesanos que participan.
                </p>
            </div>

            <Alerta tipo="error" className="mb-6">{error}</Alerta>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
                    <Campo
                        etiqueta="Buscar"
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Nombre de la feria o del lugar"
                    />
                    <Campo
                        etiqueta="Estado"
                        as="select"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        {OPCIONES_ESTADO.map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
                        ))}
                    </Campo>
                    <Campo
                        etiqueta="Fecha de realización"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                </div>

                {hayFiltros && (
                    <div className="mt-3 flex justify-end">
                        <Boton variante="fantasma" tamano="sm" onClick={limpiarFiltros}>
                            Limpiar filtros
                        </Boton>
                    </div>
                )}
            </div>

            {!cargando && (
                <p className="text-sm font-semibold text-gray-800 mb-3" aria-live="polite">
                    {tarjetas.length} {tarjetas.length === 1 ? "resultado" : "resultados"}
                </p>
            )}

            {cargando ? (
                <div className="flex flex-col gap-4">
                    <Esqueleto className="h-44 w-full rounded-2xl" />
                    <Esqueleto className="h-44 w-full rounded-2xl" />
                    <Esqueleto className="h-44 w-full rounded-2xl" />
                </div>
            ) : tarjetas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200">
                    <EstadoVacio
                        titulo={hayFiltros ? "No encontramos resultados" : "Aún no hay ferias publicadas"}
                        descripcion={
                            hayFiltros
                                ? "Prueba con otra búsqueda o cambia los filtros."
                                : "Cuando el administrador cree una feria, aparecerá aquí."
                        }
                        accion={
                            hayFiltros ? (
                                <Boton variante="secundario" onClick={limpiarFiltros}>
                                    Limpiar filtros
                                </Boton>
                            ) : null
                        }
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {tarjetas.map((item) => (
                        <TarjetaEdicion
                            key={item.edicion ? `edicion-${item.edicion.id}` : `feria-${item.feria.id}`}
                            feria={item.feria}
                            edicion={item.edicion}
                            lugar={item.lugar}
                            ocupacion={item.edicion ? ocupaciones[item.edicion.id] : null}
                            rolUsuario={usuario?.rol}
                            estadoSolicitud={item.edicion ? misSolicitudes[item.edicion.id] : null}
                            solicitando={item.edicion ? solicitandoId === item.edicion.id : false}
                            aviso={item.edicion ? avisos[item.edicion.id] : null}
                            abierta={item.edicion ? abiertaId === item.edicion.id : false}
                            participantes={participantes}
                            cargandoParticipantes={cargandoParticipantes}
                            onSolicitar={() => manejarSolicitud(item.edicion.id)}
                            onAlternar={() => alternarParticipantes(item.edicion.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Ferias;