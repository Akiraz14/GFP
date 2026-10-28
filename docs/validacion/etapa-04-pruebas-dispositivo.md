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
| 1 | `Invoke-StaticChecks.ps1` | Node, rama y árbol limpio, `npm ci`, `typecheck`, `lint`, `format:check` y Jest (264 pruebas esperadas) | Ninguna |
| 2 | `Invoke-AndroidBuild.ps1` | `assembleDebug` con JDK 17 solo en el proceso; SHA-256 del APK | Ninguna |
| 3 | `Invoke-Hu2DeviceTests.ps1 -Serial <emulador>` | Instalación limpia; HU2-CA01 a HU2-CA10, regresión HU1-CA18 y registro de una cuenta sintética por la interfaz; base cifrada y `logcat` sin la contraseña | Automática; reinstala la app con `-AllowAppReset` |
| 4 | `Invoke-Hu1DeviceRegression.ps1 -Serial <emulador>` | P-D3, E03-V09 (clave ausente y rechazada), E03-V06 y E03-V13 con la app que empieza en el inicio de sesión | Automática; reinstala la app con `-AllowAppReset` |
| 5 | `Invoke-HermesUnicodeCheck.ps1 -Serial <emulador>` | P-D2 en Hermes con la app de la rama | Automática; usa la app instalada por el paso 4 |

`Invoke-Hu2DeviceTests.ps1` deja la app con una cuenta sintética y el acceso bloqueado 15
minutos (HU2-CA06); el paso 4 la reinstala. Ninguno de los scripts hace commit, push ni cambia
archivos versionados; cada uno comprueba al terminar que el estado de Git no cambió.

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

Al 2026-10-28 los scripts de esta etapa no se han ejecutado en Windows ni en los emuladores;
todas las comprobaciones de este documento están **NOT RUN**. Los resultados se registrarán
aquí y en `trazabilidad.md` cuando el responsable los ejecute.
