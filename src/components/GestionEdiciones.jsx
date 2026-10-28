import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { crearEdicionFeria, cambiarEstadoEdicion, configurarCupoEdicion } from "../services/api";
import { estadoEdicion, formatearFechaCorta, normalizarTexto } from "../utils/helpers";
import {
    Alerta, Boton, Campo, ConfirmarDialogo, EstadoVacio, Esqueleto, Insignia, Tarjeta,
} from "./ui";
import BarraCupo from "./BarraCupo";

const ETIQUETAS = {
    EN_CURSO: { texto: "En curso", tono: "verde" },
    PROXIMA: { texto: "Próxima", tono: "azul" },
    FINALIZADA: { texto: "Finalizada", tono: "gris" },
    INACTIVA: { texto: "Inactiva", tono: "rojo" },
};

const RANGO = { EN_CURSO: 0, PROXIMA: 1, FINALIZADA: 2, INACTIVA: 3 };

const OPCIONES_ESTADO = [
    { valor: "TODAS", texto: "Todas" },
    { valor: "EN_CURSO", texto: "En curso" },
    { valor: "PROXIMA", texto: "Próximas" },
    { valor: "FINALIZADA", texto: "Finalizadas" },
    { valor: "INACTIVA", texto: "Inactivas" },
];

const FORMULARIO_VACIO = { idFeria: "", idLugar: "", fechaInicio: "", fechaFin: "" };

function GestionEdiciones({ ferias, lugares, ediciones, ocupaciones, cargando, onCambio }) {
    const { usuario } = useAuth();

    const [mostrarForm, setMostrarForm] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [guardando, setGuardando] = useState(false);

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODAS");

    const [cupoEditandoId, setCupoEditandoId] = useState(null);
    const [cupoEditado, setCupoEditado] = useState("");
    const [guardandoCupo, setGuardandoCupo] = useState(false);

    const [cambiandoId, setCambiandoId] = useState(null);
    const [aDesactivar, setADesactivar] = useState(null);

    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    const feriasActivas = ferias.filter((f) => f.activo);
    const lugaresActivos = lugares.filter((lugar) => lugar.activo);
    const puedeCrear = feriasActivas.length > 0 && lugaresActivos.length > 0;

    const lista = useMemo(() => {
        const termino = normalizarTexto(busqueda.trim());

        return ediciones
            .map((edicion) => ({
                edicion,
                feria: ferias.find((f) => f.id === edicion.idFeria),
                lugar: lugares.find((l) => l.id === edicion.idLugar),
                estado: edicion.activo ? estadoEdicion(edicion) : "INACTIVA",
            }))
            .filter((item) => {
                if (filtroEstado !== "TODAS" && item.estado !== filtroEstado) return false;
                if (!termino) return true;

                const texto = normalizarTexto(
                    `${item.feria?.nombreFeria ?? ""} ${item.lugar?.nombre ?? ""} ${item.lugar?.direccion ?? ""}`
                );
                return texto.includes(termino);
            })
            .sort((a, b) => {
                if (RANGO[a.estado] !== RANGO[b.estado]) return RANGO[a.estado] - RANGO[b.estado];
                if (a.estado === "EN_CURSO") return a.edicion.fechaFin.localeCompare(b.edicion.fechaFin);
                if (a.estado === "PROXIMA") return a.edicion.fechaInicio.localeCompare(b.edicion.fechaInicio);
                return b.edicion.fechaFin.localeCompare(a.edicion.fechaFin);
            });
    }, [ediciones, ferias, lugares, busqueda, filtroEstado]);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarCrear(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);

        if (formulario.fechaFin < formulario.fechaInicio) {
            setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
            return;
        }

        setGuardando(true);
        try {
            await crearEdicionFeria(
                {
                    idFeria: Number(formulario.idFeria),
                    idLugar: Number(formulario.idLugar),
                    fechaInicio: formulario.fechaInicio,
                    fechaFin: formulario.fechaFin,
                },
                usuario.token
            );
            setMensaje("Edición creada. Ya aparece en la vista pública y los artesanos pueden solicitar participar.");
            setFormulario(FORMULARIO_VACIO);
            setMostrarForm(false);
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    function iniciarCupo(edicion) {
        setError(null);
        setMensaje(null);
        setCupoEditandoId(edicion.id);
        setCupoEditado(edicion.cupoMaximo ?? "");
    }

    async function guardarCupo(idEdicion) {
        setError(null);
        setMensaje(null);
        setGuardandoCupo(true);

        try {
            const valor = cupoEditado === "" ? null : Number(cupoEditado);
            await configurarCupoEdicion(idEdicion, valor, usuario.token);
            setMensaje(valor === null ? "Se quitó el límite de cupo." : `Cupo actualizado a ${valor} artesanos.`);
            setCupoEditandoId(null);
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardandoCupo(false);
        }
    }

    async function cambiarEstado(edicion, activo) {
        setError(null);
        setMensaje(null);
        setCambiandoId(edicion.id);

        try {
            await cambiarEstadoEdicion(edicion.id, activo, usuario.token);
            setMensaje(
                activo
                    ? "Edición reactivada."
                    : "Edición desactivada. Ya no se muestra al público, pero conserva sus solicitudes y su cupo."
            );
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setCambiandoId(null);
        }
    }

    async function confirmarDesactivacion() {
        const edicion = aDesactivar;
        await cambiarEstado(edicion, false);
        setADesactivar(null);
    }

    function nombreFeriaDe(edicion) {
        return ferias.find((f) => f.id === edicion.idFeria)?.nombreFeria ?? `Feria #${edicion.idFeria}`;
    }

    return (
        <>
            <Tarjeta
                titulo="Ediciones"
                descripcion="Cada edición tiene sus fechas, su lugar y su cupo de artesanos. Los artesanos solicitan participar en una edición."
                acciones={
                    <Boton
                        tamano="sm"
                        variante={mostrarForm ? "secundario" : "primario"}
                        onClick={() => {
                            setError(null);
                            setMostrarForm((visible) => !visible);
                        }}
                    >
                        {mostrarForm ? "Cancelar" : "+ Crear edición"}
                    </Boton>
                }
            >
                <Alerta tipo="error" className="mb-4">{error}</Alerta>
                <Alerta tipo="exito" className="mb-4">{mensaje}</Alerta>

                {mostrarForm &&
                    (puedeCrear ? (
                        <form
                            onSubmit={manejarCrear}
                            className="mb-5 grid gap-4 rounded-xl border border-green-100 bg-green-50/50 p-4 sm:grid-cols-2"
                        >
                            <Campo
                                etiqueta="Feria"
                                as="select"
                                name="idFeria"
                                value={formulario.idFeria}
                                onChange={manejarCambio}
                                required
                            >
                                <option value="">Selecciona una feria</option>
                                {feriasActivas.map((feria) => (
                                    <option key={feria.id} value={feria.id}>{feria.nombreFeria}</option>
                                ))}
                            </Campo>

                            <Campo
                                etiqueta="Lugar"
                                as="select"
                                name="idLugar"
                                value={formulario.idLugar}
                                onChange={manejarCambio}
                                required
                            >
                                <option value="">Selecciona un lugar</option>
                                {lugaresActivos.map((lugar) => (
                                    <option key={lugar.id} value={lugar.id}>{lugar.nombre}</option>
                                ))}
                            </Campo>

                            <Campo
                                etiqueta="Fecha de inicio"
                                type="date"
                                name="fechaInicio"
                                value={formulario.fechaInicio}
                                onChange={manejarCambio}
                                required
                            />
                            <Campo
                                etiqueta="Fecha de fin"
                                type="date"
                                name="fechaFin"
                                value={formulario.fechaFin}
                                onChange={manejarCambio}
                                min={formulario.fechaInicio || undefined}
                                required
                            />

                            <div className="sm:col-span-2">
                                <Boton type="submit" cargando={guardando}>
                                    {guardando ? "Creando..." : "Crear edición"}
                                </Boton>
                            </div>
                        </form>
                    ) : (
                        <Alerta tipo="aviso" className="mb-5">
                            Para crear una edición primero necesitas al menos una feria activa y un lugar registrado.
                        </Alerta>
                    ))}

                <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_12rem]">
                    <Campo
                        etiqueta="Buscar"
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Feria o lugar"
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
                </div>

                {!cargando && (
                    <p className="mb-3 text-sm font-semibold text-gray-800" aria-live="polite">
                        {lista.length} {lista.length === 1 ? "edición" : "ediciones"}
                    </p>
                )}

                {cargando ? (
                    <div className="flex flex-col gap-3">
                        <Esqueleto className="h-32 w-full rounded-2xl" />
                        <Esqueleto className="h-32 w-full rounded-2xl" />
                    </div>
                ) : lista.length === 0 ? (
                    <EstadoVacio
                        titulo={ediciones.length === 0 ? "Aún no hay ediciones" : "No encontramos ediciones"}
                        descripcion={
                            ediciones.length === 0
                                ? "Crea la primera con el botón de arriba."
                                : "Prueba con otra búsqueda o cambia el filtro."
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-4">
                        {lista.map(({ edicion, feria, lugar, estado }) => {
                            const etiqueta = ETIQUETAS[estado];
                            const ocupado = cambiandoId !== null || guardandoCupo;

                            return (
                                <article
                                    key={edicion.id}
                                    className={`overflow-hidden rounded-2xl border shadow-sm ${
                                        edicion.activo ? "border-gray-200 bg-white" : "border-red-100 bg-red-50/40"
                                    }`}
                                >
                                    <div className="grid md:grid-cols-[1fr_16rem]">
                                        <div className="p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <h4 className="text-base font-semibold text-gray-900">
                                                    {feria ? feria.nombreFeria : `Feria #${edicion.idFeria}`}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {feria && !feria.activo && (
                                                        <Insignia tono="ambar">Feria inactiva</Insignia>
                                                    )}
                                                    <Insignia tono={etiqueta.tono}>{etiqueta.texto}</Insignia>
                                                </div>
                                            </div>

                                            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <dt className="text-xs text-gray-500">Fecha de realización</dt>
                                                    <dd className="text-sm font-medium text-gray-800">
                                                        {formatearFechaCorta(edicion.fechaInicio)} — {formatearFechaCorta(edicion.fechaFin)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-gray-500">Lugar</dt>
                                                    <dd className="text-sm font-medium text-gray-800">
                                                        {lugar ? lugar.nombre : `Lugar #${edicion.idLugar}`}
                                                    </dd>
                                                    {lugar?.direccion && (
                                                        <dd className="text-xs text-gray-500">{lugar.direccion}</dd>
                                                    )}
                                                </div>
                                            </dl>
                                        </div>

                                        <div className="border-t border-gray-100 bg-gray-50/70 p-5 md:border-l md:border-t-0">
                                            <BarraCupo ocupacion={ocupaciones[edicion.id]} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-3">
                                        <Boton
                                            variante="secundario"
                                            tamano="sm"
                                            onClick={() => iniciarCupo(edicion)}
                                            disabled={ocupado}
                                        >
                                            Configurar cupo
                                        </Boton>
                                        {edicion.activo ? (
                                            <Boton
                                                variante="peligroSuave"
                                                tamano="sm"
                                                onClick={() => setADesactivar(edicion)}
                                                disabled={ocupado}
                                            >
                                                Desactivar
                                            </Boton>
                                        ) : (
                                            <Boton
                                                tamano="sm"
                                                onClick={() => cambiarEstado(edicion, true)}
                                                cargando={cambiandoId === edicion.id}
                                                disabled={ocupado}
                                            >
                                                Reactivar
                                            </Boton>
                                        )}
                                    </div>

                                    {cupoEditandoId === edicion.id && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                guardarCupo(edicion.id);
                                            }}
                                            className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-3"
                                        >
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={cupoEditado}
                                                onChange={(e) => setCupoEditado(e.target.value)}
                                                placeholder="Vacío = sin límite"
                                                aria-label="Cupo máximo de artesanos"
                                                autoFocus
                                                className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                            <Boton type="submit" tamano="sm" cargando={guardandoCupo}>
                                                Guardar cupo
                                            </Boton>
                                            <Boton
                                                variante="secundario"
                                                tamano="sm"
                                                onClick={() => setCupoEditandoId(null)}
                                            >
                                                Cancelar
                                            </Boton>
                                        </form>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </Tarjeta>

            <ConfirmarDialogo
                abierto={Boolean(aDesactivar)}
                titulo="¿Desactivar esta edición?"
                mensaje={
                    aDesactivar
                        ? `La edición del ${formatearFechaCorta(aDesactivar.fechaInicio)} al ${formatearFechaCorta(aDesactivar.fechaFin)} de "${nombreFeriaDe(aDesactivar)}" dejará de mostrarse al público. Sus solicitudes y su cupo se conservan.`
                        : ""
                }
                textoConfirmar="Desactivar"
                peligro
                cargando={cambiandoId !== null && aDesactivar?.id === cambiandoId}
                onConfirmar={confirmarDesactivacion}
                onCancelar={() => setADesactivar(null)}
            />
        </>
    );
}

export default GestionEdiciones;