import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { crearFeria, actualizarFeria, cambiarEstadoFeria } from "../services/api";
import {
    Alerta, Boton, Campo, ConfirmarDialogo, EstadoVacio, Esqueleto, Insignia, Tarjeta,
} from "./ui";

function GestionFerias({ ferias, ediciones, cargando, onCambio }) {
    const { usuario } = useAuth();

    const [mostrarForm, setMostrarForm] = useState(false);
    const [nombreNueva, setNombreNueva] = useState("");
    const [creando, setCreando] = useState(false);

    const [editandoId, setEditandoId] = useState(null);
    const [nombreEditado, setNombreEditado] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);

    const [aDesactivar, setADesactivar] = useState(null);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    async function manejarCrear(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);

        const nombre = nombreNueva.trim();
        if (!nombre) {
            setError("El nombre de la feria es obligatorio.");
            return;
        }

        setCreando(true);
        try {
            const creada = await crearFeria(nombre, usuario.id, usuario.token);
            setMensaje(`Feria "${creada.nombreFeria}" creada. Ahora puedes agregarle una edición con fechas y lugar.`);
            setNombreNueva("");
            setMostrarForm(false);
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreando(false);
        }
    }

    function iniciarEdicion(feria) {
        setError(null);
        setMensaje(null);
        setEditandoId(feria.id);
        setNombreEditado(feria.nombreFeria);
    }

    async function guardarNombre(feria) {
        setError(null);
        setMensaje(null);

        const nombre = nombreEditado.trim();
        if (!nombre) {
            setError("El nombre de la feria es obligatorio.");
            return;
        }

        setProcesandoId(feria.id);
        try {
            await actualizarFeria(feria.id, nombre, usuario.token);
            setMensaje(`Feria renombrada a "${nombre}".`);
            setEditandoId(null);
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesandoId(null);
        }
    }

    async function cambiarEstado(feria, activo) {
        setError(null);
        setMensaje(null);
        setProcesandoId(feria.id);

        try {
            await cambiarEstadoFeria(feria.id, activo, usuario.token);
            setMensaje(
                activo
                    ? `Feria "${feria.nombreFeria}" reactivada.`
                    : `Feria "${feria.nombreFeria}" desactivada. Sus ediciones ya no se muestran al público.`
            );
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesandoId(null);
        }
    }

    async function confirmarDesactivacion() {
        const feria = aDesactivar;
        await cambiarEstado(feria, false);
        setADesactivar(null);
    }

    const ordenadas = [...ferias].sort(
        (a, b) =>
            Number(b.activo) - Number(a.activo) ||
            a.nombreFeria.localeCompare(b.nombreFeria, "es")
    );

    return (
        <>
            <Tarjeta
                className="mb-6"
                titulo="Ferias"
                descripcion="Una feria es el evento general. Sus fechas y su lugar se definen en cada edición."
                acciones={
                    <Boton
                        tamano="sm"
                        variante={mostrarForm ? "secundario" : "primario"}
                        onClick={() => {
                            setError(null);
                            setMostrarForm((visible) => !visible);
                        }}
                    >
                        {mostrarForm ? "Cancelar" : "+ Crear feria"}
                    </Boton>
                }
            >
                <Alerta tipo="error" className="mb-4">{error}</Alerta>
                <Alerta tipo="exito" className="mb-4">{mensaje}</Alerta>

                {mostrarForm && (
                    <form
                        onSubmit={manejarCrear}
                        className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-green-100 bg-green-50/50 p-4"
                    >
                        <Campo
                            className="min-w-[14rem] flex-1"
                            etiqueta="Nombre de la feria"
                            value={nombreNueva}
                            onChange={(e) => setNombreNueva(e.target.value)}
                            required
                            maxLength={150}
                            autoFocus
                        />
                        <Boton type="submit" cargando={creando}>
                            {creando ? "Creando..." : "Crear feria"}
                        </Boton>
                    </form>
                )}

                {cargando ? (
                    <div className="flex flex-col gap-2">
                        <Esqueleto className="h-14 w-full rounded-xl" />
                        <Esqueleto className="h-14 w-full rounded-xl" />
                    </div>
                ) : ordenadas.length === 0 ? (
                    <EstadoVacio
                        titulo="Aún no hay ferias"
                        descripcion="Crea la primera con el botón de arriba."
                    />
                ) : (
                    <div className="flex flex-col gap-2">
                        {ordenadas.map((feria) => {
                            const deLaFeria = ediciones.filter((e) => e.idFeria === feria.id);
                            const activas = deLaFeria.filter((e) => e.activo).length;
                            const ocupado = procesandoId !== null;

                            return (
                                <div
                                    key={feria.id}
                                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                                        feria.activo ? "border-gray-100 bg-white" : "border-red-100 bg-red-50/40"
                                    }`}
                                >
                                    {editandoId === feria.id ? (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                guardarNombre(feria);
                                            }}
                                            className="flex flex-1 flex-wrap items-center gap-2"
                                        >
                                            <input
                                                type="text"
                                                value={nombreEditado}
                                                onChange={(e) => setNombreEditado(e.target.value)}
                                                required
                                                maxLength={150}
                                                autoFocus
                                                aria-label="Nuevo nombre de la feria"
                                                className="min-w-[12rem] flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                            <Boton type="submit" tamano="sm" cargando={procesandoId === feria.id}>
                                                Guardar
                                            </Boton>
                                            <Boton
                                                variante="secundario"
                                                tamano="sm"
                                                onClick={() => setEditandoId(null)}
                                            >
                                                Cancelar
                                            </Boton>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium text-gray-900">{feria.nombreFeria}</p>
                                                    {!feria.activo && <Insignia tono="rojo">Inactiva</Insignia>}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {deLaFeria.length === 0
                                                        ? "Sin ediciones"
                                                        : `${activas} ${activas === 1 ? "edición activa" : "ediciones activas"}`}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Boton
                                                    variante="secundario"
                                                    tamano="sm"
                                                    onClick={() => iniciarEdicion(feria)}
                                                    disabled={ocupado}
                                                    aria-label={`Editar el nombre de ${feria.nombreFeria}`}
                                                >
                                                    Editar
                                                </Boton>
                                                {feria.activo ? (
                                                    <Boton
                                                        variante="peligroSuave"
                                                        tamano="sm"
                                                        onClick={() => setADesactivar(feria)}
                                                        disabled={ocupado}
                                                    >
                                                        Desactivar
                                                    </Boton>
                                                ) : (
                                                    <Boton
                                                        tamano="sm"
                                                        onClick={() => cambiarEstado(feria, true)}
                                                        cargando={procesandoId === feria.id}
                                                        disabled={ocupado}
                                                    >
                                                        Reactivar
                                                    </Boton>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Tarjeta>

            <ConfirmarDialogo
                abierto={Boolean(aDesactivar)}
                titulo="¿Desactivar esta feria?"
                mensaje={
                    aDesactivar
                        ? `"${aDesactivar.nombreFeria}" y sus ediciones dejarán de mostrarse al público. Podrás reactivarla cuando quieras.`
                        : ""
                }
                textoConfirmar="Desactivar"
                peligro
                cargando={procesandoId !== null && aDesactivar?.id === procesandoId}
                onConfirmar={confirmarDesactivacion}
                onCancelar={() => setADesactivar(null)}
            />
        </>
    );
}

export default GestionFerias;