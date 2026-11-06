# NexusArena

Plataforma web para organizar torneos universitarios de **League of Legends** y **Valorant**.
Proyecto final – JavaScript Avanzado (React 18 + Vite + React Router).

## Ejecutar en local
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # genera /dist para desplegar

Cuenta demo organizador: `organizador@demo.com` / `Demo1234`

## Arquitectura
    src/
      main.jsx            rutas (HashRouter) y arranque
      components/         Layout (header, menú, guarda por rol), forms (Field, Form, FormModal), GameBadge
      pages/              Home, Auth (login/registro), Profile, Tournaments, Teams
      lib/                capa de dominio, independiente de React:
        services.js         reglas de negocio y permisos
        validators.js       validaciones reutilizables
        storage.js          Repository sobre localStorage (reemplazable por API REST) + suscripción
        api.js              fetch() a Data Dragon (LoL) y valorant-api.com
        hooks.js            useDB (useSyncExternalStore), useCurrentUser, usePicks
        ui.js               toasts y utilidades

## Despliegue
`npm run build` y publicar `dist/` en GitHub Pages, Netlify o Vercel (usa HashRouter y `base: './'`, no requiere configuración extra).

## Alcance actual: hasta Sprint 2
Sprint 1: navegación, registro/login, perfil. Sprint 2: CRUD de torneos y equipos, inscripciones, validaciones, persistencia y consumo de APIs.
Pendiente: Sprint 3 (dashboard, resultados/brackets), Sprint 4 (calidad y despliegue).
