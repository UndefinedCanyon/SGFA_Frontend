import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/imagenes", () => ({
    prepararImagen: vi.fn(),
    urlImagen: (nombre) => `/api/imagenes/${nombre}`,
}));

import SelectorImagen from "./SelectorImagen";
import { prepararImagen } from "../utils/imagenes";

let onSubir;
let onQuitar;
let onError;

beforeEach(() => {
    vi.clearAllMocks();
    onSubir = vi.fn().mockResolvedValue(undefined);
    onQuitar = vi.fn().mockResolvedValue(undefined);
    onError = vi.fn();
    prepararImagen.mockImplementation(async (archivo) => archivo);
});

function montar(propiedades = {}) {
    return render(
        <SelectorImagen nombre="Vasija" onSubir={onSubir} onQuitar={onQuitar} onError={onError} {...propiedades} />
    );
}

const entrada = (contenedor) => contenedor.querySelector('input[type="file"]');
const archivo = () => new File(["x"], "foto.png", { type: "image/png" });

describe("SelectorImagen", () => {
    it("sin imagen ofrece subir foto y no ofrece quitar", () => {
        montar();

        expect(screen.getByRole("button", { name: "Subir imagen de Vasija" })).toHaveTextContent("Subir foto");
        expect(screen.queryByRole("button", { name: /Quitar imagen/ })).not.toBeInTheDocument();
    });

    it("con imagen ofrece cambiar y quitar", () => {
        montar({ imagen: "abc.png" });

        expect(screen.getByRole("button", { name: "Cambiar imagen de Vasija" })).toHaveTextContent("Cambiar");
        expect(screen.getByRole("button", { name: "Quitar imagen de Vasija" })).toBeInTheDocument();
    });

    it("el botón abre el selector de archivos", () => {
        const { container } = montar();
        const clic = vi.spyOn(entrada(container), "click");

        fireEvent.click(screen.getByRole("button", { name: "Subir imagen de Vasija" }));

        expect(clic).toHaveBeenCalled();
    });

    it("al elegir un archivo lo prepara y lo sube", async () => {
        const { container } = montar();
        const elegido = archivo();

        fireEvent.change(entrada(container), { target: { files: [elegido] } });

        await waitFor(() => expect(onSubir).toHaveBeenCalledWith(elegido));
        expect(prepararImagen).toHaveBeenCalledWith(elegido);
        expect(onError).toHaveBeenCalledWith(null);
    });

    it("si no se elige ningún archivo no hace nada", async () => {
        const { container } = montar();

        fireEvent.change(entrada(container), { target: { files: [] } });

        expect(prepararImagen).not.toHaveBeenCalled();
        expect(onSubir).not.toHaveBeenCalled();
    });

    it("si preparar o subir falla, avisa el error y vuelve a habilitar los botones", async () => {
        prepararImagen.mockRejectedValue(new Error("La imagen pesa demasiado."));
        const { container } = montar();

        fireEvent.change(entrada(container), { target: { files: [archivo()] } });

        await waitFor(() => expect(onError).toHaveBeenCalledWith("La imagen pesa demasiado."));
        expect(onSubir).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.getByRole("button", { name: "Subir imagen de Vasija" })).toBeEnabled()
        );
    });

    it("mientras sube, deshabilita los botones", async () => {
        let terminar;
        onSubir.mockReturnValue(new Promise((resolver) => (terminar = resolver)));
        const { container } = montar({ imagen: "abc.png" });

        fireEvent.change(entrada(container), { target: { files: [archivo()] } });

        await waitFor(() => expect(screen.getByRole("button", { name: /Cambiar imagen/ })).toBeDisabled());
        expect(screen.getByRole("button", { name: /Quitar imagen/ })).toBeDisabled();

        terminar();
        await waitFor(() => expect(screen.getByRole("button", { name: /Cambiar imagen/ })).toBeEnabled());
    });

    it("quitar llama al callback y limpia el error", async () => {
        montar({ imagen: "abc.png" });

        fireEvent.click(screen.getByRole("button", { name: "Quitar imagen de Vasija" }));

        await waitFor(() => expect(onQuitar).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(null);
    });

    it("si quitar falla, avisa el error", async () => {
        onQuitar.mockRejectedValue(new Error("No se pudo quitar."));
        montar({ imagen: "abc.png" });

        fireEvent.click(screen.getByRole("button", { name: "Quitar imagen de Vasija" }));

        await waitFor(() => expect(onError).toHaveBeenCalledWith("No se pudo quitar."));
    });

    it("funciona sin el callback onError", async () => {
        onQuitar.mockRejectedValue(new Error("falló"));
        render(<SelectorImagen imagen="abc.png" nombre="Vasija" onSubir={onSubir} onQuitar={onQuitar} />);

        fireEvent.click(screen.getByRole("button", { name: "Quitar imagen de Vasija" }));

        await waitFor(() => expect(onQuitar).toHaveBeenCalled());
    });
});
