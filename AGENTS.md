# Aritos — instrucciones para Codex

Lee primero README.md, docs/requirements.md y docs/POC_REPORT.md.

## Objetivo actual
El usuario aceptó el POC de física del juguete de agua el 19 de octubre de 2026. El usuario reanudó los pendientes el 20 de octubre de 2026. Conservar el setup y las dos reglas al evolucionar el jugador y su laboratorio; consultar el tablero y el informe actual antes de repetir trabajo. TypeScript, Rapier 3D y Three.js. Usar motor existente; crear uno propio queda fuera del alcance.

## Reglas del producto
- El agujero del aro debe existir en la colisión; ensartado y extracción físicos, sin teletransporte ni fijación artificial.
- Bombeo de un impulso por pulsación, botones simultáneos e inclinación 3D completa con inversión.
- Celulares y tablets, horizontal y vertical; sensores con calibración y alternativa manual.
- La configuración de botones pertenece al modelo del juguete. Los temas se separan de la mecánica.
- Conservar la física aceptada. Por decisión del usuario del 19 de octubre de 2026, T06 usa herramientas gratuitas y se ejecuta en paralelo: no bloquea interfaz, temas, audio, mascotas ni integración. Mantener explícitas las comprobaciones móviles reales pendientes.

## Setup aceptado
- Fuerza de bombeo 75 y resistencia del agua 0.50 como valores iniciales.
- Depósito con fondo interior 1.8, bases apoyadas en el piso y chorros laterales bajos.
- Modo inicial Guardar: retirar el aro tras ensartado y contacto con la base durante 0.12 s activos; progreso acumulado. Mantener el clásico separado y disponible.
- Los botones de bombeo quedan bajo el depósito. Los controles de cámara pertenecen solo al POC.

## Verificación
Node.js 22+ y pnpm 11.25.0. Ejecutar pnpm install, pnpm typecheck, pnpm test y pnpm build.
El informe conserva las seis pruebas históricas del 18 de octubre y las iteraciones del 19. Las 16 pruebas originales preservan el setup aceptado. La suite actual tiene 53 pruebas superadas tras la integración del 20 de octubre; ver docs/validation/release.md. El informe T01–T05 conserva la evidencia histórica de sus 42 pruebas. Distinguir siempre los resultados actuales de los históricos. Para servir localmente, usar `pnpm serve`: evita caché y muestra la revisión de compilación.
No afirmar que se validaron sensores, controles táctiles, FPS o apariencia sin probarlos en navegador/dispositivo real.

## Pendientes prioritarios
El jugador normal está en `/`; el POC está en `/lab.html` y la vista de pruebas en `/preview.html?scene=stack`. T01–T08 y T10–T12 tienen implementación/evidencia integradas. T09 está integrado y probado automáticamente; queda revisión auditiva subjetiva. T06 terminó su baseline gratuito; la aceptación en dispositivos reales sigue pendiente. Usar pruebas automatizadas, DevTools y emuladores disponibles; acceso físico gratuito o prestado es opcional. No contratar servicios ni activar facturación. La falta de dispositivos deja evidencia pendiente, sin impedir el desarrollo ni el informe de pruebas; no declarar superada la aceptación móvil real. Sensores y calibración en Android/iOS; multitáctil; cambio de orientación; FPS y sesiones en dispositivos de referencia. El usuario ya aceptó la sensación de juego del POC con el setup indicado; no confundir esa aceptación con validación móvil completa. Seguir el protocolo manual de docs/POC_REPORT.md y usar el diagnóstico exportado.

Esta es una copia portátil del fuente. No contiene credenciales ni la identidad del alojamiento original. No publicar ni reemplazar el sitio alojado como parte de la validación local.


## Implementation planning

The English product specification is `docs/requirements.md`; player-facing copy remains Spanish. For future implementation assignments, read `docs/implementation-guide.md` and exactly the assigned card under `docs/tasks/`. Track ownership and status in `docs/tasks/README.md`. Preserve the accepted POC and follow the updated dependencies. T06 is a parallel, no-cost validation task, not a prerequisite for other implementation tasks; see requirements section 15. A prepared plan is not authorization to start tasks or agents, and completing one assigned card does not authorize taking another.

User-selected worker configuration: `gpt-6-luna`, reasoning effort `high`. Use it for assigned subagents; do not substitute models silently.
