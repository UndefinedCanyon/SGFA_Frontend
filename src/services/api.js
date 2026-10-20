const BASE_URL = import.meta.env.VITE_API_URL;

const MENSAJE_RED = "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const MENSAJE_SERVIDOR = "Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.";
const MENSAJES_ESTADO = {
    400: "Los datos enviados no son válidos.",
    401: "Tu sesión expiró. Inicia sesión de nuevo.",
    403: "No tienes permiso para realizar esta acción.",
    404: "No encontramos lo que buscabas.",
    409: "La acción entra en conflicto con los datos actuales.",
    413: "La imagen es demasiado pesada.",
};

let alExpirarSesion = null;

export function registrarManejadorSesionExpirada(manejador) {
    alExpirarSesion = manejador;
}

async function leerCuerpo(response) {
    const texto = await response.text();
    if (!texto) return null;
    try {
        return JSON.parse(texto);
    } catch {
        return null;
    }
}

async function solicitar(ruta, { metodo = "GET", cuerpo, formulario, token } = {}) {
    const headers = {};
    if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${BASE_URL}${ruta}`, {
            method: metodo,
            headers,
            // Con FormData el navegador agrega solo el Content-Type, con su separador.
            body: formulario ?? (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined),
        });
    } catch {
        throw new Error(MENSAJE_RED);
    }

    const datos = await leerCuerpo(response);

    if (!response.ok) {
        // Un 401 en una petición CON token significa sesión vencida o inválida.
        // Un 401 sin token (el login con credenciales incorrectas) no cuenta.
        if (response.status === 401 && token && alExpirarSesion) {
            alExpirarSesion();
        }

        const error = new Error(
            datos?.error ||
                MENSAJES_ESTADO[response.status] ||
                (response.status >= 500 ? MENSAJE_SERVIDOR : "Ocurrió un error inesperado.")
        );
        error.codigo = datos?.codigo ?? null;
        throw error;
    }

    return datos;
}

// ---------- Autenticación y registro ----------
export function registrarArtesano(datosArtesano) {
    return solicitar("/artesanos", { metodo: "POST", cuerpo: datosArtesano });
}

export function iniciarSesion(correoElectronico, contrasena) {
    return solicitar("/auth/login", {
        metodo: "POST",
        cuerpo: { correoElectronico, contrasena },
    });
}

// ---------- Consultas públicas ----------
export function consultarFerias() {
    return solicitar("/ferias");
}

export function consultarEdicionesFeria(idFeria) {
    return solicitar(idFeria ? `/edicionesferia?idFeria=${idFeria}` : "/edicionesferia");
}

export function consultarLugares() {
    return solicitar("/lugares");
}

export function consultarParticipantes(idEdicion) {
    return solicitar(`/edicionesferia/${idEdicion}/participantes`);
}

export function consultarOcupacion(idEdicion) {
    return solicitar(`/edicionesferia/${idEdicion}/ocupacion`);
}

// ---------- Administrador ----------
export function crearFeria(nombreFeria, idAdmin, token) {
    return solicitar("/ferias", { metodo: "POST", cuerpo: { nombreFeria, idAdmin }, token });
}

export function actualizarFeria(idFeria, nombreFeria, token) {
    return solicitar(`/ferias/${idFeria}`, { metodo: "PUT", cuerpo: { nombreFeria }, token });
}

export function consultarTodasLasFerias(token) {
    return solicitar("/ferias/todas", { token });
}

export function cambiarEstadoFeria(idFeria, activo, token) {
    return solicitar(`/ferias/${idFeria}/estado`, { metodo: "PUT", cuerpo: { activo }, token });
}

export function crearEdicionFeria(datosEdicion, token) {
    return solicitar("/edicionesferia", { metodo: "POST", cuerpo: datosEdicion, token });
}

export function consultarTodasLasEdiciones(token) {
    return solicitar("/edicionesferia/todas", { token });
}

export function cambiarEstadoEdicion(idEdicion, activo, token) {
    return solicitar(`/edicionesferia/${idEdicion}/estado`, {
        metodo: "PUT",
        cuerpo: { activo },
        token,
    });
}

export function configurarCupoEdicion(idEdicion, cupoMaximo, token) {
    return solicitar(`/edicionesferia/${idEdicion}/cupo`, {
        metodo: "PUT",
        cuerpo: { cupoMaximo },
        token,
    });
}

export function crearLugar(datos, token) {
    return solicitar("/lugares", { metodo: "POST", cuerpo: datos, token });
}

export function actualizarLugar(idLugar, datos, token) {
    return solicitar(`/lugares/${idLugar}`, { metodo: "PUT", cuerpo: datos, token });
}

export function consultarTodosLosArtesanos(token) {
    return solicitar("/artesanos", { token });
}

export function cambiarEstadoArtesano(idArtesano, activo, token) {
    return solicitar(`/artesanos/${idArtesano}/estado`, {
        metodo: "PUT",
        cuerpo: { activo },
        token,
    });
}

export function consultarTodasLasSolicitudes(token) {
    return solicitar("/inscripciones", { token });
}

export function aprobarSolicitud(idInscripcion, token) {
    return solicitar(`/inscripciones/${idInscripcion}/aprobar`, { metodo: "PUT", token });
}

export function rechazarSolicitud(idInscripcion, token) {
    return solicitar(`/inscripciones/${idInscripcion}/rechazar`, { metodo: "PUT", token });
}

// ---------- Artesano ----------
export function consultarMiPerfil(token) {
    return solicitar("/artesanos/perfil", { token });
}

export function actualizarMiPerfil(datos, token) {
    return solicitar("/artesanos/perfil", { metodo: "PUT", cuerpo: datos, token });
}

export function consultarMisProductos(token) {
    return solicitar("/productos", { token });
}

export function crearProducto(datosProducto, token) {
    return solicitar("/productos", { metodo: "POST", cuerpo: datosProducto, token });
}

export function actualizarProducto(idProducto, datosProducto, token) {
    return solicitar(`/productos/${idProducto}`, { metodo: "PUT", cuerpo: datosProducto, token });
}

export function eliminarProducto(idProducto, token) {
    return solicitar(`/productos/${idProducto}`, { metodo: "DELETE", token });
}

export function solicitarParticipacion(idEdicionFeria, token) {
    return solicitar("/inscripciones", { metodo: "POST", cuerpo: { idEdicionFeria }, token });
}

export function consultarMisSolicitudes(token) {
    return solicitar("/inscripciones/mias", { token });
}

// ---------- Imágenes ----------
function formularioConArchivo(archivo) {
    const formulario = new FormData();
    formulario.append("archivo", archivo);
    return formulario;
}

export function subirImagenProducto(idProducto, archivo, token) {
    return solicitar(`/productos/${idProducto}/imagen`, {
        metodo: "PUT",
        formulario: formularioConArchivo(archivo),
        token,
    });
}

export function quitarImagenProducto(idProducto, token) {
    return solicitar(`/productos/${idProducto}/imagen`, { metodo: "DELETE", token });
}

export function subirLogoArtesano(archivo, token) {
    return solicitar("/artesanos/perfil/logo", {
        metodo: "PUT",
        formulario: formularioConArchivo(archivo),
        token,
    });
}

export function quitarLogoArtesano(token) {
    return solicitar("/artesanos/perfil/logo", { metodo: "DELETE", token });
}

// ---------- Confirmación de cuenta y recuperación de contraseña ----------
export function verificarCorreo(token) {
    return solicitar("/auth/verificar-correo", { metodo: "POST", cuerpo: { token } });
}

export function reenviarVerificacion(correoElectronico) {
    return solicitar("/auth/reenviar-verificacion", {
        metodo: "POST",
        cuerpo: { correoElectronico },
    });
}

export function solicitarRecuperacion(correoElectronico) {
    return solicitar("/auth/olvide-contrasena", {
        metodo: "POST",
        cuerpo: { correoElectronico },
    });
}

export function restablecerContrasena(token, contrasena) {
    return solicitar("/auth/restablecer-contrasena", {
        metodo: "POST",
        cuerpo: { token, contrasena },
    });
}

export function registrarArtesanoAdmin(datosArtesano, token) {
    return solicitar("/artesanos/admin", { metodo: "POST", cuerpo: datosArtesano, token });
}