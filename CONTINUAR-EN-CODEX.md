# Continuar Aritos en Codex

## Estado al cerrar el POC

El usuario aceptó el POC el 19 de octubre de 2026. El setup inicial elegido es fuerza 75, resistencia 0.50 y modo Guardar al llegar a la base. Se conservan el modo clásico y las herramientas de laboratorio. TypeScript, build y las 16 pruebas pasaron con esta configuración.

Abrir esta carpeta como proyecto en Codex y leer `AGENTS.md`, `README.md`, `docs/requirements.md` y `POC_REPORT.md`. El informe distingue resultados históricos, comprobaciones locales y aceptación del usuario. Acordar el alcance de la siguiente iteración; no tratar los pendientes móviles como ya validados.

## Ejecución local

Requiere Node.js 22+ y pnpm 11.25.0.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm serve
```

Abrir http://127.0.0.1:8000/ en esta computadora. El servidor local evita caché; tras editar, construir y recargar. El encabezado muestra la revisión de compilación para confirmar qué versión está abierta.

Para sensores desde un dispositivo real, usar un origen HTTPS; el servidor local se limita a esta computadora. La aceptación del POC no valida permisos, calibración, multitáctil, cambios de orientación ni FPS en móviles reales.

## Contenido

Fuente TypeScript, pruebas, lockfile de dependencias, servidor local, requisitos e informe de validación. `node_modules/` y `dist/` se generan localmente y no se versionan. No publicar ni reemplazar el sitio original como parte del trabajo local.
