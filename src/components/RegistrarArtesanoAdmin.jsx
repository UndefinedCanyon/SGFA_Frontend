import { useState } from "react";
import { registrarArtesano } from "../services/api";
import { Alerta, Boton, Campo } from "./ui";

const FORMULARIO_VACIO = {
    nombre: "",
    correoElectronico: "",
    contrasena: "",
    cc: "",
    telefono: "",
    nombreEmprendimiento: "",
    descripcionCorta: "",
};

function RegistrarArtesanoAdmin({ onCreado, onCerrar }) {
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setMensaje(null);
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);
        setGuardando(true);

        try {
            const creado = await registrarArtesano(formulario);
            setMensaje(
                `Artesano "${creado.nombreEmprendimiento}" registrado. Entrégale su correo y la contraseña inicial para que pueda iniciar sesión.`
            );
            setFormulario(FORMULARIO_VACIO);
            if (onCreado) await onCreado();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form
            onSubmit={manejarEnvio}
            className="mb-5 grid gap-4 rounded-xl border border-green-100 bg-green-50/50 p-4 sm:grid-cols-2"
        >
            <Campo
                etiqueta="Nombre completo"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                required
                maxLength={100}
                autoFocus
            />
            <Campo
                etiqueta="Cédula"
                name="cc"
                value={formulario.cc}
                onChange={manejarCambio}
                required
                maxLength={20}
                inputMode="numeric"
            />

            <Campo
                etiqueta="Correo electrónico"
                type="email"
                name="correoElectronico"
                value={formulario.correoElectronico}
                onChange={manejarCambio}
                required
                maxLength={150}
            />
            <Campo
                etiqueta="Contraseña inicial"
                name="contrasena"
                value={formulario.contrasena}
                onChange={manejarCambio}
                required
                autoComplete="off"
                ayuda="Se muestra para que puedas dársela al artesano."
            />

            <Campo
                etiqueta="Teléfono"
                type="tel"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
                maxLength={20}
            />
            <Campo
                etiqueta="Nombre del emprendimiento"
                name="nombreEmprendimiento"
                value={formulario.nombreEmprendimiento}
                onChange={manejarCambio}
                required
                maxLength={150}
            />

            <Campo
                className="sm:col-span-2"
                etiqueta="Descripción corta"
                as="textarea"
                name="descripcionCorta"
                value={formulario.descripcionCorta}
                onChange={manejarCambio}
                rows={2}
                maxLength={300}
            />

            <Alerta tipo="error" className="sm:col-span-2">{error}</Alerta>
            <Alerta tipo="exito" className="sm:col-span-2">{mensaje}</Alerta>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Boton type="submit" cargando={guardando}>
                    {guardando ? "Registrando..." : "Registrar artesano"}
                </Boton>
                {onCerrar && (
                    <Boton variante="secundario" onClick={onCerrar}>
                        Cerrar
                    </Boton>
                )}
            </div>
        </form>
    );
}

export default RegistrarArtesanoAdmin;