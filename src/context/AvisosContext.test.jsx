import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorAvisos, useAvisos } from "./AvisosContext";

let avisos;

function Espia() {
    avisos = useAvisos();
    return null;
}

function montar() {
    return render(
        <ProveedorAvisos>
            <Espia />
            <p>contenido de la app</p>
        </ProveedorAvisos>
    );
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("ProveedorAvisos", () => {
    it("muestra a sus hijos y una región de notificaciones accesible", () => {
        montar();

        expect(screen.getByText("contenido de la app")).toBeInTheDocument();
        const region = screen.getByRole("region", { name: "Notificaciones" });
        expect(region).toHaveAttribute("aria-live", "polite");
    });

    it("muestra un aviso de éxito como estado", () => {
        montar();

        act(() => avisos.mostrar("exito", "Guardado correctamente"));

        expect(screen.getByRole("status")).toHaveTextContent("Guardado correctamente");
    });

    it("muestra un aviso de error como alerta", () => {
        montar();

        act(() => avisos.mostrar("error", "No se pudo guardar"));

        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar");
    });

    it("ignora el mismo aviso repetido en menos de 400 ms", () => {
        montar();

        act(() => {
            avisos.mostrar("exito", "Repetido");
            avisos.mostrar("exito", "Repetido");
        });

        expect(screen.getAllByText("Repetido")).toHaveLength(1);
    });

    it("acepta el mismo aviso otra vez pasado el tiempo de espera", () => {
        montar();
        act(() => avisos.mostrar("exito", "Repetido"));

        act(() => vi.advanceTimersByTime(500));
        act(() => avisos.mostrar("exito", "Repetido"));

        expect(screen.getAllByText("Repetido")).toHaveLength(2);
    });

    it("trata como distintos los avisos con el mismo texto pero otro tipo", () => {
        montar();

        act(() => {
            avisos.mostrar("exito", "Mismo texto");
            avisos.mostrar("error", "Mismo texto");
        });

        expect(screen.getAllByText("Mismo texto")).toHaveLength(2);
    });

    it("muestra como máximo 3 avisos y descarta los más antiguos", () => {
        montar();

        act(() => {
            avisos.mostrar("info", "uno");
            avisos.mostrar("info", "dos");
            avisos.mostrar("info", "tres");
            avisos.mostrar("info", "cuatro");
        });

        expect(screen.queryByText("uno")).not.toBeInTheDocument();
        expect(screen.getByText("dos")).toBeInTheDocument();
        expect(screen.getByText("tres")).toBeInTheDocument();
        expect(screen.getByText("cuatro")).toBeInTheDocument();
    });

    it("cierra un aviso con su botón", () => {
        montar();
        act(() => avisos.mostrar("exito", "Cerrame"));

        fireEvent.click(screen.getByRole("button", { name: /Cerrar notificación/ }));

        expect(screen.queryByText("Cerrame")).not.toBeInTheDocument();
    });

    it("cierra un aviso corto solo a los 5 segundos", () => {
        montar();
        act(() => avisos.mostrar("exito", "Hola"));

        act(() => vi.advanceTimersByTime(4900));
        expect(screen.getByText("Hola")).toBeInTheDocument();

        act(() => vi.advanceTimersByTime(200));
        expect(screen.queryByText("Hola")).not.toBeInTheDocument();
    });

    it("da más tiempo a los mensajes largos, hasta 12 segundos", () => {
        montar();
        act(() => avisos.mostrar("info", "x".repeat(300)));

        act(() => vi.advanceTimersByTime(11900));
        expect(screen.getByText("x".repeat(300))).toBeInTheDocument();

        act(() => vi.advanceTimersByTime(200));
        expect(screen.queryByText("x".repeat(300))).not.toBeInTheDocument();
    });

    it("sigue funcionando después de muchos avisos distintos", () => {
        montar();

        act(() => {
            for (let i = 0; i < 60; i += 1) avisos.mostrar("info", `mensaje ${i}`);
        });

        expect(screen.getByText("mensaje 59")).toBeInTheDocument();
        expect(screen.getAllByRole("status")).toHaveLength(3);
    });
});

describe("useAvisos", () => {
    it("devuelve null fuera de un ProveedorAvisos", () => {
        let valor = "sin-leer";
        function Suelto() {
            valor = useAvisos();
            return null;
        }

        render(<Suelto />);

        expect(valor).toBeNull();
    });
});