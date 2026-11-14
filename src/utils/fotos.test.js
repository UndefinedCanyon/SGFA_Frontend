import { describe, expect, it } from "vitest";
import { buscarFoto, fotoDe } from "./fotos";

describe("buscarFoto", () => {
    const mapa = {
        "../assets/fotos/hero.webp": "/assets/hero-abc.webp",
        "../assets/fotos/ferias.JPG": "/assets/ferias-def.jpg",
        "../assets/fotos/hero-viejo.png": "/assets/otro.png",
    };

    it("encuentra la foto por nombre sin importar la extensión", () => {
        expect(buscarFoto(mapa, "hero")).toBe("/assets/hero-abc.webp");
        expect(buscarFoto(mapa, "ferias")).toBe("/assets/ferias-def.jpg");
    });

    it("no confunde nombres parecidos ni devuelve fotos inexistentes", () => {
        expect(buscarFoto(mapa, "viejo")).toBeNull();
        expect(buscarFoto(mapa, "acceso")).toBeNull();
        expect(buscarFoto({}, "hero")).toBeNull();
    });
});

describe("fotoDe", () => {
    it("devuelve null cuando no hay fotos en src/assets/fotos", () => {
        expect(fotoDe("nombre-que-no-existe")).toBeNull();
    });
});
