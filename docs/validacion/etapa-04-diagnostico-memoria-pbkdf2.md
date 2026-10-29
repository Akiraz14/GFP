# Diagnóstico: cierre de la app en Android 14 durante el registro (Etapa 04)

**Estado (2026-10-28, tras E1 a E3): causa demostrada a nivel de implementación; el detalle
interno de Conscrypt sigue siendo una inferencia.** En un proceso aislado, sin la app ni la
interfaz, la implementación actual con seis derivaciones en paralelo hizo crecer la memoria
nativa hasta 410–561 MB (Android 14) y 1,9–2,0 GB (Android 10), con `Scudo OOM` y
`lowmemorykiller`; en secuencia, el pico fue de unos 50 MB; con `SecretKeyFactory`, de unos 2 MB en
ambos modos (sección 8). No se ha modificado `GfpCrypto` ni el algoritmo (E02-D1); el
responsable autorizó solo el diagnóstico y E3 (2026-10-28).

Evidencias en `GFP-e04-evidencias\` (fuera del repositorio). Horas de `logcat` en la zona
horaria del emulador (UTC); las de `summary.txt`, en la del equipo (UTC−5).

## 1. Ejecuciones revisadas

| Ejecución | Android | Commit | Resultado | `logcat` |
|---|---|---|---|---|
| `hu2-device-emulator-5554-20261028-164615` | 14 | `35a8150` | Interrumpida: el emulador se congeló en el paso 3 del registro | No |
| `hu2-device-emulator-5554-20261028-181257` | 14 | `438a9f6` | PASS=26 | Sí (`logcat.txt`) |
| `hu2-device-emulator-5554-20261028-190159` | 10 | `438a9f6` | PASS=26 | Sí |
| `hu2-device-emulator-5554-20261028-200912` | 10 | `d91dfbc` | PASS=26 | Sí |
| `hu2-device-emulator-5554-20261028-202817` | 14 | `d91dfbc` | PASS=8 FAIL=2 BLOCKED=1 | No |
| `hu2-device-emulator-5554-20261028-205503` | 14 | `7db7f06` | PASS=9 FAIL=1 BLOCKED=1 | Sí (`logcat-on-failure.txt`) |

## 2. Hechos comprobados en las evidencias

### Ejecución `205503` (Android 14, con `logcat`)

| Hora (UTC) | Evento | Línea del `logcat` |
|---|---|---|
| 01:59:07.969 | Se oculta el teclado antes de pulsar «Registrar» (`Tap-Text` llama a `Hide-Keyboard`) | 10202 |
| 01:59:08 – 01:59:23 | La app dibuja de forma continua (indicador de progreso) | `app_time_stats` |
| 01:59:08.366 | Primera recolección del proceso de la app (pid 15706): 12 MB/25 MB de montón Java | 10206 |
| 01:59:10.122 | `Scudo OOM: The process has exhausted 256M for size class 144` (3 358 228 asignaciones nativas, 2 094 462 vivas) | 10280, 10314 |
| 01:59:13 – 01:59:20 | Se agotan sucesivamente las clases 176, 192, 224, 288 y 352: el asignador desplaza el mismo flujo de bloques pequeños a clases mayores. A las 01:59:20, 1616 MB mapeados, 12 811 140 asignaciones, 7 871 302 vivas | 10422–10907 |
| 01:59:10 – 01:59:19 | Recolecciones `NativeAlloc` (provocadas por la memoria nativa); el montón Java crece de 43/67 MB a 107/131 MB | 10350, 10536, 10839 |
| 01:59:16 – 01:59:23 | `lowmemorykiller` mata 24 procesos en segundo plano (incluido el launcher) | — |
| 01:59:23.693 | `lowmemorykiller` mata la app: `oom_score_adj 0` (primer plano), 1 621 572 kB de RSS y 500 940 kB de swap | 11385 |
| 02:00:23.637 | La app se vuelve a abrir desde el launcher (`realCallingUid=10161`, `com.google.android.apps.nexuslauncher`); no la abre el script | 18722 |

### Ejecución `181257` (Android 14, aprobada)

El registro también agotó cuatro clases de Scudo (144, 176, 192 y 224; 1110 MB mapeados y
18 225 193 asignaciones a las 23:22:36) y `lowmemorykiller` mató 16 procesos en segundo plano
entre las 23:22 y las 23:23, pero no la app. La ejecución pasó porque la app sobrevivió, no porque no hubiera
agotamiento de memoria. Después, en los inicios de sesión (una derivación cada uno), las recolecciones completas liberan
unos 650 000–760 000 objetos Java cada una.

### Ejecuciones de Android 10

No hay mensajes de Scudo (Android 10 usa otro asignador) ni recolecciones largas del proceso de
la app durante el registro. Esto no prueba que no haya asignaciones: ART solo registra las
recolecciones largas.

## 3. Hipótesis principal y grado de confirmación

**Hipótesis:** cada iteración de `Pbkdf2HmacSha256.derive()` llama a `Mac.doFinal()`. En la
versión de Conscrypt de Android 10 a 14, `doFinal()` llama a `resetContext()`, que crea un
`HMAC_CTX` nativo nuevo envuelto en un `NativeRef`; ese contexto solo se libera en
`NativeRef.finalize()`, cuando el recolector y el hilo de finalización lo procesan. El registro
lanza seis derivaciones de 600 000 iteraciones en paralelo (`Promise.all` en
`accountRegistration.ts`, grupo de hasta 4 hilos en `GfpCryptoModule`): unos 3,6 millones de
contextos nativos producidos más deprisa de lo que se finalizan.

| Afirmación | Estado | Evidencia |
|---|---|---|
| La app agotó la memoria nativa y `lowmemorykiller` la mató en primer plano | **Comprobado** | Líneas 10314–10907 y 11385 de `205503` |
| El agotamiento empezó justo después de pulsar «Registrar» | **Comprobado** (correlación temporal de 1–2 s) | Líneas 10202–10314 |
| La operación en curso eran las derivaciones PBKDF2 del registro | **Muy probable**: en el código, entre «Registrar» y la escritura en la base solo hay validación y las seis derivaciones; la cuenta no se creó | `accountRegistration.ts` (derivaciones antes de la transacción); `HU1-REGISTER` en FAIL |
| Conscrypt de Android 10 y 14 crea un `HMAC_CTX` por `doFinal()` y lo libera con `finalize()` | **Comprobado en el código fuente de AOSP** (`android10-release`, `android14-release`: `OpenSSLMac.resetContext()` llama a `HMAC_CTX_new()`; `NativeRef.finalize()`); corregido en Conscrypt en 2023 (`514d4d9e`, «Reset HMAC and CMAC contexts more efficiently») | Repositorios de Conscrypt |
| El emulador usa esa versión de Conscrypt | **No comprobado**: Conscrypt se actualiza como módulo APEX | Experimento E2 |
| El número de asignaciones corresponde a las llamadas a `doFinal()` | **Coherente, no demostrado**: 12,8 millones de asignaciones frente a 3,6 millones de `doFinal()` (unas 3–4 por contexto nuevo); no hay pila de llamadas | Experimento E1 |
| Android 10 no falla porque su asignador no tiene el límite por clase de Scudo o porque produce más despacio | **Hipótesis** | Experimento E1 en ambos emuladores |

## 4. Fallos distintos que no deben atribuirse automáticamente a `GfpCrypto`

| Fallo | Causa | Clasificación |
|---|---|---|
| `INFO no se encontro el texto 'Aceptar'` (`202817`, `205503`) | Consecuencia: el script pulsa «Aceptar» aunque no haya aparecido «El registro fue exitoso»; el diálogo no existe porque el registro no terminó | Automatización (efecto secundario) |
| `FAIL HU1-REGISTER-LOGIN` (`202817`) | El panel de ajustes rápidos cubría la pantalla: con la app fuera del primer plano, los deslizamientos del script lo abrieron desde el escritorio | Automatización (efecto secundario) |
| `PASS HU1-REGISTER-LOGIN` (`205503`) | **Falso positivo**: el inicio de sesión estaba visible porque el launcher reabrió la app tras su cierre, no porque el registro volviera a él (A-W4) | Automatización: el PASS no es válido |
| Cierre de la app en `202817` | Sin `logcat`; mismo momento del recorrido y mismo síntoma que `205503` | Compatible con el agotamiento de memoria; no demostrado |
| Congelamiento del emulador en `164615` | Sin `logcat`; el último volcado de la interfaz (21:52 UTC) muestra el paso 3 con tres respuestas escritas y Metro registró la pérdida del dispositivo a las 21:54. Pudo pulsarse «Registrar» después del último volcado | Compatible, no demostrado |

Mejoras de automatización propuestas, que no cambian la app: tras un registro fallido,
comprobar que la app sigue en primer plano (`dumpsys activity`) antes de seguir; no pulsar
«Aceptar» ni deslizar si no está; y no contar como PASS el inicio de sesión que aparece tras un
cierre de la app.

## 5. Experimentos definidos (ejecutados; resultados en las secciones 7 y 8)

**E1 — Derivación aislada, sin la app ni la interfaz (sin cambios de código).** Ejecutar en
cada emulador la clase existente `Pbkdf2Calibration` del APK con `app_process` (como en P-D1),
con 100 000 y 600 000 iteraciones y 6 muestras, registrando cada segundo `VmRSS` y `VmHWM`
del proceso y guardando el `logcat`. Resultado que confirmaría la hipótesis: en Android 14,
`VmHWM` crece con el número total de iteraciones y aparecen recolecciones `NativeAlloc` o
mensajes de Scudo; con 100 000 iteraciones el pico es mucho menor. Si `VmHWM` se mantiene
estable con 600 000 × 6, la hipótesis queda descartada. Es una sola derivación a la vez, así
que mide el mecanismo, no la concurrencia del registro.

**E2 — Versión de Conscrypt instalada (sin cambios de código).** `pm list packages --apex-only
--show-versioncode` y la huella de la imagen en cada emulador.

**E3 — Alternativa en el dispositivo (requiere código de diagnóstico fuera de la app;
pendiente de autorización).** Una clase Java independiente, ejecutada con `app_process`, que
derive con `SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")` los vectores de la sección 6,
informe el proveedor que la implementa, mida el tiempo de 600 000 iteraciones y registre
`VmHWM` con 6 derivaciones. No se incluiría en el APK ni en el repositorio sin autorización.

## 6. Equivalencia de la alternativa: comprobación previa en el JDK

En el JDK 21 del entorno de Claude (2026-10-28), tres implementaciones dan el mismo resultado
para 7 vectores: `hashlib.pbkdf2_hmac` de Python sobre bytes UTF-8, la clase actual
`Pbkdf2HmacSha256.java` y `SecretKeyFactory("PBKDF2WithHmacSHA256")` del proveedor `SunJCE` sobre
`char[]`. Vectores: `password` (4096), V7 `contraseña-ñ€✓` (600 000), `José María` en NFC y en
NFD (4096, resultados distintos entre sí, como corresponde), `clave😀ñ!` (fuera del plano
básico), la respuesta plegada `pena bogota` y un texto CJK. Esto no prueba nada sobre Android:
allí el proveedor es otro y su conversión de `char[]` a bytes debe comprobarse en E3.

## 7. Auditoría de E1 y E2 en Android 14 (`diag-pbkdf2-memory-sdk34-20261028-215553`)

`Pbkdf2Calibration` en secuencia: vectores V1–V7 correctos; mediana de 377 ms (100 000) y
2030 ms (600 000); `VmRSS` estable en 150–154 MB en ambas. **Esta medición no confirmaba la
hipótesis**, y tenía limitaciones: el pico de `VmHWM` (206–207 MB) se alcanza al arrancar el
proceso y es igual en ambas, `VmRSS` incluye páginas compartidas, el muestreo era de 1 s y ART
solo registra recolecciones largas. E3 corrige el método: memoria nativa y Java medida dentro del
proceso cada 100 ms y `RssAnon` cada 0,2 s, en secuencia y en paralelo. E2: imagen
`UE1A.230829.036.A4`, Conscrypt `com.google.android.conscrypt` 340818082.

## 8. Resultados de E3 (2026-10-28)

Clase `gfpdiag.Pbkdf2Diagnostic` fuera del repositorio y del APK (SHA-256 del código
`49FC9DAA…CDFF7`, del dex `C1B16AB5…7E25F`), ejecutada con `app_process` junto al APK Debug
`B9544684…6F28`, cuya clase `Pbkdf2HmacSha256` es la implementación actual. La alternativa
decodifica estrictamente los bytes UTF-8 a `char[]` y usa `PBEKeySpec`.

| | Android 14 (`diag-e3-pbkdf2-emulator-5554-sdk34-20261028-221432`) | Android 10 (`diag-e3-pbkdf2-emulator-5554-sdk29-20261028-222139`) |
|---|---|---|
| Proveedor actual / alternativo | `AndroidOpenSSL` (Conscrypt) / `BC` 1.68 | `AndroidOpenSSL` / `BC` 1.61 |
| Vectores (V1–V7, tildes, NFC, NFD, emoji, CJK, combinados; 13) | 13/13 en ambas, idénticas entre sí | 13/13 en ambas, idénticas entre sí |
| UTF-8 mal formado | Actual: deriva; alternativa: `MalformedInputException` | Igual |
| Compatibilidad de verificadores (4 contraseñas, 600 000, sal aleatoria; en ambos sentidos y rechazo de la incorrecta) | 4/4 | 4/4 |
| Mediana de 600 000 iteraciones: actual / alternativa | 2040 ms / 972 ms | 16 679 ms (7,7–17,3 s) / 6410 ms |
| Memoria nativa máxima, 6 × 600 000 en secuencia: actual / alternativa | 52,0 y 51,9 MB / 1,3 y 1,3 MB | 47,8 y 48,1 MB / 1,7 y 1,6 MB |
| Memoria nativa máxima, 6 × 600 000 en paralelo (4 hilos): actual / alternativa | **561 y 410 MB** / 1,4 y 1,4 MB | **1933 y 2049 MB** / 2,0 y 1,9 MB |
| `RssAnon` máximo en paralelo: actual / alternativa | 700 y 526 MB / 45 y 40 MB | 1443 y 1442 MB / 24 y 22 MB |
| Montón Java máximo en paralelo: actual / alternativa | 87 y 91 MB / 10 y 6 MB | 285 y 301 MB / 7 y 6 MB |
| `logcat` en paralelo con la actual | `Scudo OOM` 2 y 1; `lowmemorykiller` 2 y 0 | `lowmemorykiller` 60 y 144 (otros procesos) |

Conclusiones:

1. **Demostrado:** con la implementación actual, seis derivaciones en paralelo agotan la memoria
   en ambos emuladores fuera de la app; en secuencia el pico queda acotado (~50 MB), y la
   alternativa no acumula memoria en ningún modo. Las dos repeticiones dan el mismo resultado.
2. **Coherente, no demostrado:** que la memoria corresponda a los contextos HMAC que Conscrypt
   crea en cada `doFinal()` y libera al finalizar (sección 3). No hay pila de llamadas.
3. Android 10 también está afectado; en las ejecuciones de la app no se observó porque la app
   tiene otros límites de montón que `app_process` (`maxMemory` de 192 MB en Android 14 y 512 MB
   en Android 10 en este proceso) y otra presión de recolección. Esto es una hipótesis.

Limitaciones: emuladores, no un dispositivo físico (P-D1 sigue aplazada); `app_process` no
reproduce los límites de montón de la app; el muestreo es periódico; en Android 10 no se pudo
registrar la versión de Conscrypt (`pm list packages --apex-only` no produjo `apex.txt`); la
compatibilidad se probó con verificadores simulados, no con una cuenta guardada en la base de
la app.

## 9. Corrección candidata (WU del 2026-10-28)

El responsable autorizó implementar `SecretKeyFactory("PBKDF2WithHmacSHA256")` y validarlo, sin
integración, publicación ni cierre de E04.

| Rama | Commit | Contenido |
|---|---|---|
| `fix/pbkdf2-memory` (desde `main`, `b59948c`) | `40cda90` | Corrección de `Pbkdf2HmacSha256.java`, vectores U1–U8 y comprobaciones de rechazo en `Pbkdf2Calibration.java`, nota de implementación en `decisiones.md`, `arquitectura-identidad.md` y `etapa-02-pruebas-dispositivo.md` |
| `e04/hu2-login-pbkdf2` (desde `e04/hu2-login`, `37858de`) | `6564d95` | El mismo cambio aplicado con `cherry-pick`, para validar HU1 y HU2 con la corrección; más el script `Invoke-Pbkdf2UpgradeCheck.ps1` y esta documentación |

Comprobaciones hechas por Claude (Linux, JDK 21; el proveedor es `SunJCE`, no el de Android):
`Pbkdf2Calibration` con 13/13 vectores y 6/6 comprobaciones; 303 casos aleatorios (Unicode,
sal aleatoria, 1–3000 y 600 000 iteraciones, 1–64 bytes) idénticos entre la implementación
anterior y la nueva; `typecheck`, `lint`, `format:check` y Jest 265/265 sin cambios en JavaScript.

### Resultados de la validación (2026-10-28 y 2026-10-29)

Rama `e04/hu2-login-pbkdf2`; APK Debug corregido `26D3F94F578D631119652FDF22FC4B057F23DFA1643BC4474029E8DAC540045F`
(compilado con `2e5fd6c`); APK anterior `B9544684B05B5AA05A469E465FE9F18F7ED617749633BACB6108174A42D86F28`.
Entre `2e5fd6c` y `1df52d8` solo cambia `Invoke-Pbkdf2UpgradeCheck.ps1`.

| Comprobación | Commit | Evidencia | Resultado |
|---|---|---|---|
| Análisis sintáctico de los scripts | `1df52d8` | Salida de terminal | 9 archivos sin errores |
| Controles estáticos (Windows) | `2e5fd6c` | `hu2-static-windows-20261028-235504` | PASS=8 FAIL=0; Jest 265/265 |
| Compilación | `2e5fd6c` | `hu2-build-windows-20261028-235608` | PASS=4 FAIL=0; APK `26D3F94F…045F` |
| E1 y E3 con el APK corregido, Android 10 | — | `diag-e3-pbkdf2-nuevo-emulator-5554-sdk29-20261029-000508` | Vectores 13/13 y rechazos 6/6 (`BC` 1.61); mediana 8445 ms (E1) y 6372 ms (E3); memoria nativa máxima 1,9–2,0 MB en paralelo |
| E1 y E3 con el APK corregido, Android 14 | — | `diag-e3-pbkdf2-nuevo-emulator-5554-sdk34-20261029-003237` | Vectores 13/13 y rechazos 6/6 (`BC` 1.68); mediana 1056 ms (E1) y 1215 ms (E3); memoria nativa máxima 1,4 MB en paralelo |
| HU2, Android 10 | `2e5fd6c` | `hu2-device-emulator-5554-20261029-001949` | PASS=26 FAIL=0 BLOCKED=0; sin `lowmemorykiller` |
| Regresión de HU1 / P-D2, Android 10 | `2e5fd6c` | `hu2-hu1-regression-…-20261029-002709`, `hu2-p-d2-…-20261029-003054` | PASS=30 / PASS=15 |
| HU2, Android 14 | `2e5fd6c` | `hu2-device-emulator-5554-20261029-003847` | PASS=26 FAIL=0 BLOCKED=0; sin `Scudo OOM` ni `lowmemorykiller` |
| Regresión de HU1 / P-D2, Android 14 | `2e5fd6c` | `hu2-hu1-regression-…-20261029-004840`, `hu2-p-d2-…-20261029-010313` | PASS=30 / PASS=15 |
| Cuenta creada con el APK anterior, Android 10 | `1df52d8` | `hu2-pbkdf2-upgrade-emulator-5554-20261029-011328` | **PASS=14 FAIL=0 BLOCKED=0 NOT RUN=1** |

Detalle de la cuenta creada con el APK anterior (Android 10):

- El APK instalado era el anterior (SHA-256 de `base.apk`); la cuenta se registró («El registro fue exitoso») y la app anterior se detuvo con `am force-stop` sin pulsar «Aceptar» (`UPGRADE-OLD-STOPPED`). El inicio de sesión con el APK anterior quedó `NOT RUN`, omitido deliberadamente con autorización del responsable (2026-10-29).
- `adb install -r` con el APK nuevo: misma instalación (`firstInstallTime` igual, `lastUpdateTime` nuevo) y `base.apk` con el SHA-256 del APK nuevo.
- La base `gfp.db` tiene el mismo SHA-256 antes y después (`579f2fac…efbe`, `database-states.txt`) y el archivo de la clave sigue presente. Que la clave es la misma se demuestra porque el APK nuevo abrió esa base y autenticó la cuenta; su contenido no se compara para no exponerlo.
- Con el APK nuevo: contraseña incorrecta rechazada con el mensaje literal; inicio de sesión correcto con el correo y con el documento; la contraseña no aparece en `logcat` y no hay `FATAL EXCEPTION`.

Ejecuciones anteriores de esta prueba que no cuentan como resultado: `hu2-pbkdf2-upgrade-emulator-5554-20261029-001552` (Android 10: la cuenta se registró, pero la app anterior se cerró con `SIGABRT` en el hilo de dibujo, con el montón Java a 152/158 MB y `lowmemorykiller` activo, antes de llegar a la actualización) y `…-20261029-003453` (Android 14: la app anterior se cerró durante el registro, con 37 eventos de `Scudo OOM` o `lowmemorykiller`). Ambos cierres son del APK anterior.

Limitaciones: solo emuladores (no hay dispositivo físico; P-D1 sigue aplazada); la prueba con una cuenta real solo pudo hacerse en Android 10, porque en Android 14 el APK anterior no consigue registrar; la versión de Conscrypt de Android 10 no quedó registrada; la mediana en Android 10 (6,4–8,4 s por derivación) es del emulador x86 de 32 bits y no representa un dispositivo.

## 10. Siguiente paso

Revisión de integración por el responsable: la corrección está en `fix/pbkdf2-memory` (desde `main`) y
en `e04/hu2-login-pbkdf2` (desde `e04/hu2-login`). No se ha integrado ni publicado.
