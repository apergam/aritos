# Aritos — POC de física

Prototipo independiente para validar la sección 7 de la hoja de requisitos. TypeScript, Rapier 3D 0.19.3 y Three.js 0.180.0. No implementa todavía los temas, audio, mascotas, editor ni otros modos futuros.

## Estado del POC

Aceptado por el usuario el 19 de octubre de 2026 con fuerza de bombeo **75**, resistencia del agua **0.50** y modo inicial **Guardar al llegar a la base**. Incluye depósito de fondo 1.8, estacas apoyadas en el piso, chorros laterales bajos, botones bajo el depósito y controles de cámara exclusivos del laboratorio.

Las 16 pruebas automáticas, TypeScript y build pasaron con esta configuración; también se hicieron comprobaciones en el navegador integrado. La aceptación del POC no acredita sensores, multitáctil ni rendimiento en dispositivos móviles reales. Esas comprobaciones y el alcance del juego completo se mantienen separados; ver `POC_REPORT.md`.

## Ejecutar y construir

Requiere Node.js 22+ y pnpm 11.25.0.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm serve
```

Para probar en esta computadora, `pnpm serve` abre http://127.0.0.1:8000/ y evita la caché. Tras cambiar el fuente, ejecutar `pnpm build` y recargar. El encabezado muestra `POC / <revisión>`; CSS y JavaScript llevan esa misma revisión en su URL para evitar mezclar versiones.

Servir `dist/` mediante HTTPS para probar sensores en móvil. La salida es estática; no requiere backend. Los recursos JavaScript incluyen Rapier/WASM, sin CDN de dependencias. Las tipografías tienen respaldo de fuentes del sistema.

## Usar el POC

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
- P pausa. Cambiar de modelo o escena reinicia el experimento.
- “Ver formas de colisión” muestra los cuerpos físicos. No usar esa vista para medir rendimiento gráfico del modo normal.
- Panel “Solo POC / Cámara”: giro horizontal, elevación, distancia y altura del punto de mira; muestra posición X/Y/Z, punto de mira y distancia efectiva. “Desde arriba · 15°” permite comparar con “Vista original” sin reiniciar la física.
- “Copiar configuración” copia los ángulos, escala de distancia, posición, punto de mira, FOV y aspecto como JSON para elegir un futuro valor predeterminado. También se pueden seleccionar manualmente en “Valores para compartir”. La distancia se adapta a la pantalla sin restablecer el ángulo; recargar vuelve a la vista original. Estos controles son exclusivos del POC.
- “Descargar diagnóstico” exporta navegador, tamaño de pantalla, configuración de cámara, FPS medidos, coste de pasos físicos y parámetros de la sesión.

## Diseño de física

Un cuerpo rígido por aro, compuesto por veinte cápsulas alrededor de la circunferencia. La geometría de colisión conserva el agujero. Depósito cerrado con seis paredes y dos estacas cilíndricas con bases apoyadas en el piso interior. Las estacas conservan su longitud de 4.35 unidades; su posición física y visual se deriva de la altura del piso. El fondo interior es de 1.8 unidades frente a un diámetro exterior de aro de 1.3; paredes y representación comparten `TANK.z`. Se redujo desde 3.3 para limitar los fallos por profundidad difíciles de leer de frente, conservando rotación y movimiento 3D. La representación visual del aro es un toro.

Paso fijo a 120 Hz, máximo doce pasos por cuadro. Impulsos de bombeo durante 0.24 s con influencia espacial: penacho diagonal desde cada lateral bajo y retorno aproximado cerca del piso, activo solo durante el pulso. Se mantiene pequeño par de giro, gravedad efectiva reducida y amortiguación lineal/angular para aproximar el agua. `JETS` comparte origen y dirección entre física y representación; el diagnóstico incluye esta configuración. No se resuelve un fluido ni se desarrolla un motor propio. No hay teletransporte ni fijación de aros. En el modo Guardar, se retiran del motor únicamente tras ensartado y contacto físico continuado con la base; en el clásico no se retiran. El arranque de las escenas coloca piezas para cada experimento; después todas se mueven por física.

La detección de ensartado calcula la intersección del eje de la estaca con el plano del agujero del aro, comprueba la holgura radial y el intervalo de altura; no usa coincidencia en pantalla. En modo clásico, la celebración técnica exige dos segundos continuos con todos los aros ensartados. En modo Guardar, se celebra al retirar el último aro. Las escenas reducidas usan su cantidad inicial de aros como objetivo.

## Validación

Ver `POC_REPORT.md` y `tests/physics.test.ts`. La suite incluye la caída de un aro horizontal alineado desde cinco posiciones en todo su margen Z disponible, contención contra ambas paredes de profundidad y ausencia de solapamientos iniciales con ellas en las cuatro escenas. Las pruebas de motor en Node no acreditan FPS, permisos, tacto ni compatibilidad de un navegador/dispositivo real.
