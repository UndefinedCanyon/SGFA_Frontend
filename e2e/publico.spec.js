import { expect, test } from "@playwright/test";

test.describe("Visitante", () => {
    test("la portada muestra el título y los enlaces para registrarse e ingresar", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByRole("link", { name: "Registrarme como artesano" })).toBeVisible();
        await expect(page.getByRole("banner").getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    });

    test("la lista de ferias muestra las ferias publicadas sin iniciar sesión", async ({ page }) => {
        await page.goto("/ferias");

        await expect(page.getByRole("heading", { name: "Ferias artesanales" })).toBeVisible();
        // Esta feria tiene dos ediciones, por eso aparece en dos tarjetas.
        await expect(page.getByRole("heading", { name: "Feria Artesanal de Fusagasugá" }).first()).toBeVisible();
        await expect(page.getByRole("heading", { name: "Feria Navideña Artesanal" }).first()).toBeVisible();
    });

    test("un visitante no ve botones para solicitar participación", async ({ page }) => {
        await page.goto("/ferias");
        await expect(page.getByRole("heading", { name: "Feria Navideña Artesanal" }).first()).toBeVisible();

        await expect(page.getByRole("button", { name: "Solicitar participación" })).toHaveCount(0);
    });

    test("se navega entre inicio y ferias con el encabezado", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("banner").getByRole("link", { name: "Ferias" }).click();
        await expect(page).toHaveURL(/\/ferias$/);

        await page.getByRole("banner").getByRole("link", { name: "Inicio" }).click();
        await expect(page).toHaveURL(/\/$/);
    });

    test("una dirección inexistente muestra la página 404", async ({ page }) => {
        await page.goto("/esta-ruta-no-existe");

        await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    });

    test("los paneles protegidos mandan al login a quien no ha iniciado sesión", async ({ page }) => {
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/login$/);

        await page.goto("/mi-panel");
        await expect(page).toHaveURL(/\/login$/);
    });
});
