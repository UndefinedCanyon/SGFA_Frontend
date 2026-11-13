import { expect, test } from "@playwright/test";
import { ADMIN, iniciarSesion } from "./utils";

test.describe("Administración", () => {
    test.beforeEach(async ({ page }) => {
        await iniciarSesion(page, ADMIN.correo, ADMIN.contrasena);
        await expect(page).toHaveURL(/\/admin$/);
    });

    test("el panel muestra las estadísticas y las cuatro pestañas", async ({ page }) => {
        await expect(page.getByText("Solicitudes pendientes")).toBeVisible();
        await expect(page.getByText("Ferias activas")).toBeVisible();

        for (const nombre of ["Solicitudes", "Ferias y ediciones", "Artesanos", "Lugares"]) {
            await expect(page.getByRole("tab", { name: new RegExp(nombre) })).toBeVisible();
        }
    });

    test("crea, renombra y desactiva una feria", async ({ page }) => {
        const nombre = `Feria E2E ${Date.now()}`;
        await page.getByRole("tab", { name: /Ferias y ediciones/ }).click();

        await page.getByRole("button", { name: "+ Crear feria" }).click();
        await page.getByLabel("Nombre de la feria").fill(nombre);
        await page.getByRole("button", { name: "Crear feria" }).click();
        await expect(page.getByText(`Feria "${nombre}" creada.`)).toBeVisible();

        await page.getByRole("button", { name: `Editar el nombre de ${nombre}` }).click();
        await page.getByLabel("Nuevo nombre de la feria").fill(`${nombre} renombrada`);
        await page.getByRole("button", { name: "Guardar" }).click();
        await expect(page.getByText(`Feria renombrada a "${nombre} renombrada".`)).toBeVisible();

        const fila = page
            .getByRole("tabpanel")
            .getByText(`${nombre} renombrada`, { exact: true })
            .locator("xpath=ancestor::div[.//button[normalize-space()='Desactivar']][1]");
        await fila.getByRole("button", { name: "Desactivar" }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Desactivar" }).click();
        await expect(page.getByText(/desactivada\./)).toBeVisible();
    });

    test("filtra los artesanos por texto", async ({ page }) => {
        await page.getByRole("tab", { name: /Artesanos/ }).click();

        await page.getByRole("tabpanel").getByLabel("Buscar").fill("Ceramica");

        await expect(page.getByRole("tabpanel").getByText("Ceramica Carlos")).toBeVisible();
        await expect(page.getByRole("tabpanel").getByText("Tejidos Maria")).toHaveCount(0);
    });

    test("muestra los lugares sembrados en la base de datos", async ({ page }) => {
        await page.getByRole("tab", { name: /Lugares/ }).click();

        await expect(page.getByRole("tabpanel").getByText("Parque Principal de Fusagasugá")).toBeVisible();
        await expect(page.getByRole("tabpanel").getByText("Plaza de Mercado")).toBeVisible();
    });
});
