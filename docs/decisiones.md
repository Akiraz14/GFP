# Registro de decisiones — GFP

Fuente de verdad: los documentos fuente del proyecto (propuesta comercial, propuesta VF
y documento de historias de usuario), que se conservan fuera del repositorio por
decisión del responsable. Este registro
recoge las decisiones tomadas por el responsable del proyecto (Juan) durante la
planificación y la ejecución por etapas. No modifica los documentos fuente.

## Decisiones tomadas

| ID | Decisión | Fecha | Etapa |
|---|---|---|---|
| G-01 | Plan de etapas v3 aprobado: etapas 00, 01, 02, una etapa por historia (HU1–HU10) y etapa 13 de integración. Orden: HU1, HU2, HU3, HU8, HU4, HU5, HU6, HU7, HU9, HU10. Ver `plan-etapas.md`. | 2026-10-16 | 00 |
| DT-01 | El APK instalable y funcional para Android 10 (API 29) o superior es un entregable técnico obligatorio. Su generación, instalación y validación forman parte del proyecto. | 2026-10-16 | 00 |
| G-02 | Validación Android: Claude prepara guías, comandos, pruebas y registro de evidencias; Juan ejecuta en Windows lo que el entorno de Claude no permite. La validación en una segunda versión de Android es complementaria salvo acuerdo posterior. | 2026-10-16 | 00 |
| G-03 | Repositorio Git solo local en `C:\Users\juanz\Akiraz\Study\GFP`, con los documentos fuente intactos. No se crea ni publica repositorio remoto por ahora. | 2026-10-16 | 00 |
| G-04 | React Native CLI 0.87.x con TypeScript, npm, ESLint, Prettier, Jest y React Native Testing Library. Las dependencias nativas se validan en la Etapa 02. | 2026-10-16 | 00 |
| G-05 | Nombre visible `GFP`; identificador de aplicación `co.gfpsas.gestionfinanciera`. | 2026-10-16 | 00 |
| D-FUENTES | Los documentos fuente no se incluyen en el repositorio Git; se conservan fuera de él, en la ubicación de trabajo del responsable. No se restauran desde el historial. | 2026-10-16 | 01 |
| CA-ID | Los criterios de aceptación se conservan literalmente; se usan identificadores internos `HUx-CAyy` solo para organizar pruebas y trazabilidad. | 2026-10-16 | 00 |

## Discrepancias documentadas

| ID | Discrepancia | Estado |
|---|---|---|
| C-01 | El documento de historias de usuario (§2.1) indica que en la fase MVP no se contempla la generación y entrega de un APK instalable. La propuesta comercial, la propuesta VF y la decisión DT-01 establecen el APK como entregable. Según Juan, la redacción del documento de historias responde a una consideración académica de flexibilidad ante la evaluación. **Alcance documental académico:** demostración desde el entorno de desarrollo. **Objetivo técnico del proyecto:** APK instalable y validado (DT-01). El documento de historias no se modifica. | Abierta hasta su formalización documental; no reduce el objetivo técnico. |

## Entorno de validación confirmado (G-02)

Evidencia aportada por Juan el 2026-10-16 (Windows):

| Componente | Valor |
|---|---|
| Node / npm | 24.22.0 / 12.2.0 |
| Java global | Microsoft OpenJDK 25.0.4.1 (sin cambios) |
| JDK para GFP | Microsoft OpenJDK 17.0.20.1 — `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot` (se usa solo en el proceso de compilación) |
| ANDROID_HOME | `C:\Users\juanz\AppData\Local\Android\Sdk` |
| build-tools | 37.0.0 (requerida por la plantilla) y 36.0.0 |
| NDK | 27.1.12297006 (requerida por la plantilla) y 28.2.13676358 |
| CMake | 3.22.1 |
| Plataformas | android-29, android-35, android-36, android-37.0 |
| Licencias SDK | Aceptadas |
| Emulador | `Pixel_4_Android_10`: API 29, x86, Google Play, WHPX disponible |
| Rutas largas | `LongPathsEnabled = 1` |

Motivo del JDK 17: `@react-native/gradle-plugin` 0.87.1 fija `jvmToolchain(17)` y
`sourceCompatibility = JavaVersion.VERSION_17` para los módulos Android
(`JdkConfiguratorUtils.kt`). La guía oficial de React Native recomienda JDK 17.

## Observaciones registradas para etapas futuras (sin decisión tomada)

| Observación | Etapa |
|---|---|
| La plantilla declara el permiso `INTERNET` (necesario para Metro en desarrollo). Si debe mantenerse en el APK final se decide con la seguridad de la Etapa 02 o en la Etapa 13. | 02 / 13 |
| La plantilla firma la variante release con la clave de depuración. La clave de firma definitiva es la decisión E13-D1. | 13 |
| El diagrama C4 Nivel 3 incluye los componentes "Sincronización Local" (Servicios) y "Generación de Reportes" (Análisis). Su alcance se interpreta con las historias de usuario y las exclusiones (sin sincronización entre dispositivos ni exportación); se revisará al implementar las etapas afectadas. | 02 / 11 |
| El APK release registra en `aapt2 dump badging` los permisos `android.permission.INTERNET` y `co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (este último lo genera AndroidX). Se revisan junto con la observación del permiso `INTERNET`. | 02 / 13 |

## Diagnóstico de la validación Android en Windows (Etapa 01)

| Tipo | Contenido |
|---|---|
| Hecho comprobado (Juan, Windows PowerShell 5.1) | `Invoke-WebRequest -UseBasicParsing` sobre `http://localhost:8081/status` respondió en 0,2 s con contenido `System.Byte[]`, porque Metro no envía `Content-Type`. Con ese tipo de contenido, la comparación con `packager-status:running` del script original no podía cumplirse (análisis del código por Claude). |
| Hecho comprobado (Juan) | `curl.exe --max-time 10 -i http://localhost:8081/status` devolvió HTTP 200 y `packager-status:running`; el puerto 8081 estaba libre antes de iniciar Metro. |
| Hecho comprobado (Claude, evidencias) | En la ejecución `20261016-152425`, Metro quedó listo (`metro.log`) y el script no registró ningún paso posterior; la espera no mostraba mensajes de progreso. |
| No demostrado | Que la lectura como `System.Byte[]` sea la única causa de la interrupción observada (por sí sola habría terminado en FALLO a los 120 s). |
| Corrección aplicada (19/10/2026) | `scripts/validar-etapa.ps1`: lectura de `/status` como texto con límites de conexión y lectura de 3 s y sin proxy; progreso cada 10 s; límite global de 120 s; detección previa del puerto 8081 ocupado; cierre del Metro lanzado por el script también ante Ctrl+C, sin cerrar procesos ajenos; `adb reverse --remove tcp:8081` en lugar de `--remove-all`; PID y datos del dispositivo por variante; verificación del dispositivo antes de Release. |
| Revalidación (Juan, Windows, 19/10/2026) | Ejecución `evidencias/ETAPA-01/20261019-194120/`: puerto 8081 libre, Metro listo en 5 s, cierre de Metro con puerto libre, `reverse-release.txt` sin redirecciones, PID y datos del dispositivo registrados para Debug y Release. |

## Defecto de formato detectado en la revalidación (Etapa 01)

| Tipo | Contenido |
|---|---|
| Hecho comprobado | En `20261019-194120/format.log`, `npm run format:check` falló (código 1) con 359 archivos, todos generados por la compilación: 104 en `android\app\.cxx\` y 255 en `android\app\build\`. Ningún archivo fuente ni de documentación. |
| Causa | El script `format:check` revisa `**/*.{js,jsx,ts,tsx,json,md}` y Prettier 2.8.8 no aplica `.gitignore`; no existía `.prettierignore`. En la primera ejecución el chequeo corrió antes de que existieran las carpetas de compilación. |
| Corrección (20/10/2026) | `app/.prettierignore` con `android/app/build/`, `android/app/.cxx/`, `android/build/`, `android/.gradle/`, `android/.kotlin/` y `coverage/`. Ninguno de los 21 archivos fuente y de documentación de `app/` queda excluido (comprobado con `prettier --file-info`); las 6 rutas no tienen archivos versionados y ya estaban en `app/.gitignore`. |
| Resultado | Claude, terminal Linux sobre la carpeta del proyecto: "All matched files use Prettier code style!", código 0 (`claude-20261019/format-check.log`). Juan, Windows (21/10/2026): `npm run format:check` → "All matched files use Prettier code style!", código 0 (`evidencias/ETAPA-01/windows-format-check/format-check.log`). Corrección verificada en ambos entornos. |

## Advertencias de compilación registradas (observación, no fallo)

Avisos de obsolescencia observados en `evidencias/ETAPA-01/20261016-152425/gradle-assembleDebug.log`, procedentes de la
plantilla de React Native 0.87.1 y de sus dependencias, no del código de GFP. No
impiden compilar; se revisarán si una actualización de AGP los convierte en errores.

| Aviso | Origen |
|---|---|
| `android.builtInKotlin=false` y `android.newDsl=false` obsoletas; se retirarán en AGP 10 | `android/gradle.properties` de la plantilla |
| APIs `applicationVariants`, `testVariants`, `unitTestVariants`, `libraryVariants` obsoletas | Plugin de Gradle de React Native y `react-native-safe-area-context` |
| Constructor de `DefaultReactActivityDelegate` con flags obsoleto | `MainActivity.kt` de la plantilla |
| Clases de la arquitectura antigua y atributo `package` en el manifiesto | `react-native-safe-area-context` |
