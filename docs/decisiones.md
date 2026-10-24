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
| E02-LIB | Librerías nativas seleccionadas para los fundamentos técnicos, con versión exacta: `@op-engineering/op-sqlite` 18.2.5 con SQLCipher (`"op-sqlite": { "sqlcipher": true }`), `react-native-keychain` 10.0.0, `react-native-get-random-values` 2.0.0 (solo su módulo nativo `RNGetRandomValues`), `@noble/hashes` 2.4.0, `@react-native-ml-kit/text-recognition` 2.0.0 y `react-native-image-picker` 8.3.0. | 2026-10-23 | 02 |
| E02-INT | Integración selectiva de la Etapa 02 en `main`: dependencias, configuración de SQLCipher, regla ESLint de aleatoriedad segura y documentación. La aplicación de la Etapa 01 (`App.tsx`, sus pruebas y `versionName "1.0"`) no cambia. El código de pruebas de concepto se conserva solo en `refs/revision/spike-02-v4` (`6caa2acc882965d68a37f87992c0a6136c7db4fa`) y no se integra. | 2026-10-23 | 02 |
| E02-RNG | En `src/` se prohíben `Math.random` y el import del punto de entrada de `react-native-get-random-values` (contiene un respaldo inseguro con `Math.random`); los valores aleatorios criptográficos se obtienen del módulo nativo `RNGetRandomValues`. Regla ESLint en `app/.eslintrc.js`. | 2026-10-23 | 02 |
| E02-CIERRE | Cierre técnico de la Etapa 02 aceptado con reservas, según el informe `Informe_Cierre_Tecnico_Stage02_V4.docx` (fuera del repositorio). Las reservas y las decisiones abiertas figuran en las secciones "Etapa 02" de este registro. | 2026-10-23 | 02 |
| E02-OCR | La anomalía `similarity=0.355` de la imagen sintética 03 se acepta como limitación conocida, pendiente de pruebas OCR exhaustivas en una fase posterior. No valida la calidad ni la precisión del OCR. | 2026-10-23 | 02 |

## Discrepancias documentadas

| ID | Discrepancia | Estado |
|---|---|---|
| C-01 | El documento de historias de usuario (§2.1) indica que en la fase MVP no se contempla la generación y entrega de un APK instalable. La propuesta comercial, la propuesta VF y la decisión DT-01 establecen el APK como entregable. Según Juan, la redacción del documento de historias responde a una consideración académica de flexibilidad ante la evaluación. **Alcance documental académico:** demostración desde el entorno de desarrollo. **Objetivo técnico del proyecto:** APK instalable y validado (DT-01). El documento de historias no se modifica. | Abierta hasta su formalización documental; no reduce el objetivo técnico. |
| C-02 | G-03 establece un repositorio solo local, sin remoto publicado, en `C:\Users\juanz\Akiraz\Study\GFP`. El repositorio canónico está en `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP` y tiene el remoto `origin` (`https://github.com/Akiraz14/GFP.git`), con `main` publicado en `e10cebf` (`git ls-remote`, 2026-10-23). La WU de cierre de la Etapa 02 autoriza sincronizar `main` con ese remoto. | Abierta: actualización formal de G-03 pendiente del responsable. |

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

## Etapa 02 — resultados validados experimentalmente

Ejecución del protocolo `scripts/poc-stage02.ps1` sobre la rama experimental
`spike/02-compatibilidad` V4 (`6caa2ac`), 2026-10-23, emulador `emulator-5554` (API 34).
Evidencia original fuera del repositorio: `GFP-spike02-evidencias\20261023-163848-6caa2ac\`
(`summary.md`: 48 PASS, 1 FAIL `BUILD-RELEASE`). Copia versionada en
`evidencias/ETAPA-02/V4/`, idéntica byte a byte en sus 69 archivos (SHA-256 comparados el
2026-10-23; en Git, con finales de línea LF); las copias de bases de datos y el APK no se versionan (ver
`evidencias/ETAPA-02/README.md`). Son resultados de un emulador con código de pruebas de
concepto; no demuestran el comportamiento en producción ni en dispositivos físicos.

| Fundamento | Resultado | Evidencia |
|---|---|---|
| SQLCipher (op-sqlite) | Lectura y escritura cifradas; clave incorrecta rechazada con `NOTADB` y archivo sin cambios; sin cabecera ni marcadores en claro con control positivo válido; SQLite estándar no abre la copia cifrada | `wrong-key-hashes.txt`, `at-rest.txt`, `marker-search.txt`, `sqlite-standard.txt` |
| Persistencia | Datos de P1, P1B y P2 conservados tras force-stop, cierre, cambio de variante, actualización con `install -r` y reinicio | `steps\`, `runs.txt` |
| Keystore (react-native-keychain) | Secreto guardado y recuperado entre ejecuciones; nivel declarado `SECURE_SOFTWARE` | `summary.md` (`P2-KEYSTORE-CAPABILITY`) |
| PBKDF2-HMAC-SHA256 (@noble/hashes) | Vectores V1–V7D correctos en Hermes; benchmark 12/12 muestras en 435 s (presupuesto 900 s) | `p3-extended.txt`, `p3-benchmark.txt` |
| Cámara, galería y OCR (viabilidad) | Lote de 6 imágenes sintéticas sin fallos (p50 543 ms, p95 3.497 ms); galería y cámara con resultado OCR | `p4-batch.txt`, `steps\` |
| Build Debug | Compilado e instalado | `gradle-assembleDebug.log`, `apk-spike.txt` |
| Build Release | Falló en la ruta larga (`ninja: Filename longer than 260 characters`); las pruebas Release usaron un APK compilado antes desde el mismo commit (`DD54C93E…`). Un Release compilado después en `C:\gfp-v4-short` (`819EF8CC…`) solo se instaló y abrió | `gradle-assembleRelease.log`; informe de cierre |

## Etapa 02 — integración en `main`

| Elemento | Valor |
|---|---|
| Commits | `372180c` (feat: integrate stage 02 technical foundations) y `e21ba6b` (merge sin avance rápido de `372180c` sobre `e10cebf`) |
| Archivos | `app/.eslintrc.js`, `app/package.json`, `app/package-lock.json`, `docs/decisiones.md`, `docs/trazabilidad.md` |
| Sin cambios respecto a `e10cebf` (comprobado con `git diff --quiet`) | `app/App.tsx`, `app/__tests__/App.test.tsx`, `app/android/` (incluido `versionName "1.0"` e identificador `co.gfpsas.gestionfinanciera`), `app/src/`, `app/app.json`, `app/index.js`, `app/jest.config.js`, `app/jest.setup.js`, `scripts/`, `evidencias/ETAPA-01/` |
| Validaciones sobre el árbol `app/` de `main` (`b5a0f08`) | Claude, Linux, 2026-10-23: `npm ci`, `typecheck`, `lint`, `format:check` y Jest (1/1) con código 0 (`evidencias/ETAPA-02/claude-20261023/`) |
| No ejecutado | Compilación Android Debug de `main` integrado en Windows con JDK 17. Las compilaciones Debug y Release de la Etapa 02 se hicieron sobre la rama experimental `6caa2ac`, con las mismas versiones de las dependencias |

## Etapa 02 — decisiones abiertas

No se dan por resueltas por haber validado las librerías. Los valores de las pruebas son
hipótesis de prueba, no parámetros aprobados.

| ID | Decisión abierta | Estado | Justificación y evidencia | Condición de resolución | Prerrequisito de la Etapa 03 |
|---|---|---|---|---|---|
| E02-D1 | Algoritmo y parámetros de protección de contraseñas y respuestas: iteraciones de PBKDF2, `Tmax`, tamaño de sal y de clave derivada | Abierta | Candidatos 600000 iteraciones, sal de 16 bytes y clave de 32 bytes solo como hipótesis de prueba; benchmark medido en emulador (mediana 70,9 s para 600000 iteraciones en Hermes, `p3-benchmark.txt`), no en dispositivo físico | El responsable aprueba algoritmo y parámetros, con la medición en el dispositivo o emulador que acepte como referencia | Sí |
| E02-D2 | Política de normalización Unicode de contraseñas y respuestas (NFC u otra) | Abierta | V7 y V7D demuestran que NFC y NFD producen claves distintas (`pbkdf2-vectors.txt`) | Política aprobada, coherente con E03-D9 y E05-D3 | Sí |
| E02-D3 | Estrategia de clave de cifrado de la base de datos (generación, custodia en Keystore, rotación) | Abierta | Secreto aleatorio en Keystore validado en el PoC con nivel declarado `SECURE_SOFTWARE`; respaldo por hardware y generación con `RNGetRandomValues` no observados en la ejecución final | Estrategia aprobada: generación, custodia, nivel de protección aceptado, comportamiento ante borrado de datos o reinstalación y rotación | Sí |
| E02-D4 | Modelo multiusuario | Abierta | Sin evidencia ni decisión; afecta a HU2-CA11 | Modelo aprobado por el responsable | Sí |
| E02-D5 | Esquema de base de datos en la Etapa 02 o incremental | Abierta | Sin decidir; afecta a HU8-CA07c | Decisión del responsable sobre el alcance del esquema | Sí |
| E02-D6 | Criterios y evidencias concretas de cierre de la Etapa 02 (G-06) | Criterios registrados; aprobación pendiente | Criterios E02-C1 a E02-C7 con estado y evidencia en `trazabilidad.md`; veredicto en `cierre-etapa-02.md` | Aprobación explícita del responsable de los criterios y del cierre con reservas | Sí |
| E02-D7 | Permisos del APK final: `INTERNET` y los añadidos por `react-native-keychain` (`USE_BIOMETRIC`, `USE_FINGERPRINT`) | Abierta | Observados en el APK Debug del PoC (`permissions-debug.txt`), junto con otros declarados por dependencias | Decisión del responsable con la lista de permisos del APK de `main` (`aapt2`); a más tardar en la Etapa 13, según la observación registrada sobre `INTERNET` | No |
| E02-D8 | Umbral de calidad del OCR | Abierta | Sin umbral aprobado (E02-OCR); la viabilidad demostrada no aprueba la calidad | Umbral y conjunto de pruebas aprobados antes de la Etapa 10 (HU7) | No |
| E02-D9 | Tratamiento de la vulnerabilidad alta informada por `npm audit` | Abierta | `npm audit` (2026-10-23, `claude-20261023/npm-audit.json`): un único hallazgo alto, `body-parser` 2.3.0 (GHSA-27r3-jxmh-p828, denegación de servicio), dependencia transitiva de la dependencia de desarrollo `@react-native-community/cli` 20.2.0 (`cli-server-api`). Ya figuraba en el `package-lock.json` de `e10cebf`; no la introducen las dependencias de la Etapa 02. `npm audit` informa una corrección disponible. No se ejecutó `npm audit fix` | Decisión del responsable (actualizar, fijar la versión o aceptar el riesgo) y revalidación completa si cambia el lockfile | No |

## Etapa 02 — limitaciones registradas

- Protección de claves respaldada por hardware no demostrada (`SECURE_SOFTWARE`).
- Generación del secreto con `RNGetRandomValues` no observada en la ejecución final (el secreto ya existía).
- Escenarios de desinstalación y reinstalación no ejecutados (destructivos, sin autorización).
- Sin validación en dispositivo físico, incluida la cámara.
- La compilación Release en Windows requiere una ruta corta por el límite de 260 caracteres de Ninja. Procedimiento conocido: compilar desde un worktree en una ruta corta (por ejemplo `C:\gfp-v4-short`) con JDK 17 solo en el proceso. Las pruebas Release se ejecutaron con el APK `DD54C93E…`; el Release `819EF8CC…`, compilado en la ruta corta, solo se instaló y abrió.
- Compilación Android de `main` integrado (`e21ba6b`) no ejecutada; ver "Etapa 02 — integración en `main`".
- Pruebas en un solo emulador (API 34); no se repitieron en el emulador API 29 de la Etapa 01.
- OCR evaluado solo con 6 imágenes sintéticas; la anomalía `similarity=0.355` (imagen 03) queda como limitación conocida (E02-OCR).

## Prerrequisitos de la Etapa 03 (HU1 Registrar usuario)

Deben resolverse antes de iniciar la Etapa 03:

| Prerrequisito | Motivo |
|---|---|
| E02-D6 y aprobación del cierre de la Etapa 02 | Protocolo por etapa: pausa obligatoria hasta aprobación explícita |
| E02-D1 y E02-D2 | HU1 almacena contraseña y respuestas de seguridad (relacionado con E03-D9 y E03-D10) |
| E02-D3, E02-D4 y E02-D5 | HU1 crea el primer registro persistente de usuario |
| G-07 y E03-D1 a E03-D10 | Decisiones propias de la etapa en `plan-etapas.md` |
| Autorización explícita del responsable para iniciar la Etapa 03 | El cierre técnico de la Etapa 02 no la concede |
