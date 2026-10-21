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
El informe conserva las seis pruebas históricas del 18 de octubre y las iteraciones del 19. Las 16 pruebas originales preservan el setup aceptado. La primera integración del 20 de octubre superó 53 pruebas (docs/validation/release.md). La integración tras la corrección de contraste musical tuvo 66 pruebas superadas (histórico); la suite actual tiene 130; ver docs/validation/polish-audio-art.md. El informe T01–T05 conserva la evidencia histórica de sus 42 pruebas. Distinguir siempre los resultados actuales de los históricos. Para servir localmente, usar `pnpm serve`: evita caché y muestra la revisión de compilación.
No afirmar que se validaron sensores, controles táctiles, FPS o apariencia sin probarlos en navegador/dispositivo real.

## Backlog de pulido registrado
El 20 de octubre el usuario celebró la primera versión y pidió agregar sus ideas al backlog, sin iniciar su implementación: T13–T20 en `docs/tasks/README.md`, con decisiones en `docs/requirements.md` sección 16. Separar efectos de recompensa y música por tema. Ancho, veinte aros y posiciones de estacas son comparaciones de laboratorio; no cambiar defaults sin elegir un candidato. La música amplía la restricción histórica de solo efectos y los stickers amplían de forma acotada la personalización. No lanzar agentes por el solo registro de tareas; conservar explícitos T09 auditivo y dispositivos reales pendientes.

T21–T23 agregan POCs planeados de presión variable, powerups con mascota y enemigos que añaden aros; ver sección 17. La medición de fuerza real no se presupone. Asistencia guiada/programada y objetivos dinámicos son excepciones experimentales explícitas; no relajar las reglas físicas ni el conteo de la versión normal. Mantener los dos powerups diferenciados y conservar el progreso ya guardado al añadir aros. Ningún agente ni implementación se inicia por este registro.

El usuario después seleccionó T14/T15/T16 para esta tanda, con POCs pospuestos: las tres implementaciones están integradas (build a3889036, 66 pruebas); T14/T15 siguen en revisión auditiva y T16 vuelve a revisión tras reemplazar los fondos de océano/capibaras que el usuario rechazó. Ver docs/validation/art-refresh.md; las ilustraciones PNG están empaquetadas localmente y los prompts están en docs/art/. La música y los fondos son originales/locales. Preservar silencio global y el toggle de música independiente, y no confundir activación de una muestra con aceptación acústica.

El usuario reportó que la música de los temas se percibía igual. Se verificó el cambio correcto de buffer y se reprodujo un inicio PCM idéntico entre océano/espacio. La corrección 76c890a diferencia tempo, compás, registro e instrumento, y cada tema nuevo empieza su frase; pausa/mute/reinicio conservan posición. Revisión acústica del nuevo candidato sigue pendiente.

El usuario aprobó los fondos ilustrados de océano y capibaras y pidió equiparar espacio. Los tres fondos son ahora PNG locales generados, con prompts en docs/art/rear-scenes-v2-prompts.json. Mantener ese acabado y la zona central despejada; no reemplazarlos por placeholders geométricos. Espacio queda listo para revisión visual del usuario.

## Pendientes prioritarios
El jugador normal está en `/`; el POC está en `/lab.html` y la vista de pruebas en `/preview.html?scene=stack`. T01–T08 y T10–T12 tienen implementación/evidencia integradas. T09 está integrado y probado automáticamente; queda revisión auditiva subjetiva. T06 terminó su baseline gratuito; la aceptación en dispositivos reales sigue pendiente. Usar pruebas automatizadas, DevTools y emuladores disponibles; acceso físico gratuito o prestado es opcional. No contratar servicios ni activar facturación. La falta de dispositivos deja evidencia pendiente, sin impedir el desarrollo ni el informe de pruebas; no declarar superada la aceptación móvil real. Sensores y calibración en Android/iOS; multitáctil; cambio de orientación; FPS y sesiones en dispositivos de referencia. El usuario ya aceptó la sensación de juego del POC con el setup indicado; no confundir esa aceptación con validación móvil completa. Seguir el protocolo manual de docs/POC_REPORT.md y usar el diagnóstico exportado.

Esta es una copia portátil del fuente. No contiene credenciales ni la identidad del alojamiento original. No publicar ni reemplazar el sitio alojado como parte de la validación local.


## Implementation planning

The English product specification is `docs/requirements.md`; player-facing copy remains Spanish. For future implementation assignments, read `docs/implementation-guide.md` and exactly the assigned card under `docs/tasks/`. Track ownership and status in `docs/tasks/README.md`. Preserve the accepted POC and follow the updated dependencies. T06 is a parallel, no-cost validation task, not a prerequisite for other implementation tasks; see requirements section 15. A prepared plan is not authorization to start tasks or agents, and completing one assigned card does not authorize taking another.

User-selected worker configuration: `gpt-6-luna`, reasoning effort `high`. Use it for assigned subagents; do not substitute models silently.


T17/T19 were selected next and are integrated in review: build a23155cf, 78 tests, docs/validation/themed-rings-stickers.md. Preserve appearance-only ring finishes and the requirements §19 first-victory-per-theme sticker rule. Decorative saves are global within this browser; preview uses a completely isolated nonpersistent sandbox. Editing has its own decoration pause and separate preloaded thumbnail/placed image nodes. User visual/reward feedback remains pending. T23 initially received feasibility review only; the later bounded manual encounter selection is recorded below and in requirements §21. Automatic enemy timing remains unauthorized.


The user then authorized all remaining POCs T13/T18/T20/T21/T22/T23. They are integrated in review in /lab.html, build2005c319 with130 passing tests: docs/validation/lab-experiments.md and requirements§20 supersede older planned/review-only timing. Use the mutually exclusive experiment selector for lab-only alternatives. Simulation.layout is per-instance; exported constants remain historical baseline. Normal pump strength is75; lab pulses clamp.5–1.5 and snapshot strength for.24s. Twenty-ring physical stack scene uses.35 spacing. Helpers are explicitly scripted with no direct scoring; thread needs clear peg, above may release over a pile. At this stage these were lab candidates, before the user's later normal-game selection below. Keep unavailable real-pressure/sensor/mobile/acoustic acceptance explicit.

El usuario seleccionó después la configuración normal de ancho 8 con estacas elevadas, las dos ayudas manuales de mascota y un encuentro manual con villano por ronda. Este cambio supersede las notas anteriores que mantenían estos candidatos solo en el laboratorio o preservaban el ancho 9 como default. Mantener doce aros iniciales, fuerza 75 y resistencia 0.50; no añadir controles normales de presión ni cambiar T18 a veinte aros. El villano añade físicamente uno o dos aros por ronda y el total no supera 14. Las ayudas no otorgan progreso directamente; el contacto físico normal decide. Ver requisitos §21 y docs/validation/selected-toy-integration.md (evidencia de integración pendiente; no declarar pruebas completadas). El ancho 9 con estacas al piso se conserva como referencia histórica del POC.


Normal integration is now recorded in `docs/validation/selected-toy-integration.md`, build20eb133f with145/145 passing tests. Use `PLAYER_TOY_SETTINGS` and `PLAYER_TOY_LAYOUT` in normal composition/rendering. The villain checks per-instance spawn and gravity fall corridors against walls, pegs, bases and supports; never restore peg-aligned fallback candidates. T18/T21 have returned to planned/deferred backlog after user review, with historical POCs retained. Normal manual mascots serialize; pause cancels pending encounters and freezes carried rings; restart restores12 and clears mascot state. The normal player controls are below the toy. Existing real-device/acoustic limitations remain.


October21 round-completion fix: build08cfeebd,147/147 tests, `docs/validation/round-completion.md`. `mountRoundResult` derives a persistent result and Nueva partida action from `snapshot.won`; transient celebration expiry must never remove the only completion/new-round UI. Reconcile visual celebration idempotently from won state, retain once-per-round effects, use actual dynamic targets, preserve stickers/preferences and reset mascots when starting again. Keep compact action fully visible and keyboard accessible. The earlier missing-celebration user report reproduced as four-second feedback expiry, not proven event loss.


October21 automatic linked villain supersedes older manual-only restrictions: normal play uses a random remaining-count threshold1–5, then a1–3 active-second delay, one successful appearance per round, exactly two already-linked physical rings (max14). Collect counts active rings; classic counts unthreaded. No late spawn at0/win, helper overlap or paused time. Keep per-member external safety/atomicity, silent one-second unsafe retries, real collection that frees the partner, and no artificial joint. Historical lab +1/+2 remain manual/unlinked. `docs/validation/automatic-linked-villain.md`, build004a48ef,158/158 tests.


October21 mobile redesign: requirements§24 and T24 authorize the compact normal-game UI. Build 019e6188, 160/160 tests; `docs/validation/mobile-interface.md` records ten desktop viewport checks and actual interactions. Compact play uses dynamic viewport height, pumps below the stage, and nonmodal tilt/mascot panels. Preserve both manual tilt axes and explicit sensor activation, sticky panel dismissal, round state across resize, persistent victory/new-game UI and the existing accepted physics. `fitToyCameraDistance` fits the acrylic shell while retaining 0.7° elevation. Do not restore permanently expanded mobile panels or fixed-height scenic margins. Physical Pixel acceptance and sensor/multitouch/FPS checks remain pending; the subsequent user request authorizes commit/push for dev-lab testing; deployment and physical Pixel review remain user follow-up.
