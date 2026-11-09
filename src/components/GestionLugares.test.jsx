import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { instalarDialogo } from "../test/dialogo";

vi.mock("../services/api", () => ({
    crearLugar: vi.fn(),
    actualizarLugar: vi.fn(),
    cambiarEstadoLugar: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("./SelectorUbicacion", () => ({
    default: ({ valor, onCambio }) => (
        <div data-testid="selector-ubicacion">
            <span>{valor ? `punto:${valor.latitud},${valor.longitud}` : "sin-punto"}</span>
            <button type="button" onClick={() => onCambio({ latitud: 4.5, longitud: -74.1 })}>
                elegir-punto
            </button>
        </div>
    ),
}));

import GestionLugares from "./GestionLugares";
import { actualizarLugar, cambiarEstadoLugar, crearLugar } from "../services/api";
import { useAuth } from "../context/AuthContext";

const plaza = { id: 1, nombre: "Plaza Mayor", direccion: "Calle 1", latitud: 4.3, longitud: -74.3, activo: true };
const parque = { id: 2, nombre: "Parque", direccion: "Carrera 2", latitud: null, longitud: null, activo: false };
const alameda = { id: 3, nombre: "Álamos", direccion: "Calle 3", latitud: null, longitud: null, activo: true };

let onCambio;

beforeEach(() => {
    vi.clearAllMocks();
    instalarDialogo();
    Element.prototype.scrollIntoView = vi.fn();
    onCambio = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ usuario: { token: "tok" } });
    crearLugar.mockResolvedValue(undefined);
    actualizarLugar.mockResolvedValue(undefined);
    cambiarEstadoLugar.mockResolvedValue(undefined);
});

function montar(lugares = [plaza, parque, alameda], ediciones = [], cargando = false) {
    return render(<GestionLugares lugares={lugares} ediciones={ediciones} cargando={cargando} onCambio={onCambio} />);
}

const formulario = () => screen.getByLabelText("Nombre").closest("form");

function llenarBasico() {
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "  Salón Comunal " } });
    fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: " Calle 9 " } });
}

describe("GestionLugares: lista", () => {
    it("muestra activos primero, ordenados, con sus insignias", () => {
        montar();

        const nombres = screen.getAllByText(/^(Plaza Mayor|Parque|Álamos)$/).map((e) => e.textContent);
        expect(nombres).toEqual(["Álamos", "Plaza Mayor", "Parque"]);
        expect(screen.getByText("Inactivo")).toBeInTheDocument();
        expect(screen.getByText("Con mapa")).toBeInTheDocument();
        expect(screen.getAllByText("Sin ubicación")).toHaveLength(2);
    });

    it("mientras carga no muestra el estado vacío", () => {
        montar([], [], true);

        expect(screen.queryByText("Aún no hay lugares")).not.toBeInTheDocument();
    });

    it("sin lugares invita a agregar el primero", () => {
        montar([]);

        expect(screen.getByText("Aún no hay lugares")).toBeInTheDocument();
    });

    it("funciona aunque no se pasen las ediciones", () => {
        render(<GestionLugares lugares={[plaza]} cargando={false} onCambio={onCambio} />);

        expect(screen.getByText("Plaza Mayor")).toBeInTheDocument();
    });
});

describe("GestionLugares: crear", () => {
    it("crea el lugar sin ubicación y limpia el formulario", async () => {
        montar();
        llenarBasico();

        fireEvent.click(screen.getByRole("button", { name: "Agregar lugar" }));

        expect(await screen.findByText(/Lugar "Salón Comunal" creado/)).toBeInTheDocument();
        expect(crearLugar).toHaveBeenCalledWith(
            { nombre: "Salón Comunal", direccion: "Calle 9", latitud: null, longitud: null },
            "tok"
        );
        expect(onCambio).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText("Nombre")).toHaveValue("");
    });

    it("elegir un punto en el mapa rellena latitud y longitud", () => {
        montar();

        fireEvent.click(screen.getByText("elegir-punto"));

        expect(screen.getByLabelText("Latitud")).toHaveValue(4.5);
        expect(screen.getByLabelText("Longitud")).toHaveValue(-74.1);
        expect(screen.getByText("punto:4.5,-74.1")).toBeInTheDocument();
    });

    it("crea el lugar con las coordenadas escritas", async () => {
        montar();
        llenarBasico();
        fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "4.25" } });
        fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "-74.5" } });

        fireEvent.click(screen.getByRole("button", { name: "Agregar lugar" }));

        await waitFor(() =>
            expect(crearLugar).toHaveBeenCalledWith(
                { nombre: "Salón Comunal", direccion: "Calle 9", latitud: 4.25, longitud: -74.5 },
                "tok"
            )
        );
    });

    it("Quitar ubicación borra las coordenadas", () => {
        montar();
        fireEvent.click(screen.getByText("elegir-punto"));

        fireEvent.click(screen.getByRole("button", { name: "Quitar ubicación" }));

        expect(screen.getByLabelText("Latitud")).toHaveValue(null);
        expect(screen.queryByRole("button", { name: "Quitar ubicación" })).not.toBeInTheDocument();
    });

    it("pide ambas coordenadas si solo se escribe una", () => {
        montar();
        llenarBasico();
        fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "4.25" } });

        fireEvent.submit(formulario());

        expect(screen.getByRole("alert")).toHaveTextContent("Indica la latitud y la longitud, o deja ambas vacías.");
        expect(crearLugar).not.toHaveBeenCalled();
    });

    it("rechaza coordenadas fuera de rango", () => {
        montar();
        llenarBasico();
        fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "95" } });
        fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "10" } });

        fireEvent.submit(formulario());

        expect(screen.getByRole("alert")).toHaveTextContent("La latitud debe estar entre -90 y 90");
        expect(crearLugar).not.toHaveBeenCalled();
    });

    it("si el servidor falla muestra el error y conserva lo escrito", async () => {
        crearLugar.mockRejectedValue(new Error("Nombre repetido."));
        montar();
        llenarBasico();

        fireEvent.click(screen.getByRole("button", { name: "Agregar lugar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nombre repetido.");
        expect(screen.getByLabelText("Nombre")).toHaveValue("  Salón Comunal ");
    });
});

describe("GestionLugares: editar", () => {
    it("carga el lugar en el formulario y lo desplaza a la vista", () => {
        montar();

        fireEvent.click(screen.getByRole("button", { name: "Editar Plaza Mayor" }));

        expect(screen.getByText("Editar lugar")).toBeInTheDocument();
        expect(screen.getByLabelText("Nombre")).toHaveValue("Plaza Mayor");
        expect(screen.getByLabelText("Latitud")).toHaveValue(4.3);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it("un lugar sin coordenadas se carga con los campos vacíos", () => {
        montar();

        fireEvent.click(screen.getByRole("button", { name: "Editar Parque" }));

        expect(screen.getByLabelText("Latitud")).toHaveValue(null);
    });

    it("guarda los cambios con actualizarLugar y vuelve al modo crear", async () => {
        montar();
        fireEvent.click(screen.getByRole("button", { name: "Editar Plaza Mayor" }));
        fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Plaza Central" } });

        fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

        expect(await screen.findByText('Lugar "Plaza Central" actualizado.')).toBeInTheDocument();
        expect(actualizarLugar).toHaveBeenCalledWith(
            1,
            { nombre: "Plaza Central", direccion: "Calle 1", latitud: 4.3, longitud: -74.3 },
            "tok"
        );
        expect(screen.getByRole("heading", { name: "Agregar lugar" })).toBeInTheDocument();
    });

    it("Cancelar descarta la edición", () => {
        montar();
        fireEvent.click(screen.getByRole("button", { name: "Editar Plaza Mayor" }));

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.getByLabelText("Nombre")).toHaveValue("");
        expect(screen.getByRole("heading", { name: "Agregar lugar" })).toBeInTheDocument();
    });
});

describe("GestionLugares: estado", () => {
    it("desactivar un lugar sin ediciones pide confirmación y desactiva", async () => {
        montar([plaza]);

        fireEvent.click(screen.getByRole("button", { name: "Desactivar Plaza Mayor" }));
        const dialogo = screen.getByRole("dialog");
        expect(within(dialogo).getByText(/dejará de ofrecerse al crear ediciones nuevas\. Podrás reactivarlo/)).toBeInTheDocument();
        fireEvent.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

        await waitFor(() => expect(cambiarEstadoLugar).toHaveBeenCalledWith(1, false, "tok"));
        expect(await screen.findByText(/Lugar "Plaza Mayor" desactivado/)).toBeInTheDocument();
    });

    it("el aviso menciona las ediciones activas que lo usan, en singular y plural", () => {
        const { unmount } = montar([plaza], [{ idLugar: 1, activo: true }, { idLugar: 1, activo: false }]);
        fireEvent.click(screen.getByRole("button", { name: "Desactivar Plaza Mayor" }));
        expect(screen.getByRole("dialog")).toHaveTextContent("La edición activa que ya lo usa seguirá mostrándolo.");
        unmount();

        montar([plaza], [{ idLugar: 1, activo: true }, { idLugar: 1, activo: true }]);
        fireEvent.click(screen.getByRole("button", { name: "Desactivar Plaza Mayor" }));
        expect(screen.getByRole("dialog")).toHaveTextContent("Las 2 ediciones activas que ya lo usan seguirán mostrándolo.");
    });

    it("cancelar la confirmación no desactiva", () => {
        montar([plaza]);
        fireEvent.click(screen.getByRole("button", { name: "Desactivar Plaza Mayor" }));

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(cambiarEstadoLugar).not.toHaveBeenCalled();
    });

    it("reactivar no pide confirmación", async () => {
        montar([parque]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar Parque" }));

        await waitFor(() => expect(cambiarEstadoLugar).toHaveBeenCalledWith(2, true, "tok"));
        expect(await screen.findByText('Lugar "Parque" reactivado.')).toBeInTheDocument();
    });

    it("si falla muestra el error de la lista", async () => {
        cambiarEstadoLugar.mockRejectedValue(new Error("Sin permiso."));
        montar([parque]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar Parque" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso.");
    });
});
