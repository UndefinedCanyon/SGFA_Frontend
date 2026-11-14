import { describe, expect, it } from "vitest";
import * as ui from "./index";

describe("índice de componentes de UI", () => {
    it.each([
        "Boton",
        "Campo",
        "Tarjeta",
        "Insignia",
        "Alerta",
        "EstadoVacio",
        "Esqueleto",
        "ConfirmarDialogo",
        "Spinner",
        "Pestanas",
        "PanelPestana",
        "Onda",
        "Portada",
        "EncabezadoPagina",
        "FondoAcceso",
    ])("exporta %s", (nombre) => {
        expect(ui[nombre]).toBeDefined();
    });
});