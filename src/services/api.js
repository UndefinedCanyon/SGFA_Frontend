const BASE_URL = "http://localhost:8080/api";

async function manejarRespuesta(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error inesperado.");
    }
    return data;
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