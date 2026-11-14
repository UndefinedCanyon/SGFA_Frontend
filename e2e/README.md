# Pruebas end to end (Playwright)

Corren contra el stack real de Docker Compose (MySQL, backend, frontend y Mailpit).

```powershell
# 1. Levantar el stack. Con ASISTENTE_PROVEEDOR=falso el asistente de IA usa el modo demostración
#    (sin internet ni cuota de Gemini), así las pruebas son siempre iguales.
cd C:\dev\SGFA_Backend
$env:ASISTENTE_PROVEEDOR = "falso"
docker compose up -d --build

# 2. Ejecutar las pruebas
cd C:\dev\SGFA_Frontend
npx playwright test

# 3. Ver el informe si algo falla
npx playwright show-report
```

Usuarios de ejemplo (de `database/data.sql`): `admin@sgfa.com / admin123` y `maria@correo.com / clave123`.
