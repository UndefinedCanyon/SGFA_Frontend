import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmarDialogo from "./ConfirmarDialogo";

// jsdom no implementa showModal ni close del elemento <dialog>, así que se simulan.
beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function mostrar() {
        this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function cerrar() {
        this.open = false;
    });
});

function montar(propiedades = {}) {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    const resultado = render(
        <ConfirmarDialogo
            abierto={false}
            titulo="¿Eliminar producto?"
            mensaje="Esta acción no se puede deshacer."
            onConfirmar={onConfirmar}
            onCancelar={onCancelar}
            {...propiedades}
        />
    );
    return { onConfirmar, onCancelar, ...resultado };
}

const boton = (texto) => screen.getByText(texto).closest("button");

describe("ConfirmarDialogo", () => {
    it("muestra el título y el mensaje", () => {
        montar();

        expect(screen.getByText("¿Eliminar producto?")).toBeInTheDocument();
        expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();
    });

    it("no abre el diálogo mientras abierto es false", () => {
        montar({ abierto: false });

        expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
    });

    it("abre el diálogo como modal cuando abierto pasa a true", () => {
        const { rerender, onConfirmar, onCancelar } = montar({ abierto: false });

        rerender(
            <ConfirmarDialogo
                abierto
                titulo="¿Eliminar producto?"
                mensaje="Esta acción no se puede deshacer."
                onConfirmar={onConfirmar}
                onCancelar={onCancelar}
            />
        );

        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    });

    it("abre el diálogo si ya se monta abierto", () => {
        montar({ abierto: true });

        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    });

    it("cierra el diálogo cuando abierto vuelve a false", () => {
        const { rerender, onConfirmar, onCancelar } = montar({ abierto: true });

        rerender(
            <ConfirmarDialogo
                abierto={false}
                titulo="¿Eliminar producto?"
                mensaje="Esta acción no se puede deshacer."
                onConfirmar={onConfirmar}
                onCancelar={onCancelar}
            />
        );

        expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
    });

    it("no vuelve a abrir un diálogo que ya está abierto", () => {
        const { rerender, onConfirmar, onCancelar } = montar({ abierto: true });

        rerender(
            <ConfirmarDialogo
                abierto
                cargando
                titulo="¿Eliminar producto?"
                mensaje="Esta acción no se puede deshacer."
                onConfirmar={onConfirmar}
                onCancelar={onCancelar}
            />
        );

        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    });

    it("el botón de confirmar dice «Confirmar» por defecto y acepta otro texto", () => {
        const { unmount } = montar();
        expect(boton("Confirmar")).toBeInTheDocument();
        unmount();

        montar({ textoConfirmar: "Sí, eliminar" });
        expect(boton("Sí, eliminar")).toBeInTheDocument();
    });

    it("confirmar y cancelar llaman a su respectiva función", () => {
        const { onConfirmar, onCancelar } = montar({ abierto: true });

        fireEvent.click(boton("Confirmar"));
        expect(onConfirmar).toHaveBeenCalledTimes(1);
        expect(onCancelar).not.toHaveBeenCalled();

        fireEvent.click(boton("Cancelar"));
        expect(onCancelar).toHaveBeenCalledTimes(1);
    });

    it("la tecla Escape cancela sin cerrar el diálogo por su cuenta", () => {
        const { onCancelar, container } = montar({ abierto: true });
        const dialogo = container.querySelector("dialog");

        const evento = new Event("cancel", { cancelable: true });
        dialogo.dispatchEvent(evento);

        expect(onCancelar).toHaveBeenCalledTimes(1);
        expect(evento.defaultPrevented).toBe(true);
    });

    it("usa el estilo de peligro en el botón de confirmar cuando corresponde", () => {
        montar({ peligro: true });

        expect(boton("Confirmar")).toHaveClass("bg-red-600");
    });

    it("usa el estilo primario cuando no es una acción peligrosa", () => {
        montar({ peligro: false });

        expect(boton("Confirmar")).toHaveClass("bg-green-600");
    });

    it("deshabilita el botón de confirmar mientras está cargando", () => {
        const { onConfirmar } = montar({ cargando: true });

        expect(boton("Confirmar")).toBeDisabled();
        fireEvent.click(boton("Confirmar"));
        expect(onConfirmar).not.toHaveBeenCalled();
    });
});