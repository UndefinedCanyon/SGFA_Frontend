import { expect, test } from "@playwright/test";
import { datosArtesanoUnico, esperarEnlaceDeCorreo, iniciarSesion, llenarRegistro } from "./utils";

test.describe("Registro de artesanos", () => {
    test("la contraseña de menos de 8 caracteres no se envía", async ({ page }) => {
        await llenarRegistro(page, { ...datosArtesanoUnico("corta"), contrasena: "corta" });

        await page.getByRole("button", { name: "Crear mi cuenta" }).click();

        await expect(page.getByRole("heading", { name: "Registro de artesano" })).toBeVisible();
    });

    test("no se puede iniciar sesión antes de confirmar el correo", async ({ page }) => {
        const datos = datosArtesanoUnico("sinconfirmar");
        await llenarRegistro(page, datos);
        await page.getByRole("button", { name: "Crear mi cuenta" }).click();
        await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();

        await iniciarSesion(page, datos.correo, datos.contrasena);

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole("alert").or(page.getByRole("status")).first()).toBeVisible();
    });

    test("registro, confirmación del correo con el enlace recibido e inicio de sesión", async ({ page, request }) => {
        const datos = datosArtesanoUnico("registro");
        await llenarRegistro(page, datos);

        await page.getByRole("button", { name: "Crear mi cuenta" }).click();
        await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
        await expect(page.getByText(datos.correo)).toBeVisible();

        const enlace = await esperarEnlaceDeCorreo(request, datos.correo);
        await page.goto(enlace);
        await expect(page.getByRole("heading", { name: "¡Correo confirmado!" })).toBeVisible();

        await iniciarSesion(page, datos.correo, datos.contrasena);
        await expect(page).toHaveURL(/\/mi-panel$/);
        await expect(page.getByText(`Hola, ${datos.nombre}`).first()).toBeVisible();
    });

    test("registrar dos veces el mismo correo muestra un error", async ({ page, request }) => {
        const datos = datosArtesanoUnico("duplicado");
        await llenarRegistro(page, datos);
        await page.getByRole("button", { name: "Crear mi cuenta" }).click();
        await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
        await esperarEnlaceDeCorreo(request, datos.correo);

        await llenarRegistro(page, { ...datos, cc: "9999999999" });
        await page.getByRole("button", { name: "Crear mi cuenta" }).click();

        await expect(page.getByRole("alert")).toBeVisible();
        await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toHaveCount(0);
    });

    test("un enlace de confirmación inválido muestra el error", async ({ page }) => {
        await page.goto("/verificar-correo?token=token-que-no-existe");

        await expect(page.getByRole("heading", { name: "No pudimos confirmar tu correo" })).toBeVisible();
    });
});
