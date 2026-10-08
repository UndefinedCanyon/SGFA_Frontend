const BASE_URL = import.meta.env.VITE_API_URL;

async function manejarRespuesta(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error inesperado.");
    }
    return data;
}

function headersConToken(token) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function registrarArtesano(datosArtesano) {
    const response = await fetch(`${BASE_URL}/artesanos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosArtesano),
    });
    return manejarRespuesta(response);
}

export async function iniciarSesion(correoElectronico, contrasena) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correoElectronico, contrasena }),
    });
    return manejarRespuesta(response);
}

export async function consultarFerias() {
    const response = await fetch(`${BASE_URL}/ferias`);
    return manejarRespuesta(response);
}

export async function consultarEdicionesFeria(idFeria) {
    const url = idFeria
        ? `${BASE_URL}/edicionesferia?idFeria=${idFeria}`
        : `${BASE_URL}/edicionesferia`;
    const response = await fetch(url);
    return manejarRespuesta(response);
}

export async function crearFeria(nombreFeria, idAdmin, token) {
    const response = await fetch(`${BASE_URL}/ferias`, {
        method: "POST",
        headers: headersConToken(token),
        body: JSON.stringify({ nombreFeria, idAdmin }),
    });
    return manejarRespuesta(response);
}

export async function crearEdicionFeria(datosEdicion, token) {
    const response = await fetch(`${BASE_URL}/edicionesferia`, {
        method: "POST",
        headers: headersConToken(token),
        body: JSON.stringify(datosEdicion),
    });
    return manejarRespuesta(response);
}

export async function crearProducto(datosProducto, token) {
    const response = await fetch(`${BASE_URL}/productos`, {
        method: "POST",
        headers: headersConToken(token),
        body: JSON.stringify(datosProducto),
    });
    return manejarRespuesta(response);
}

export async function consultarMisProductos(token) {
    const response = await fetch(`${BASE_URL}/productos`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return manejarRespuesta(response);
}

export async function actualizarProducto(idProducto, datosProducto, token) {
    const response = await fetch(`${BASE_URL}/productos/${idProducto}`, {
        method: "PUT",
        headers: headersConToken(token),
        body: JSON.stringify(datosProducto),
    });
    return manejarRespuesta(response);
}

export async function eliminarProducto(idProducto, token) {
    const response = await fetch(`${BASE_URL}/productos/${idProducto}`, {
        method: "DELETE",
        headers: headersConToken(token),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo eliminar el producto.");
    }
}

export async function solicitarParticipacion(idEdicionFeria, token) {
    const response = await fetch(`${BASE_URL}/inscripciones`, {
        method: "POST",
        headers: headersConToken(token),
        body: JSON.stringify({ idEdicionFeria }),
    });
    return manejarRespuesta(response);
}

export async function consultarMisSolicitudes(token) {
    const response = await fetch(`${BASE_URL}/inscripciones/mias`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return manejarRespuesta(response);
}

export async function consultarTodasLasSolicitudes(token) {
    const response = await fetch(`${BASE_URL}/inscripciones`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return manejarRespuesta(response);
}

export async function aprobarSolicitud(idInscripcion, token) {
    const response = await fetch(`${BASE_URL}/inscripciones/${idInscripcion}/aprobar`, {
        method: "PUT",
        headers: headersConToken(token),
    });
    return manejarRespuesta(response);
}

export async function rechazarSolicitud(idInscripcion, token) {
    const response = await fetch(`${BASE_URL}/inscripciones/${idInscripcion}/rechazar`, {
        method: "PUT",
        headers: headersConToken(token),
    });
    return manejarRespuesta(response);
}

export async function consultarTodosLosArtesanos(token) {
    const response = await fetch(`${BASE_URL}/artesanos`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return manejarRespuesta(response);
}

export async function consultarTodasLasFerias(token) {
    const response = await fetch(`${BASE_URL}/ferias/todas`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return manejarRespuesta(response);
}

export async function cambiarEstadoArtesano(idArtesano, activo, token) {
    const response = await fetch(`${BASE_URL}/artesanos/${idArtesano}/estado`, {
        method: "PUT",
        headers: headersConToken(token),
        body: JSON.stringify({ activo }),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo cambiar el estado del artesano.");
    }
}

export async function cambiarEstadoFeria(idFeria, activo, token) {
    const response = await fetch(`${BASE_URL}/ferias/${idFeria}/estado`, {
        method: "PUT",
        headers: headersConToken(token),
        body: JSON.stringify({ activo }),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo cambiar el estado de la feria.");
    }
}

export async function consultarLugares() {
    const response = await fetch(`${BASE_URL}/lugares`);
    return manejarRespuesta(response);
}

export async function crearLugar(nombre, direccion, token) {
    const response = await fetch(`${BASE_URL}/lugares`, {
        method: "POST",
        headers: headersConToken(token),
        body: JSON.stringify({ nombre, direccion }),
    });
    return manejarRespuesta(response);
}

export async function consultarTodasLasEdiciones(token) {
    const response = await fetch(`${BASE_URL}/edicionesferia/todas`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return manejarRespuesta(response);
}

export async function cambiarEstadoEdicion(idEdicion, activo, token) {
    const response = await fetch(`${BASE_URL}/edicionesferia/${idEdicion}/estado`, {
        method: "PUT",
        headers: headersConToken(token),
        body: JSON.stringify({ activo }),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo cambiar el estado de la edición.");
    }
}