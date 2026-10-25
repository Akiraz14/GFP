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
| G-03 | Repositorio Git solo local en `C:\Users\juanz\Akiraz\Study\GFP`, con los documentos fuente intactos. No se crea ni publica repositorio remoto por ahora. Sustituida por G-08. | 2026-10-16 | 00 |
| G-04 | React Native CLI 0.87.x con TypeScript, npm, ESLint, Prettier, Jest y React Native Testing Library. Las dependencias nativas se validan en la Etapa 02. | 2026-10-16 | 00 |
| G-05 | Nombre visible `GFP`; identificador de aplicación `co.gfpsas.gestionfinanciera`. | 2026-10-16 | 00 |
| D-FUENTES | Los documentos fuente no se incluyen en el repositorio Git; se conservan fuera de él, en la ubicación de trabajo del responsable. No se restauran desde el historial. | 2026-10-16 | 01 |
| CA-ID | Los criterios de aceptación se conservan literalmente; se usan identificadores internos `HUx-CAyy` solo para organizar pruebas y trazabilidad. | 2026-10-16 | 00 |
| E02-LIB | Librerías nativas seleccionadas para los fundamentos técnicos, con versión exacta: `@op-engineering/op-sqlite` 18.2.5 con SQLCipher (`"op-sqlite": { "sqlcipher": true }`), `react-native-keychain` 10.0.0, `react-native-get-random-values` 2.0.0 (solo su módulo nativo `RNGetRandomValues`), `@noble/hashes` 2.4.0, `@react-native-ml-kit/text-recognition` 2.0.0 y `react-native-image-picker` 8.3.0. | 2026-10-23 | 02 |
| E02-INT | Integración selectiva de la Etapa 02 en `main`: dependencias, configuración de SQLCipher, regla ESLint de aleatoriedad segura y documentación. La aplicación de la Etapa 01 (`App.tsx`, sus pruebas y `versionName "1.0"`) no cambia. El código de pruebas de concepto se conserva solo en `refs/revision/spike-02-v4` (`6caa2acc882965d68a37f87992c0a6136c7db4fa`) y no se integra. | 2026-10-23 | 02 |
| E02-RNG | En `src/` se prohíben `Math.random` y el import del punto de entrada de `react-native-get-random-values` (contiene un respaldo inseguro con `Math.random`); los valores aleatorios criptográficos se obtienen del módulo nativo `RNGetRandomValues`. Regla ESLint en `app/.eslintrc.js`. | 2026-10-23 | 02 |
| E02-CIERRE | Cierre técnico de la Etapa 02 aceptado con reservas, según el informe `Informe_Cierre_Tecnico_Stage02_V4.docx` (fuera del repositorio). Las reservas y las decisiones abiertas figuran en las secciones "Etapa 02" de este registro. | 2026-10-23 | 02 |
| E02-APROBACION | El responsable aprueba formalmente el cierre de la Etapa 02 con reservas, conforme a `cierre-etapa-02.md` y a las limitaciones técnicas documentadas (E02-D6), y autoriza publicar `main` en `origin`. Las reservas siguen abiertas: E02-C6 parcial, P-D1, P-D2, P-D3 y P-D7 pendientes y APK Debug de `main` sin instalar. No autoriza iniciar HU1 ni la Etapa 03. | 2026-10-25 | 02 |
| E02-OCR | La anomalía `similarity=0.355` de la imagen sintética 03 se acepta como limitación conocida, pendiente de pruebas OCR exhaustivas en una fase posterior. No valida la calidad ni la precisión del OCR. | 2026-10-23 | 02 |
| G-08 | Repositorio canónico en `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP`, con el remoto `origin` en el repositorio oficial de GitHub (`https://github.com/Akiraz14/GFP.git`) y la rama `main` sincronizada. Los documentos fuente siguen fuera del repositorio (D-FUENTES). Sustituye a G-03 y resuelve C-02. | 2026-10-25 | 02 |
| G-09 | Política oficial de nomenclatura: código, persistencia y pruebas en inglés; comentarios, documentación y textos visibles en español; commits en inglés con Conventional Commits. Ver `nomenclatura.md`. | 2026-10-25 | 02 |
| E02-ID | Resolución de E02-D1 a E02-D9 y de la recuperación por preguntas de seguridad, con los valores de la sección "Etapa 02 — decisiones técnicas" y el diseño de `arquitectura-identidad.md`. Los valores marcados como provisionales o propuestos no están aprobados como definitivos. | 2026-10-25 | 02 |
| E03-D1 | Definida por el responsable: el registro de HU1 se presenta como un asistente de tres pasos (identificación y datos personales; contacto y acceso; preguntas de seguridad), con validación por paso y sin guardar nada hasta «Registrar». Distribución, criterios E03-W01 a E03-W08 y ambigüedades A-W1 a A-W6 en `decisiones-etapa-03.md`. | 2026-10-25 | 03 |
| E03-D2 | Definida por el responsable: el número celular, con su código de país, es obligatorio en el registro, porque HU2 permite iniciar sesión con correo, documento o celular. Tratamiento de los identificadores y ambigüedades A-ID1 a A-ID4 en `decisiones-etapa-03.md`. | 2026-10-25 | 03 |
| A-ID1 a A-ID4 | Aprobadas por el responsable: espacio de identificadores inequívoco entre correo, documento y celular, con rechazo genérico «El usuario se encuentra registrado» (A-ID1); celular canónico E.164 e inicio de sesión sin código de país solo si es inequívoco (A-ID2); documento comparado sin espacios, puntos ni guiones y en mayúsculas, conservando el original (A-ID3); celular obligatorio en la validación y en el esquema, modificando la migración 1 porque no se ha distribuido (A-ID4). Implementación pendiente. Detalle en `decisiones-etapa-03.md`. | 2026-10-25 | 03 |
| A-W1 a A-W6 | Aprobadas por el responsable: sin confirmación de contraseña (A-W1); «Limpiar» borra los tres pasos con confirmación previa (A-W2); comprobación de usuario registrado al terminar el paso 2 y definitiva, atómica y respaldada por restricciones, al «Registrar» (A-W3); tras el registro, ir al inicio de sesión, como definición de producto porque HU1 no fija el destino (A-W4); textos «Atrás», «Siguiente» y «Registrar» (A-W5); distribución basada en HU1, sin afirmar coincidencia con el prototipo (A-W6). Detalle en `decisiones-etapa-03.md`. | 2026-10-25 | 03 |

## Discrepancias documentadas

| ID | Discrepancia | Estado |
|---|---|---|
| C-01 | El documento de historias de usuario (§2.1) indica que en la fase MVP no se contempla la generación y entrega de un APK instalable. La propuesta comercial, la propuesta VF y la decisión DT-01 establecen el APK como entregable. Según Juan, la redacción del documento de historias responde a una consideración académica de flexibilidad ante la evaluación. **Alcance documental académico:** demostración desde el entorno de desarrollo. **Objetivo técnico del proyecto:** APK instalable y validado (DT-01). El documento de historias no se modifica. | Abierta hasta su formalización documental; no reduce el objetivo técnico. |
| C-02 | G-03 establece un repositorio solo local, sin remoto publicado, en `C:\Users\juanz\Akiraz\Study\GFP`. El repositorio canónico está en `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP` y tiene el remoto `origin` (`https://github.com/Akiraz14/GFP.git`), y la WU de cierre de la Etapa 02 autorizó sincronizar `main` con ese remoto: `main` y `origin/main` coinciden en `cbef19f` (`git ls-remote`, 2026-10-25). | Resuelta por G-08 (2026-10-25). |
| C-03 | HU1 indica «Ingresar respuestas de seguridad correspondientes a las preguntas seleccionadas»; la WU del 2026-10-25 decide que las respuestas se seleccionen entre opciones, para que tildes, mayúsculas o variaciones de escritura no impidan la recuperación. La selección es una forma de ingresar la respuesta y el documento de historias no se modifica. El modelo admite también respuestas escritas (`free-text-folded`). | Resuelta por decisión del responsable (WU 2026-10-25); contenido del catálogo pendiente (E03-D5). |

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
| La plantilla declara el permiso `INTERNET` (necesario para Metro en desarrollo). Tratado en E02-D7: se conserva hasta la prueba P-D7. | 02 / 13 |
| La plantilla firma la variante release con la clave de depuración. La clave de firma definitiva es la decisión E13-D1. | 13 |
| El diagrama C4 Nivel 3 incluye los componentes "Sincronización Local" (Servicios) y "Generación de Reportes" (Análisis). Su alcance se interpreta con las historias de usuario y las exclusiones (sin sincronización entre dispositivos ni exportación); se revisará al implementar las etapas afectadas. | 02 / 11 |
| El APK release registra en `aapt2 dump badging` los permisos `android.permission.INTERNET` y `co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (este último lo genera AndroidX). Tratados en E02-D7. | 02 / 13 |

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
| Compilación Debug de `main` en Windows | Juan, 2026-10-25, worktree desacoplado `GFP Proyecto\GFP-e02-int` en `cbef19f`, JDK 17.0.20.1 solo en el proceso, Gradle 9.4.1: `npm ci`, `typecheck`, `lint`, `format:check`, Jest (1/1) y `assembleDebug` con código 0 (`BUILD SUCCESSFUL in 15m 5s`, `[OP-SQLITE] using sqlcipher.`). APK `0AEF5C750B2B7D53E9162176F054E6CB859C26752292EAB30552B492B17BEBAC` (206057040 bytes): `co.gfpsas.gestionfinanciera`, `versionName 1.0`, `minSdkVersion 29`. Repositorio canónico y APK de la Etapa 01 sin cambios (`evidencias/ETAPA-02/windows-debug-20261025/`) |
| No ejecutado | Instalación y ejecución del APK Debug de `main` en un emulador o dispositivo; compilación Release de `main` |

## Etapa 02 — fundamentos de identidad y seguridad (2026-10-25)

Implementación de E02-D1 a E02-D5 según la WU del 2026-10-25, sin pantallas ni flujos
de HU1, HU2 o HU3. Diseño en `arquitectura-identidad.md`; evidencia en
`evidencias/ETAPA-02/claude-20261025/`.

| Componente | Archivos principales |
|---|---|
| PBKDF2 nativo (TurboModule `GfpCrypto`) | `app/src/infrastructure/native/NativeGfpCrypto.ts`, `app/android/app/src/main/java/co/gfpsas/gestionfinanciera/crypto/`, `codegenConfig` en `app/package.json`, registro en `MainApplication.kt` |
| Aleatoriedad, codificación y motor PBKDF2 | `app/src/infrastructure/security/` |
| Verificadores, normalización, política de contraseñas, preguntas, intentos y recuperación | `app/src/services/authentication/` |
| Sesión | `app/src/services/session/sessionManager.ts` |
| Base cifrada, migraciones, catálogos y repositorios | `app/src/infrastructure/database/` |
| Permisos y copias | `app/android/app/src/main/AndroidManifest.xml`, `res/xml/data_extraction_rules.xml` |
| Dependencias | `body-parser` 2.4.0 en `app/package-lock.json` (sin cambios en `package.json` salvo `codegenConfig`) |

| Validación | Resultado |
|---|---|
| `npm ci`, `typecheck`, `lint`, `format:check`, Jest | Código 0; 13 suites y 74 pruebas (Claude, Linux, 2026-10-25); 76 tras la corrección de la revisión consolidada (`claude-20261025-review/`) |
| `npm audit` | 0 vulnerabilidades tras `body-parser` 2.4.0 |
| `Pbkdf2HmacSha256.java` con `javac` y JDK 21 | 5 de 5 vectores de referencia correctos; 600 000 iteraciones en 564 ms de mediana en el equipo de Claude (`claude-20261025/pbkdf2-java-vectors.txt`; referencia, no medición de dispositivo) |
| Codegen de React Native 0.87.1 | Genera `NativeGfpCryptoSpec` con la firma que implementa `GfpCryptoModule` y `GfpSpecs_ModuleProvider` |
| Compilación Android con el módulo nativo y el manifiesto nuevo | Juan, 2026-10-25, worktree `GFP Proyecto\GFP-e02-id` en `440ba4d`, JDK 17.0.20.1: `npm ci`, `npm audit` (0 vulnerabilidades), `typecheck`, `lint`, `format:check`, Jest (74/74), `assembleDebug` (`BUILD SUCCESSFUL in 8m 15s`, codegen `NativeGfpCryptoSpec` generado, sin avisos del código de GFP) y `:app:processReleaseMainManifest` con código 0. APK Debug `3CF23009ABCBAB5D80207C046F5320A48A47429136B4B8707456FC80E2A29B19` sin `USE_BIOMETRIC` ni `USE_FINGERPRINT` y con `dataExtractionRules`; manifiesto Release con `INTERNET`, `ACCESS_NETWORK_STATE` y `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Etapa 01 y repositorio canónico sin cambios (`windows-identity-20261025/`) |
| Ejecución del módulo nativo en un dispositivo | No ejecutada: P-D1 y P-D2 (`validacion/etapa-02-pruebas-dispositivo.md`) |

## Etapa 02 — revisión consolidada antes de publicar (2026-10-25)

| Severidad | Hallazgo | Evidencia | Tratamiento |
|---|---|---|---|
| Bloqueante (corregido) | `AccountRecoveryService` leía el contador de intentos, esperaba la derivación PBKDF2 y después lo escribía: 10 intentos incorrectos simultáneos se evaluaban todos en lugar de bloquearse tras 3. Con opciones de entropía limitada, una ráfaga en paralelo podía recuperar la cuenta sin conocer las respuestas | Reproducido con Jest: 10 de 10 intentos evaluados antes de la corrección | `start()` y `complete()` se serializan por base de datos, también entre instancias del servicio. Pruebas de regresión: 10 intentos simultáneos producen 3 `invalid_data` y 7 `locked`; 6 intentos repartidos entre instancias producen 3 evaluados (`accountRecovery.test.ts`, `claude-20261025-review/`) |
| Importante | `IdentityRepository.createAccount()` inserta usuario, credencial y respuestas, pero no abre su propia transacción: un llamador futuro que no la use podría dejar una cuenta incompleta | Revisión del código; las pruebas la usan dentro de una transacción | HU1 debe invocarla dentro de `database.transaction()`; se revisa al implementar HU1 |
| Importante | `SessionManager.start()` acepta cualquier `userId`; la garantía de aislamiento depende de que solo el servicio de inicio de sesión (HU2) lo invoque tras autenticar | Revisión del código | Regla de arquitectura para la Etapa 04, que también debe serializar el límite de intentos de inicio de sesión como la recuperación |
| Importante | La suma de comprobación de una migración incluye su SQL literal: cambiar una migración ya entregada, aunque sea solo el espaciado, impediría abrir la base (`checksum_mismatch`) | `migrator.test.ts` | Las migraciones son inmutables tras la primera entrega (`arquitectura-identidad.md`) |
| Importante | El enlace de BLOB de `op-sqlite` (sal y verificador como `Uint8Array`) y el módulo `GfpCrypto` solo se han probado con dobles en Jest | Compilación correcta; ninguna ejecución en dispositivo | Se comprueban al conectar la base en HU1 (P-D3) y con P-D1 y P-D2 |
| Mejora futura | `isVerifiableCandidate()` y `needsRehash()` aún no tienen llamadores de producción | Revisión del código | Se usan en HU2 |

## Etapa 02 — decisiones técnicas

Estados al 2026-10-25. «Adoptada» indica una decisión tomada e implementada; una
decisión de seguridad no se considera verificada en dispositivo hasta que pasa su
prueba P-Dx (`validacion/etapa-02-pruebas-dispositivo.md`).

| ID | Decisión | Estado | Valores y justificación | Pendiente y condición de cierre | Bloquea iniciar la Etapa 03 |
|---|---|---|---|---|---|
| E02-D1 | Protección de contraseñas y respuestas | Adoptada; iteraciones provisionales | PBKDF2-HMAC-SHA256; sal aleatoria de 16 bytes por secreto; clave derivada de 32 bytes; comparación en tiempo constante; un verificador independiente por respuesta; formato con algoritmo, iteraciones, sal, normalización y versión de formato (1), con `needsRehash()` para migrar. Implementación nativa porque `@noble/hashes` en Hermes necesitó 70,9 s para 600 000 iteraciones en el emulador (`V4/p3-benchmark.txt`). **600 000 iteraciones provisionales** | P-D1 en el dispositivo físico mínimo (objetivo de un segundo aproximadamente, mínimo 310 000 iteraciones) antes del cierre de la Etapa 03 | No: el parámetro está versionado y los verificadores se regeneran |
| E02-D2 | Normalización Unicode | Adoptada | NFC antes de derivar, al registrar, autenticar y recuperar; sin minúsculas ni eliminación de espacios internos; contraseña nueva con espacios externos rechazada; caracteres de control y unidades sustitutas aisladas rechazados. No existen credenciales previas, así que no hay migración | P-D2 (Hermes) antes del cierre de la Etapa 03; si falla, la operación se detiene de forma segura | No |
| E02-D3 | Custodia de la clave SQLCipher | Adoptada | 256 bits de `RNGetRandomValues`; Keychain `AES_GCM_NO_AUTH` sobre Android Keystore, sin biometría; comprobación de SQLCipher; `key_lost` y `key_rejected` sin borrar la base; copias y transferencias excluidas; sin rotación periódica, con procedimiento de `PRAGMA rekey`; regla `no-console`. Respaldo por hardware no demostrado | P-D3 en un AVD aislado durante la Etapa 03 | No |
| E02-D4 | Modelo multiusuario | Adoptada | Varias cuentas locales en una base compartida con aislamiento lógico: `user_id` en todo dato privado y acceso por sesión activa (`OwnedRepository`, `SessionManager`). Se rechaza un solo usuario por instalación | — | No |
| E02-D5 | Modelo de datos | Adoptada | Esquema v1 de identidad y seguridad y catálogos v2, tablas `STRICT`, claves foráneas en cascada, unicidad de identificadores, migraciones transaccionales con suma SHA-256 y protección ante esquemas más nuevos | Contenido de los catálogos (E03-D4, E03-D5) | No |
| E02-D6 | Criterios de cierre de la Etapa 02 (G-06) | Aprobados con reservas por el responsable (2026-10-25) | E02-C1 a E02-C8 en `trazabilidad.md`; veredicto en `cierre-etapa-02.md` | Ninguno para la aprobación; las reservas de E02-C6 y E02-C8 siguen abiertas | No |
| E02-D7 | Permisos del APK | Parcialmente resuelta | Se retiran `USE_BIOMETRIC` y `USE_FINGERPRINT` (`tools:node="remove"`): ninguna HU usa biometría y `react-native-keychain` solo los consulta con control de acceso biométrico. Se conservan: `INTERNET` (Metro en Debug y `datatransport` de ML Kit), `ACCESS_NETWORK_STATE` (`datatransport`), `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (permiso interno de `androidx.core`). `SYSTEM_ALERT_WINDOW` y `ACCESS_LOCAL_NETWORK` proceden del AAR de depuración de React Native Manifiestos Debug y Release comprobados (`windows-identity-20261025/`): sin permisos biométricos en ambos; `SYSTEM_ALERT_WINDOW` y `ACCESS_LOCAL_NETWORK` solo en Debug. Pendiente P-D7 para `INTERNET` | No |
| E02-D8 | Calidad del OCR | Plan definido | `plan-evaluacion-ocr.md`: exactitud por campo, umbrales propuestos (monto ≥ 90 %, fecha ≥ 85 %, comercio ≥ 75 %), conjunto etiquetado, baja confianza y confirmación humana. Calidad no aprobada | Aprobación de umbrales al iniciar la Etapa 10 | No |
| E02-D9 | Vulnerabilidad `body-parser` | Resuelta | La introducía `@react-native-community/cli-server-api` 20.2.0, que pide `^2.2.2`; GHSA-27r3-jxmh-p828 afecta a `>=2.0.0 <2.4.0`. Actualización acotada del lockfile a 2.4.0, dentro del rango; `npm audit`: 0 vulnerabilidades; `npm ci` y las pruebas pasan | — | No |

## Etapa 02 — limitaciones registradas

- Protección de claves respaldada por hardware no demostrada (`SECURE_SOFTWARE`).
- Generación del secreto con `RNGetRandomValues` no observada en la ejecución final (el secreto ya existía).
- Escenarios de desinstalación y reinstalación no ejecutados (destructivos, sin autorización).
- Sin validación en dispositivo físico, incluida la cámara.
- La compilación Release en Windows requiere una ruta corta por el límite de 260 caracteres de Ninja. Procedimiento conocido: compilar desde un worktree en una ruta corta (por ejemplo `C:\gfp-v4-short`) con JDK 17 solo en el proceso. Las pruebas Release se ejecutaron con el APK `DD54C93E…`; el Release `819EF8CC…`, compilado en la ruta corta, solo se instaló y abrió.
- El APK Debug de `main` se compiló, pero no se instaló ni ejecutó; la compilación Release de `main` no se ejecutó. Ver "Etapa 02 — integración en `main`".
- Pruebas en un solo emulador (API 34); no se repitieron en el emulador API 29 de la Etapa 01.
- El módulo nativo `GfpCrypto` compila en Android, pero no se ha ejecutado en un dispositivo; las pruebas de JavaScript usan una implementación de Node como sustituto del módulo nativo.
- Las pruebas P-D1, P-D2, P-D3 y P-D7 no se han ejecutado.
- OCR evaluado solo con 6 imágenes sintéticas; la anomalía `similarity=0.355` (imagen 03) queda como limitación conocida (E02-OCR).

## Prerrequisitos de la Etapa 03 (HU1 Registrar usuario)

| Prerrequisito | Estado | Motivo |
|---|---|---|
| Aprobación del cierre de la Etapa 02 (E02-D6) | Aprobada con reservas por el responsable (2026-10-25) | Protocolo por etapa; E02-APROBACION |
| Compilación Android de los fundamentos de identidad | Verificada (`windows-identity-20261025/`) | El módulo nativo y el manifiesto compilan |
| E02-D1 a E02-D5 | Adoptadas | P-D1, P-D2 y P-D3 se completan antes del cierre de la Etapa 03 |
| G-07, E03-D3, E03-D6 a E03-D10 | Resueltas | `decisiones-etapa-03.md` |
| E03-D1 y E03-D2 | Definidas por el responsable (2026-10-25) | Asistente de tres pasos y celular obligatorio |
| A-W1 a A-W6 y A-ID1 a A-ID4 | Aprobadas por el responsable (2026-10-25), con los textos de interfaz aprobados | Implementación pendiente: cambio de la migración 1 y de `IdentityRepository` con sus pruebas (`decisiones-etapa-03.md`, «Implementación pendiente») |
| A-ID5 — dígito de verificación del NIT | Pendiente de definición para HU1 | Riesgo de NIT duplicado con y sin dígito; recomendación en `decisiones-etapa-03.md`. No afecta al cierre de la Etapa 02 |
| E03-D4 y E03-D5 | Propuestas | Contenido de los catálogos |
| Autorización explícita para iniciar la Etapa 03 | Pendiente del responsable | El cierre técnico de la Etapa 02 no la concede |
