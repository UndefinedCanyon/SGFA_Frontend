# SGFA – Frontend

Interfaz web del **Software de Gestión para Ferias Artesanales (SGFA)**, desarrollado en la Universidad de Cundinamarca para centralizar la gestión de las ferias artesanales de Fusagasugá.

Backend: [SGFA_Backend](https://github.com/UndefinedCanyon/SGFA_Backend)

**Integrantes:** Jonhatan Emmanuel Alvarado Zamora · Juan David Cañon Vanegas

## Tecnologías

React · Vite · React Router · Tailwind CSS · nginx (en Docker) · GitHub Actions

## Estructura

```
src/
├── components/     Componentes de las pantallas y componentes base (components/ui)
├── context/        AuthContext: sesión del usuario y token JWT (se guarda en localStorage)
├── layout/         Header, pie de página y estructura común de las páginas
├── pages/          Inicio, Login, Registro, Ferias y los paneles de artesano y administrador
├── routes/         Rutas y protección por rol (RutaProtegida)
├── services/       api.js: todas las llamadas HTTP al backend
└── utils/          Funciones auxiliares (fechas, precios, búsqueda)
```

## Cómo ejecutarlo

Con **Docker**, sigue las instrucciones del backend: el `docker compose` de [SGFA_Backend](https://github.com/UndefinedCanyon/SGFA_Backend) levanta también este frontend en http://localhost:5173.

**Sin Docker** (necesitas Node 22 y el backend corriendo en http://localhost:8080):

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run dev
```

La aplicación queda en http://localhost:5173.

## Variables de entorno

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | Dirección del API |

Vite lee esta variable **al compilar**. Si la cambias, reinicia `npm run dev`. En Docker se pasa como argumento de construcción.

## Roles y pantallas

| Acceso | Pantallas |
|---|---|
| Público | Inicio, Ferias (ediciones, cupo y participantes), Registro, Login |
| Artesano | `/mi-panel`: productos, solicitudes de participación y perfil |
| Administrador | `/admin`: solicitudes, ferias y ediciones, artesanos y lugares |

Para entrar con los usuarios de ejemplo, consulta el README del backend.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la compilación localmente |

## Flujo de trabajo

Ramas: `desarrollo` → `preproduccion` → `main`. En cada push y pull request, GitHub Actions compila el proyecto con `npm run build` y construye la imagen Docker.