import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { instalarDialogo } from "../test/dialogo";

vi.mock("../services/api", () => ({ cambiarEstadoArtesano: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("./RegistrarArtesanoAdmin", () => ({
    default: ({ onCreado, onCerrar }) => (
        <div data-testid="formulario-registro">
            <button onClick={onCreado}>creado</button>
            <button onClick={onCerrar}>cerrar-form</button>
        </div>
    ),
}));
vi.mock("./Miniatura", () => ({ default: ({ nombre }) => <span>{`mini:${nombre}`}</span> }));

import GestionArtesanos from "./GestionArtesanos";
import { cambiarEstadoArtesano } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ana = {
    id: 1, nombre: "Ana Gómez", nombreEmprendimiento: "Cerámicas Ana", correoElectronico: "ana@correo.com",
    cc: "1010", telefono: "300", activo: true, correoVerificado: true, logo: null,
};
const luis = {
    id: 2, nombre: "Luis Pérez", nombreEmprendimiento: "Telares Luis", correoElectronico: "luis@correo.com",
    cc: "2020", telefono: "", activo: false, correoVerificado: false, logo: null,
};
const marta = {
    id: 3, nombre: "Marta Ruiz", nombreEmprendimiento: "Álamo Tejidos", correoElectronico: "marta@correo.com",
    cc: "3030", telefono: "311", activo: true, correoVerificado: true, logo: null,
};

let onCambio;

beforeEach(() => {
    vi.clearAllMocks();
    instalarDialogo();
    onCambio = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ usuario: { token: "tok" } });
    cambiarEstadoArtesano.mockResolvedValue(undefined);
});

function montar(artesanos = [ana, luis, marta], cargando = false) {
    return render(<GestionArtesanos artesanos={artesanos} cargando={cargando} onCambio={onCambio} />);
}


describe("GestionArtesanos: lista", () => {
    it("muestra los artesanos con los activos primero y ordenados por emprendimiento", () => {
        montar();

        const titulos = screen.getAllByText(/^(Cerámicas Ana|Telares Luis|Álamo Tejidos)$/).map((e) => e.textContent);
        expect(titulos).toEqual(["Álamo Tejidos", "Cerámicas Ana", "Telares Luis"]);
        expect(screen.getByText("3 artesanos")).toBeInTheDocument();
    });

    it("usa el singular con un solo artesano", () => {
        montar([ana]);

        expect(screen.getByText("1 artesano")).toBeInTheDocument();
    });

    it("marca los inactivos y los de correo sin confirmar, y muestra el teléfono si existe", () => {
        montar();

        expect(screen.getByText("Inactivo")).toBeInTheDocument();
        expect(screen.getByText("Correo sin confirmar")).toBeInTheDocument();
        expect(screen.getByText("ana@correo.com · 300")).toBeInTheDocument();
        expect(screen.getByText("luis@correo.com")).toBeInTheDocument();
    });

    it("mientras carga muestra esqueletos y no el conteo", () => {
        montar([], true);

        expect(screen.queryByText(/^\d+ artesanos?$/)).not.toBeInTheDocument();
        expect(screen.queryByText("Aún no hay artesanos")).not.toBeInTheDocument();
    });

    it("sin artesanos invita a registrar el primero", () => {
        montar([]);

        expect(screen.getByText("Aún no hay artesanos")).toBeInTheDocument();
        expect(screen.getByText("Registra el primero con el botón de arriba.")).toBeInTheDocument();
    });
});

describe("GestionArtesanos: búsqueda y filtro", () => {
    it("busca sin importar mayúsculas ni tildes", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "ceramicas" } });

        expect(screen.getByText("Cerámicas Ana")).toBeInTheDocument();
        expect(screen.queryByText("Telares Luis")).not.toBeInTheDocument();
        expect(screen.getByText("1 artesano")).toBeInTheDocument();
    });

    it("busca por cédula y por correo", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "2020" } });
        expect(screen.getByText("Telares Luis")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "marta@" } });
        expect(screen.getByText("Álamo Tejidos")).toBeInTheDocument();
    });

    it("filtra por activos e inactivos", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "ACTIVOS" } });
        expect(screen.queryByText("Telares Luis")).not.toBeInTheDocument();
        expect(screen.getByText("2 artesanos")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "INACTIVOS" } });
        expect(screen.getByText("Telares Luis")).toBeInTheDocument();
        expect(screen.queryByText("Cerámicas Ana")).not.toBeInTheDocument();
    });

    it("si nada coincide sugiere cambiar la búsqueda", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zzz" } });

        expect(screen.getByText("No encontramos artesanos")).toBeInTheDocument();
        expect(screen.getByText("Prueba con otra búsqueda o cambia el filtro.")).toBeInTheDocument();
    });
});

describe("GestionArtesanos: formulario de registro", () => {
    it("el botón muestra y oculta el formulario", () => {
        montar();
        expect(screen.queryByTestId("formulario-registro")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "+ Registrar artesano" }));
        expect(screen.getByTestId("formulario-registro")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cerrar formulario" }));
        expect(screen.queryByTestId("formulario-registro")).not.toBeInTheDocument();
    });

    it("el formulario puede cerrarse él mismo y refresca la lista al crear", () => {
        montar();
        fireEvent.click(screen.getByRole("button", { name: "+ Registrar artesano" }));

        fireEvent.click(screen.getByText("creado"));
        expect(onCambio).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText("cerrar-form"));
        expect(screen.queryByTestId("formulario-registro")).not.toBeInTheDocument();
    });
});

describe("GestionArtesanos: cambiar el estado", () => {
    it("desactivar pide confirmación y, al confirmar, desactiva y refresca", async () => {
        montar([ana]);

        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
        const dialogo = screen.getByRole("dialog");
        expect(within(dialogo).getByText("¿Desactivar este artesano?")).toBeInTheDocument();
        expect(within(dialogo).getByText(/"Cerámicas Ana" no podrá iniciar sesión/)).toBeInTheDocument();

        fireEvent.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

        await waitFor(() => expect(cambiarEstadoArtesano).toHaveBeenCalledWith(1, false, "tok"));
        expect(await screen.findByText(/"Cerámicas Ana" fue desactivado/)).toBeInTheDocument();
        expect(onCambio).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("cancelar la confirmación no cambia nada", () => {
        montar([ana]);
        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(cambiarEstadoArtesano).not.toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("reactivar no pide confirmación y avisa", async () => {
        montar([luis]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));

        await waitFor(() => expect(cambiarEstadoArtesano).toHaveBeenCalledWith(2, true, "tok"));
        expect(await screen.findByText('"Telares Luis" fue reactivado.')).toBeInTheDocument();
        expect(onCambio).toHaveBeenCalled();
    });

    it("si falla muestra el error y no refresca", async () => {
        cambiarEstadoArtesano.mockRejectedValue(new Error("No tienes permiso."));
        montar([luis]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso.");
        expect(onCambio).not.toHaveBeenCalled();
    });
});
