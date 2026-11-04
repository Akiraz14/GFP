# Observaciones de la validación de la Etapa 05 — HU3 Recuperar contraseña

Registro de las inconsistencias detectadas al revisar las evidencias del recorrido manual de HU3
(diagnóstico del 2026-11-04), su impacto y la decisión del responsable. Procedimiento y
resultados: `etapa-05-pruebas-dispositivo.md`.

**Decisión del responsable (2026-11-04):** se da por culminada la ejecución de las pruebas
manuales de HU3. Se aceptan los resultados de R01 a R15 y R14b en Android 14 y Android 10 con las
observaciones de este documento. R16 queda como **NO VERIFICABLE** en ambos emuladores. No se
repite ninguna prueba, no se ejecuta la comprobación adicional de R16 y no se solicitan nuevas
capturas. Ninguna observación se trata como fallo funcional, porque ninguna evidencia demuestra un
defecto de la aplicación.

Esta decisión cierra solo la ejecución de las pruebas manuales. No aprueba la Etapa 05 ni ratifica
las decisiones E05-D1 a E05-D9.

## Evidencias revisadas

Todas en `GFP-evidencias\e05\`. No se modificaron, movieron, renombraron ni borraron. Las horas
son de Bogotá (UTC−5); los emuladores registran en UTC.

| Emulador | Carpeta | Contenido |
|---|---|---|
| Android 14 (API 34, `Pixel_4`) | `hu3-manual-android14-api34-20261104-083056` | `entorno.txt`, `datos.txt`, `resultados.md`, 31 capturas (r01 a r15b), `logcat-r16.txt` |
| Android 10 (API 29, `Pixel_4_Android_10`) | `hu3-manual-android10-api29-20261104-101040` | `entorno.txt`, `resultados.md`, 31 capturas (r01 a r15b), `logcat-r16.txt`; sin `datos.txt` |

Ambos `entorno.txt` registran el APK Debug con SHA-256
`011B6277CF00CCB2A44513A48CAC2607ABA55E3872BC9B22AA410D10BDF7826F`, el mismo generado y validado
el 2026-10-30 desde `81b03e5`. Las 62 capturas se revisaron una por una: muestran el resultado
esperado de cada paso y su hora coincide con la hora del archivo.

`datos.txt` (Android 14) contiene solo los identificadores de las cuentas A, B y C, las preguntas
y las respuestas, más la nota «NO REGISTRAR CONTRASEÑAS EN ESTE ARCHIVO». Se comprobó su
estructura sin mostrar los valores: ninguna respuesta contiene números ni símbolos, así que
ninguna cumple la política de contraseñas.

## Observaciones

| ID | Emulador | Paso | Observación | Impacto | Decisión |
|---|---|---|---|---|---|
| O-01 | Android 14 | R13 → R14 | El emulador se reinició entre R13 (09:07) y R14 (09:16) y el reinicio no quedó registrado. El `logcat` empieza a las 09:13:36 con el arranque del sistema (`SystemServer: Entered the Android system server`). | Los datos de la app se conservaron y el reinicio cubre el «cierra y vuelve a abrir la app» de R14. El registro de Android anterior a las 09:13 se perdió (ver O-11). | Aceptada con observación. R14 a R15 válidos. |
| O-02 | Android 14 | R14 | Orden de capturas inconsistente con sus nombres: `r14c-fallo-recuperacion-3.png` (09:17:33) es anterior a `r14b-fallo-recuperacion-2.png` (09:18:41). Las tres capturas de fallo son distintas. El aviso de `r14d` (09:20:10) indica 14 minutos restantes, lo que corresponde a un tercer fallo hacia las 09:18:41; es probable que los nombres estén invertidos, pero no está probado. | Ninguno sobre el resultado: hay tres fallos registrados y el bloqueo de HU3 se muestra en el cuarto envío y al reintentar. | Aceptada con observación. Las evidencias no se renombran. |
| O-03 | Android 10 | Tras R03 | Cierre inesperado de la aplicación a las 11:19:30, 17 s después de la captura de R03: `SIGABRT` en `RenderThread` con el mensaje `GL errors! frameworks/base/libs/hwui/pipeline/skia/SkiaOpenGLPipeline.cpp:126` (`EGL_emulation`). Cinco segundos después falló de la misma forma la app de Google del sistema (`googlequicksearchbox`, `RenderThread`, `SIGABRT`). La app se reabrió a las 11:20:30 y el recorrido siguió en R04. El cierre no quedó registrado en `resultados.md`. | La coincidencia temporal con un fallo igual de otra app apunta a la emulación gráfica, pero **la causa no está probada**. No hay evidencia de un defecto en el código de GFP: el fallo ocurre en el renderizado nativo de Android y no hay otro cierre de GFP en los tramos que cubren los `logcat` de los dos recorridos. | Registrada. No se trata como fallo funcional. Si reaparece en otra etapa, se investiga. |
| O-04 | Android 10 | R03 | `resultados.md` tiene dos filas idénticas de R03. Puede corresponder a una repetición de R03 tras el cierre de O-03, pero no está documentado. | Ninguno: las dos filas dicen lo mismo y la captura muestra el resultado esperado. | Aceptada con observación. |
| O-05 | Android 10 | R10 → R11 | El reto de la cuenta A iniciado en R06 (11:21:48) venció a las 11:36:48 (15 minutos, E05-D2). R09 y R10 se ejecutaron después del vencimiento; son validaciones locales que no llegan al servicio. R11 (11:41) muestra el identificador `5005001` y dos preguntas distintas: se usó un reto nuevo. El aviso de reto vencido no quedó capturado ni registrado. | R08 a R10 siguen siendo válidos. R11 es válido con el reto nuevo, y R12 sigue demostrando que R08 a R10 no contaron como intentos. El vencimiento del reto está verificado por separado en R15. | Aceptada con observación. |
| O-06 | Android 10 | R10 | `r10a-confirmacion-distinta-aviso.png` y `r10b-confirmacion-distinta-campos-conservados.png` son el mismo archivo (MD5 idéntico) y las dos muestran el aviso abierto. Falta la captura posterior a «Aceptar». | Debajo del aviso se ven las respuestas, la contraseña y la confirmación escritas, y el mensaje de la confirmación junto al campo. La conservación tras «Aceptar» se verificó en Android 14 y en R08 y R09 de Android 10, y Jest la cubre. | Aceptada con observación. |
| O-07 | Android 10 | Preparación | No existe `datos.txt`, así que no se puede saber qué respuestas se usaron en Android 10. | Solo afecta a R16 (O-11). | Registrada. |
| O-08 | Ambos | R06 | Una captura no puede mostrar que el identificador queda bloqueado para edición en la segunda fase. | Respaldado por Jest: `PasswordRecoveryScreen.test.tsx` comprueba `editable` del campo `recovery-identifier`. | Aceptada. |
| O-09 | Documento | R14 | El resultado esperado de R14 dice «bloqueada durante 15 minutos». La app muestra los minutos restantes del bloqueo (`remainingLockMs`): 15 y luego 14 en Android 10, y 14 en Android 14. | El texto del procedimiento es impreciso; la app se comporta según E05-D1 y E05-D5. | Registrada como corrección documental pendiente. El procedimiento no se modifica en esta actualización. |
| O-10 | Documento | Preparación | La columna «Uso» de la tabla de cuentas de la sección 3 conserva la numeración anterior a `81b03e5`. Los pasos reales son R06 a R13 para A, R14 y R14b para B, y R05 y R15 para C. | Ninguno: la tabla de pasos es la correcta y se siguió. | Registrada como corrección documental pendiente. |
| O-11 | Ambos | R16 | Ver «R16» más abajo. | No se puede certificar que `logcat` no contenga contraseñas ni respuestas durante todo el recorrido. | **NO VERIFICABLE** en ambos emuladores. |
| O-12 | Ambos | — | Además de las dos carpetas del recorrido, en `GFP-evidencias\e05\` hay tres carpetas del 2026-10-30 con solo la preparación (`hu3-manual-emulator-5554-20261030-114133`, `-123347` y `-140709`) y tres carpetas BLOCKED de la primera ejecución en Android 14 (`hu2-*-emulator-5554-20261030-111027`, `-111028` y `-111030`). | Ninguno; quedan como registro. | Se conservan. |
| O-13 | — | — | No hay imágenes del prototipo de HU3: el documento de historias de usuario disponible solo trae el texto. | La comparación visual con el prototipo no se pudo hacer. | Pendiente, fuera de las pruebas manuales. |

## R16 — contraseñas y respuestas en `logcat`

Cobertura de los registros conservados (`adb logcat -d` al final de cada recorrido):

| Emulador | Tramo cubierto | Tramo sin cubrir |
|---|---|---|
| Android 14 | 09:13:36 a 09:57:41: R14, R14b y R15 | Registro de las cuentas y R01 a R13 (incluidas la actualización de R12 y el inicio de sesión de R13), perdidos con el reinicio de O-01 |
| Android 10 | 10:05:27 a 12:10:23: arranque, registro de las cuentas y R01 a R15 | — |

Comprobaciones que se hicieron durante el diagnóstico, sin mostrar valores:

- Las 15 respuestas de `datos.txt` (Android 14) no aparecen como palabra completa en ninguno de los
  dos `logcat`, comparadas en minúsculas y con la normalización `free-text-folded`. Hay
  coincidencias como fragmento de palabras más largas, sin relación con la app. En Android 10 el
  resultado solo sería válido si se usaron las mismas respuestas, lo que no consta (O-07).
- La única línea de JavaScript de la app en `logcat` es `Running "GFP"`, una por arranque.

Por qué R16 queda como **NO VERIFICABLE**:

1. Las contraseñas no están registradas en ningún archivo, como exige el procedimiento. Por
   decisión del responsable no se solicitan ni se busca su presencia en los registros.
2. No consta qué respuestas se usaron en Android 10.
3. En Android 14 falta el registro anterior a las 09:13.

Los registros disponibles **no permiten certificar** la ausencia de contraseñas y respuestas en
`logcat` durante todo el recorrido. Las comprobaciones anteriores son informativas y no sustituyen
a R16. HU3-CA06 sigue verificado en Jest (la fila de `credentials` no contiene la contraseña), sin
verificación en dispositivo.

## Excepciones aceptadas

| Excepción | Justificación |
|---|---|
| R06 en ambos emuladores, sin evidencia visual de que el identificador no se puede editar (O-08) | La condición no es visible en una captura y la cubre Jest |
| R10 en Android 10, sin la captura posterior a «Aceptar» (O-06) | La captura existente muestra los campos conservados bajo el aviso; el comportamiento se verificó en Android 14 y en Jest |
| R14 en Android 14, con un reinicio no documentado y dos capturas en orden inverso (O-01, O-02) | Los tres fallos y el bloqueo están en las capturas; los datos de la app se conservaron |
| R11 en Android 10, con un reto nuevo tras el vencimiento no documentado del anterior (O-05) | El vencimiento es el comportamiento de E05-D2 y R15 lo verifica; R11 y R12 son válidos con el reto nuevo |
| Cierre inesperado en Android 10 tras R03 (O-03) | Coincide en el tiempo con un fallo igual de otra app; la causa no está probada y no hay evidencia de un defecto de GFP |
| R16 no verificable en ambos emuladores (O-11) | Decisión del responsable: no repetir pruebas ni ejecutar la comprobación adicional |
