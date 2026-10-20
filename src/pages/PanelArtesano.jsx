import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    consultarMisProductos, crearProducto, actualizarProducto, eliminarProducto,
    consultarMisSolicitudes, consultarFerias, consultarEdicionesFeria, consultarLugares,
    subirImagenProducto, quitarImagenProducto,
} from "../services/api";
import { formatearFechaCorta, formatearPrecio } from "../utils/helpers";
import { prepararImagen } from "../utils/imagenes";
import {
    Alerta, Boton, Campo, ConfirmarDialogo, EstadoVacio, Esqueleto,
    Insignia, Pestanas, PanelPestana, Tarjeta,
} from "../components/ui";
import MiPerfil from "../components/MiPerfil";
import SelectorImagen from "../components/SelectorImagen";

const FORMULARIO_VACIO = { nombre: "", precio: "", cantidad: "" };

const ESTADOS_SOLICITUD = {
    PENDIENTE: { texto: "Pendiente", tono: "ambar", ayuda: "En revisión por el administrador." },
    APROBADA: { texto: "Aprobada", tono: "verde", ayuda: "Participas en esta edición." },
    RECHAZADA: { texto: "Rechazada", tono: "rojo", ayuda: "El administrador no aprobó esta solicitud." },
};

const ORDEN_SOLICITUD = { PENDIENTE: 0, APROBADA: 1, RECHAZADA: 2 };

function Estadistica({ etiqueta, valor, cargando }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{etiqueta}</p>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
                {cargando ? <Esqueleto className="h-8 w-10" /> : valor}
            </div>
        </div>
    );
}

function PanelArtesano() {
    const { usuario } = useAuth();

    const [pestana, setPestana] = useState("productos");

    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [errorProductos, setErrorProductos] = useState(null);
    const [mensajeProductos, setMensajeProductos] = useState(null);
    const [errorFoto, setErrorFoto] = useState(null);

    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [archivoFoto, setArchivoFoto] = useState(null);
    const [claveFoto, setClaveFoto] = useState(0);
    const [editandoId, setEditandoId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const formularioRef = useRef(null);

    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const [solicitudes, setSolicitudes] = useState([]);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
    const [errorSolicitudes, setErrorSolicitudes] = useState(null);

    const [ferias, setFerias] = useState([]);
    const [ediciones, setEdiciones] = useState([]);
    const [lugares, setLugares] = useState([]);

    async function cargarProductos() {
        try {
            setProductos(await consultarMisProductos(usuario.token));
        } catch (err) {
            setErrorProductos(err.message);
        } finally {
            setCargandoProductos(false);
        }
    }

    async function cargarSolicitudes() {
        try {
            setSolicitudes(await consultarMisSolicitudes(usuario.token));
        } catch (err) {
            setErrorSolicitudes(err.message);
        } finally {
            setCargandoSolicitudes(false);
        }
    }

    async function cargarReferencias() {
        // Si falla, las solicitudes se muestran igual con el texto de respaldo "Edición #N".
        try {
            const [datosFerias, datosEdiciones, datosLugares] = await Promise.all([
                consultarFerias(),
                consultarEdicionesFeria(),
                consultarLugares(),
            ]);
            setFerias(datosFerias);
            setEdiciones(datosEdiciones);
            setLugares(datosLugares);
        } catch {
            /* sin referencias: se usan los textos de respaldo */
        }
    }

    useEffect(() => {
        cargarProductos();
        cargarSolicitudes();
        cargarReferencias();
    }, []);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    function reiniciarFormulario() {
        setEditandoId(null);
        setFormulario(FORMULARIO_VACIO);
        setArchivoFoto(null);
        setClaveFoto((clave) => clave + 1);
    }

    function iniciarEdicion(producto) {
        setMensajeProductos(null);
        setErrorProductos(null);
        setEditandoId(producto.id);
        setFormulario({
            nombre: producto.nombre,
            precio: String(producto.precio),
            cantidad: String(producto.cantidad),
        });
        formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        formularioRef.current?.querySelector("input")?.focus({ preventScroll: true });
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setErrorProductos(null);
        setMensajeProductos(null);
        setGuardando(true);

        const datos = {
            nombre: formulario.nombre.trim(),
            precio: Number(formulario.precio),
            cantidad: Number(formulario.cantidad),
        };

        try {
            if (editandoId) {
                await actualizarProducto(editandoId, datos, usuario.token);
                setMensajeProductos(`Producto "${datos.nombre}" actualizado.`);
            } else {
                const creado = await crearProducto(datos, usuario.token);
                setMensajeProductos(`Producto "${datos.nombre}" agregado a tu catálogo.`);

                if (archivoFoto) {
                    try {
                        const preparada = await prepararImagen(archivoFoto);
                        await subirImagenProducto(creado.id, preparada, usuario.token);
                    } catch (err) {
                        setMensajeProductos(null);
                        setErrorProductos(
                            `El producto se agregó, pero no se pudo subir la foto: ${err.message} Puedes subirla desde su tarjeta.`
                        );
                    }
                }
            }
            reiniciarFormulario();
            await cargarProductos();
        } catch (err) {
            setErrorProductos(err.message);
        } finally {
            setGuardando(false);
        }
    }

    async function confirmarEliminacion() {
        const producto = productoAEliminar;
        setErrorProductos(null);
        setMensajeProductos(null);
        setEliminando(true);

        try {
            await eliminarProducto(producto.id, usuario.token);
            if (editandoId === producto.id) reiniciarFormulario();
            setMensajeProductos(`Producto "${producto.nombre}" eliminado.`);
            await cargarProductos();
        } catch (err) {
            setErrorProductos(err.message);
        } finally {
            setEliminando(false);
            setProductoAEliminar(null);
        }
    }

    async function subirFotoProducto(idProducto, archivo) {
        await subirImagenProducto(idProducto, archivo, usuario.token);
        await cargarProductos();
    }

    async function quitarFotoProducto(idProducto) {
        await quitarImagenProducto(idProducto, usuario.token);
        await cargarProductos();
    }

    function detalleEdicion(idEdicion) {
        const edicion = ediciones.find((e) => e.id === idEdicion);
        if (!edicion) {
            return {
                titulo: `Edición #${idEdicion}`,
                detalle: "Esta edición ya no está publicada.",
            };
        }

        const feria = ferias.find((f) => f.id === edicion.idFeria);
        const lugar = lugares.find((l) => l.id === edicion.idLugar);

        return {
            titulo: feria ? feria.nombreFeria : `Feria #${edicion.idFeria}`,
            detalle: `${formatearFechaCorta(edicion.fechaInicio)} — ${formatearFechaCorta(edicion.fechaFin)} · ${
                lugar ? lugar.nombre : `Lugar #${edicion.idLugar}`
            }`,
        };
    }

    const solicitudesOrdenadas = [...solicitudes].sort(
        (a, b) =>
            ORDEN_SOLICITUD[a.estado] - ORDEN_SOLICITUD[b.estado] ||
            b.fechaInscripcion.localeCompare(a.fechaInscripcion)
    );
    const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE").length;
    const aprobadas = solicitudes.filter((s) => s.estado === "APROBADA").length;

    const pestanas = [
        {
            id: "productos",
            etiqueta: "Mis productos",
            contador: cargandoProductos ? undefined : productos.length,
        },
        {
            id: "solicitudes",
            etiqueta: "Solicitudes",
            contador: pendientes > 0 ? pendientes : undefined,
        },
        { id: "perfil", etiqueta: "Mi perfil" },
    ];

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Mi panel</h2>
                <p className="text-gray-500 mt-1">
                    Hola, {usuario.nombre}. Administra tu catálogo y sigue tus solicitudes de participación.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
                <Estadistica etiqueta="Productos" valor={productos.length} cargando={cargandoProductos} />
                <Estadistica etiqueta="Pendientes" valor={pendientes} cargando={cargandoSolicitudes} />
                <Estadistica etiqueta="Aprobadas" valor={aprobadas} cargando={cargandoSolicitudes} />
            </div>

            <Pestanas
                idBase="panel-artesano"
                pestanas={pestanas}
                activa={pestana}
                onCambiar={setPestana}
            />

            <div className="mt-6">
                <PanelPestana idBase="panel-artesano" id="productos" activa={pestana}>
                    <div ref={formularioRef} className="mb-8">
                        <Tarjeta
                            titulo={editandoId ? "Editar producto" : "Agregar producto"}
                            descripcion={
                                editandoId
                                    ? "Modifica los datos y guarda los cambios. La foto se cambia desde la tarjeta del producto."
                                    : "Los productos que registres se muestran al público cuando tu participación sea aprobada."
                            }
                        >
                            <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                                <Campo
                                    className="sm:col-span-6"
                                    etiqueta="Nombre del producto"
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={manejarCambio}
                                    required
                                    maxLength={150}
                                />
                                <Campo
                                    className="sm:col-span-3"
                                    etiqueta="Precio (COP)"
                                    type="number"
                                    name="precio"
                                    value={formulario.precio}
                                    onChange={manejarCambio}
                                    required
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                />
                                <Campo
                                    className="sm:col-span-3"
                                    etiqueta="Cantidad disponible"
                                    type="number"
                                    name="cantidad"
                                    value={formulario.cantidad}
                                    onChange={manejarCambio}
                                    required
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                />

                                {!editandoId && (
                                    <Campo
                                        key={claveFoto}
                                        className="sm:col-span-6"
                                        etiqueta="Foto (opcional)"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => setArchivoFoto(e.target.files?.[0] ?? null)}
                                        ayuda="JPG, PNG o WebP. Si es muy grande, se reduce automáticamente."
                                    />
                                )}

                                <div className="sm:col-span-6 flex gap-2">
                                    <Boton type="submit" cargando={guardando}>
                                        {guardando ? "Guardando..." : editandoId ? "Actualizar" : "Agregar"}
                                    </Boton>
                                    {editandoId && (
                                        <Boton variante="secundario" onClick={reiniciarFormulario}>
                                            Cancelar
                                        </Boton>
                                    )}
                                </div>
                            </form>

                            <Alerta tipo="error" className="mt-4">{errorProductos}</Alerta>
                            <Alerta tipo="exito" className="mt-4">{mensajeProductos}</Alerta>
                        </Tarjeta>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Mi catálogo</h3>
                    <Alerta tipo="error" className="mb-3">{errorFoto}</Alerta>

                    {cargandoProductos ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Esqueleto className="h-32 w-full rounded-2xl" />
                            <Esqueleto className="h-32 w-full rounded-2xl" />
                        </div>
                    ) : productos.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white">
                            <EstadoVacio
                                titulo="Aún no has registrado productos"
                                descripcion="Usa el formulario de arriba para agregar el primero. Así el público sabrá qué ofreces en las ferias."
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {productos.map((producto) => (
                                <article
                                    key={producto.id}
                                    className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-shadow ${
                                        editandoId === producto.id
                                            ? "border-green-500 ring-2 ring-green-100"
                                            : "border-gray-200"
                                    }`}
                                >
                                    <SelectorImagen
                                        imagen={producto.imagen}
                                        nombre={producto.nombre}
                                        onSubir={(archivo) => subirFotoProducto(producto.id, archivo)}
                                        onQuitar={() => quitarFotoProducto(producto.id)}
                                        onError={setErrorFoto}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-gray-900 truncate">{producto.nombre}</h4>
                                            {producto.cantidad === 0 && <Insignia tono="rojo">Agotado</Insignia>}
                                        </div>
                                        <p className="text-lg font-semibold text-green-700">
                                            ${formatearPrecio(producto.precio)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {producto.cantidad}{" "}
                                            {producto.cantidad === 1 ? "unidad disponible" : "unidades disponibles"}
                                        </p>

                                        <div className="mt-3 flex gap-2">
                                            <Boton
                                                variante="secundario"
                                                tamano="sm"
                                                onClick={() => iniciarEdicion(producto)}
                                                aria-label={`Editar ${producto.nombre}`}
                                            >
                                                Editar
                                            </Boton>
                                            <Boton
                                                variante="peligroSuave"
                                                tamano="sm"
                                                onClick={() => setProductoAEliminar(producto)}
                                                aria-label={`Eliminar ${producto.nombre}`}
                                            >
                                                Eliminar
                                            </Boton>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </PanelPestana>

                <PanelPestana idBase="panel-artesano" id="solicitudes" activa={pestana}>
                    <Tarjeta
                        titulo="Mis solicitudes de participación"
                        descripcion="Las pendientes aparecen primero. El administrador las revisa y las aprueba o las rechaza."
                    >
                        <Alerta tipo="error" className="mb-4">{errorSolicitudes}</Alerta>

                        {cargandoSolicitudes ? (
                            <div className="flex flex-col gap-3">
                                <Esqueleto className="h-20 w-full rounded-xl" />
                                <Esqueleto className="h-20 w-full rounded-xl" />
                            </div>
                        ) : solicitudesOrdenadas.length === 0 ? (
                            <EstadoVacio
                                titulo="Aún no has solicitado participar en ninguna feria"
                                descripcion="Explora las ediciones disponibles y envía tu primera solicitud."
                                accion={
                                    <Link
                                        to="/ferias"
                                        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                    >
                                        Explorar ferias
                                    </Link>
                                }
                            />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {solicitudesOrdenadas.map((solicitud) => {
                                    const estado = ESTADOS_SOLICITUD[solicitud.estado];
                                    const { titulo, detalle } = detalleEdicion(solicitud.idEdicionFeria);

                                    return (
                                        <article
                                            key={solicitud.id}
                                            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4"
                                        >
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-gray-900">{titulo}</h4>
                                                <p className="text-sm text-gray-500">{detalle}</p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Solicitada el {formatearFechaCorta(solicitud.fechaInscripcion)}
                                                </p>
                                            </div>
                                            <div className="sm:text-right">
                                                <Insignia tono={estado.tono}>{estado.texto}</Insignia>
                                                <p className="mt-1 max-w-[14rem] text-xs text-gray-500">{estado.ayuda}</p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </Tarjeta>
                </PanelPestana>

                <PanelPestana idBase="panel-artesano" id="perfil" activa={pestana}>
                    <MiPerfil />
                </PanelPestana>
            </div>

            <ConfirmarDialogo
                abierto={Boolean(productoAEliminar)}
                titulo="¿Eliminar este producto?"
                mensaje={
                    productoAEliminar
                        ? `Se eliminará "${productoAEliminar.nombre}" de tu catálogo, con su foto. Esta acción no se puede deshacer.`
                        : ""
                }
                textoConfirmar="Eliminar"
                peligro
                cargando={eliminando}
                onConfirmar={confirmarEliminacion}
                onCancelar={() => setProductoAEliminar(null)}
            />
        </div>
    );
}

export default PanelArtesano;