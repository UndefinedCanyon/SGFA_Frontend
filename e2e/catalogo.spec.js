import { expect, test } from "@playwright/test";
import { iniciarSesion, registrarArtesanoVerificado } from "./utils";

test.describe("Catálogo de productos del artesano", () => {
    test("agrega, edita y elimina un producto", async ({ page, request }) => {
        const artesano = await registrarArtesanoVerificado(page, request, "catalogo");
        await iniciarSesion(page, artesano.correo, artesano.contrasena);
        await expect(page.getByRole("heading", { name: "Mi panel" })).toBeVisible();
        await expect(page.getByText("Aún no has registrado productos")).toBeVisible();

        // Crear
        await page.getByLabel("Nombre del producto").fill("Mochila wayuu");
        await page.getByLabel("Precio (COP)").fill("120000");
        await page.getByLabel("Cantidad disponible").fill("3");
        await page.getByRole("button", { name: "Agregar" }).click();

        await expect(page.getByText('Producto "Mochila wayuu" agregado a tu catálogo.')).toBeVisible();
        const tarjeta = page.getByRole("tabpanel").locator("article", { hasText: "Mochila wayuu" });
        await expect(tarjeta).toContainText("$120.000");
        await expect(tarjeta).toContainText("3 unidades disponibles");

        // Editar
        await page.getByRole("button", { name: "Editar Mochila wayuu" }).click();
        await expect(page.getByText("Editar producto")).toBeVisible();
        await page.getByLabel("Cantidad disponible").fill("0");
        await page.getByRole("button", { name: "Actualizar" }).click();

        await expect(page.getByText('Producto "Mochila wayuu" actualizado.')).toBeVisible();
        await expect(tarjeta).toContainText("Agotado");

        // Eliminar
        await page.getByRole("button", { name: "Eliminar Mochila wayuu" }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();

        await expect(page.getByText('Producto "Mochila wayuu" eliminado.')).toBeVisible();
        await expect(page.getByText("Aún no has registrado productos")).toBeVisible();
    });

    test("cancelar la eliminación conserva el producto", async ({ page, request }) => {
        const artesano = await registrarArtesanoVerificado(page, request, "conserva");
        await iniciarSesion(page, artesano.correo, artesano.contrasena);

        await page.getByLabel("Nombre del producto").fill("Sombrero vueltiao");
        await page.getByLabel("Precio (COP)").fill("90000");
        await page.getByLabel("Cantidad disponible").fill("2");
        await page.getByRole("button", { name: "Agregar" }).click();
        await expect(page.getByRole("tabpanel").locator("article", { hasText: "Sombrero vueltiao" })).toBeVisible();

        await page.getByRole("button", { name: "Eliminar Sombrero vueltiao" }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

        await expect(page.getByRole("tabpanel").locator("article", { hasText: "Sombrero vueltiao" })).toBeVisible();
    });
});
