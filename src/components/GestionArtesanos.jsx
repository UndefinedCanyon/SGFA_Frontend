import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { cambiarEstadoArtesano } from "../services/api";
import { normalizarTexto } from "../utils/helpers";
import {
    Alerta, Boton, Campo, ConfirmarDialogo, EstadoVacio, Esqueleto, Insignia, Tarjeta,
} from "./ui";
import RegistrarArtesanoAdmin from "./RegistrarArtesanoAdmin";

const OPCIONES = [
    { valor: "TODOS", texto: "Todos" },
    { valor: "ACTIVOS", texto: "Activos" },
    { valor: "INACTIVOS", texto: "Inactivos" },
];

function GestionArtesanos({ artesanos, cargando, onCambio }) {
    const { usuario } = useAuth();

    const [mostrarForm, setMostrarForm] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("TODOS");
    const [cambiandoId, setCambiandoId] = useState(null);
    const [aDesactivar, setADesactivar] = useState(null);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    const lista = useMemo(() => {
        const termino = normalizarTexto(busqueda.trim());

        return artesanos
            .filter((a) => {
                if (filtro === "ACTIVOS" && !a.activo) return false;
                if (filtro === "INACTIVOS" && a.activo) return false;
                if (!termino) return true;

                const texto = normalizarTexto(
                    `${a.nombre} ${a.nombreEmprendimiento} ${a.correoElectronico} ${a.cc}`
                );
                return texto.includes(termino);
            })
            .sort(
                (a, b) =>
                    Number(b.activo) - Number(a.activo) ||
                    a.nombreEmprendimiento.localeCompare(b.nombreEmprendimiento, "es")
            );
    }, [artesanos, busqueda, filtro]);

    async function cambiarEstado(artesano, activo) {
        setError(null);
        setMensaje(null);
        setCambiandoId(artesano.id);

        try {
            await cambiarEstadoArtesano(artesano.id, activo, usuario.token);
            setMensaje(
                activo
                    ? `"${artesano.nombreEmprendimiento}" fue reactivado.`
                    : `"${artesano.nombreEmprendimiento}" fue desactivado. Ya no puede iniciar sesión ni aparece en las ferias.`
            );
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setCambiandoId(null);
        }
    }

    async function confirmarDesactivacion() {
        const artesano = aDesactivar;
        await cambiarEstado(artesano, false);
        setADesactivar(null);
    }

    return (
        <>
            <Tarjeta
                titulo="Artesanos"
                descripcion="Registra artesanos y controla quién puede iniciar sesión y participar. Desactivar conserva su historial."
                acciones={
                    <Boton
                        tamano="sm"
                        variante={mostrarForm ? "secundario" : "primario"}
                        onClick={() => setMostrarForm((visible) => !visible)}
                    >
                        {mostrarForm ? "Cerrar formulario" : "+ Registrar artesano"}
                    </Boton>
                }
            >
                {mostrarForm && (
                    <RegistrarArtesanoAdmin
                        onCreado={onCambio}
                        onCerrar={() => setMostrarForm(false)}
                    />
                )}

                <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_12rem]">
                    <Campo
                        etiqueta="Buscar"
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Nombre, emprendimiento, correo o cédula"
                    />
                    <Campo
                        etiqueta="Estado"
                        as="select"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    >
                        {OPCIONES.map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
                        ))}
                    </Campo>
                </div>

                <Alerta tipo="error" className="mb-4">{error}</Alerta>
                <Alerta tipo="exito" className="mb-4">{mensaje}</Alerta>

                {!cargando && (
                    <p className="mb-3 text-sm font-semibold text-gray-800" aria-live="polite">
                        {lista.length} {lista.length === 1 ? "artesano" : "artesanos"}
                    </p>
                )}

                {cargando ? (
                    <div className="flex flex-col gap-2">
                        <Esqueleto className="h-16 w-full rounded-xl" />
                        <Esqueleto className="h-16 w-full rounded-xl" />
                    </div>
                ) : lista.length === 0 ? (
                    <EstadoVacio
                        titulo={artesanos.length === 0 ? "Aún no hay artesanos" : "No encontramos artesanos"}
                        descripcion={
                            artesanos.length === 0
                                ? "Registra el primero con el botón de arriba."
                                : "Prueba con otra búsqueda o cambia el filtro."
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-2">
                        {lista.map((artesano) => (
                            <div
                                key={artesano.id}
                                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                                    artesano.activo ? "border-gray-100 bg-white" : "border-red-100 bg-red-50/40"
                                }`}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700"
                                        aria-hidden="true"
                                    >
                                        {artesano.nombreEmprendimiento.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate font-medium text-gray-900">
                                                {artesano.nombreEmprendimiento}
                                            </p>
                                            {!artesano.activo && <Insignia tono="rojo">Inactivo</Insignia>}
                                        </div>
                                        <p className="truncate text-sm text-gray-600">{artesano.nombre}</p>
                                        <p className="truncate text-xs text-gray-500">
                                            {artesano.correoElectronico}
                                            {artesano.telefono ? ` · ${artesano.telefono}` : ""}
                                        </p>
                                    </div>
                                </div>

                                {artesano.activo ? (
                                    <Boton
                                        variante="peligroSuave"
                                        tamano="sm"
                                        onClick={() => setADesactivar(artesano)}
                                        disabled={cambiandoId !== null}
                                    >
                                        Desactivar
                                    </Boton>
                                ) : (
                                    <Boton
                                        tamano="sm"
                                        onClick={() => cambiarEstado(artesano, true)}
                                        cargando={cambiandoId === artesano.id}
                                        disabled={cambiandoId !== null}
                                    >
                                        Reactivar
                                    </Boton>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Tarjeta>

            <ConfirmarDialogo
                abierto={Boolean(aDesactivar)}
                titulo="¿Desactivar este artesano?"
                mensaje={
                    aDesactivar
                        ? `"${aDesactivar.nombreEmprendimiento}" no podrá iniciar sesión y dejará de aparecer en las ferias. Sus datos, productos y solicitudes se conservan, y podrás reactivarlo cuando quieras.`
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

export default GestionArtesanos;