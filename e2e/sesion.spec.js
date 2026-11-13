import { expect, test } from "@playwright/test";
import { ADMIN, ARTESANA_SEMILLA, cerrarSesion, iniciarSesion } from "./utils";

test.describe("Inicio y cierre de sesión", () => {
    test("las credenciales incorrectas muestran un error y no dejan entrar", async ({ page }) => {
        await iniciarSesion(page, ADMIN.correo, "contraseña-equivocada");

        await expect(page.getByRole("alert")).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test("el administrador entra a su panel y puede cerrar sesión", async ({ page }) => {
        await iniciarSesion(page, ADMIN.correo, ADMIN.contrasena);

        await expect(page).toHaveURL(/\/admin$/);
        await expect(page.getByRole("heading", { name: "Panel de administrador" })).toBeVisible();
        await expect(page.getByText(`Hola, ${ADMIN.nombre}`).first()).toBeVisible();

        await cerrarSesion(page);
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/login$/);
    });

    test("una artesana entra a Mi panel y no puede abrir el panel de administración", async ({ page }) => {
        await iniciarSesion(page, ARTESANA_SEMILLA.correo, ARTESANA_SEMILLA.contrasena);

        await expect(page).toHaveURL(/\/mi-panel$/);
        await expect(page.getByRole("heading", { name: "Mi panel" })).toBeVisible();

        await page.goto("/admin");
        await expect(page).not.toHaveURL(/\/admin$/);
    });

    test("la sesión se conserva al recargar la página", async ({ page }) => {
        await iniciarSesion(page, ARTESANA_SEMILLA.correo, ARTESANA_SEMILLA.contrasena);
        await expect(page).toHaveURL(/\/mi-panel$/);

        await page.reload();

        await expect(page.getByRole("heading", { name: "Mi panel" })).toBeVisible();
    });

    test("la contraseña se puede mostrar y ocultar", async ({ page }) => {
        await page.goto("/login");
        const campo = page.getByLabel("Contraseña", { exact: true });

        await expect(campo).toHaveAttribute("type", "password");
        await page.getByLabel("Mostrar contraseña").check();
        await expect(campo).toHaveAttribute("type", "text");
    });
});
