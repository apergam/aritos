# Resultado del POC — 18 de octubre de 2026

## Resultado técnico

Rapier queda como candidato viable en las pruebas automáticas ejecutadas. El POC utiliza Three.js para representación. No se implementó un motor propio ni se reemplazó el ensartado por una animación.

Seis pruebas pasaron en Node.js/Linux usando los mismos módulos físicos que el navegador:

| Prueba | Resultado |
| --- | --- |
| Aro alineado frente a desalineado | El alineado termina ensartado; el otro no cuenta. |
| Profundidad | El aro apartado del eje en Z no cuenta por superposición frontal. |
| Apilado e inversión | Doce aros se apilan; al invertir salen; siguen existiendo los doce. |
| Bombeo localizado | El aro junto al chorro sube más que el del lado opuesto; el pulso termina. |
| Orientación y calibración | Vectores de gravedad normal, invertida, frontal, lateral y horizontal, y calibración de postura. |
| Duración | 600 segundos simulados, 72 000 pasos, con bombeos e inclinación, sin escapes ni valores inválidos. |

La primera ejecución completa tardó 39.806 segundos en la prueba de duración: media de 0.553 ms por paso en este entorno de ejecución, excluyendo representación gráfica. Es una medición del motor en este servidor, no una promesa de FPS en teléfono.

Compilación estática y comprobación TypeScript superadas. Tras revisar las coordenadas del sensor se corrigió el signo del eje lateral y se añadió su comprobación específica.

## Qué sigue sin comprobar

- Apariencia e interacciones en navegador: el supervisor de vista previa no pudo arrancar por un fallo de infraestructura (`bwrap: Can't mount proc`). No se sustituyó esa infraestructura.
- Permisos y datos reales de orientación, calibración cómoda y cambio de orientación en Android/iOS.
- Multitáctil y controles simultáneos en una pantalla real.
- 30/60 FPS incluyendo dibujo, interfaz y sensores; usar el diagnóstico para registrar los dispositivos concretos.
- Sensación de agua y diversión. Requiere probar y ajustar fuerza, resistencia y geometría con el usuario.
- Completar manualmente los doce aros desde juego libre. Las escenas controladas demuestran capacidad geométrica, no dificultad equilibrada del juego completo.

## Protocolo manual sugerido

1. En “Caída y choque”, esperar nueve segundos. Debe quedar uno ensartado y otro fuera.
2. En “Profundidad”, esperar nueve segundos; solo cuenta el aro que pasa por el eje.
3. En “Apilar y extraer”, esperar ocho segundos; deben contar doce. Pulsar “Boca abajo” y esperar nueve segundos; deben contar cero sin perder piezas.
4. En juego libre, bombear por lados, probar ambas entradas a la vez y repetir con el modelo de un botón.
5. Inclinar lateralmente y en profundidad; probar inversión manual y mediante sensores cuando estén disponibles.
6. Abrir en vertical/horizontal, pausar y cambiar de pestaña. Los aros no deben avanzar de golpe al volver.
7. Jugar diez minutos en el dispositivo de referencia y descargar el diagnóstico. Registrar modelo, sistema y navegador junto con los FPS.

No se considera superada la aceptación móvil completa hasta realizar este protocolo y validar la sensación con el usuario.


## Actualización local — 19 de octubre de 2026: profundidad

El ajuste de cámara anterior no había cambiado el fondo físico. Se redujo el interior del depósito de 3.3 a 1.8 unidades, manteniendo el diámetro exterior de los aros en 1.3. Paredes, carcasa, fondo, rejilla y cristal frontal usan ahora la misma semiprofundidad `TANK.z`. No se añadieron fuerzas de centrado, bloqueos, teletransportes ni cambios en la detección de ensartado.

Reproducción antes del cambio: `node --import tsx --test --test-name-pattern='Depósito poco profundo' tests/physics.test.ts` falló porque un aro horizontal alineado desde Z=-0.98 cayó por detrás de la estaca. Después del cambio, la misma prueba pasa desde las cinco posiciones muestreadas en el margen Z disponible para ese aro. Esto comprueba la caída controlada; no garantiza ensartado para cualquier posición lateral u orientación.

La escena “Profundidad” coloca ahora el aro desalineado en Z=0.55 y vertical, de modo que cabe dentro del nuevo depósito y puede pasar por delante sin recibir progreso falso. No se conserva la antigua colocación en Z=1.02 porque quedaría fuera del depósito reducido.

Validación de esta actualización:

- `pnpm typecheck` y `pnpm build`: superados.
- `pnpm test`: nueve pruebas superadas, incluidas las seis anteriores, la caída desde cinco posiciones Z, la contención hacia delante/atrás y el arranque de las cuatro escenas sin solapar las paredes de profundidad.
- La prueba de diez minutos simulados completó 72 000 pasos sin escapes ni NaN. Medición local del motor: 23.44 s de ejecución, media de 0.326 ms por paso; no acredita rendimiento móvil.
- En el navegador integrado, servido desde localhost: se observa la etiqueta “FONDO 1.8 · ARO 1.3”, el depósito reducido y un aro ensartado en “Caída y choque”; la vista elevada a 15° sigue funcionando.

Sigue pendiente validar con el usuario si la reducción mejora suficientemente la lectura y la dificultad del juego libre, además de las pruebas en móviles reales descritas arriba. El ángulo predeterminado no se modificó; se mantienen los controles del POC para elegirlo.


## Actualización local — 19 de octubre de 2026: bases sobre el piso

Las dos bases se bajaron hasta apoyar en el piso interior (Y=-6). La cara superior queda en Y=-5.7 y las puntas en Y=-1.35, conservando los 4.35 de longitud de las estacas. Tanto los cuerpos de colisión como la representación usan `BASE` y `TIP`.

Se redistribuyeron los doce aros de juego libre para iniciar junto a las estacas sin interpenetrarlas ni invadir las bases. La prueba de bombeo coloca los aros por encima de las nuevas puntas para seguir midiendo un chorro sobre cuerpos libres.

TypeScript, build y las nueve pruebas superados; se conservan apilado de doce aros, extracción por inversión y diez minutos simulados sin escapes ni NaN. En el navegador integrado se verificó la posición de las bases sobre el piso y la escena de apilado. La profundidad interior continúa en 1.8 unidades.


## Actualización local — 19 de octubre de 2026: bombeo lateral bajo

Los botones de bombeo pasaron a una franja debajo del depósito, también en el modelo central. En el navegador integrado se comprobó que quedan fuera del área de representación tanto a 390×844 como a 1200×850, sin desbordamiento horizontal de la página. No equivale a validar multitáctil en un teléfono real.

Las salidas laterales están ahora en X=±4.2, Y=-5.25, Z=0, dirigidas hacia dentro y arriba (componentes horizontales ±0.48 y vertical 0.877). El modelo de un botón usa una salida central vertical. Durante el pulso se añade una corriente aproximada débil junto al piso que alimenta el lateral activo y levanta los aros acumulados en el centro. Ambas influencias terminan con el pulso de 0.24 s; no hay bombeo autónomo ni cambios a colisiones o ensartado.

La prueba de reproducción `node --import tsx --test --test-name-pattern='Cada lateral' tests/physics.test.ts` falló antes del cambio: un aro asentado en el centro del piso no ascendió con una pulsación izquierda. Con el nuevo flujo supera el umbral de ascenso de 0.35 unidades al medir 0.6 s después de pulsar cualquiera de los laterales; cada lateral también lo desplaza fuera del centro. La misma comprobación cubre pulsaciones simultáneas, que deben levantarlo aunque sus componentes horizontales se cancelen.

TypeScript, build y once pruebas superados, incluida la dirección hacia dentro/arriba de los dos laterales, la salida central, el apilado/extracción y diez minutos simulados sin escapes ni NaN. En el navegador se probaron los botones y el cambio entre ambos modelos, y se observaron las boquillas laterales y la respuesta al bombeo. Las burbujas siguen el eje principal del chorro; no representan una simulación completa de circulación.

Queda pendiente evaluar con el usuario el alcance, fuerza y sensación de circulación en una partida libre completa. El aro aislado del ensayo no demuestra que ninguna pila de doce aros pueda atascarse.


## Actualización local — 19 de octubre de 2026: guardar aros al llegar a la base

Se añadió el modo “Guardar al llegar a la base”, seleccionado inicialmente en el POC, separado del clásico según la nueva decisión registrada en `docs/requirements.md`, sección 13.

Para retirar un aro se exige detección de ensartado 3D y contacto físico con una base durante 0.12 segundos continuos de simulación activa. Se retiran su cuerpo rígido, colisiones y malla; suma al contador acumulado. El denominador conserva la cantidad inicial de la escena y el progreso no baja al bombear ni invertir. El contacto con el piso por sí solo no cuenta. El clásico conserva cuerpos, extracción y victoria tras dos segundos simultáneos.

Validación actual: TypeScript, build y 16 pruebas superados. Las cinco nuevas pruebas cubren retirada física y conservación de progreso, ausencia de retirada antes de tocar la base, superposición/piso sin progreso falso, victoria única y reinicio, y una sesión de 60 segundos con bombeo/inclinación que conserva guardados + activos = 12. La prueba histórica de diez minutos sigue pasando en modo clásico.

En el navegador integrado se comprobó “Caída y choque” con un aro retirado y contador 1/2, el cambio al clásico con aros visibles y la escena de apilado en modo Guardar con retirada sucesiva y contador final 12/12. No se observaron errores de consola durante esa comprobación. El nuevo modo queda pendiente de ajuste de sensación/dificultad mediante juego libre con el usuario y de las pruebas móviles reales.


## Ajuste elegido por el usuario — 19 de octubre de 2026

Tras jugar el POC, el usuario eligió fuerza de bombeo **75** y resistencia del agua **0.50**. Se fijaron como valores iniciales en la simulación y en los controles. Con esta configuración pasaron TypeScript, build y las 16 pruebas; en navegador se verificaron los valores al cargar la compilación `6bf2ef77`.


## Cierre del POC — 19 de octubre de 2026

El usuario dio por completo y aceptado el POC con el setup elegido: fuerza 75, resistencia 0.50 y modo inicial Guardar al llegar a la base. Quedan aceptados para este prototipo la profundidad reducida, las bases sobre el piso, la ubicación de botones, el bombeo lateral y la regla de progreso acumulado. Las anotaciones anteriores que pedían validación subjetiva del usuario quedan cubiertas por esta aceptación del POC; no constituyen una promesa de dificultad equilibrada para toda la versión completa.

Validación técnica final del fuente: 16 pruebas, TypeScript y build superados con ese setup. Las pruebas de sensores y rendimiento en móviles reales continúan pendientes y no se declaran superadas al cerrar este POC.
