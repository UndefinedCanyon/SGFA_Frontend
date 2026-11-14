import { expect, test } from "@playwright/test";
import { ADMIN, cerrarSesion, iniciarSesion, registrarArtesanoVerificado } from "./utils";

// Funciona con cualquier asistente: si el backend tiene GEMINI_API_KEY responde Gemini; si no, el modo
// demostración. Para que la prueba no dependa de internet ni de la cuota, levanta el backend con
// ASISTENTE_PROVEEDOR=falso (ver e2e/README).
test.describe("Asistente de IA del administrador", () => {
    test("el administrador analiza las solicitudes pendientes y ve las sugerencias", async ({ page, request }) => {
        // Garantiza que haya al menos una solicitud pendiente: la crea una artesana nueva.
        const artesano = await registrarArtesanoVerificado(page, request, "asistente");
        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await expect(page).toHaveURL(/\/mi-panel$/);
        await page.goto("/ferias");
        await page.getByRole("button", { name: "Solicitar participación" }).first().click();
        await expect(page.getByText(/Solicitud enviada/)).toBeVisible();
        await cerrarSesion(page);

        await iniciarSesion(page, ADMIN.correo, ADMIN.contrasena);
        await expect(page).toHaveURL(/\/admin$/);
        await page.getByRole("tab", { name: /Solicitudes/ }).click();
        const panel = page.getByRole("tabpanel");

        // Sin elegir edición no se puede analizar.
        await expect(panel.getByRole("button", { name: "Analizar con IA" })).toBeDisabled();

        await panel.getByLabel("Edición a analizar").selectOption({ index: 1 });
        await panel.getByRole("button", { name: "Analizar con IA" }).click();

        await expect(panel.getByRole("heading", { name: "Análisis del asistente" })).toBeVisible({ timeout: 45_000 });
        await expect(panel.getByText(/Demostración \(sin IA\)|Generado por Gemini/)).toBeVisible();
        await expect(panel.getByText(/revísala antes de decidir/)).toBeVisible();

        // Cada solicitud pendiente de esa edición muestra su prioridad y su motivo.
        await expect(panel.getByText(/Prioridad (alta|media|baja)/).first()).toBeVisible();
        await expect(panel.getByText("Sugerencia del asistente:").first()).toBeVisible();

        // Se puede ordenar por la prioridad sugerida y cerrar el análisis.
        await panel.getByLabel(/Ordenar por la prioridad/).check();
        await panel.getByRole("button", { name: "Cerrar análisis" }).click();
        await expect(panel.getByRole("heading", { name: "Análisis del asistente" })).toHaveCount(0);
        await expect(panel.getByText("Sugerencia del asistente:")).toHaveCount(0);
    });

    test("el artesano no tiene acceso al asistente", async ({ page, request }) => {
        const artesano = await registrarArtesanoVerificado(page, request, "sinacceso");
        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await expect(page).toHaveURL(/\/mi-panel$/);

        const respuesta = await page.evaluate(async () => {
            const { token } = JSON.parse(localStorage.getItem("sgfa_usuario"));
            const resultado = await fetch("http://localhost:8080/api/asistente/solicitudes/analisis", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ idEdicionFeria: 1 }),
            });
            return resultado.status;
        });

        expect(respuesta).toBe(403);
    });
});
