# Aritos de agua — Hoja de requisitos
Versión 1.0 · 18 de octubre de 2026

Definición de producto obtenida mediante la entrevista grill-me. Nombre de trabajo, sin branding definitivo. Este documento define la primera versión; no implica que el juego ya esté implementado o probado.

## 1. Objetivo
Recrear en un navegador la experiencia del juguete de agua: presionar botones para impulsar aros, inclinar el depósito y ensartarlos en estacas. Debe sentirse como un objeto físico con profundidad, agua y piezas con volumen, manteniendo una dificultad entretenida.

La inclinación y el ensartado físico en 3D son fundamentales desde la primera versión. La sensación de agua será aproximada; no se requiere una simulación científica del fluido.

## 2. Alcance de la primera versión
- Juego clásico individual, sin límite de tiempo ni vidas.
- Navegador, principalmente para teléfonos y tablets; soporte funcional en computadora.
- Pantalla vertical y horizontal, conservando la partida al cambiar orientación.
- Dos modelos de juguete predefinidos: un botón central o dos botones laterales.
- Dos estacas y doce aros por partida.
- Temas océano, espacio y capibaras, compatibles con ambos modelos.
- Física 3D, cámara frontal fija, bombeo e inclinación.
- Sonidos discretos, pausa, ayuda, reinicio y preferencias locales.
- Celebración temática con mascota bailando y confeti.
- Acceso mediante enlace, sin cuentas ni servidor de partidas.

## 3. Flujo de uso
1. Abrir el enlace y cargar los recursos necesarios.
2. Elegir un modelo de juguete y un tema. Recuperar preferencias cuando existan; si no hay preferencias de modelo, ofrecer dos botones como selección inicial.
3. Mostrar una ayuda breve en español: bombear, inclinar y ensartar.
4. Ofrecer activación del control por movimiento. Solicitar permiso solo cuando el navegador lo requiera y desde una interacción explícita. Si no hay datos utilizables o se deniega, permitir jugar mediante controles alternativos.
5. Jugar sin temporizador. Se pueden alternar bombeos e inclinación o utilizarlos simultáneamente.
6. Abrir ajustes para pausar y cambiar tema, sonido o control, centrar la inclinación o reiniciar.
7. Celebrar al completar el objetivo y permitir continuar jugando o reiniciar.
8. Para cambiar de modelo, salir de la partida y seleccionar otro. No cambiar su número de botones durante una partida.

## 4. Requisitos funcionales

### 4.1. Modelos, depósito y aros
| ID | Requisito |
| --- | --- |
| RF-01 | Cada modelo define un número fijo de botones y la distribución de sus chorros. |
| RF-02 | El modelo de un botón utiliza bombeo central; el de dos botones utiliza un chorro asociado a cada lado. |
| RF-03 | Cambiar de tema no modifica el modelo ni su mecánica. |
| RF-04 | Cada partida contiene doce aros y dos estacas. No hay restricciones de color ni reparto obligatorio entre estacas. |
| RF-05 | La geometría y capacidad de las estacas deben permitir completar el objetivo con los doce aros. |
| RF-06 | El depósito es poco profundo, cerrado y tridimensional. Los aros permanecen dentro, incluso al invertirlo. |
| RF-07 | Los aros se trasladan y rotan libremente en tres dimensiones, con colisiones entre ellos, las estacas y las paredes del depósito. |
| RF-08 | El agujero de cada aro existe también en su representación de colisión, no solamente en el dibujo. |
| RF-09 | Ensartar requiere que la estaca atraviese el agujero. Una coincidencia visual o una intersección con el exterior del aro no basta. |
| RF-10 | Un aro ensartado sigue siendo un cuerpo físico: permanece visible y puede salir por bombeo o inclinación. No se fija mediante un bloqueo artificial. |

### 4.2. Bombeo y sensación de agua
| ID | Requisito |
| --- | --- |
| RF-11 | Cada pulsación genera un solo impulso de bombeo. Mantener presionado no genera impulsos repetidos ni un chorro continuo. |
| RF-12 | En el modelo de dos botones se admite pulsarlos simultáneamente mediante multitáctil y entradas equivalentes en computadora. |
| RF-13 | Cada chorro afecta a los aros según su ubicación; no levanta todos los aros con un desplazamiento idéntico. |
| RF-14 | El movimiento debe transmitir resistencia del agua: frenado, caída lenta, giros y respuesta gradual a los impulsos. |
| RF-15 | Se permite ayuda discreta para facilitar el ensartado, sin teletransportar aros, ignorar colisiones, bloquearlos en estacas ni otorgar progreso automáticamente. |
| RF-16 | La geometría de las estacas y la atenuación local del chorro deben dar cierta estabilidad a los aros ensartados, manteniendo posible su extracción. |

### 4.3. Inclinación y entradas
| ID | Requisito |
| --- | --- |
| RF-17 | El control principal en dispositivos compatibles utiliza orientación física, incluyendo inclinación lateral y hacia adelante/atrás. |
| RF-18 | Se permite poner el juguete de lado o boca abajo. La dirección efectiva de la gravedad responde en tres dimensiones. |
| RF-19 | La acción “centrar” permite definir una postura cómoda de referencia; debe conservar la posibilidad de inclinar e invertir posteriormente el juguete. |
| RF-20 | Debe existir una alternativa táctil que permita las mismas orientaciones de juego, incluida la inversión. No basta con ofrecer izquierda/derecha. |
| RF-21 | En computadora se ofrecen bombeo mediante botones y teclado, y orientación mediante teclado o un control equivalente. Los atajos se muestran en la ayuda. |
| RF-22 | La negativa de permisos, ausencia de sensores o ausencia de eventos utilizables no impide jugar. Se indica cómo utilizar el control alternativo. |
| RF-23 | Al cambiar entre vertical y horizontal, adaptar la correspondencia de controles y mantener los aros y su estado, sin aplicar impulsos espurios. |
| RF-24 | El bombeo y la orientación alternativa deben poder utilizarse simultáneamente. Los gestos del juego no deben provocar desplazamiento accidental de la página. |

### 4.4. Victoria y celebración
| ID | Requisito |
| --- | --- |
| RF-25 | El objetivo es mantener los doce aros ensartados simultáneamente durante dos segundos continuos de simulación activa. |
| RF-26 | Si un aro sale antes de completar ese intervalo, se reinicia la comprobación de estabilidad. La pausa no acumula tiempo de victoria. |
| RF-27 | Al completar el objetivo aparece una mascota bailando y confeti. La celebración no bloquea controles ni tapa los aros de forma que impida jugar. |
| RF-28 | Mascotas por tema: pulpo en océano, astronauta en espacio y capibara en capibaras. |
| RF-29 | El confeti y la celebración se retiran automáticamente. La duración concreta se ajusta durante el acabado visual. |
| RF-30 | La celebración ocurre una sola vez por partida, aunque después salgan aros y vuelvan a ensartarse. |
| RF-31 | Tras la victoria se puede seguir jugando o reiniciar. Reiniciar permite volver a celebrar en la nueva partida. |

### 4.5. Temas y apariencia
| ID | Requisito |
| --- | --- |
| RF-32 | La apariencia representa un juguete físico: carcasa transparente, depósito con agua, botones y aros con volumen. |
| RF-33 | Se incluyen tres temas completos: océano, espacio y capibaras. |
| RF-34 | Cada tema funciona con los dos modelos de juguete. |
| RF-35 | Desde la definición de temas en código deben poder configurarse temática, colores de carcasa y botones, fondo, paleta de aros y mascota. |
| RF-36 | El jugador elige temas completos. No se incluye un editor libre de colores o fondos en la primera versión. |
| RF-37 | Cambiar de tema conserva el estado físico y el progreso. No recrea la partida ni cambia geometrías de colisión, fuerzas o dificultad. |
| RF-38 | La cámara frontal es fija respecto al juguete; no se incluye navegación libre de cámara. Debe poder apreciarse la profundidad al girar los aros. |

### 4.6. Menú, audio y persistencia
| ID | Requisito |
| --- | --- |
| RF-39 | La interfaz y la ayuda inicial están en español y utilizan instrucciones breves. |
| RF-40 | El menú permite pausar, elegir tema, activar o silenciar efectos, gestionar el modo de control, centrar la inclinación y reiniciar. |
| RF-41 | Abrir el menú pausa la física. Reiniciar pide confirmación y permite cancelar sin perder la partida. |
| RF-42 | Al enviar el navegador al fondo o cambiar de pestaña se pausa la simulación. Al regresar se conserva la partida, sin simular de golpe todo el tiempo transcurrido. |
| RF-43 | Se incluyen efectos suaves de bombeo, agua y celebración, sin música de fondo. |
| RF-44 | Se recuerdan localmente tema, modelo, sonido y preferencias de control. El funcionamiento básico no depende de que el almacenamiento esté disponible. |
| RF-45 | Cerrar o recargar el juego inicia una partida nueva. No se persisten posiciones, velocidades ni progreso entre aperturas. |

## 5. Requisitos técnicos y de calidad
| ID | Requisito |
| --- | --- |
| RT-01 | Implementar en TypeScript. |
| RT-02 | Usar un motor de física 3D existente. Crear un motor propio queda fuera del alcance. |
| RT-03 | Adoptar Rapier 3D como candidato inicial para física, sujeto a la prueba de viabilidad descrita abajo. |
| RT-04 | Separar física, reglas de partida, entradas, representación gráfica, definiciones de modelo y definiciones de tema. |
| RT-05 | Aplicar bombeo, resistencia y efecto del agua mediante fuerzas, impulsos y parámetros del motor. No se exige resolver un fluido completo. |
| RT-06 | Utilizar un paso de física estable, independiente de la frecuencia de dibujado, y limitar la recuperación tras pausas. |
| RT-07 | Priorizar Chrome en Android y Safari en iPhone/iPad. Mantener controles funcionales en navegadores de computadora. |
| RT-08 | Adaptar el diseño a teléfonos y tablets, vertical y horizontal, con botones cómodos y sin recortes de controles esenciales. |
| RT-09 | Buscar 60 FPS y aceptar un mínimo de 30 FPS sostenidos en los dispositivos de referencia de la prueba. Registrar modelo, sistema, navegador y configuración gráfica; no extrapolar a cualquier dispositivo. |
| RT-10 | Reducir primero reflejos, partículas y confeti cuando sea necesario para mantener la fluidez, conservando las reglas y una física estable. |
| RT-11 | Servir por HTTPS para el acceso normal a sensores y detectar capacidades reales del navegador. La conexión inicial es necesaria para cargar el juego. |
| RT-12 | Tras cargar todos los recursos de la partida, el juego no depende de solicitudes a un servidor. Incluir recursos de los tres temas para que cambiar de tema no requiera conexión. |
| RT-13 | No incorporar cuentas, multijugador ni backend de partidas a la primera versión. |
| RT-14 | Fijar versiones de dependencias al implementar y registrar las utilizadas en la prueba. |

Los dispositivos y versiones concretas de la matriz de pruebas se registrarán al preparar el prototipo, antes de aceptar rendimiento o compatibilidad. Esta es una tarea de validación técnica pendiente, no una afirmación de compatibilidad ya comprobada.

## 6. Decisión de motor y revisión de p5.js

### Conclusión
p5.js puede representar este proyecto mediante su modo WebGL, incluyendo aros 3D con torus(), materiales, luces y cámara. Su API principal no proporciona la dinámica de cuerpos rígidos y las colisiones 3D necesarias para sustituir al motor elegido. Por ello se mantiene Rapier para física, siguiendo la autorización del usuario de utilizarlo si p5 no cubre esa función.

p5.js y Rapier pueden desempeñar funciones complementarias: representación y simulación. La integración de ambos es una posibilidad de implementación que aún no se ha probado. La elección final del renderizador se resolverá en el prototipo; p5.js queda como opción viable, no como dependencia obligatoria ni como librería descartada del proyecto.

| Opción revisada | Papel y conclusión |
| --- | --- |
| Rapier 3D | Candidato inicial de física; dispone de cuerpos rígidos, colisiones y formas compuestas. Validar con la geometría real de los aros. |
| cannon-es | Alternativa existente; su matriz documenta limitaciones de colisión entre ciertas formas. No es la selección inicial. |
| Ammo.js / Bullet | Alternativa existente con API derivada de Bullet. Su integración se considera menos conveniente para este alcance. |
| p5.js | Opción de representación 3D, no sustituto completo de la física requerida. |
| p5play | Su uso de Box2D corresponde a física 2D; no cubre la dinámica 3D acordada. |

### Aproximación inicial de colisión
Evaluar un cuerpo rígido por aro con varias piezas convexas alrededor de su circunferencia, conservando el agujero. No convertir el aro completo en una única envolvente convexa. Rapier recomienda descomposición convexa para cuerpos móviles no convexos.

Esta aproximación es una hipótesis de implementación pendiente de validar. No se ha demostrado todavía que la discretización sea suficientemente suave para ensartar, apilar y retirar aros sin enganches artificiales.

## 7. Prototipo obligatorio antes del acabado visual
El primer entregable de implementación debe incluir:
- Depósito cerrado de geometría simple y cámara frontal.
- Dos estacas y doce aros con agujeros físicos.
- Los dos modelos de bombeo.
- Control por orientación e interacción alternativa, incluyendo inversión.
- Resistencia del agua aproximada y detección de ensartado.
- Visualización de formas de colisión y medición de rendimiento para desarrollo.

Debe demostrar ensartado, apilado, extracción, estabilidad y fluidez. Si no supera la evaluación, ajustar geometrías, pasos, parámetros y aproximación de colisión. Si persisten problemas relevantes, evaluar otro motor existente. No resolverlos creando un motor propio o sustituyendo el ensartado por una animación predeterminada.

### Criterios de aceptación
| ID | Prueba | Resultado requerido |
| --- | --- | --- |
| CA-01 | Soltar un aro alineado sobre una estaca y otro desalineado. | El primero puede ensartarse; el segundo choca o cae sin recibir progreso falso. |
| CA-02 | Hacer pasar un aro delante y detrás de una estaca. | La profundidad determina el contacto; superposición en pantalla no significa ensartado. |
| CA-03 | Apilar aros e inclinar o invertir el depósito. | Los aros pueden salir físicamente sin bloqueos artificiales. |
| CA-04 | Bombear repetidamente y en ambos lados a la vez. | Respuesta local de chorros y multitáctil funcional; mantener pulsado no repite bombeos. |
| CA-05 | Observar interacción entre aros y paredes durante bombeo e inversión. | No se observan escapes del depósito, atravesamientos reproducibles, vibración persistente o aros bloqueados por errores. |
| CA-06 | Jugar una sesión continua de diez minutos con doce aros. | Sin inestabilidad acumulativa o pérdida de cuerpos. Alcanzar al menos 30 FPS sostenidos en dispositivos de referencia registrados, sin caídas prolongadas bajo ese umbral. |
| CA-07 | Comparar juego a distintas frecuencias de dibujo. | La velocidad de simulación y duración de dos segundos de victoria se mantienen coherentes. |
| CA-08 | Denegar permiso y probar un entorno sin datos de orientación. | Sigue siendo posible jugar, bombear e invertir mediante la alternativa. |
| CA-09 | Cambiar de vertical a horizontal y centrar el control. | Se conserva la partida, los controles siguen accesibles y la orientación responde coherentemente. |
| CA-10 | Probar la sensación de agua y posibilidad de completar el objetivo. | El usuario valida que bombeo, caída, giros e inclinación recuerdan al juguete y que ensartar resulta entretenido. |

## 8. Aceptación de la versión completa
| ID | Prueba | Resultado requerido |
| --- | --- | --- |
| CA-11 | Ejecutar cada combinación de dos modelos y tres temas. | Las seis combinaciones funcionan con mecánica independiente de la apariencia. |
| CA-12 | Cambiar de tema con aros ensartados y otros en movimiento. | Se mantienen cuerpos, posiciones, velocidades y progreso al reanudar. |
| CA-13 | Mantener doce aros ensartados durante menos de dos segundos y sacar uno. | No se celebra; el intervalo se reinicia. |
| CA-14 | Mantener doce aros ensartados dos segundos continuos activos. | Mascota correcta bailando y confeti; se puede seguir jugando. |
| CA-15 | Sacar y reinsertar aros tras celebrar; después reiniciar. | No se repite la celebración en la misma partida; sí puede repetirse en la nueva. |
| CA-16 | Abrir ajustes o enviar la app al fondo. | La física y el intervalo de victoria se pausan; no hay avance brusco al volver. |
| CA-17 | Reiniciar y cancelar la confirmación. | Cancelar conserva el juego; confirmar inicia doce aros y restablece la celebración. |
| CA-18 | Cerrar y abrir nuevamente. | Se recuperan preferencias y se inicia partida nueva sin recuperar posiciones previas. |
| CA-19 | Silenciar, cambiar de tema y volver a abrir. | Se respeta la preferencia de sonido; no aparece música de fondo. |
| CA-20 | Desconectar internet después de la carga completa y alternar temas. | La partida y los temas siguen funcionando con los recursos ya cargados. |
| CA-21 | Abrir el enlace en la matriz de plataformas y orientaciones registrada. | Carga correcta, controles utilizables y verificación de sensores o alternativa según capacidades reales. |

La revisión documental de librerías no sustituye estas pruebas. Ningún criterio se declara superado por la existencia de una API.

## 9. Backlog explícito
| ID | Funcionalidad futura |
| --- | --- |
| BL-01 | Modo contrarreloj. |
| BL-02 | Modo donde el aro ensartado desaparece y acumula progreso. Mantenerlo separado del clásico. |
| BL-03 | Configurar el número de aros por partida. |
| BL-04 | Editor de personalización para mezclar colores, fondos y otros elementos del tema. |
| BL-05 | Sacudir físicamente el dispositivo para agitar el agua. |
| BL-06 | Instalación como aplicación web y apertura sin conexión. |

No forman parte de esta versión un motor propio, cuentas, multijugador ni un servidor de partidas. Una simulación científica del agua tampoco es requisito del producto definido.

## 10. Orden de entrega
1. Prototipo de física y validación de Rapier; selección del renderizador.
2. Controles completos, ciclo de partida, pausa y victoria.
3. Modelos de juguete, temas y preferencias.
4. Sonido, mascotas bailando, confeti y acabados.
5. Validación funcional, compatibilidad y rendimiento en dispositivos registrados.

Cada etapa conserva los criterios ya superados. No dar por resuelta la física mediante acabados visuales.

## 11. Trazabilidad de decisiones
| Preguntas de entrevista | Decisión consolidada |
| --- | --- |
| 1, 5, 26 | Clásico por enlace, sin cuentas; conexión inicial y partida local. Tiempo y apertura offline al backlog. |
| 2, 6, 24 | Prioridad móvil/tablet, vertical y horizontal, Chrome Android y Safari iOS/iPadOS; computadora funcional. |
| 3, 9, 14, 21 | Física 3D con ayuda discreta, agujeros reales, extracción posible e inversión completa. |
| 7, 11, 16, 20 | Modelos predefinidos de uno/dos botones; un impulso por pulsación; tema independiente. La propuesta anterior de cambiar botones en ajustes quedó reemplazada. |
| 8, 13 | Inclinación en la primera versión. La sugerencia inicial de posponerla quedó rechazada. |
| 10 | Doce aros y dos estacas; cantidad configurable al backlog. |
| 12, 19 | Temas intercambiables sin perder partida: océano, espacio y capibaras. Pastel quedó reemplazado. |
| 15, 22 | Victoria tras dos segundos estables, mascota temática bailando y confeti, sin bloquear el juego. |
| 17, 18, 23 | Preferencias locales, partida no persistida, pausa, interfaz en español y efectos sin música. |
| 25, 27 y revisión de p5 | TypeScript, prototipo primero, motor existente. Rapier para física; p5 viable para gráficos, selección de renderizador durante prototipo. |

## 12. Fuentes técnicas consultadas
Consultadas el 18 de octubre de 2026. Las decisiones de producto provienen de la entrevista; las fuentes sustentan las capacidades de las herramientas.

- [p5.js — WebGL](https://p5js.org/reference/p5/constants/WEBGL/): representación 3D, materiales, luces y cámara.
- [p5.js — torus](https://p5js.org/reference/p5/torus/): representación visual del aro.
- [p5.js — referencia](https://p5js.org/reference/): alcance de su API principal.
- [p5play — World](https://p5play.org/learn/world): simulación mediante Box2D.
- [Box2D — Overview](https://box2d.org/documentation/): alcance de física 2D.
- [Rapier — Getting started](https://rapier.rs/docs/user_guides/javascript/getting_started_js/): integración JavaScript/WebAssembly.
- [Rapier — Colliders](https://rapier.rs/docs/user_guides/javascript/colliders/): geometrías y cuerpos móviles no convexos.
- [Rapier — Rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/): fuerzas, amortiguación y detección continua.
- [cannon-es — documentación](https://pmndrs.github.io/cannon-es/docs/index.html): tipos de formas y matriz de colisiones.
- [Ammo.js — repositorio oficial](https://github.com/kripken/ammo.js): integración de Bullet.
- [W3C — Device Orientation and Motion](https://www.w3.org/TR/orientation-event/): contexto seguro, orientación y permisos.



## 13. Iteración del POC — 19 de octubre de 2026: progreso acumulado

A petición del usuario, BL-02 se adelanta al POC como modo independiente “Guardar al llegar a la base”, seleccionado inicialmente en el laboratorio. RF-10 y RF-25/RF-26 siguen describiendo el modo clásico, que se mantiene disponible.

En el modo Guardar:
- El aro debe ensartarse por física y tocar una base durante 0.12 segundos continuos de simulación activa antes de desaparecer.
- Desaparecer retira tanto el cuerpo y sus colisiones como el dibujo, y suma una unidad al progreso acumulado. Bombear o invertir no resta aros ya guardados.
- Un aro suelto sobre el piso, sobre una base sin ensartarse o superpuesto visualmente a una estaca no suma progreso.
- El objetivo es guardar los doce aros; las escenas de diagnóstico usan su cantidad inicial como objetivo. El contador conserva ese denominador aunque queden menos cuerpos.
- La victoria ocurre al guardar el último aro, una sola vez por partida. Reiniciar devuelve los aros y pone el progreso en cero. Cambiar de modo, modelo o escena reinicia la prueba.
- El modo clásico conserva los aros, extracción libre y victoria tras dos segundos simultáneos; no se sustituye su regla por la de progreso acumulado.

La aceptación de la sensación y dificultad del nuevo modo sigue requiriendo juego libre con el usuario. El documento original de la versión clásica se conserva como referencia.


## 14. Cierre del POC — 19 de octubre de 2026

El usuario acepta el POC con fuerza 75, resistencia 0.50 y modo inicial Guardar al llegar a la base. La versión clásica sigue definida en este documento y disponible en el laboratorio. El cierre valida la experiencia del prototipo con el usuario; no equivale a aceptar toda la versión completa ni los criterios de compatibilidad/rendimiento que requieren dispositivos móviles reales. El alcance de la siguiente iteración se acordará aparte.
