# Matriz de trazabilidad — GFP

Los criterios de aceptación se conservan **literalmente** en el documento fuente
`RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (sección 3).
Esta matriz solo asigna identificadores internos `HUx-CAyy`, numerados en el orden
en que aparecen los criterios en cada historia, y registra etapa, estado y
evidencia. La transcripción literal de cada criterio se incorpora a esta matriz al
iniciar la etapa de su historia.

Estados: Pendiente · Implementado · Probado · Parcial · Verificado · Eliminado del alcance (criterio derivado retirado; se conserva el identificador).
El estado indica la implementación y la verificación; la aprobación de la definición de un
criterio derivado figura en su columna «Origen».

## Resumen por historia

| Historia | Criterios | Etapa | Estado |
|---|---|---|---|
| HU1 Registrar usuario | CA01–CA19 | 03 | Pendiente (criterios transcritos; implementación no autorizada) |
| HU2 Iniciar sesión | CA01–CA11 | 04 | Pendiente |
| HU3 Recuperar contraseña | CA01–CA13 | 05 | Pendiente |
| HU8 Administrar categorías de movimientos financieros | CA01–CA08 (CA07 con subcriterios a, b, c) | 06 | Pendiente |
| HU4 Registrar y editar movimiento financiero | CA01–CA13 | 07 | Pendiente |
| HU5 Consultar historia de movimientos financieros | CA01–CA07 | 08 | Pendiente |
| HU6 Visualizar balance financiero | CA01–CA04 | 09 | Pendiente |
| HU7 Capturar gasto mediante factura o comprobante | CA01–CA12 | 10 | Pendiente |
| HU9 Consultar análisis financiero | CA01–CA06 | 11 | Pendiente |
| HU10 Consultar recomendaciones financieras automáticas | CA01–CA06 (CA02 con subcriterios a, b, c) | 12 | Pendiente |
| **Total** | **99** | | |

## Criterios parciales previstos

| Criterio | Historia | Dependencia | Evidencia exigible en la etapa actual (propuesta) | Verificación definitiva |
|---|---|---|---|---|
| HU1-CA18 | HU1 | Pantalla de inicio de sesión (HU2) | Prueba: Cancelar limpia todos los campos y emite navegación a la ruta de inicio de sesión | E04 |
| HU2-CA09 | HU2 | Pantalla de recuperación (HU3) | Prueba: el enlace emite navegación a la ruta de recuperación | E05 |
| HU2-CA10 | HU2 | Pantallas con información financiera (HU4, HU5, HU6, HU9, HU10) | Prueba: rutas autenticadas inaccesibles sin sesión válida; re-verificación en E07–E12 | E13 |
| HU2-CA11 | HU2 | Datos financieros de dos o más usuarios | Prueba: la sesión queda asociada a un único usuario; aislamiento verificado en E07, E08, E11, E12 | E13 |
| HU8-CA07c | HU8 | Movimientos (HU4) | Prueba de eliminación; reasignación con datos de prueba solo si el esquema existe desde E02 | E07 |
| HU8-CA08 | HU8 | Formulario HU4 y filtros HU5 | Prueba: la categoría creada o editada aparece de inmediato en la consulta de categorías activas | E07 y E08 |
| HU4-CA07 y CA08 (variante edición) | HU4 | Punto de entrada a la edición (HU5) | Prueba de integración del modo edición: guarda y muestra el mensaje de actualización | E08 |
| HU4-CA10 | HU4 | Botón "Editar" del historial (HU5-CA07) | Prueba de integración: el modo edición carga todos los datos del movimiento | E08 |
| HU4-CA12 | HU4 | Historial (HU5) y decisión E07-D3 | Prueba: Cancelar descarta cambios sin persistir | E08 |

HU5-CA07 pertenece a HU5 y se verifica en E08 como criterio propio; no sustituye
a HU4-CA10.

## HU1 — decisiones de producto (no son criterios literales)

Decisiones del responsable del 2026-10-25 que condicionan la implementación de HU1 sin
modificar sus criterios literales. Detalle en `decisiones-etapa-03.md`.

| Decisión | Efecto en HU1 | Criterios derivados | Estado |
|---|---|---|---|
| E03-D1 — asistente de tres pasos | Los campos de HU1 se distribuyen en tres pasos; «Registrar» queda en el último; «Limpiar» pide confirmación si hay datos; tras el registro se va al inicio de sesión | E03-W01 a E03-W10 | Definida; A-W1 a A-W6 aprobadas por el responsable |
| E03-D2 — celular obligatorio | El número celular con su código de país se valida como obligatorio, además de los campos de la lista de obligatorios de HU1; correo, documento y celular forman un espacio de identificadores inequívoco | Obligatoriedad del celular en el paso 2; colisiones entre documento y celular; formatos de documento; celular canónico | Definida; A-ID1 a A-ID4 aprobadas por el responsable; implementación pendiente |
| E03-D11 — respuestas escritas | Las respuestas de seguridad se escriben y se normalizan con `free-text-folded`; riesgo residual aceptado solo para una demostración académica controlada | E03-V10 | Definida por el responsable; implementación pendiente |

A-ID2 también condiciona HU2 (Etapa 04): el inicio de sesión con celular sin código de
país solo se acepta si es inequívoco. E03-D11 (respuestas escritas, aprobada el 2026-10-25)
también condiciona HU3 (Etapa 05).

La aprobación de esta documentación no autoriza implementar HU1 ni distribuir el
producto, limitado a una demostración académica controlada (E03-D11).

## HU1 — criterios de aceptación (preparación del 2026-10-25)

Transcripción literal de los 19 criterios de HU1, en el orden del documento fuente. Ninguno
está implementado ni probado. La verificación prevista es una propuesta: U (prueba unitaria
con Jest), C (prueba de componente con React Native Testing Library), I (integración con la
base de pruebas `node:sqlite`) y E (ejecución en el emulador o en un dispositivo).

| ID interno | Criterio literal | Paso | Decisiones relacionadas | Verificación prevista | Estado |
|---|---|---|---|---|---|
| HU1-CA01 | Los campos tipo documento, documento, primer nombre, primer apellido, correo electrónico, contraseña, preguntas y respuestas de seguridad son obligatorios. | 1, 2 y 3 | E03-D2 añade el celular | U, C | Pendiente |
| HU1-CA02 | El selector "Tipo de documento" debe poblarse con el maestro 'document_types'. | 1 | E03-D4, E03-V11 | I, C | Pendiente |
| HU1-CA03 | El campo tipo de documento debe mostrar un listado de opciones que deben ser las que estén en el maestro tipos de documentos. | 1 | E03-D4, E03-V11 | I, C | Pendiente |
| HU1-CA04 | Los campos primer nombre, segundo nombre, primer apellido, segundo apellido no deben aceptar símbolos o números. | 1 | E03-D7; P-D2 | U, E | Pendiente |
| HU1-CA05 | La contraseña debe ser una contraseña segura, de mínimo 8 caracteres, entre los cuales debe contener mínimo 1 número, 1 letra, 1 símbolo. | 2 | E03-D10 | U (`passwordPolicy`), C | Pendiente |
| HU1-CA06 | La aplicación no debe almacenar la contraseña en texto plano. | 3 (al registrar) | E02-D1 | I (contenido de la base), E | Pendiente |
| HU1-CA07 | La aplicación debe validar las condiciones definidas para la contraseña antes de completar el registro. | 2 y 3 | E03-W02, E03-W05 | C | Pendiente |
| HU1-CA08 | Para el campo número de celular se debe tener un listado para seleccionar el código de país. | 2 | E03-D8, A-ID2 | U, C | Pendiente |
| HU1-CA09 | Para el campo correo se debe garantizar la validación del símbolo @ y un dominio; de no contar con estos parámetros, debe indicarse al usuario por mensaje “Verificar correo”. | 2 | — | U, C | Pendiente |
| HU1-CA10 | Los campos de preguntas de seguridad serán una lista desplegable en la cual se mostrarán las diferentes preguntas disponibles de la base de datos. | 3 | E03-D5, E03-D11 | I, C | Pendiente |
| HU1-CA11 | No permitir que se seleccionen preguntas de seguridad similares. | 3 | E03-D6 | U (`securityQuestionPolicy`), C | Pendiente |
| HU1-CA12 | Las respuestas de seguridad no deben almacenarse en texto plano. | 3 (al registrar) | E02-D1, E03-D9, E03-D11 | I (contenido de la base), E | Pendiente |
| HU1-CA13 | Se genera un mensaje de error cerca del campo registrado en caso de que el dato no sea acorde a los criterios: “Error en los campos ingresados”. | 1, 2 y 3 | E03-W02 | C | Pendiente |
| HU1-CA14 | Se genera un mensaje de alerta si el usuario ya se encuentra registrado: “El usuario se encuentra registrado”. | 2 y 3 | E03-D3, A-W3, A-ID1 | I, C | Pendiente |
| HU1-CA15 | Al presionar el botón de “Registrar”, la información diligenciada es guardada en la base de datos, solo si todo fue diligenciado correctamente y el usuario no está registrado previamente. | 3 | E03-W05, E03-W06, A-W3 | I, C, E | Pendiente |
| HU1-CA16 | Se genera un mensaje de información indicando “El registro fue exitoso” después de guardar la información en la base de datos. | 3 | A-W4 | C | Pendiente |
| HU1-CA17 | Se limpian los campos del formulario finalizado el registro exitoso. | 3 | E03-W08, E03-W10 | C | Pendiente |
| HU1-CA18 | El botón “Cancelar” limpia todos los campos del formulario y regresa a la vista de inicio de sesión. | 1, 2 y 3 | G-07 (parcial hasta E04) | C | Pendiente |
| HU1-CA19 | El botón “Limpiar” limpia todos los campos del formulario. | 1, 2 y 3 | A-W2 (con confirmación) | C | Pendiente |

### Criterios adicionales (no son criterios literales de HU1)

E03-W01 a E03-W10 (asistente) están en `decisiones-etapa-03.md`, sección E03-D1, y se
derivan de decisiones aprobadas. Los siguientes son criterios derivados que concretan
identificadores, persistencia, errores y preguntas de seguridad; no sustituyen a ningún
criterio literal. Ninguno está implementado ni probado.

| ID interno | Criterio | Origen | Verificación prevista | Estado |
|---|---|---|---|---|
| E03-V01 | El celular se valida con un código de país de la lista y un número solo de dígitos; se guarda en formato E.164 y, por separado, el código y el número nacional; las tres columnas son obligatorias | A-ID2, A-ID4 (aprobadas) | U, I | Pendiente |
| E03-V02 | El documento se compara y es único por su valor normalizado (A-ID3), sin importar el tipo, y se conserva el valor original | A-ID3, E03-D3 (aprobadas) | U, I | Pendiente |
| E03-V03 | Un documento normalizado igual al celular de otra cuenta, o al revés, se rechaza con «El usuario se encuentra registrado», sin indicar qué identificador coincide | A-ID1 (aprobada) | I | Pendiente |
| E03-V04 | Dos registros simultáneos con un mismo identificador crean una sola cuenta; el otro recibe «El usuario se encuentra registrado» y no queda ninguna cuenta incompleta | A-W3 (aprobada) | I | Pendiente |
| E03-V05 | (Retirado) Validación específica del número con el tipo `NIT` | E03-D4 y A-ID5: el NIT se excluyó del catálogo el 2026-10-25, porque la app es solo para personas naturales | — | Eliminado del alcance |
| E03-V06 | El número de documento solo admite los caracteres definidos para su tipo | E03-D4 (catálogo aprobado provisionalmente; reglas de caracteres por tipo pendientes de verificación) | U | Pendiente |
| E03-V07 | Un fallo técnico al registrar no deja ninguna cuenta parcial, conserva los campos no sensibles, no conserva la contraseña ni las respuestas de seguridad y muestra «No fue posible completar el registro. Intenta de nuevo» | A-W7 (aprobada) | I, C | Pendiente |
| E03-V08 | Mientras se registra, se muestra «Registrando…» y los botones del asistente están deshabilitados, sin admitir un segundo envío | A-W8 (aprobada) | C | Pendiente |
| E03-V09 | La base se abre y se verifica al iniciar la app; si falla, se muestra «No fue posible abrir la base de datos. Reinicia la aplicación.», no se permiten las funciones que dependen de ella y la base no se borra, no se reinicializa ni se recrea | A-W9 (aprobada) | I, E | Pendiente |
| E03-V10 | El paso 3 recoge una respuesta escrita por pregunta, rechaza con «Error en los campos ingresados» la que quede vacía o fuera de 3 a 100 puntos de código Unicode tras normalizar, no usa las opciones del catálogo y guarda cada una como verificador con la normalización `free-text-folded` | E03-D11 y E03-D5 (aprobadas) | U, I, C | Pendiente |
| E03-V11 | El selector de tipo de documento muestra solo los tipos activos de `document_types` (CC, CE, PA y PPT); una migración posterior a la 2 marca el NIT como inactivo; el registro rechaza cualquier tipo de documento inactivo, aunque el intento llegue por una vía distinta al selector, validándolo también en la lógica de registro y no solo en la interfaz, con «Error en los campos ingresados» | E03-D4; definición aprobada por el responsable (2026-10-25); implementación y validación pendientes | U, I, C | Pendiente |

## Etapa 01 — criterios de cierre (no son criterios de historias)

| ID interno | Criterio | Estado | Evidencia |
|---|---|---|---|
| E01-C1 | Proyecto React Native 0.87.x con TypeScript para Android, identificador y nombre de G-05 | Verificado | `aapt2`: `package: name='co.gfpsas.gestionfinanciera'`, `application-label:'GFP'`, `minSdkVersion:'29'` (`20261016-152425/complementarias-20261019/salida-aapt2.txt`); `claude-20261016/configuracion.txt` |
| E01-C2 | Estructura inicial de carpetas según C4 Nivel 3 | Implementado | `app/src/README.md` |
| E01-C3 | Herramientas de calidad configuradas (tsc, ESLint, Prettier) y sin errores | Verificado (Linux y Windows); defecto de Prettier corregido | `claude-20261016/{typecheck,lint,format}.log`; `20261016-152425/{typecheck,lint,format}.log`; `20261019-194120/{typecheck,lint}.log`. Prettier falló en `20261019-194120/format.log` por revisar archivos generados; corregido con `app/.prettierignore` y verificado en Linux (`claude-20261019/format-check.log`) y en Windows (`windows-format-check/format-check.log`, 21/10/2026, código 0) |
| E01-C4 | Pruebas configuradas (Jest + React Native Testing Library) pasan | Verificado (Linux y Windows) | `claude-20261016/jest.log`; `20261016-152425/jest.log`; `20261019-194120/jest.log` |
| E01-C5 | Compilación Android (`assembleDebug`) con JDK 17 sin modificar Java global | Verificado | `20261016-152425/gradle-version.log` (`Launcher JVM: 17.0.20.1`), `20261016-152425/gradle-assembleDebug.log` (`BUILD SUCCESSFUL`), `20261016-152425/entorno.txt` (`JAVA_HOME` del proceso); repetido en `20261019-194120/`. El script solo cambia variables de su propio proceso |
| E01-C6 | APK de depuración instalado y ejecutándose en Android 10 (API 29) | Verificado | `20261016-152425/dispositivo.txt` (API 29); `20261016-152425/reanudacion/{instalar-debug.log,ui-debug.xml,captura-debug.png,logcat-debug.txt}`. Revalidación: `20261019-194120/{dispositivo-debug.txt,pid-debug.txt,ui-debug.xml,logcat-debug.txt}`. Release (complementaria): `20261016-152425/reanudacion/` (archivos `*-release*`) y `20261019-194120/{dispositivo-release.txt,reverse-release.txt,pid-release.txt,ui-release.xml,logcat-release.txt}` (API 29 registrada) |
| E01-C7 | Repositorio Git local con convenciones; documentos fuente excluidos del repositorio por decisión del responsable | Verificado | Historial sin objetos de los documentos fuente (`git rev-list --objects --all`, 2026-10-16); decisión D-FUENTES en `decisiones.md` |

Rutas relativas a `evidencias/ETAPA-01/`. El script corregido `scripts/validar-etapa.ps1`
quedó revalidado en `20261019-194120/`. La Etapa 01 fue aprobada. Ver `cierre-etapa-01.md`.

## Etapa 02 — criterios de cierre (no son criterios de historias)

Criterio específico del plan: fundamentos críticos con pruebas y evidencias verificables;
PoC de OCR solo de viabilidad; riesgos informados. Evidencia de la ejecución V4 (rama
experimental `6caa2ac`, emulador API 34) en `evidencias/ETAPA-02/V4/`, copia idéntica de
`GFP-spike02-evidencias\20261023-163848-6caa2ac\` (ver `evidencias/ETAPA-02/README.md`).
Detalle y decisiones abiertas en `decisiones.md` (secciones "Etapa 02"); veredicto en
`cierre-etapa-02.md`.

| ID interno | Criterio | Estado | Evidencia |
|---|---|---|---|
| E02-C1 | Librerías nativas seleccionadas y compatibles con React Native 0.87.1 | Verificado (emulador) | E02-LIB; `BUILD-DEBUG`, `RUN-D1` a `RUN-R3` en `V4/summary.md` |
| E02-C2 | Base de datos cifrada con SQLCipher: cifrado en reposo y rechazo de clave incorrecta | Verificado (emulador) | `V4/at-rest.txt`, `V4/marker-search.txt`, `V4/wrong-key-hashes.txt`, `V4/sqlite-standard.txt` |
| E02-C3 | Secreto en Android Keystore persistente entre ejecuciones | Verificado (emulador); respaldo por hardware no demostrado | `P2-KEYSTORE-CAPABILITY`, `SCN-*` en `V4/summary.md`; `V4/steps/` |
| E02-C4 | Derivación PBKDF2-HMAC-SHA256 conforme a vectores de referencia | Verificado (emulador, implementación JavaScript del PoC). Implementación nativa de producción conforme a 5 vectores en JDK; iteraciones provisionales hasta P-D1 (E02-D1) | `V4/p3-extended.txt`, `V4/p3-benchmark.txt`, `V4/pbkdf2-vectors.txt`, `claude-20261025/pbkdf2-java-vectors.txt` |
| E02-C5 | Viabilidad de cámara, galería y OCR | Verificado solo como viabilidad. La calidad del OCR no está aprobada: no hay umbral (E02-D8) y la imagen 03 dio `similarity=0.355` (E02-OCR) | `V4/p4-batch.txt`; `V4/steps/rmvljbhq6-P4_*` |
| E02-C6 | Decisiones de la etapa resueltas (plan, "Decisiones pendientes por etapa") | Parcial | Librerías (E02-LIB), estrategia de clave (E02-D3), algoritmo (E02-D1), modelo multiusuario (E02-D4), esquema (E02-D5) y `body-parser` (E02-D9) resueltos en `decisiones.md`. Quedan: iteraciones de PBKDF2 provisionales hasta P-D1, permiso `INTERNET` hasta P-D7 (E02-D7) y umbrales del OCR para la Etapa 10 (E02-D8) |
| E02-C7 | Integración en `main` sin alterar la aplicación de la Etapa 01 | Verificado (compilación Debug en Windows); APK de `main` no instalado | Commits `372180c` y `e21ba6b` (E02-INT). Archivos de la aplicación de la Etapa 01 sin cambios respecto a `e10cebf`. `npm ci`, `typecheck`, `lint`, `format:check` y Jest 1/1 con código 0 en Linux (`claude-20261023/`) y en Windows; `assembleDebug` de `cbef19f` con JDK 17, código 0, SQLCipher activo, APK `0AEF5C75…` con `versionName 1.0` y `co.gfpsas.gestionfinanciera`; APK de la Etapa 01 intactos (`windows-debug-20261025/`) |
| E02-C8 | Fundamentos de identidad y seguridad implementados y probados: verificadores PBKDF2 nativos, normalización NFC, política de contraseñas, preguntas de seguridad, limitación de intentos, recuperación, clave SQLCipher, migraciones y aislamiento entre usuarios | Verificado (Jest, `javac` y compilación Debug en Windows); ejecución en dispositivo pendiente (P-D1, P-D2, P-D3) | `claude-20261025/` (vectores PBKDF2 en Java, codegen, `npm audit`); `claude-20261025-review/` (76 pruebas Jest; corrección de la serialización de la recuperación en `a592e1b`, cubierta por las pruebas de regresión «evaluates at most three concurrent wrong attempts before locking» y «shares the attempt limit between service instances of the same database» de `app/__tests__/services/authentication/accountRecovery.test.ts`); `windows-identity-20261025/` (compilación Debug y manifiestos); `docs/arquitectura-identidad.md` |

Rutas relativas a `evidencias/ETAPA-02/`. Estado del cierre: aprobado formalmente con reservas
por el responsable el 2026-10-25 (E02-D6, E02-APROBACION), con E02-C6 parcial y E02-C8 sin
ejecución en dispositivo. Este cierre no autoriza el inicio de la Etapa 03, que requiere la
autorización explícita del responsable y los prerrequisitos de `decisiones.md`.
