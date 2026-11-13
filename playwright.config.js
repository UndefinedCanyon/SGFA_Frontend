import { defineConfig, devices } from "@playwright/test";

// Las pruebas end to end corren contra el stack real de Docker Compose
// (base de datos MySQL, backend, frontend y Mailpit). Antes de ejecutarlas:
//   cd C:\dev\SGFA_Backend ; docker compose up -d --build
export default defineConfig({
    testDir: "./e2e",
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
        locale: "es-CO",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
