// Fotos reales opcionales. Para usar una, copia el archivo en src/assets/fotos/ con uno de estos
// nombres (jpg, jpeg, png, webp o avif): hero, ferias, acceso, panel, convocatoria.
// Si el archivo no existe, la página usa la ilustración incluida en src/assets/fondos/.
const archivos = import.meta.glob("../assets/fotos/*.{jpg,jpeg,png,webp,avif}", {
    eager: true,
    query: "?url",
    import: "default",
});

export function buscarFoto(mapa, nombre) {
    const patron = new RegExp(`/${nombre}\\.(jpg|jpeg|png|webp|avif)$`, "i");
    const ruta = Object.keys(mapa).find((clave) => patron.test(clave));
    return ruta ? mapa[ruta] : null;
}

export function fotoDe(nombre) {
    return buscarFoto(archivos, nombre);
}
