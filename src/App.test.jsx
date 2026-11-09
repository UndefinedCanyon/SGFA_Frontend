import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./routes/AppRoutes", () => ({ default: () => <p>rutas</p> }));
vi.mock("./context/AuthContext", () => ({
    AuthProvider: ({ children }) => <div data-testid="proveedor-auth">{children}</div>,
}));
vi.mock("./App.css", () => ({}));

import App from "./App";

describe("App", () => {
    it("envuelve las rutas con el proveedor de autenticación", () => {
        render(<App />);

        expect(screen.getByTestId("proveedor-auth")).toContainElement(screen.getByText("rutas"));
    });
});
