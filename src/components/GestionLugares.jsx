import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { crearLugar, actualizarLugar } from "../services/api";
import { tieneUbicacion } from "../utils/mapa";
import { Alerta, Boton, Campo, EstadoVacio, Esqueleto, Insignia, Tarjeta } from "./ui";
import SelectorUbicacion from "./SelectorUbicacion";

const FORMULARIO_VACIO = { nombre: "", direccion: "", latitud: "", longitud: "" };

function leerNumero(texto) {
    if (texto === "") return null;
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
}

function GestionLugares({ lugares, cargando, onCambio }) {
    const { usuario } = useAuth();

    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [editandoId, setEditandoId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const formularioRef = useRef(null);

    const latitud = leerNumero(formulario.latitud);
    const longitud = leerNumero(formulario.longitud);
    const ubicacion = latitud !== null && longitud !== null ? { latitud, longitud } : null;

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setMensaje(null);
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    function alElegirPunto(punto) {
        setMensaje(null);
        setFormulario((anterior) => ({
            ...anterior,
            latitud: String(punto.latitud),
            longitud: String(punto.longitud),
        }));
    }

    function quitarUbicacion() {
        setFormulario((anterior) => ({ ...anterior, latitud: "", longitud: "" }));
    }

    function reiniciar() {
        setEditandoId(null);
        setFormulario(FORMULARIO_VACIO);
    }

    function iniciarEdicion(lugar) {
        setError(null);
        setMensaje(null);
        setEditandoId(lugar.id);
        setFormulario({
            nombre: lugar.nombre,
            direccion: lugar.direccion,
            latitud: lugar.latitud == null ? "" : String(lugar.latitud),
            longitud: lugar.longitud == null ? "" : String(lugar.longitud),
        });
        formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);

        const nombre = formulario.nombre.trim();
        const direccion = formulario.direccion.trim();
        const hayLatitud = formulario.latitud !== "";
        const hayLongitud = formulario.longitud !== "";

        if (hayLatitud !== hayLongitud || (hayLatitud && ubicacion === null)) {
            setError("Indica la latitud y la longitud, o deja ambas vacías.");
            return;
        }

        if (ubicacion && (Math.abs(ubicacion.latitud) > 90 || Math.abs(ubicacion.longitud) > 180)) {
            setError("La latitud debe estar entre -90 y 90, y la longitud entre -180 y 180.");
            return;
        }

        const datos = {
            nombre,
            direccion,
            latitud: ubicacion ? ubicacion.latitud : null,
            longitud: ubicacion ? ubicacion.longitud : null,
        };

        setGuardando(true);
        try {
            if (editandoId) {
                await actualizarLugar(editandoId, datos, usuario.token);
                setMensaje(`Lugar "${nombre}" actualizado.`);
            } else {
                await crearLugar(datos, usuario.token);
                setMensaje(`Lugar "${nombre}" creado. Ya puedes usarlo en una edición.`);
            }
            reiniciar();
            await onCambio();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Tarjeta
            titulo="Lugares"
            descripcion="Sitios donde se realizan las ediciones. Si les marcas la ubicación, el público verá el mapa."
        >
            <div ref={formularioRef} className="mb-6 rounded-xl border border-green-100 bg-green-50/50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-800">
                    {editandoId ? "Editar lugar" : "Agregar lugar"}
                </h4>

                <form onSubmit={manejarEnvio} className="grid gap-4 sm:grid-cols-2">
                    <Campo
                        etiqueta="Nombre"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        required
                        maxLength={150}
                    />
                    <Campo
                        etiqueta="Dirección"
                        name="direccion"
                        value={formulario.direccion}
                        onChange={manejarCambio}
                        required
                        maxLength={255}
                    />

                    <div className="sm:col-span-2">
                        <p className="mb-1 text-sm font-medium text-gray-700">
                            Ubicación en el mapa <span className="font-normal text-gray-500">(opcional)</span>
                        </p>
                        <SelectorUbicacion
                            key={editandoId ?? "nuevo"}
                            valor={ubicacion}
                            onCambio={alElegirPunto}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Haz clic en el mapa para marcar el punto exacto, o escribe las coordenadas.
                        </p>
                    </div>

                    <Campo
                        etiqueta="Latitud"
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        name="latitud"
                        value={formulario.latitud}
                        onChange={manejarCambio}
                    />
                    <Campo
                        etiqueta="Longitud"
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        name="longitud"
                        value={formulario.longitud}
                        onChange={manejarCambio}
                    />

                    <Alerta tipo="error" className="sm:col-span-2">{error}</Alerta>

                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <Boton type="submit" cargando={guardando}>
                            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar lugar"}
                        </Boton>
                        {ubicacion && (
                            <Boton variante="secundario" onClick={quitarUbicacion}>
                                Quitar ubicación
                            </Boton>
                        )}
                        {editandoId && (
                            <Boton variante="secundario" onClick={reiniciar}>
                                Cancelar
                            </Boton>
                        )}
                    </div>
                </form>
            </div>

            <Alerta tipo="exito" className="mb-4">{mensaje}</Alerta>

            {cargando ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Esqueleto className="h-20 w-full rounded-xl" />
                    <Esqueleto className="h-20 w-full rounded-xl" />
                </div>
            ) : lugares.length === 0 ? (
                <EstadoVacio
                    titulo="Aún no hay lugares"
                    descripcion="Agrega el primero con el formulario de arriba."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {lugares.map((lugar) => (
                        <div
                            key={lugar.id}
                            className={`flex flex-col justify-between gap-3 rounded-xl border bg-white px-4 py-3 ${
                                editandoId === lugar.id ? "border-green-500 ring-2 ring-green-100" : "border-gray-100"
                            }`}
                        >
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-gray-900">{lugar.nombre}</p>
                                    {tieneUbicacion(lugar) ? (
                                        <Insignia tono="verde">Con mapa</Insignia>
                                    ) : (
                                        <Insignia tono="gris">Sin ubicación</Insignia>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{lugar.direccion}</p>
                            </div>
                            <div>
                                <Boton
                                    variante="secundario"
                                    tamano="sm"
                                    onClick={() => iniciarEdicion(lugar)}
                                    aria-label={`Editar ${lugar.nombre}`}
                                >
                                    Editar
                                </Boton>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Tarjeta>
    );
}

export default GestionLugares;