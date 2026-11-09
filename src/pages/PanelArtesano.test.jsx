import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { instalarDialogo } from "../test/dialogo";

vi.mock("../services/api", () => ({
    consultarMisProductos: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn(),
    consultarMisSolicitudes: vi.fn(),
    consultarFerias: vi.fn(),
    consultarEdicionesFeria: vi.fn(),
    consultarLugares: vi.fn(),
    subirImagenProducto: vi.fn(),
    quitarImagenProducto: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../utils/imagenes", () => ({ prepararImagen: vi.fn() }));
vi.mock("../components/MiPerfil", () => ({ default: () => <div>perfil-mock</div> }));
vi.mock("../components/SelectorImagen", () => ({
    default: (p) => (
        <div>
            <span>{`selector:${p.nombre}`}</span>
            <button onClick={() => p.onSubir("archivo-nuevo")}>{`subir-${p.nombre}`}</button>
            <button onClick={() => p.onQuitar()}>{`quitar-${p.nombre}`}</button>
            <button onClick={() => p.onError("Foto inválida")}>{`error-${p.nombre}`}</button>
        </div>
    ),
}));

import PanelArtesano from "./PanelArtesano";
import {
    actualizarProducto, consultarEdicionesFeria, consultarFerias, consultarLugares, consultarMisProductos,
    consultarMisSolicitudes, crearProducto, eliminarProducto, quitarImagenProducto, subirImagenProducto,
} from "../services/api";
import { prepararImagen } from "../utils/imagenes";
import { useAuth } from "../context/AuthContext";

const productos = [
    { id: 1, nombre: "Mochila", precio: 85000, cantidad: 3, imagen: null },
    { id: 2, nombre: "Sombrero", precio: 40000, cantidad: 1, imagen: null },
    { id: 3, nombre: "Ruana", precio: 120000, cantidad: 0, imagen: null },
];
const solicitudes = [
    { id: 1, idEdicionFeria: 10, estado: "APROBADA", fechaInscripcion: "2026-10-01" },
    { id: 2, idEdicionFeria: 10, estado: "PENDIENTE", fechaInscripcion: "2026-10-05" },
    { id: 3, idEdicionFeria: 99, estado: "RECHAZADA", fechaInscripcion: "2026-09-01" },
    { id: 4, idEdicionFeria: 11, estado: "PENDIENTE", fechaInscripcion: "2026-10-09" },
];

beforeEach(() => {
    vi.clearAllMocks();
    instalarDialogo();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.mockReturnValue({ usuario: { nombre: "Rosa", token: "tok" } });
    consultarMisProductos.mockResolvedValue(productos);
    consultarMisSolicitudes.mockResolvedValue(solicitudes);
    consultarFerias.mockResolvedValue([{ id: 1, nombreFeria: "Feria Andina" }]);
    consultarEdicionesFeria.mockResolvedValue([
        { id: 10, idFeria: 1, idLugar: 1, fechaInicio: "2026-11-01", fechaFin: "2026-11-03" },
        { id: 11, idFeria: 5, idLugar: 5, fechaInicio: "2026-12-01", fechaFin: "2026-12-03" },
    ]);
    consultarLugares.mockResolvedValue([{ id: 1, nombre: "Plaza Mayor" }]);
    crearProducto.mockResolvedValue({ id: 50 });
    actualizarProducto.mockResolvedValue({});
    eliminarProducto.mockResolvedValue(undefined);
    subirImagenProducto.mockResolvedValue(undefined);
    quitarImagenProducto.mockResolvedValue(undefined);
    prepararImagen.mockResolvedValue("foto-lista");
});

async function montar() {
    render(<MemoryRouter><PanelArtesano /></MemoryRouter>);
    await screen.findByText("Mochila");
}

const irASolicitudes = () => fireEvent.click(screen.getByRole("tab", { name: /Solicitudes/ }));

function llenar(nombre = "Cesta", precio = "15000", cantidad = "4") {
    fireEvent.change(screen.getByLabelText(/Nombre del producto/), { target: { name: "nombre", value: nombre } });
    fireEvent.change(screen.getByLabelText(/Precio/), { target: { name: "precio", value: precio } });
    fireEvent.change(screen.getByLabelText(/Cantidad disponible/), { target: { name: "cantidad", value: cantidad } });
}

describe("PanelArtesano: carga y resumen", () => {
    it("saluda y carga productos, solicitudes y referencias con el token", async () => {
        await montar();

        expect(screen.getByText(/Hola, Rosa/)).toBeInTheDocument();
        expect(consultarMisProductos).toHaveBeenCalledWith("tok");
        expect(consultarMisSolicitudes).toHaveBeenCalledWith("tok");
        expect(consultarFerias).toHaveBeenCalled();
    });

    it("muestra las estadísticas y los contadores de pestañas", async () => {
        await montar();

        const valor = (t) => screen.getByText(t, { selector: "p" }).nextElementSibling.textContent;
        expect(valor("Productos")).toBe("3");
        expect(valor("Pendientes")).toBe("2");
        expect(valor("Aprobadas")).toBe("1");
        expect(screen.getByRole("tab", { name: /Mis productos/ })).toHaveTextContent("3");
        expect(screen.getByRole("tab", { name: /Solicitudes/ })).toHaveTextContent("2");
    });

    it("muestra precio, unidades en singular/plural y la insignia de agotado", async () => {
        await montar();

        expect(screen.getByText("$85.000")).toBeInTheDocument();
        expect(screen.getByText("3 unidades disponibles")).toBeInTheDocument();
        expect(screen.getByText("1 unidad disponible")).toBeInTheDocument();
        expect(screen.getByText("Agotado")).toBeInTheDocument();
    });

    it("sin productos invita a agregar el primero", async () => {
        consultarMisProductos.mockResolvedValue([]);
        render(<MemoryRouter><PanelArtesano /></MemoryRouter>);

        expect(await screen.findByText("Aún no has registrado productos")).toBeInTheDocument();
    });

    it("si falla la carga de productos muestra el error", async () => {
        consultarMisProductos.mockRejectedValue(new Error("No se pudo cargar el catálogo."));
        render(<MemoryRouter><PanelArtesano /></MemoryRouter>);

        expect(await screen.findByText("No se pudo cargar el catálogo.")).toBeInTheDocument();
    });
});

describe("PanelArtesano: crear producto", () => {
    it("agrega el producto, avisa y recarga el catálogo", async () => {
        await montar();
        llenar("  Cesta  ", "15000", "4");

        fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

        expect(await screen.findByText('Producto "Cesta" agregado a tu catálogo.')).toBeInTheDocument();
        expect(crearProducto).toHaveBeenCalledWith({ nombre: "Cesta", precio: 15000, cantidad: 4 }, "tok");
        expect(subirImagenProducto).not.toHaveBeenCalled();
        expect(consultarMisProductos).toHaveBeenCalledTimes(2);
        expect(screen.getByLabelText(/Nombre del producto/)).toHaveValue("");
    });

    it("con foto la prepara y la sube al producto creado", async () => {
        await montar();
        llenar();
        const archivo = new File(["x"], "foto.png", { type: "image/png" });
        fireEvent.change(screen.getByLabelText(/Foto/), { target: { files: [archivo] } });

        fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

        await waitFor(() => expect(subirImagenProducto).toHaveBeenCalledWith(50, "foto-lista", "tok"));
        expect(prepararImagen).toHaveBeenCalledWith(archivo);
    });

    it("si la foto falla conserva el producto y lo explica", async () => {
        prepararImagen.mockRejectedValue(new Error("Formato no válido."));
        await montar();
        llenar();
        fireEvent.change(screen.getByLabelText(/Foto/), { target: { files: [new File(["x"], "f.png")] } });

        fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

        expect(await screen.findByText(/El producto se agregó, pero no se pudo subir la foto: Formato no válido\./)).toBeInTheDocument();
        expect(screen.queryByText(/agregado a tu catálogo/)).not.toBeInTheDocument();
    });

    it("si crear falla muestra el error y conserva el formulario", async () => {
        crearProducto.mockRejectedValue(new Error("Nombre duplicado."));
        await montar();
        llenar();

        fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

        expect(await screen.findByText("Nombre duplicado.")).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre del producto/)).toHaveValue("Cesta");
    });
});

describe("PanelArtesano: editar producto", () => {
    const editar = (nombre) => fireEvent.click(screen.getByRole("button", { name: `Editar ${nombre}` }));

    it("carga los datos en el formulario y oculta el campo de foto", async () => {
        await montar();

        editar("Mochila");

        expect(screen.getByText("Editar producto")).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre del producto/)).toHaveValue("Mochila");
        expect(screen.getByLabelText(/Precio/)).toHaveValue(85000);
        expect(screen.queryByLabelText(/Foto/)).not.toBeInTheDocument();
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it("guarda los cambios", async () => {
        await montar();
        editar("Mochila");

        fireEvent.change(screen.getByLabelText(/Cantidad disponible/), { target: { name: "cantidad", value: "9" } });
        fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

        expect(await screen.findByText('Producto "Mochila" actualizado.')).toBeInTheDocument();
        expect(actualizarProducto).toHaveBeenCalledWith(1, { nombre: "Mochila", precio: 85000, cantidad: 9 }, "tok");
        expect(screen.getByText("Agregar producto")).toBeInTheDocument();
    });

    it("cancelar vuelve al modo agregar", async () => {
        await montar();
        editar("Mochila");

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.getByText("Agregar producto")).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre del producto/)).toHaveValue("");
    });
});

describe("PanelArtesano: eliminar producto", () => {
    const pedirEliminar = (nombre) => fireEvent.click(screen.getByRole("button", { name: `Eliminar ${nombre}` }));

    it("pide confirmación y elimina", async () => {
        await montar();

        pedirEliminar("Sombrero");
        const dialogo = screen.getByRole("dialog");
        expect(dialogo).toHaveTextContent('Se eliminará "Sombrero" de tu catálogo');
        fireEvent.click(within(dialogo).getByRole("button", { name: "Eliminar" }));

        expect(await screen.findByText('Producto "Sombrero" eliminado.')).toBeInTheDocument();
        expect(eliminarProducto).toHaveBeenCalledWith(2, "tok");
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("eliminar el producto que se edita reinicia el formulario", async () => {
        await montar();
        fireEvent.click(screen.getByRole("button", { name: "Editar Sombrero" }));

        pedirEliminar("Sombrero");
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

        await screen.findByText('Producto "Sombrero" eliminado.');
        expect(screen.getByText("Agregar producto")).toBeInTheDocument();
    });

    it("cancelar no elimina", async () => {
        await montar();
        pedirEliminar("Sombrero");

        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));

        expect(eliminarProducto).not.toHaveBeenCalled();
    });

    it("si falla muestra el error", async () => {
        eliminarProducto.mockRejectedValue(new Error("Producto en uso."));
        await montar();
        pedirEliminar("Sombrero");

        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

        expect(await screen.findByText("Producto en uso.")).toBeInTheDocument();
    });
});

describe("PanelArtesano: fotos de los productos", () => {
    it("sube y quita fotos desde la tarjeta y recarga", async () => {
        await montar();

        fireEvent.click(screen.getByText("subir-Mochila"));
        await waitFor(() => expect(subirImagenProducto).toHaveBeenCalledWith(1, "archivo-nuevo", "tok"));
        await waitFor(() => expect(consultarMisProductos).toHaveBeenCalledTimes(2));

        fireEvent.click(screen.getByText("quitar-Mochila"));
        await waitFor(() => expect(quitarImagenProducto).toHaveBeenCalledWith(1, "tok"));
        await waitFor(() => expect(consultarMisProductos).toHaveBeenCalledTimes(3));
    });

    it("muestra los errores que reporta el selector", async () => {
        await montar();

        fireEvent.click(screen.getByText("error-Mochila"));

        expect(await screen.findByText("Foto inválida")).toBeInTheDocument();
    });
});

describe("PanelArtesano: solicitudes", () => {
    it("las ordena: pendientes (más recientes primero), aprobadas y rechazadas", async () => {
        await montar();
        irASolicitudes();

        const tarjetas = screen.getAllByRole("article").filter((a) => within(a).queryByText(/Solicitada el/));
        const estados = tarjetas.map((a) => ["Pendiente", "Aprobada", "Rechazada"].find((e) => within(a).queryByText(e)));
        expect(estados).toEqual(["Pendiente", "Pendiente", "Aprobada", "Rechazada"]);
        expect(within(tarjetas[0]).getByText("Feria #5")).toBeInTheDocument();
    });

    it("describe la edición con feria, fechas y lugar, o textos de respaldo", async () => {
        await montar();
        irASolicitudes();

        await screen.findAllByText("Feria Andina");
        expect(screen.getAllByText(/Plaza Mayor/).length).toBeGreaterThan(0);
        expect(screen.getByText("Lugar #5", { exact: false })).toBeInTheDocument();
        expect(screen.getByText("Edición #99")).toBeInTheDocument();
        expect(screen.getByText("Esta edición ya no está publicada.")).toBeInTheDocument();
        expect(screen.getByText("Participas en esta edición.")).toBeInTheDocument();
    });

    it("si fallan las referencias igual muestra las solicitudes", async () => {
        consultarFerias.mockRejectedValue(new Error("caído"));
        await montar();
        irASolicitudes();

        expect(await screen.findAllByText(/Edición #10/)).not.toHaveLength(0);
    });

    it("sin solicitudes ofrece explorar ferias", async () => {
        consultarMisSolicitudes.mockResolvedValue([]);
        await montar();
        irASolicitudes();

        expect(await screen.findByText("Aún no has solicitado participar en ninguna feria")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Explorar ferias" })).toHaveAttribute("href", "/ferias");
    });

    it("si fallan las solicitudes muestra el error", async () => {
        consultarMisSolicitudes.mockRejectedValue(new Error("No se pudieron cargar las solicitudes."));
        await montar();
        irASolicitudes();

        expect(await screen.findByText("No se pudieron cargar las solicitudes.")).toBeInTheDocument();
    });
});

describe("PanelArtesano: perfil", () => {
    it("la pestaña Mi perfil muestra el componente de perfil", async () => {
        await montar();

        fireEvent.click(screen.getByRole("tab", { name: "Mi perfil" }));

        expect(screen.getByText("perfil-mock")).toBeVisible();
    });
});
