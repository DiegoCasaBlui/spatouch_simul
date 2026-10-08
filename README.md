# SpaTouch 4 · Simulador Rev. A

Aplicación local basada exclusivamente en **SPA-TOUCH-4-user-guide-English.pdf**, documento **42410 Rev. A**, **MVP Release**. El PDF original se conserva sin modificaciones.

## Ejecutar

Requisitos: Node.js 22 o posterior y pnpm. Desarrollo verificado con pnpm 11.25.0.

```sh
pnpm install
pnpm dev
```

Abrir **http://127.0.0.1:5173/**. El servidor utiliza únicamente la interfaz local. Si el puerto 5173 está ocupado, detener el otro servidor antes de iniciar este proyecto.

```sh
pnpm build       # TypeScript + compilación en dist/
pnpm preview     # Vista local de la compilación, URL indicada en consola
pnpm test        # Pruebas del motor
pnpm test:e2e    # Recorridos de navegador con Microsoft Edge instalado
```

Las pruebas de navegador arrancan el servidor cuando es necesario y reutilizan el que ya esté en 5173. No necesitan descargar Chromium: usan el canal `msedge`. Para otro navegador, ajustar `channel` en `playwright.config.ts`. Las capturas y trazas se guardan en `test-results/` y no se versionan.

## Usar el panel

La pantalla conserva las coordenadas **800 × 480** de las capturas y se escala para escritorio o móvil. Arrastrar con el **botón izquierdo mantenido**, o con un dedo:

- Desde el engranaje superior hacia abajo: **Settings**.
- Desde el icono lateral derecho hacia el centro (también admite arrastre hacia afuera): **Spa Devices**.
- Desde el icono de luz izquierdo hacia la derecha: **Chromazone**. Un clic corto en la luz cambia encendido/apagado.
- Desde el título de la pista hacia arriba: **Music**.
- En Spa Devices, arrastrar desde la temperatura superior hacia abajo para volver a Home. Los cuatro equipos aparecen en una sola pantalla.
- Arrastrar listas hacia arriba/abajo para desplazarlas; también funciona la rueda del mouse.
- Tocar el dial para editar la consigna; usar +/− o arrastrar el arco. Tocar su centro vuelve a Home. El dial también admite flechas y Home/End con el teclado.
- En los selectores de hora y suspensión, arrastrar las columnas. ✓ guarda y × cancela. Salir del editor también descarta el borrador.
- Al suspenderse la pantalla, tocarla y pulsar **1, luego 2**. Con `Tap to Wake` activado se despierta con un toque.

La interfaz inicia en inglés. `Settings → General → Language` permite elegir español. Los rótulos abreviados R y R girada 90°, L/H y F°/C° conservan la presentación del manual.

## Simulación

El desplegable **Simulación**, fuera del panel, permite pausar, acelerar 1×/10×/60×, avanzar tiempo, modificar el agua, configurar accesorios, iniciar/finalizar Priming, cambiar la conexión ficticia, despertar, quitar bloqueos o restablecer.

- Perfil inicial: dos bombas de una velocidad, circulación, bba 3, Chromazone, Clim8zone, ozono y M8 disponibles.
- Inicio a las 12:00, agua a 90 °F y consigna a 100 °F. La hora inicialmente no está confirmada: aparece el mensaje 40 hasta guardarla. Los horarios automáticos quedan pendientes de ese paso.
- Al arrancar se muestra `----` hasta completar 60 segundos continuos de circulación. Una lectura sin renovar caduca a los 60 minutos. El control de circulación es informativo salvo durante Priming.
- Ready calienta según demanda. Rest calienta únicamente durante filtración. High y Low usan los límites publicados por el manual; cambiar unidades conserva la temperatura física y cambiar rango limita la consigna cuando hace falta.
- Los horarios atraviesan medianoche y se evalúan incluso al avanzar una hora de golpe. Inicio igual a fin significa un ciclo de 24 horas. Los ciclos de filtración solapados muestran ambos indicadores.
- La suspensión mide **inactividad real**, independiente del reloj simulado. Las bombas y el calentamiento siguen funcionando mientras la pantalla está dormida.
- Los ajustes y la hora se guardan en `localStorage`, sin cuentas ni servicios externos. Al recargar, se reinician bombas manuales, conexiones, música, Priming, actualización y lecturas; no se calcula el tiempo transcurrido con la web cerrada.

## Fidelidad y aproximaciones

La sección **Referencia y alcance** contiene la matriz completa por función y página. No se utilizaron pantallas ni documentación de otras revisiones.

Las pantallas documentadas se reconstruyen con HTML, CSS y SVG. La textura procede de una zona sin controles de una captura de la página 6 del PDF. Las tipografías e iconos son aproximaciones visuales; no se ejecuta ni se incluye firmware Balboa.

El documento enumera funciones sin explicar sus pantallas. Por acuerdo, se implementaron estas aproximaciones:

| Función | Comportamiento del simulador |
| --- | --- |
| Modelo térmico | 2 °C/h de calentamiento; 4 °C/h con Clim8zone activo. Pérdida de 2,5 % por hora de la diferencia respecto a un ambiente de 22 °C. |
| M8 | Muestreo de 30 minutos, ampliado a 60 cuando la diferencia con la consigna es menor a 0,5 °C. |
| Clim8zone | Off, Heat y Auto; Heat/Auto cooperan con la demanda de calor, sin refrigeración inventada. |
| Audio | Controles, metadatos y progreso; no incluye grabaciones ni reproduce sonido. “White Christmas / Bing Crosby” son los metadatos de la captura del manual. |
| Chromazone / Light Cycles | Encendido, siete colores, intensidad y un horario diario. El horario puede mantener la luz encendida aunque su control manual esté apagado. |
| Hold | Pausa de 60 minutos que detiene salidas de bombas, blower y calentamiento. |
| Cleanup Cycle | Duración de 0/15/30/60 min, inicio manual o 30 min después de apagar el último equipo manual. |
| Security | Bloqueos independientes de panel y ajustes. La secuencia demo 1 → 2 desbloquea; no se afirma que sea el método de seguridad real. |
| Connections | Offline, Local o Cloud, sin enlaces Bluetooth, red del spa ni servicios de Balboa. |
| Diagnostics | Lecturas del motor; voltaje de 120 V y datos de software ilustrativos. |
| Software Update | Progreso ficticio de 10 segundos del reloj simulado; no descarga firmware ni cambia la revisión de referencia. |
| Idioma y recordatorios | Traducción propia al español y recordatorio de demostración; no representan un catálogo oficial de idiomas ni intervalos de mantenimiento. |

## Estructura

- `src/model.ts`: tipos, límites, horarios, motor puro, acciones y persistencia versionada.
- `src/App.tsx`: navegación, reloj de ejecución, suspensión, bloqueos y composición.
- `src/Screens.tsx`, `src/Dial.tsx`, `src/ui.tsx`, `src/icons.tsx`: controles y pantallas.
- `src/gestures.tsx`: captura del puntero, separación entre clic/arrastre y coordenadas invertidas.
- `src/SimulatorTools.tsx`: controles de escenarios y matriz de cobertura.
- `src/model.test.ts` y `tests/simulator.spec.ts`: pruebas de lógica y recorridos de usuario.

No hay backend, autenticación, telemetría, conexión a hardware ni publicación automática. Todos los recursos de la aplicación se sirven localmente.
