# Validación de la Etapa 04 — HU2 Iniciar sesión

Procedimiento reproducible para validar HU2 en Windows y en los emuladores del estándar del
proyecto: Android 10 (API 29) y Android 14 (API 34). Los scripts están en `scripts/stage-04/`,
derivan la raíz del repositorio de su propia ubicación y rechazan la ubicación obsoleta del
repositorio. Las evidencias siguen E04-D8 (`decisiones-etapa-04.md`): se guardan fuera del
repositorio, una carpeta por ejecución, y no se sobrescriben.

## Prerrequisitos

- Un clon o worktree de GFP con la rama `e04/hu2-login`, con el árbol limpio.
- Node.js 22.11 o superior y npm (`app/package.json`, `engines`).
- JDK 17 (lo busca en la carpeta de instalación predeterminada de Microsoft OpenJDK o se indica con `-Jdk17Path`) y el Android SDK (`ANDROID_HOME`).
- Para las pruebas en dispositivo: emuladores desechables encendidos y visibles en `adb devices`; el puerto 8081 libre para Metro.

## Scripts

Se ejecutan desde la raíz del repositorio. Resultados: `PASS`, `FAIL`, `BLOCKED` (precondición
no cumplida, la ejecución se detiene) y `NOT RUN`. Código de salida: 0 sin fallos, 1 con algún
`FAIL`, 2 con algún `BLOCKED`.

| Orden | Script | Qué comprueba | Interacción |
|---|---|---|---|
| 0 | `Test-ScriptSyntax.ps1` | Análisis sintáctico de todos los scripts, sin ejecutarlos | Ninguna |
| 1 | `Invoke-StaticChecks.ps1` | Node, rama y árbol limpio, `npm ci`, `typecheck`, `lint`, `format:check` y Jest (265 pruebas esperadas) | Ninguna |
| 2 | `Invoke-AndroidBuild.ps1` | `assembleDebug` con JDK 17 solo en el proceso; SHA-256 del APK | Ninguna |
| 3 | `Invoke-Hu2DeviceTests.ps1 -Serial <emulador>` | Instalación limpia; HU2-CA01 a HU2-CA10, regresión HU1-CA18 y registro de una cuenta sintética por la interfaz; base cifrada y `logcat` sin la contraseña | Automática; reinstala la app con `-AllowAppReset` |
| 4 | `Invoke-Hu1DeviceRegression.ps1 -Serial <emulador>` | P-D3, E03-V09 (clave ausente y rechazada), E03-V06 y E03-V13 con la app que empieza en el inicio de sesión | Automática; reinstala la app con `-AllowAppReset` |
| 5 | `Invoke-HermesUnicodeCheck.ps1 -Serial <emulador>` | P-D2 en Hermes con la app de la rama | Automática; usa la app instalada por el paso 4 |

`Invoke-Hu2DeviceTests.ps1` deja la app con una cuenta sintética y el acceso bloqueado 15
minutos (HU2-CA06); el paso 4 la reinstala. Ninguno de los scripts hace commit, push ni cambia
archivos versionados; cada uno comprueba al terminar que el estado de Git no cambió.

Cada llamada de `adb` que maneja la interfaz tiene un límite de 60 s. Si el emulador deja de
responder, el script registra `BLOCKED DEVICE-RESPONSIVE`, detiene Metro y termina; hay que
reiniciar el emulador con *Cold Boot* antes de repetir la ejecución.

## Comprobaciones en dispositivo

| ID | Criterio | Resultado esperado |
|---|---|---|
| `HU2-START` | — | La app abre en el inicio de sesión, con «Identificador» y «Contraseña» |
| `HU2-CA02` | HU2-CA02 | Con los campos vacíos, «Ingresa tu identificador.» e «Ingresa tu contraseña.» |
| `HU2-CA04` | HU2-CA04 | Con «ana@example», «Verificar identificación» |
| `HU2-CA09` | HU2-CA09 (parcial) | El enlace lleva a la pantalla provisional de HU3 |
| `HU2-CA08` | HU2-CA08 | «Registrar» abre el paso 1 del registro |
| `HU1-CA18` | HU1-CA18 (regresión) | «Cancelar» vuelve al inicio de sesión real con los campos vacíos |
| `HU2-CA05-PASSWORD`, `HU2-CA05-UNKNOWN` | HU2-CA05 | El mensaje literal en ambos casos |
| `HU2-CA01-EMAIL`, `-DOCUMENT`, `-PHONE`, `HU2-CA07` | HU2-CA01, HU2-CA07 | Inicio de sesión con correo (en mayúsculas), documento, celular E.164 y celular nacional; destino provisional de HU5 |
| `…-RESTART` | HU2-CA10, E04-D4 | Al reabrir la app, la sesión no se conserva |
| `HU2-CA06-THIRD`, `HU2-CA06`, `HU2-CA06-RESTART` | HU2-CA06 | El tercer fallo anuncia el bloqueo de 15 minutos; con la contraseña correcta sigue bloqueado, también tras reabrir la app |
| `HU2-CA03-DB`, `HU2-CA03-LOGCAT` | HU2-CA03 | La base cifrada no contiene la contraseña ni el correo en claro; `logcat` no contiene la contraseña |
| `LOGCAT` | — | Sin `FATAL EXCEPTION` |

## Estado

Ejecuciones del 2026-10-28 en Windows, con las evidencias en `GFP-e04-evidencias\` (fuera del
repositorio). Las pruebas en dispositivo usaron el commit `438a9f6`; el APK se compiló con
`35a8150` y el análisis estático con `a13bddc`. Entre esos commits solo cambian scripts de esta
etapa y este documento, no el código de la app.

| Paso | Dispositivo | Carpeta de evidencias | Resultado |
|---|---|---|---|
| 0 | Windows | (salida de terminal, commit `35a8150`) | 8 archivos sin errores; la repetición con `438a9f6` no se capturó |
| 1 | Windows | `hu2-static-windows-20261028-144946` | PASS=8 FAIL=0 (Jest 264/264) |
| 2 | Windows | `hu2-build-windows-20261028-162954` | PASS=4 FAIL=0; APK SHA-256 `B9544684…6F28` |
| 3 | Android 14 (API 34) | `hu2-device-emulator-5554-20261028-181257` | PASS=26 FAIL=0 BLOCKED=0 |
| 4 | Android 14 (API 34) | `hu2-hu1-regression-emulator-5554-20261028-182906` | PASS=30 FAIL=0 BLOCKED=0 |
| 5 | Android 14 (API 34) | `hu2-p-d2-emulator-5554-20261028-183403` | PASS=15 FAIL=0 BLOCKED=0 |
| 3 | Android 10 (API 29) | `hu2-device-emulator-5554-20261028-190159` | PASS=26 FAIL=0 BLOCKED=0 |
| 4 | Android 10 (API 29) | `hu2-hu1-regression-emulator-5554-20261028-191251` | PASS=30 FAIL=0 BLOCKED=0 |
| 5 | Android 10 (API 29) | `hu2-p-d2-emulator-5554-20261028-191606` | PASS=15 FAIL=0 BLOCKED=0 |

Todas las comprobaciones de la tabla «Comprobaciones en dispositivo» pasaron en ambos
emuladores, y en ninguna ejecución cambió el estado de Git del worktree.

**Pendiente con `a4831e9`.** Ese commit cambia `LoginScreen.tsx`: dos envíos del formulario
antes de que la pantalla se actualice contaban dos intentos (HU2-CA06). En Linux pasan
`typecheck`, `lint`, `format:check` y Jest (265 pruebas). Faltan los pasos 1 y 3 en Windows y en
ambos emuladores. El APK Debug no incluye el JavaScript (lo sirve Metro desde el árbol), así que
el paso 2 no es necesario para probar el cambio; los pasos 4 y 5 no dependen de la pantalla de
inicio de sesión más allá de su carga, que el paso 3 comprueba.

Ejecuciones anteriores que no cuentan como resultado:

- `hu2-build-windows-20261028-145142`: la compilación terminó (`BUILD SUCCESSFUL` en
  `gradle-assembleDebug.log`), pero el script se quedó esperando al demonio de Gradle y se
  detuvo a mano; corregido en `35a8150`.
- `hu2-device-emulator-5554-20261028-164615` (Android 14): el emulador dejó de responder en el
  paso 3 del registro y hubo que reiniciarlo con *Cold Boot*; el script esperó sin límite y se
  detuvo a mano. Las ocho comprobaciones previas pasaron. Se desconoce la causa del bloqueo
  del emulador; desde `438a9f6` las llamadas de `adb` tienen límite de tiempo.

En `Invoke-HermesUnicodeCheck.ps1` la línea «PASS conexion WebSocket» es informativa y no entra
en el recuento: el resumen tiene 16 líneas `PASS` y el resultado indica `PASS=15`.
