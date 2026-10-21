# Cierre de la Etapa 01 — Estructura inicial y configuración

**Estado: lista para aprobación del responsable; todavía no está formalmente cerrada.**
Este documento resume las evidencias; el cierre formal requiere la aprobación del
responsable.

## Alcance ejecutado

- Proyecto React Native 0.87.1 con TypeScript en `app/`, solo Android.
- Identificador `co.gfpsas.gestionfinanciera`, nombre visible `GFP`, `minSdkVersion 29`.
- Capas `app/src/` según C4 Nivel 3 (vacías en esta etapa).
- Calidad y pruebas: TypeScript estricto, ESLint, Prettier (con `app/.prettierignore`), Jest y React Native Testing Library.
- Validación Android en Windows con `scripts/validar-etapa.ps1` (JDK 17 solo en el proceso), corregido y revalidado.
- Repositorio Git local; los documentos fuente se conservan fuera del repositorio por decisión del responsable (D-FUENTES).

No se implementó ninguna historia de usuario ni trabajo de la Etapa 02.

## Criterios de cierre E01

Estado y evidencias en `trazabilidad.md` (sección "Etapa 01"). E01-C1 y E01-C3 a
E01-C7 verificados; E01-C2 implementado. En E01-C3, el chequeo de formato corregido
está verificado en Linux y en Windows.

## Comprobaciones manuales M1–M4

Detalle en `../evidencias/ETAPA-01/resultados.md`.

| ID | Resultado | Base |
|---|---|---|
| M1 | OK | Captura del lanzador con ícono y nombre "GFP" |
| M2 | OK | Instalación, XML de interfaz, captura y logcat de Debug con Metro |
| M3 | OK | Instalación, XML, captura y logcat de Release; APK con bundle incluido. En la revalidación `20261019-194120` quedaron registrados el cierre de Metro, la ausencia de redirecciones `adb reverse` y la API 29 |
| M4 | Verificación técnica OK; comprobación literal en Ajustes no disponible | `aapt2` y XML de interfaz registran el paquete; la pantalla de Ajustes no lo muestra |

## Identificadores y hashes

| Elemento | Valor |
|---|---|
| Application ID | `co.gfpsas.gestionfinanciera` |
| Etiqueta | `GFP` |
| minSdk / targetSdk / compileSdk | 29 / 36 / 37 |
| Arquitecturas nativas | arm64-v8a, armeabi-v7a, x86, x86_64 |

| APK | Ejecución | SHA-256 |
|---|---|---|
| Debug | `20261016-152425` (16/10/2026) | `086163609A5CA26347D8710CF8697DF634FDD928C13BAD447B21762A96E184D2` |
| Debug | `20261019-194120` (19/10/2026) | `8EB6D5A0D3317A852ACA7A0A560459E579F25BBD1238B90388CED32BF39B395E` |
| Release | `20261016-152425/reanudacion` (19/10/2026) | `D39154D3AE285AE089BFBF7AC53E7997B7CB1C905D27ED53982B721801E4FA05` |
| Release | `20261019-194120` (19/10/2026) | `D39154D3AE285AE089BFBF7AC53E7997B7CB1C905D27ED53982B721801E4FA05` |

Los APK no se versionan; se conservan en `app/android/app/build/outputs/apk/`.

## Evidencias

Rutas relativas a `evidencias/ETAPA-01/`.

| Carpeta | Contenido | Ejecutado por |
|---|---|---|
| `claude-20261016/` | Clon limpio: `npm ci`, tsc, ESLint, Prettier, Jest y configuración estática | Claude (Linux) |
| `20261016-152425/` | Primera ejecución del script: entorno, Gradle con JDK 17, calidad, Jest, `assembleDebug`, dispositivo, `metro.log` (interrumpida en la espera de Metro) | Juan (Windows) |
| `20261016-152425/reanudacion/` | Instalación y ejecución Debug (16/10) y Release (19/10): logs, XML, capturas, logcat, `assembleRelease` | Juan (Windows) |
| `20261016-152425/complementarias-20261019/` | Captura del lanzador, captura de Ajustes y salida completa de `aapt2` | Juan (Windows) |
| `20261019-194120/` | Revalidación con el script corregido: Debug y Release completos; único fallo, Prettier sobre archivos generados | Juan (Windows) |
| `claude-20261019/` | `format:check` tras crear `app/.prettierignore` | Claude (terminal Linux sobre la carpeta del proyecto) |
| `windows-format-check/` | `npm run format:check` tras crear `app/.prettierignore` (21/10/2026, código 0) | Juan (Windows) |

## Incidencias y correcciones

| Incidencia | Corrección | Estado |
|---|---|---|
| El script no reconocía a Metro en Windows PowerShell 5.1 (`/status` leído como `System.Byte[]`) y la espera no mostraba progreso | Lectura como texto con límites de tiempo, progreso, control del puerto 8081 y cierre seguro de Metro (19/10/2026) | Revalidado en `20261019-194120/` |
| `format:check` revisaba archivos generados por Gradle y CMake | `app/.prettierignore` (20/10/2026) | Verificado en Linux y en Windows |

Detalle en `decisiones.md`. No está demostrado que la lectura como `System.Byte[]`
fuera la única causa de la interrupción de la primera ejecución.

## Limitaciones

- M4 no pudo comprobarse literalmente en Ajustes; se sustenta en evidencia técnica.
- En la sesión manual Release del 19/10 (`20261016-152425/reanudacion/`), la API 29 y la detención de Metro solo las observó Juan; ambas quedaron registradas después en la revalidación `20261019-194120/`.
- El hash del APK Debug difiere entre las dos ejecuciones; el del Release coincide. Se registran ambos sin atribuir causa.

## Observaciones no bloqueantes

- Avisos de obsolescencia de la plantilla de React Native 0.87.1 y sus dependencias (AGP 10), registrados en `decisiones.md`.
- Permiso `INTERNET` y firma del Release con la clave de depuración de la plantilla: decisiones de las etapas 02 y 13.

## Pendiente para cerrar

1. Revisión del diff y autorización de commits.
2. Aprobación del responsable; después, creación de `main` y de la etiqueta `etapa-01-aprobada`.
