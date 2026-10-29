# Diagnóstico: cierre de la app en Android 14 durante el registro (Etapa 04)

**Estado: diagnóstico en curso. La causa raíz NO está demostrada.** Las evidencias existentes
son muy consistentes con una hipótesis concreta (sección 3), pero falta el experimento
controlado de la sección 5. No se ha modificado `GfpCrypto` ni el algoritmo (E02-D1); el
responsable autorizó solo el diagnóstico (2026-10-28).

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

## 5. Experimentos que faltan

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

## 7. Siguiente paso

El responsable decide si autoriza E3 y, con los resultados de E1 a E3, la alternativa de
corrección. Hasta entonces, el recorrido de HU2 en Android 14 sigue pendiente.
