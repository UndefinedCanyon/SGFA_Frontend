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