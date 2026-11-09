import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./UbicacionLugar", () => ({ default: ({ lugar }) => <div data-testid="ubicacion">{lugar?.nombre}</div> }));
vi.mock("./Miniatura", () => ({ default: ({ nombre }) => <span>{`mini:${nombre}`}</span> }));
vi.mock("./BarraCupo", () => ({
    default: ({ ocupacion }) => <div data-testid="cupo">{ocupacion ? "con-cupo" : "sin-datos"}</div>,
}));

import TarjetaEdicion from "./TarjetaEdicion";

const feria = { id: 1, nombreFeria: "Feria Andina" };
const lugar = { id: 2, nombre: "Plaza Mayor", direccion: "Calle 1 # 2-3", latitud: 4.3, longitud: -74.3 };

const enCurso = { id: 10, idLugar: 2, fechaInicio: "2026-11-01", fechaFin: "2026-11-30" };
const proxima = { id: 11, idLugar: 2, fechaInicio: "2026-12-01", fechaFin: "2026-12-03" };
const finalizada = { id: 12, idLugar: 2, fechaInicio: "2026-10-01", fechaFin: "2026-10-03" };

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 8, 12, 0, 0));
});
afterEach(() => vi.useRealTimers());

function montar(propiedades = {}) {
    const alternar = vi.fn();
    const solicitar = vi.fn();
    const resultado = render(
        <MemoryRouter>
            <TarjetaEdicion
                feria={feria}
                edicion={proxima}
                lugar={lugar}
                ocupacion={{ cupoMaximo: 10, aprobados: 2, disponibles: 8 }}
                rolUsuario={null}
                estadoSolicitud={null}
                solicitando={false}
                aviso={null}
                abierta={false}
                participantes={[]}
                cargandoParticipantes={false}
                onSolicitar={solicitar}
                onAlternar={alternar}
                {...propiedades}
            />
        </MemoryRouter>
    );
    return { alternar, solicitar, ...resultado };
}

describe("TarjetaEdicion: sin edición", () => {
    it("indica que la feria aún no tiene ediciones", () => {
        montar({ edicion: undefined });

        expect(screen.getByRole("heading", { name: "Feria Andina" })).toBeInTheDocument();
        expect(screen.getByText("Sin ediciones")).toBeInTheDocument();
        expect(screen.getByText(/Aún no hay ediciones programadas/)).toBeInTheDocument();
    });
});

describe("TarjetaEdicion: datos de la edición", () => {
    it("muestra el estado según las fechas", () => {
        const { unmount } = montar({ edicion: enCurso });
        expect(screen.getByText("En curso")).toBeInTheDocument();
        unmount();

        const segunda = montar({ edicion: proxima });
        expect(screen.getByText("Próxima")).toBeInTheDocument();
        segunda.unmount();

        montar({ edicion: finalizada });
        expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("muestra fechas, lugar, dirección y el mapa del lugar", () => {
        montar();

        expect(screen.getByText(/2026/)).toBeInTheDocument();
        expect(screen.getAllByText("Plaza Mayor").length).toBeGreaterThan(0);
        expect(screen.getByText("Calle 1 # 2-3")).toBeInTheDocument();
        expect(screen.getByTestId("ubicacion")).toBeInTheDocument();
        expect(screen.getByTestId("cupo")).toHaveTextContent("con-cupo");
    });

    it("si el lugar no se encontró usa un nombre de respaldo y no muestra dirección", () => {
        montar({ lugar: undefined });

        expect(screen.getByText("Lugar #2")).toBeInTheDocument();
    });

    it("un lugar sin dirección no muestra la línea de dirección", () => {
        montar({ lugar: { ...lugar, direccion: "" } });

        expect(screen.queryByText("Calle 1 # 2-3")).not.toBeInTheDocument();
    });
});

describe("TarjetaEdicion: pie de la tarjeta", () => {
    it("a un visitante le invita a iniciar sesión", () => {
        montar();

        expect(screen.getByRole("link", { name: "Inicia sesión" })).toHaveAttribute("href", "/login");
    });

    it("una edición finalizada lo dice y no ofrece solicitar", () => {
        montar({ edicion: finalizada, rolUsuario: "ARTESANO" });

        expect(screen.getByText("Esta edición ya finalizó.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Solicitar/ })).not.toBeInTheDocument();
    });

    it("un administrador no ve el enlace de iniciar sesión ni el botón de solicitar", () => {
        montar({ rolUsuario: "ADMINISTRADOR" });

        expect(screen.queryByRole("link", { name: "Inicia sesión" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Solicitar/ })).not.toBeInTheDocument();
    });

    it.each([
        ["PENDIENTE", "Solicitud pendiente"],
        ["APROBADA", "Participas en esta edición"],
        ["RECHAZADA", "Solicitud rechazada"],
    ])("un artesano con solicitud %s ve la insignia %s y no puede volver a solicitar", (estado, texto) => {
        montar({ rolUsuario: "ARTESANO", estadoSolicitud: estado });

        expect(screen.getByText(texto)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Solicitar/ })).not.toBeInTheDocument();
    });
});

describe("TarjetaEdicion: solicitar participación", () => {
    it("un artesano sin solicitud puede solicitar", () => {
        const { solicitar } = montar({ rolUsuario: "ARTESANO" });

        fireEvent.click(screen.getByRole("button", { name: "Solicitar participación" }));

        expect(solicitar).toHaveBeenCalledTimes(1);
    });

    it("mientras envía muestra Enviando y se deshabilita", () => {
        montar({ rolUsuario: "ARTESANO", solicitando: true });

        expect(screen.getByRole("button", { name: /Enviando/ })).toBeDisabled();
    });

    it("con el cupo lleno muestra Cupo completo y no deja solicitar", () => {
        montar({ rolUsuario: "ARTESANO", ocupacion: { cupoMaximo: 5, aprobados: 5, disponibles: 0 } });

        expect(screen.getByRole("button", { name: "Cupo completo" })).toBeDisabled();
    });

    it("muestra el aviso recibido", () => {
        montar({ rolUsuario: "ARTESANO", aviso: { tipo: "error", texto: "No se pudo enviar." } });

        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo enviar.");
    });
});

describe("TarjetaEdicion: participantes", () => {
    it("el botón alterna la lista", () => {
        const { alternar } = montar();

        fireEvent.click(screen.getByRole("button", { name: "Ver participantes" }));

        expect(alternar).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "Ver participantes" })).toHaveAttribute("aria-expanded", "false");
    });

    it("abierta cambia el texto del botón", () => {
        montar({ abierta: true });

        expect(screen.getByRole("button", { name: "Ocultar participantes" })).toHaveAttribute("aria-expanded", "true");
    });

    it("mientras carga los participantes muestra esqueletos y no el mensaje de vacío", () => {
        montar({ abierta: true, cargandoParticipantes: true });

        expect(screen.getByText("Artesanos participantes")).toBeInTheDocument();
        expect(screen.queryByText(/Aún no hay artesanos confirmados/)).not.toBeInTheDocument();
    });

    it("sin participantes lo explica", () => {
        montar({ abierta: true });

        expect(screen.getByText("Aún no hay artesanos confirmados en esta edición.")).toBeInTheDocument();
    });

    it("lista participantes con descripción y productos con su precio", () => {
        montar({
            abierta: true,
            participantes: [
                {
                    id: 7,
                    nombreEmprendimiento: "Cerámicas Ana",
                    descripcionCorta: "Vasijas a mano",
                    logo: null,
                    productos: [{ id: 1, nombre: "Vasija", precio: 25000, imagen: null }],
                },
                { id: 8, nombreEmprendimiento: "Telares Luis", descripcionCorta: "", logo: null, productos: [] },
            ],
        });

        expect(screen.getByRole("heading", { name: "Cerámicas Ana" })).toBeInTheDocument();
        expect(screen.getByText("Vasijas a mano")).toBeInTheDocument();
        expect(screen.getByText("Vasija")).toBeInTheDocument();
        expect(screen.getByText(/^\$25[.,]000$/)).toBeInTheDocument();
        expect(screen.getByText("Sin productos publicados.")).toBeInTheDocument();
    });
});
