import { expect } from "@playwright/test";

export const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://localhost:8025";

// Datos que crea database/data.sql al levantar la base de datos por primera vez.
export const ADMIN = { correo: "admin@sgfa.com", contrasena: "admin123", nombre: "Admin SGFA" };
export const ARTESANA_SEMILLA = { correo: "maria@correo.com", contrasena: "clave123", nombre: "Maria Gomez" };

export const CONTRASENA_NUEVA = "ClaveE2E-2026";

export function datosArtesanoUnico(prefijo = "e2e") {
    const marca = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return {
        nombre: `Artesano ${prefijo} ${marca}`,
        correo: `${prefijo}.${marca}@prueba.local`,
        contrasena: CONTRASENA_NUEVA,
        cc: marca.slice(-10).padStart(10, "1"),
        telefono: "3001234567",
        emprendimiento: `Taller ${prefijo} ${marca}`,
        descripcion: "Artesanías hechas por una prueba automática.",
    };
}

export async function iniciarSesion(page, correo, contrasena) {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
    await page.getByRole("button", { name: "Ingresar" }).click();
}

export async function cerrarSesion(page) {
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
}

export async function llenarRegistro(page, datos) {
    await page.goto("/registro");
    await page.getByLabel("Nombre completo").fill(datos.nombre);
    await page.getByLabel("Correo electrónico").fill(datos.correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(datos.contrasena);
    await page.getByLabel("Cédula").fill(datos.cc);
    await page.getByLabel("Teléfono").fill(datos.telefono);
    await page.getByLabel("Nombre del emprendimiento").fill(datos.emprendimiento);
    await page.getByLabel("Descripción corta").fill(datos.descripcion);
}

/** Espera en Mailpit el correo enviado a `correo` y devuelve el enlace con token que contiene. */
export async function esperarEnlaceDeCorreo(request, correo) {
    let enlace = null;

    await expect
        .poll(
            async () => {
                const busqueda = await request.get(`${MAILPIT}/api/v1/search`, {
                    params: { query: `to:${correo}` },
                });
                if (!busqueda.ok()) return null;

                const { messages } = await busqueda.json();
                if (!messages?.length) return null;

                const detalle = await request.get(`${MAILPIT}/api/v1/message/${messages[0].ID}`);
                const { Text: texto, HTML: html } = await detalle.json();
                const coincidencia = `${texto ?? ""} ${html ?? ""}`.match(/https?:\/\/[^\s"'<>]+token=[^\s"'<>]+/);
                enlace = coincidencia ? coincidencia[0].replace(/&amp;/g, "&") : null;
                return enlace;
            },
            { message: `No llegó a Mailpit ningún correo con enlace para ${correo}`, timeout: 20_000 }
        )
        .not.toBeNull();

    return enlace;
}

/** Registra un artesano nuevo desde la pantalla, confirma su correo con el enlace recibido y devuelve sus datos. */
export async function registrarArtesanoVerificado(page, request, prefijo = "e2e") {
    const datos = datosArtesanoUnico(prefijo);

    await llenarRegistro(page, datos);
    await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();

    const enlace = await esperarEnlaceDeCorreo(request, datos.correo);
    await page.goto(enlace);
    await expect(page.getByRole("heading", { name: "¡Correo confirmado!" })).toBeVisible();

    return datos;
}
