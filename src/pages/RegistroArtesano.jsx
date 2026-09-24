import { useState } from "react";
import { registrarArtesano } from "../services/api";

function RegistroArtesano() {
    const [formulario, setFormulario] = useState({
        nombre: "",
        correoElectronico: "",
        contrasena: "",
        cc: "",
        telefono: "",
        nombreEmprendimiento: "",
        descripcionCorta: "",
    });

    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setMensaje(null);
        setError(null);
        setCargando(true);

        try {
            const artesanoCreado = await registrarArtesano(formulario);
            setMensaje(`Artesano "${artesanoCreado.nombreEmprendimiento}" registrado con éxito.`);
            setFormulario({
                nombre: "",
                correoElectronico: "",
                contrasena: "",
                cc: "",
                telefono: "",
                nombreEmprendimiento: "",
                descripcionCorta: "",
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    return (
        <div>
            <h2>Registro de Artesano</h2>

            <form onSubmit={manejarEnvio}>
                <div>
                    <label>Nombre completo</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        required
                    />
                </div>

                <div>
                    <label>Correo electrónico</label>
                    <input
                        type="email"
                        name="correoElectronico"
                        value={formulario.correoElectronico}
                        onChange={manejarCambio}
                        required
                    />
                </div>

                <div>
                    <label>Contraseña</label>
                    <input
                        type="password"
                        name="contrasena"
                        value={formulario.contrasena}
                        onChange={manejarCambio}
                        required
                    />
                </div>

                <div>
                    <label>Cédula</label>
                    <input
                        type="text"
                        name="cc"
                        value={formulario.cc}
                        onChange={manejarCambio}
                        required
                    />
                </div>

                <div>
                    <label>Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        value={formulario.telefono}
                        onChange={manejarCambio}
                    />
                </div>

                <div>
                    <label>Nombre del emprendimiento</label>
                    <input
                        type="text"
                        name="nombreEmprendimiento"
                        value={formulario.nombreEmprendimiento}
                        onChange={manejarCambio}
                        required
                    />
                </div>

                <div>
                    <label>Descripción corta</label>
                    <textarea
                        name="descripcionCorta"
                        value={formulario.descripcionCorta}
                        onChange={manejarCambio}
                    />
                </div>

                <button type="submit" disabled={cargando}>
                    {cargando ? "Registrando..." : "Registrarse"}
                </button>
            </form>

            {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default RegistroArtesano;