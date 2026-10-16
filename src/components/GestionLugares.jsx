import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { crearLugar } from "../services/api";
import { Alerta, Boton, Campo, EstadoVacio, Esqueleto, Tarjeta } from "./ui";

function GestionLugares({ lugares, cargando, onCambio }) {
    const { usuario } = useAuth();

    const [formulario, setFormulario] = useState({ nombre: "", direccion: "" });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);

        const nombre = formulario.nombre.trim();
        const direccion = formulario.direccion.trim();
        if (!nombre || !direccion) {
            setError("El nombre y la dirección son obligatorios.");
            return;
        }

        setGuardando(true);
        try {
            const creado = await crearLugar(nombre, direccion, usuario.token);
            setMensaje(`Lugar "${creado.nombre}" creado. Ya puedes usarlo en una edición.`);
            setFormulario({ nombre: "", direccion: "" });
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
            descripcion="Sitios donde se realizan las ediciones. Se eligen al crear una edición."
        >
            <form onSubmit={manejarEnvio} className="mb-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
                <Boton type="submit" cargando={guardando}>
                    {guardando ? "Guardando..." : "Agregar lugar"}
                </Boton>
            </form>

            <Alerta tipo="error" className="mb-4">{error}</Alerta>
            <Alerta tipo="exito" className="mb-4">{mensaje}</Alerta>

            {cargando ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Esqueleto className="h-16 w-full rounded-xl" />
                    <Esqueleto className="h-16 w-full rounded-xl" />
                </div>
            ) : lugares.length === 0 ? (
                <EstadoVacio
                    titulo="Aún no hay lugares"
                    descripcion="Agrega el primero con el formulario de arriba."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {lugares.map((lugar) => (
                        <div key={lugar.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                            <p className="font-medium text-gray-900">{lugar.nombre}</p>
                            <p className="text-sm text-gray-500">{lugar.direccion}</p>
                        </div>
                    ))}
                </div>
            )}
        </Tarjeta>
    );
}

export default GestionLugares;