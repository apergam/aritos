# Aritos — instrucciones para Codex

Lee primero README.md, docs/requirements.md y POC_REPORT.md.

## Objetivo actual
El usuario aceptó el POC de física del juguete de agua el 19 de octubre de 2026. Conservar el resultado y acordar el alcance de la siguiente iteración antes de desarrollar el juego completo. TypeScript, Rapier 3D y Three.js. Usar motor existente; crear uno propio queda fuera del alcance.

## Reglas del producto
- El agujero del aro debe existir en la colisión; ensartado y extracción físicos, sin teletransporte ni fijación artificial.
- Bombeo de un impulso por pulsación, botones simultáneos e inclinación 3D completa con inversión.
- Celulares y tablets, horizontal y vertical; sensores con calibración y alternativa manual.
- La configuración de botones pertenece al modelo del juguete. Los temas se separan de la mecánica.
- No desarrollar temas, audio o mascotas antes de validar la física y la experiencia móvil.

## Setup aceptado
- Fuerza de bombeo 75 y resistencia del agua 0.50 como valores iniciales.
- Depósito con fondo interior 1.8, bases apoyadas en el piso y chorros laterales bajos.
- Modo inicial Guardar: retirar el aro tras ensartado y contacto con la base durante 0.12 s activos; progreso acumulado. Mantener el clásico separado y disponible.
- Los botones de bombeo quedan bajo el depósito. Los controles de cámara pertenecen solo al POC.

## Verificación
Node.js 22+ y pnpm 11.25.0. Ejecutar pnpm install, pnpm typecheck, pnpm test y pnpm build.
El informe conserva las seis pruebas históricas del 18 de octubre y las iteraciones del 19. La suite actual tiene 16 pruebas, superadas con el setup aceptado. Distinguir siempre los resultados actuales de los históricos. Para servir localmente, usar `pnpm serve`: evita caché y muestra la revisión de compilación.
No afirmar que se validaron sensores, controles táctiles, FPS o apariencia sin probarlos en navegador/dispositivo real.

## Pendientes prioritarios
Sensores y calibración en Android/iOS; multitáctil; cambio de orientación; FPS y sesiones en dispositivos de referencia. El usuario ya aceptó la sensación de juego del POC con el setup indicado; no confundir esa aceptación con validación móvil completa. Seguir el protocolo manual de POC_REPORT.md y usar el diagnóstico exportado.

Esta es una copia portátil del fuente. No contiene credenciales ni la identidad del alojamiento original. No publicar ni reemplazar el sitio alojado como parte de la validación local.
