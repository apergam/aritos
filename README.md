# Aritos — Aros al agua

Juego de aros al agua en el navegador, con TypeScript, Rapier 3D 0.19.3 y Three.js 0.180.0. Incluye interfaz de juego en español, dos modelos, tres temas, controles manuales/sensores, preferencias, audio sintetizado y celebraciones. Conserva el laboratorio físico como entrada separada. Sin cuentas, backend de partida ni temporizador.

## Estado actual

Aceptado por el usuario el 19 de octubre de 2026 con fuerza de bombeo **75**, resistencia del agua **0.50** y modo inicial **Guardar al llegar a la base**. Incluye depósito de fondo 1.8, estacas apoyadas en el piso, chorros laterales bajos, botones bajo el depósito y controles de cámara exclusivos del laboratorio.

Las 16 pruebas originales preservan el setup aceptado. La primera integración del 20 de octubre superó 53 pruebas. El pulido posterior de audio y fondos supera **64 pruebas**, TypeScript y build; ver [la revisión actual](docs/validation/polish-audio-art.md). Se comprobaron las doce combinaciones de modelo/tema/modo, seis tamaños de pantalla y el cambio de temas con el servidor detenido después de cargar; ver el [informe de preparación](docs/validation/release.md). La aceptación del POC no acredita sensores, multitáctil ni rendimiento en dispositivos móviles reales. Esas comprobaciones y el alcance del juego completo se mantienen separados; ver `docs/POC_REPORT.md`.

## Implementation planning

The [requirements](docs/requirements.md) are available in English, with their original IDs and POC amendments preserved. Read the [implementation guide](docs/implementation-guide.md) and [agent task board](docs/tasks/README.md) to plan the next iteration. Each task card defines ownership, dependencies, acceptance criteria, and verification. The user authorized implementation using `gpt-6-luna` with high reasoning effort. T01–T08 and T10–T12 have integrated implementation/evidence. T09 audio is integrated with automated lifecycle checks; subjective browser/device audition remains in review. T06 completed its free baseline, independently of unavailable physical devices. See the board and release report for exact evidence; no paid subscription or billing activation is allowed. Player-facing text remains in Spanish.

## Backlog de pulido

El usuario aprobó la primera versión visual el 20 de octubre. Se registraron [ocho tareas T13–T20](docs/tasks/README.md#polish-backlog--recorded-october-20) para sus siete ideas: ancho, sonido de recompensa, música por tema, ilustraciones traseras, aros temáticos, veinte aros, stickers y estacas en otras posiciones. El usuario seleccionó T14/T15/T16: están integradas, con sonido/música pendientes de revisión auditiva. Las demás siguen planeadas; los cambios físicos se compararán en el laboratorio. La música amplía el alcance anterior de solo efectos; ver [la decisión](docs/requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026).

Se añadieron [T21–T23](docs/tasks/README.md#pressure-and-arcade-backlog--recorded-october-20): presión variable en el POC, dos powerups con mascota acuática y un enemigo que añade uno o dos aros llamativos con música de villano. Quedan planeados como experimentos separados; ver [alcance y reglas pendientes](docs/requirements.md#17-variable-pressure-and-arcade-experiments--october-20-2026).

## Ejecutar y construir

Requiere Node.js 22+ y pnpm 11.25.0.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm serve
```

Para probar en esta computadora, `pnpm serve` sirve el juego en http://127.0.0.1:8000/ y el laboratorio en http://127.0.0.1:8000/lab.html, sin caché. Tras cambiar el fuente, ejecutar `pnpm build` y recargar. El laboratorio muestra `POC / <revisión>` y `/build.json` registra la revisión común; CSS y JavaScript llevan esa misma revisión en su URL para evitar mezclar versiones.

Servir `dist/` mediante HTTPS para probar sensores en móvil. La salida es estática; no requiere backend. Los recursos JavaScript incluyen Rapier/WASM, sin CDN de dependencias. Las tipografías tienen respaldo de fuentes del sistema.

## Entradas y juego

- `/`: selección de modelo, tema y modo, seguida de Jugar. Ajustes permite tema/sonido, pausa, ayuda, cambio de juguete y reinicio con confirmación. Cambiar el tema conserva la ronda; cambiar juguete vuelve a selección y crea otra al pulsar Jugar.
- `/lab.html`: laboratorio conservado, con escenas, cámara, parámetros físicos, colisiones y diagnóstico.
- `/preview.html?scene=stack`: vista de pruebas del jugador con escena física controlada; admite `free`, `drop`, `stack` y `depth`. Está separada de la entrada normal y sirve para comprobar victorias sin colocar aros desde el juego libre.
- Ajustes incluye sonido general, música por tema y sonido al guardar (Monedita/Chispas), con botón Escuchar. La música usa loops originales de unos 19 segundos, se activa al jugar y se pausa con la partida; reiniciar la ronda conserva su posición musical. Sonido general silencia música y efectos; música se puede apagar por separado. Las elecciones se recuerdan sin restaurar la ronda.
- Recursos de temas, ilustraciones del plástico posterior y mascotas SVG incluidos en el bundle; audio y música generados con Web Audio, sin grabaciones de terceros. No se requieren peticiones de red para seguir jugando/cambiar tema tras la carga. Esto no implementa PWA ni arranque en frío sin conexión.

## Usar el laboratorio

- Juego libre: doce aros sueltos y dos estacas.
- Modo inicial “Guardar al llegar a la base”: el aro debe ensartarse físicamente y tocar una base durante 0.12 s activos. Se retira su cuerpo y su dibujo, suma a “Guardados” y conserva ese progreso durante la partida. Tocar el piso fuera de las estacas no cuenta. Al guardar el último aro se completa el objetivo.
- “Clásico: mantener ensartados” conserva el comportamiento anterior: los aros siguen siendo físicos y deben estar todos ensartados durante dos segundos continuos. Cambiar modo reinicia la escena.
- Caída y choque: un aro alineado y otro desalineado.
- Apilar y extraer: doce aros alineados en dos pilas. En modo clásico, esperar a que asienten y pulsar “Boca abajo”. En modo Guardar, bajan hasta las bases y se retiran sucesivamente hasta llegar a 12/12.
- Profundidad: un aro horizontal alineado y otro vertical desplazado hacia delante, ambos dentro del depósito. La superposición frontal del segundo no cuenta como ensartado.
- Los botones de bombeo están debajo del depósito para no tapar los aros ni las bases.
- Dos salidas en los laterales bajos impulsan hacia dentro y arriba. Durante cada pulso se aproxima una corriente débil junto al piso para llevar aros del centro hacia el lateral activo. El modelo de un botón conserva su salida central. Las boquillas y las burbujas indican el origen y dirección principal.
- Un impulso por pulsación. Dos botones admiten multitáctil. Espacio activa ambos, A/D activa cada lado.
- Flechas inclinan lateralmente; W/S o arriba/abajo cambian inclinación hacia delante/atrás. Deslizadores y “Boca abajo” permiten invertir sin sensores.
- “Usar movimiento” solicita permiso si el navegador lo necesita y calibra la postura. “Centrar” vuelve a calibrar. Sin datos o permiso, continúa el control manual.
- P pausa. Reiniciar o cambiar modelo/escena conserva una pausa manual activa. Recargar recuerda el modelo elegido y crea una partida nueva en modo Guardar; no restaura aros ni progreso. El acceso a sensores siempre requiere activación explícita.
- “Ver formas de colisión” muestra los cuerpos físicos. No usar esa vista para medir rendimiento gráfico del modo normal.
- Panel “Solo POC / Cámara”: giro horizontal, elevación, distancia y altura del punto de mira; muestra posición X/Y/Z, punto de mira y distancia efectiva. “Desde arriba · 15°” permite comparar con “Vista original” sin reiniciar la física.
- “Copiar configuración” copia los ángulos, escala de distancia, posición, punto de mira, FOV y aspecto como JSON para elegir un futuro valor predeterminado. También se pueden seleccionar manualmente en “Valores para compartir”. La distancia se adapta a la pantalla sin restablecer el ángulo; recargar vuelve a la vista original. Estos controles son exclusivos del POC.
- “Descargar diagnóstico” exporta navegador, tamaño de pantalla, configuración de cámara, FPS medidos, coste de pasos físicos y parámetros de la sesión.

## Diseño de física

Un cuerpo rígido por aro, compuesto por veinte cápsulas alrededor de la circunferencia. La geometría de colisión conserva el agujero. Depósito cerrado con seis paredes y dos estacas cilíndricas con bases apoyadas en el piso interior. Las estacas conservan su longitud de 4.35 unidades; su posición física y visual se deriva de la altura del piso. El fondo interior es de 1.8 unidades frente a un diámetro exterior de aro de 1.3; paredes y representación comparten `TANK.z`. Se redujo desde 3.3 para limitar los fallos por profundidad difíciles de leer de frente, conservando rotación y movimiento 3D. La representación visual del aro es un toro.

Paso fijo a 120 Hz, máximo doce pasos por cuadro. Impulsos de bombeo durante 0.24 s con influencia espacial: penacho diagonal desde cada lateral bajo y retorno aproximado cerca del piso, activo solo durante el pulso. Se mantiene pequeño par de giro, gravedad efectiva reducida y amortiguación lineal/angular para aproximar el agua. `JETS` comparte origen y dirección entre física y representación; el diagnóstico incluye esta configuración. No se resuelve un fluido ni se desarrolla un motor propio. No hay teletransporte ni fijación de aros. En el modo Guardar, se retiran del motor únicamente tras ensartado y contacto físico continuado con la base; en el clásico no se retiran. El arranque de las escenas coloca piezas para cada experimento; después todas se mueven por física.

La detección de ensartado calcula la intersección del eje de la estaca con el plano del agujero del aro, comprueba la holgura radial y el intervalo de altura; no usa coincidencia en pantalla. En modo clásico, la celebración técnica exige dos segundos continuos con todos los aros ensartados. En modo Guardar, se celebra al retirar el último aro. Las escenas reducidas usan su cantidad inicial de aros como objetivo.

## Validación

Ver `docs/POC_REPORT.md` y `tests/physics.test.ts`. La suite incluye la caída de un aro horizontal alineado desde cinco posiciones en todo su margen Z disponible, contención contra ambas paredes de profundidad y ausencia de solapamientos iniciales con ellas en las cuatro escenas. Las pruebas de motor en Node no acreditan FPS, permisos, tacto ni compatibilidad de un navegador/dispositivo real.
