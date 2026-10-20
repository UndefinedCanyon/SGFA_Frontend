import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    consultarMiPerfil, actualizarMiPerfil, subirLogoArtesano, quitarLogoArtesano,
} from "../services/api";
import { Alerta, Boton, Campo, Esqueleto, Tarjeta } from "./ui";
import SelectorImagen from "./SelectorImagen";

function aFormulario(datos) {
    return {
        nombre: datos.nombre ?? "",
        telefono: datos.telefono ?? "",
        nombreEmprendimiento: datos.nombreEmprendimiento ?? "",
        descripcionCorta: datos.descripcionCorta ?? "",
    };
}

function MiPerfil() {
    const { usuario, actualizarUsuario } = useAuth();

    const [perfil, setPerfil] = useState(null);
    const [guardado, setGuardado] = useState(null);
    const [formulario, setFormulario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [errorLogo, setErrorLogo] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        async function cargarPerfil() {
            try {
                const datos = await consultarMiPerfil(usuario.token);
                setPerfil(datos);
                setGuardado(aFormulario(datos));
                setFormulario(aFormulario(datos));
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarPerfil();
    }, []);

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
            const actualizado = await actualizarMiPerfil(formulario, usuario.token);
            setPerfil(actualizado);
            setGuardado(aFormulario(actualizado));
            setFormulario(aFormulario(actualizado));
            actualizarUsuario({ nombre: actualizado.nombre });
            setMensaje("Perfil actualizado correctamente.");
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    }

    async function subirLogo(archivo) {
        setPerfil(await subirLogoArtesano(archivo, usuario.token));
    }

    async function quitarLogo() {
        setPerfil(await quitarLogoArtesano(usuario.token));
    }

    const hayCambios =
        formulario !== null && JSON.stringify(formulario) !== JSON.stringify(guardado);

    return (
        <Tarjeta
            titulo="Mi perfil"
            descripcion="El nombre del emprendimiento, la descripción y el logo se muestran al público en las ferias en las que participas."
        >
            {cargando && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Esqueleto className="h-14 w-full" />
                    <Esqueleto className="h-14 w-full" />
                    <Esqueleto className="h-14 w-full" />
                    <Esqueleto className="h-14 w-full" />
                </div>
            )}

            <Alerta tipo="error" className="mb-4">{error}</Alerta>

            {perfil && formulario && (
                <form onSubmit={manejarEnvio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <SelectorImagen
                            imagen={perfil.logo}
                            nombre={perfil.nombreEmprendimiento}
                            redonda
                            onSubir={subirLogo}
                            onQuitar={quitarLogo}
                            onError={setErrorLogo}
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">Logo de tu emprendimiento</p>
                            <p className="text-xs text-gray-500">
                                JPG, PNG o WebP. Si la imagen es muy grande, se reduce automáticamente.
                                El logo se guarda al subirlo, sin pulsar "Guardar cambios".
                            </p>
                            <Alerta tipo="error" className="mt-2">{errorLogo}</Alerta>
                        </div>
                    </div>

                    <Campo
                        etiqueta="Correo electrónico"
                        value={perfil.correoElectronico}
                        disabled
                        readOnly
                        ayuda="No se puede modificar."
                    />
                    <Campo
                        etiqueta="Cédula"
                        value={perfil.cc}
                        disabled
                        readOnly
                        ayuda="No se puede modificar."
                    />

                    <Campo
                        etiqueta="Nombre completo"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        required
                        maxLength={100}
                        autoComplete="name"
                    />
                    <Campo
                        etiqueta="Teléfono"
                        type="tel"
                        name="telefono"
                        value={formulario.telefono}
                        onChange={manejarCambio}
                        maxLength={20}
                        autoComplete="tel"
                    />

                    <Campo
                        className="sm:col-span-2"
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
                        rows={3}
                        maxLength={300}
                        ayuda={`${formulario.descripcionCorta.length}/300 caracteres`}
                    />

                    <Alerta tipo="exito" className="sm:col-span-2">{mensaje}</Alerta>

                    <div className="sm:col-span-2 flex items-center gap-3">
                        <Boton type="submit" cargando={guardando} disabled={!hayCambios}>
                            {guardando ? "Guardando..." : "Guardar cambios"}
                        </Boton>
                        {!hayCambios && !mensaje && (
                            <p className="text-xs text-gray-400">No hay cambios por guardar.</p>
                        )}
                    </div>
                </form>
            )}
        </Tarjeta>
    );
}

export default MiPerfil;