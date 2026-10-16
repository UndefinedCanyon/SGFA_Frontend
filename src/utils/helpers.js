export function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

export function describirEdicion(idEdicion, ediciones, ferias, lugares) {
    const edicion = ediciones.find((e) => e.id === idEdicion);
    if (!edicion) return `Edición #${idEdicion}`;

    const feria = ferias.find((f) => f.id === edicion.idFeria);
    const lugar = lugares.find((l) => l.id === edicion.idLugar);

    const nombreFeria = feria ? feria.nombreFeria : `Feria #${edicion.idFeria}`;
    const nombreLugar = lugar ? lugar.nombre : `Lugar #${edicion.idLugar}`;

    return `${nombreFeria} · ${formatearFecha(edicion.fechaInicio)} al ${formatearFecha(edicion.fechaFin)} · ${nombreLugar}`;
}

export function destinoPorRol(rol) {
    return rol === "ADMINISTRADOR" ? "/admin" : "/mi-panel";
}

export function hoyISO() {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function estadoEdicion(edicion) {
    const hoy = hoyISO();
    if (edicion.fechaFin < hoy) return "FINALIZADA";
    if (edicion.fechaInicio > hoy) return "PROXIMA";
    return "EN_CURSO";
}

export function normalizarTexto(texto) {
    return (texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function formatearFechaCorta(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatearPrecio(valor) {
    return Number(valor).toLocaleString("es-CO");
}