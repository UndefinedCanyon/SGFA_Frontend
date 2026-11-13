import { expect, test } from "@playwright/test";
import { ADMIN, cerrarSesion, iniciarSesion, registrarArtesanoVerificado } from "./utils";

test.describe("Flujo completo de participación en una feria", () => {
    test("la artesana solicita, el administrador aprueba y ella ve su solicitud aprobada", async ({ page, request }) => {
        const artesano = await registrarArtesanoVerificado(page, request, "participa");

        // 1. La artesana solicita participar en la primera edición disponible.
        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await expect(page).toHaveURL(/\/mi-panel$/);

        await page.goto("/ferias");
        const solicitar = page.getByRole("button", { name: "Solicitar participación" }).first();
        await expect(solicitar, "No hay ediciones futuras: revisa las fechas de database/data.sql").toBeVisible();
        await solicitar.click();
        await expect(page.getByText("Solicitud enviada. Queda pendiente de revisión por el administrador.")).toBeVisible();

        await page.getByRole("banner").getByRole("link", { name: "Mi Panel" }).click();
        await page.getByRole("tab", { name: /Solicitudes/ }).click();
        await expect(page.getByRole("tabpanel").getByText("Pendiente", { exact: true })).toBeVisible();
        await cerrarSesion(page);

        // 2. El administrador la encuentra entre las pendientes y la aprueba.
        await iniciarSesion(page, ADMIN.correo, ADMIN.contrasena);
        await expect(page).toHaveURL(/\/admin$/);
        await page.getByRole("tab", { name: /Solicitudes/ }).click();

        const solicitud = page.getByRole("tabpanel").locator("article", { hasText: artesano.emprendimiento });
        await expect(solicitud).toBeVisible();
        await solicitud.getByRole("button", { name: "Aprobar" }).click();
        await expect(solicitud).toHaveCount(0); // sale de la lista de pendientes
        await cerrarSesion(page);

        // 3. La artesana ve su solicitud aprobada.
        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await page.getByRole("tab", { name: /Solicitudes/ }).click();
        await expect(page.getByRole("tabpanel").getByText("Aprobada", { exact: true })).toBeVisible();
        await expect(page.getByRole("tabpanel").getByText("Participas en esta edición.")).toBeVisible();
    });

    test("el administrador puede rechazar una solicitud pendiente", async ({ page, request }) => {
        const artesano = await registrarArtesanoVerificado(page, request, "rechazo");
        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await expect(page).toHaveURL(/\/mi-panel$/);
        await page.goto("/ferias");
        await page.getByRole("button", { name: "Solicitar participación" }).first().click();
        await expect(page.getByText(/Solicitud enviada/)).toBeVisible();
        await cerrarSesion(page);

        await iniciarSesion(page, ADMIN.correo, ADMIN.contrasena);
        await page.getByRole("tab", { name: /Solicitudes/ }).click();
        await page.getByRole("tabpanel").locator("article", { hasText: artesano.emprendimiento }).getByRole("button", { name: "Rechazar" }).click();
        await cerrarSesion(page);

        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await page.getByRole("tab", { name: /Solicitudes/ }).click();
        await expect(page.getByRole("tabpanel").getByText("Rechazada", { exact: true })).toBeVisible();
    });
});
