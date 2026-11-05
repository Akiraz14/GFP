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
| HU1 Registrar usuario | CA01–CA19 | 03 | Implementada (2026-10-26) con correcciones de usabilidad y reglas de documento definitivas (2026-10-26 y 2026-10-27); CA01–CA19 verificados en Jest y en emulador; integrada en `main` (`14f2c88`) y publicada el 2026-10-28; cierre aprobado formalmente con reservas el 2026-10-28 (`cierre-etapa-03.md`, E03-APROBACION) |
| HU2 Iniciar sesión | CA01–CA11 | 04 | Implementada (2026-10-28) con la corrección de memoria de PBKDF2; CA01–CA08 verificados en Jest y en Android 10 y 14 (`2e5fd6c`, 2026-10-29); CA09 verificado en E05; CA10 y CA11 verificados en Jest en la consolidación (pendiente la validación manual final); integrada en `main` (`96d00cb`, `611a7ef`) el 2026-10-30; cierre aprobado con reservas (`cierre-etapa-04.md`, E04-APROBACION) |
| HU3 Recuperar contraseña | CA01–CA13 | 05 | Implementada (2026-10-30); CA01–CA13 verificados en Jest; pruebas manuales en Android 10 y 14 culminadas el 2026-11-04: CA01–CA05 y CA07–CA13 verificados con excepciones aceptadas, CA06 sin verificación en dispositivo (R16 no verificable); integrada en `main` (`e19d9ab`); cierre documental en `cierre-etapa-05.md` (E05-APROBACION) |
| HU8 Administrar categorías de movimientos financieros | CA01–CA08 (CA07 con subcriterios a, b, c) | 06 | Implementada (2026-11-04) e integrada en `main` (`5d515ef`); cerrada con validación parcial (`cierre-etapa-06.md`); CA01–CA06, CA07a y CA07b verificados en Jest; CA07c completada en E07 y CA08 en E08 (verificados en Jest); validación manual final pendiente |
| HU4 Registrar y editar movimiento financiero | CA01–CA13 | 07 | Integrada en `main` (`7558a3f`, etiqueta `etapa-07-aprobada`); CA01–CA13 verificados en Jest: CA10, CA12 y la edición de CA07 y CA08 completados en E08 (rama `e08/hu5-historial-movimientos`); sin pruebas manuales hasta la validación final (D-07) |
| HU5 Consultar historia de movimientos financieros | CA01–CA07 | 08 | Integrada en `main` (`5dd2071`, etiqueta `etapa-08-aprobada`); CA01–CA07 verificados en Jest; ampliada en la consolidación con filtros iniciales y el acceso a HU7; sin pruebas manuales hasta la validación final (D-07) |
| HU6 Visualizar balance financiero | CA01–CA04 | Consolidación | Implementada en la rama `integracion/consolidacion-global` (2026-11-04), sin integrar en `main`; CA01–CA04 verificados en Jest; adaptada de `daniela888-li/GFP` (E-CONS-D2) |
| HU7 Capturar gasto mediante factura o comprobante | CA01–CA12 | Consolidación | Implementada en la rama `integracion/consolidacion-global` (2026-11-04), sin integrar en `main`; CA01–CA12 verificados en Jest con cámara, galería y OCR simulados; cámara real, ML Kit y borrado nativo sin ejecutar (validación final); calidad del OCR sin evaluar (P-CONS-03) |
| HU9 Consultar análisis financiero | CA01–CA06 | Consolidación | Implementada en la rama `integracion/consolidacion-global` (2026-11-04), sin integrar en `main`; CA01–CA06 verificados en Jest (la dona y las líneas se renderizan en Jest; su aspecto requiere validación manual) |
| HU10 Consultar recomendaciones financieras automáticas | CA01–CA06 (CA02 con subcriterios a, b, c) | Consolidación | Implementada en la rama `integracion/consolidacion-global` (2026-11-04), sin integrar en `main`; CA01–CA06 verificados en Jest; descartes por mes (I-27, migración 6) |
| **Total** | **99** | | |

## Criterios parciales previstos

| Criterio | Historia | Dependencia | Evidencia exigible en la etapa actual (propuesta) | Verificación definitiva |
|---|---|---|---|---|
| HU1-CA18 | HU1 | Pantalla de inicio de sesión (HU2) | Prueba: Cancelar limpia todos los campos y emite navegación a la ruta de inicio de sesión | Verificado en E03 (2026-10-27): el criterio exige regresar a la vista de inicio de sesión, no autenticar; en E04 se repite como regresión cuando HU2 sustituya la pantalla provisional |
| HU2-CA09 | HU2 | Pantalla de recuperación (HU3) | Prueba: el enlace emite navegación a la ruta de recuperación (cumplida en E04: `LoginScreen.test.tsx`, `App.test.tsx`) | E05: verificado en Jest (`App.test.tsx`: el enlace abre el formulario de HU3) y en Android 10 y 14 (`HU2-CA09`, 2026-10-30; R01, 2026-11-04) |
| HU2-CA10 | HU2 | Pantallas con información financiera (HU4, HU5 con el resumen de HU6, HU7, HU8, HU9 y HU10; E04-D3) | Prueba: rutas autenticadas inaccesibles sin sesión válida; re-verificación en E07–E12 (cumplida en E04 para el registro de rutas: `resolveRoute()`, `App.test.tsx`) | Consolidación: verificado en Jest para todas las pantallas con sesión (`App.test.tsx`: rutas con sesión; servicios de HU4, HU5, HU6, HU8, HU10 con `session_expired`); validación final: G2-10 |
| HU2-CA11 | HU2 | Datos financieros de dos o más usuarios | Prueba: la sesión queda asociada a un único usuario; aislamiento verificado en E07, E08, E11, E12 (cumplida en E04 para la sesión: `accountLogin.test.ts`) | Consolidación: verificado en Jest para movimientos, categorías, totales, recomendaciones y descartes (`movementManagement.test.ts`, `categoryManagement.test.ts`, `recommendationService.test.ts`, migraciones 5 y 6); validación final: G2-11 |
| HU8-CA07c | HU8 | Movimientos (HU4) | Prueba de eliminación; reasignación con datos de prueba solo si el esquema existe desde E02 | E07: verificado en Jest (reasignación en la transacción de la eliminación, `categoryManagement.test.ts`, `CategoriesScreen.test.tsx`) |
| HU8-CA08 | HU8 | Formulario HU4 y filtros HU5 | Prueba: la categoría creada o editada aparece de inmediato en la consulta de categorías activas | E07: verificado en Jest para el formulario de HU4 (`MovementFormScreen.test.tsx`); E08: verificado en Jest para el filtro de HU5 (`MovementHistoryScreen.test.tsx`, `App.test.tsx`) |
| HU4-CA07 y CA08 (variante edición) | HU4 | Punto de entrada a la edición (HU5) | Prueba de integración del modo edición: guarda y muestra el mensaje de actualización | E08: verificado en Jest desde el botón «Editar» del historial (`App.test.tsx`) |
| HU4-CA10 | HU4 | Botón "Editar" del historial (HU5-CA07) | Prueba de integración: el modo edición carga todos los datos del movimiento | E08: verificado en Jest (`App.test.tsx`, `MovementHistoryScreen.test.tsx`) |
| HU4-CA12 | HU4 | Historial (HU5) y decisión E07-D3 | Prueba: Cancelar descarta cambios sin persistir | E08: verificado en Jest con el historial real, al crear y al editar (`App.test.tsx`) |

HU5-CA07 pertenece a HU5 y se verifica en E08 como criterio propio; no sustituye
a HU4-CA10.

## HU1 — decisiones de producto (no son criterios literales)

Decisiones del responsable del 2026-10-25 que condicionan la implementación de HU1 sin
modificar sus criterios literales. Detalle en `decisiones-etapa-03.md`.

| Decisión | Efecto en HU1 | Criterios derivados | Estado |
|---|---|---|---|
| E03-D1 — asistente de tres pasos | Los campos de HU1 se distribuyen en tres pasos; «Registrar» queda en el último; «Limpiar» pide confirmación si hay datos; tras el registro se va al inicio de sesión | E03-W01 a E03-W10 | Definida; A-W1 a A-W6 aprobadas por el responsable |
| E03-D2 — celular obligatorio | El número celular con su código de país se valida como obligatorio, además de los campos de la lista de obligatorios de HU1; correo, documento y celular forman un espacio de identificadores inequívoco | Obligatoriedad del celular en el paso 2; colisiones entre documento y celular; formatos de documento; celular canónico | Definida; A-ID1 a A-ID4 aprobadas por el responsable; implementada (2026-10-26) e integrada en `main` (`14f2c88`) |
| E03-D11 — respuestas escritas | Las respuestas de seguridad se escriben y se normalizan con `free-text-folded`; riesgo residual aceptado solo para una demostración académica controlada | E03-V10 | Definida por el responsable; implementada (2026-10-26) e integrada en `main` (`14f2c88`) |

A-ID2 también condiciona HU2 (Etapa 04): el inicio de sesión con celular sin código de
país solo se acepta si es inequívoco. E03-D11 (respuestas escritas, aprobada el 2026-10-25)
también condiciona HU3 (Etapa 05).

La aprobación de esta documentación no autoriza implementar HU1 ni distribuir el
producto, limitado a una demostración académica controlada (E03-D11).

## HU1 — criterios de aceptación (preparación del 2026-10-25)

Transcripción literal de los 19 criterios de HU1, en el orden del documento fuente.
Verificación: U (prueba unitaria con Jest), C (prueba de componente con React Native Testing
Library), I (integración con la base de pruebas `node:sqlite`) y E (ejecución en el emulador
o en un dispositivo). Estado al 2026-10-26, con la implementación de HU1; evidencias en la
sección «HU1 — evidencias de la implementación».

| ID interno | Criterio literal | Paso | Decisiones relacionadas | Verificación prevista | Estado |
|---|---|---|---|---|---|
| HU1-CA01 | Los campos tipo documento, documento, primer nombre, primer apellido, correo electrónico, contraseña, preguntas y respuestas de seguridad son obligatorios. | 1, 2 y 3 | E03-D2 añade el celular | U, C | Verificado |
| HU1-CA02 | El selector "Tipo de documento" debe poblarse con el maestro 'document_types'. | 1 | E03-D4, E03-V11 | I, C | Verificado |
| HU1-CA03 | El campo tipo de documento debe mostrar un listado de opciones que deben ser las que estén en el maestro tipos de documentos. | 1 | E03-D4, E03-V11 | I, C | Verificado |
| HU1-CA04 | Los campos primer nombre, segundo nombre, primer apellido, segundo apellido no deben aceptar símbolos o números. | 1 | E03-D7; P-D2 | U, E | Verificado |
| HU1-CA05 | La contraseña debe ser una contraseña segura, de mínimo 8 caracteres, entre los cuales debe contener mínimo 1 número, 1 letra, 1 símbolo. | 2 | E03-D10 | U (`passwordPolicy`), C | Verificado |
| HU1-CA06 | La aplicación no debe almacenar la contraseña en texto plano. | 3 (al registrar) | E02-D1 | I (contenido de la base), E | Verificado |
| HU1-CA07 | La aplicación debe validar las condiciones definidas para la contraseña antes de completar el registro. | 2 y 3 | E03-W02, E03-W05 | C | Verificado |
| HU1-CA08 | Para el campo número de celular se debe tener un listado para seleccionar el código de país. | 2 | E03-D8, A-ID2 | U, C | Verificado |
| HU1-CA09 | Para el campo correo se debe garantizar la validación del símbolo @ y un dominio; de no contar con estos parámetros, debe indicarse al usuario por mensaje “Verificar correo”. | 2 | — | U, C | Verificado |
| HU1-CA10 | Los campos de preguntas de seguridad serán una lista desplegable en la cual se mostrarán las diferentes preguntas disponibles de la base de datos. | 3 | E03-D5, E03-D11 | I, C | Verificado |
| HU1-CA11 | No permitir que se seleccionen preguntas de seguridad similares. | 3 | E03-D6 | U (`securityQuestionPolicy`), C | Verificado |
| HU1-CA12 | Las respuestas de seguridad no deben almacenarse en texto plano. | 3 (al registrar) | E02-D1, E03-D9, E03-D11 | I (contenido de la base), E | Verificado |
| HU1-CA13 | Se genera un mensaje de error cerca del campo registrado en caso de que el dato no sea acorde a los criterios: “Error en los campos ingresados”. | 1, 2 y 3 | E03-W02 | C | Verificado |
| HU1-CA14 | Se genera un mensaje de alerta si el usuario ya se encuentra registrado: “El usuario se encuentra registrado”. | 2 y 3 | E03-D3, A-W3, A-ID1 | I, C | Verificado |
| HU1-CA15 | Al presionar el botón de “Registrar”, la información diligenciada es guardada en la base de datos, solo si todo fue diligenciado correctamente y el usuario no está registrado previamente. | 3 | E03-W05, E03-W06, A-W3 | I, C, E | Verificado |
| HU1-CA16 | Se genera un mensaje de información indicando “El registro fue exitoso” después de guardar la información en la base de datos. | 3 | A-W4 | C | Verificado |
| HU1-CA17 | Se limpian los campos del formulario finalizado el registro exitoso. | 3 | E03-W08, E03-W10 | C | Verificado |
| HU1-CA18 | El botón “Cancelar” limpia todos los campos del formulario y regresa a la vista de inicio de sesión. | 1, 2 y 3 | G-07 | C | Verificado (2026-10-27: Cancelar en los pasos 2 y 3 regresa a la vista de inicio de sesión de G-07 sin confirmación, sin cuenta parcial y sin datos en claro; regresión prevista en E04) |
| HU1-CA19 | El botón “Limpiar” limpia todos los campos del formulario. | 1, 2 y 3 | A-W2 (con confirmación) | C | Verificado |

### Criterios adicionales (no son criterios literales de HU1)

E03-W01 a E03-W10 (asistente) están en `decisiones-etapa-03.md`, sección E03-D1, y se
derivan de decisiones aprobadas. Los siguientes son criterios derivados que concretan
identificadores, persistencia, errores y preguntas de seguridad; no sustituyen a ningún
criterio literal. Estado al 2026-10-27.

| ID interno | Criterio | Origen | Verificación prevista | Estado |
|---|---|---|---|---|
| E03-V01 | El celular se valida con un código de país de la lista y un número solo de dígitos; se guarda en formato E.164 y, por separado, el código y el número nacional; las tres columnas son obligatorias | A-ID2, A-ID4 (aprobadas) | U, I | Probado |
| E03-V02 | El documento se compara y es único por su valor normalizado (A-ID3), sin importar el tipo, y se conserva el valor original | A-ID3, E03-D3 (aprobadas) | U, I | Probado |
| E03-V03 | Un documento normalizado igual al celular de otra cuenta, o al revés, se rechaza con «El usuario se encuentra registrado», sin indicar qué identificador coincide | A-ID1 (aprobada) | I | Verificado |
| E03-V04 | Dos registros simultáneos con un mismo identificador crean una sola cuenta; el otro recibe «El usuario se encuentra registrado» y no queda ninguna cuenta incompleta | A-W3 (aprobada) | I | Probado |
| E03-V05 | (Retirado) Validación específica del número con el tipo `NIT` | E03-D4 y A-ID5: el NIT se excluyó del catálogo el 2026-10-25, porque la app es solo para personas naturales | — | Eliminado del alcance |
| E03-V06 | El número de documento solo admite los caracteres definidos para su tipo | E03-D4 (reglas definitivas del 2026-10-27: CC Resolución 3571 de 2003; CE Circular 24 de 2019; PPT Resolución 572 de 2022; PA Cancillería) | U, C | Verificado (2026-10-27: CC, CE y PPT solo dígitos y PA letras y dígitos, sin longitud fija, en interfaz y servicio; Jest 221 pruebas; CC verificada además en el emulador). Reserva documental: CE y PPT se apoyan en especificaciones oficiales sectoriales, no en una norma de Migración Colombia sobre el formato del número |
| E03-V07 | Un fallo técnico al registrar no deja ninguna cuenta parcial, conserva los campos no sensibles, no conserva la contraseña ni las respuestas de seguridad y muestra «No fue posible completar el registro. Intenta de nuevo» | A-W7 (aprobada) | I, C | Probado |
| E03-V08 | Mientras se registra, se muestra «Registrando…» y los botones del asistente están deshabilitados, sin admitir un segundo envío | A-W8 (aprobada) | C | Verificado |
| E03-V09 | La base se abre y se verifica al iniciar la app; si falla, se muestra «No fue posible abrir la base de datos. Reinicia la aplicación.», no se permiten las funciones que dependen de ella y la base no se borra, no se reinicializa ni se recrea | A-W9 (aprobada) | I, E | Verificado (Jest y emulador `emulator-5554`, Android 14: clave ausente y clave rechazada; `hu1-closure-20261027-160501/`) |
| E03-V10 | El paso 3 recoge una respuesta escrita por pregunta, rechaza con «Error en los campos ingresados», seguido de la causa, la que quede vacía o fuera de 2 a 100 puntos de código Unicode tras normalizar (mínimo de 3 hasta el 2026-10-26), no usa las opciones del catálogo y guarda cada una como verificador con la normalización `free-text-folded` | E03-D11 y E03-D5 (aprobadas) | U, I, C | Verificado |
| E03-V11 | El selector de tipo de documento muestra solo los tipos activos de `document_types` (CC, CE, PA y PPT); una migración posterior a la 2 marca el NIT como inactivo; el registro rechaza cualquier tipo de documento inactivo, aunque el intento llegue por una vía distinta al selector, validándolo también en la lógica de registro y no solo en la interfaz, con «Error en los campos ingresados» | E03-D4; definición aprobada por el responsable (2026-10-25); implementación y validación pendientes | U, I, C | Verificado |
| E03-V12 | En los tres pasos, la tecla de acción del teclado en pantalla («Siguiente») pasa al campo siguiente sin cerrar el teclado; el campo activo, su etiqueta y sus mensajes quedan visibles por encima del teclado; en el último campo de cada paso la tecla de acción cierra el teclado | Corrección autorizada por el responsable (2026-10-26) | C | Verificado (`hu1-a1-recheck-20261027-151116`, 19 PASS) |
| E03-V13 | El teclado corresponde al campo: numérico para el documento CC, CE y PPT, de texto para PA (cambia con el tipo), telefónico para el celular | Corrección autorizada por el responsable (2026-10-26); reglas de E03-D4 del 2026-10-27 | U, C | Verificado (Jest; celular en `hu1-fixes2-20261027-144924`; CC, CE y PPT con `inputType` numérico 0x83002 y PA de texto 0x81001 en `emulator-5554`, `hu1-v13-keyboard-20261027-181849`) |
| E03-V14 | El selector de indicativo muestra bandera, país e indicativo («🇨🇴 Colombia (+57)»); la bandera se asocia al país (código ISO), no al prefijo; Colombia es la selección inicial | Corrección autorizada por el responsable (2026-10-26) | U, C | Verificado (Jest: 214 códigos ISO y banderas distintas; capturas de Colombia, lista y Canadá; Estados Unidos confirmado visualmente por el responsable el 2026-10-27) |
| E03-V15 | Cada error indica la causa concreta junto al campo, tras el texto literal de HU1 («Error en los campos ingresados» o «Verificar correo»), se actualiza o desaparece al corregir el valor y sigue visible con el teclado abierto; la contraseña muestra sus requisitos desde el inicio, con la misma fuente de reglas que la validación | Corrección autorizada por el responsable (2026-10-26); HU1-CA09 y HU1-CA13 | U, C | Verificado (`hu1-fixes2-20261027-144924`, controles `C-*`) |

## HU1 — evidencias de la implementación (2026-10-26)

Implementación sobre `b5b4140` (parche `hu1-implementation.patch`, SHA-256
`45cb2cc8…62475fe`). Las evidencias de la Etapa 03 no se incluyen en el
repositorio: forman el paquete de evidencias `GFP-e03-evidencias`, que conserva el responsable
del proyecto y que puede solicitarse a él. Las referencias de evidencia de la Etapa 03 de este
documento (por ejemplo, `hu1-closure-20261027-160501/summary.txt`) identifican carpetas y
archivos de ese paquete; no son rutas del repositorio. Tampoco se versionan los parches, los
manifiestos ni los scripts de validación de la Etapa 03 citados, que se identifican por su
nombre y, cuando consta, su SHA-256. Los resultados comprobados se registran en las tablas,
de modo que no hace falta disponer del paquete para conocerlos.

| Control | Resultado | Evidencia |
|---|---|---|
| Jest, `tsc`, ESLint y Prettier (contenedor) | 17 suites, 182 pruebas; sin errores | Ejecución de Claude del 2026-10-26 |
| `npm ci`, `npm audit`, `typecheck`, `lint`, `format:check`, Jest y `assembleDebug` en Windows (worktree aislado de HU1, JDK 17) | Todos con código 0; `npm audit` sin vulnerabilidades; APK Debug `1A941EA6…AB5A7AE9` | `hu1-20261026-131034/` |
| Recorrido en el emulador (API 29, `emulator-5556`, `adb install -r`, Metro) | 24 PASS; 1 FAIL de mecanismo en P-D2 (Metro rechazó el WebSocket sin cabecera `Origin`) | `hu1-20261026-143817/summary.txt`, capturas `01` a `14`, `logcat.txt` |
| P-D2 aislada en Hermes (NFC, NFD, `free-text-folded`, `\p{L}`, `\p{M}`, `\p{Nd}`, regla de nombres) | 15 PASS, 0 FAIL | `p-d2-20261026-150452/summary.txt`, `p-d2-hermes.json` |
| Base cifrada en el emulador | `gfp.db` sin cabecera SQLite en claro y sin el documento, el correo, la contraseña ni las respuestas de prueba | `hu1-20261026-143817/summary.txt` |
| Integridad | APK de la Etapa 01 y repositorio canónico sin cambios | `hu1-20261026-143817/summary.txt` |

| Criterio | Pruebas automatizadas | Emulador |
|---|---|---|
| HU1-CA01, CA13 | `RegistrationWizard.test.tsx` (validación por paso); `registrationValidation.test.ts` | `02-paso1-obligatorios.png` |
| HU1-CA02, CA03, E03-V11 | `identityRepository.test.ts` (tipos activos, NIT inactivo, rechazo en repositorio y base); `RegistrationWizard.test.tsx` | `03-tipos-documento.png` |
| HU1-CA04 | `registrationValidation.test.ts` (nombres) | Nombre con número rechazado; regla de nombres en Hermes (P-D2) |
| HU1-CA05, CA07 | `registrationValidation.test.ts`, `passwordPolicy.test.ts`, `RegistrationWizard.test.tsx` | `05-paso2-errores.png` |
| HU1-CA06, CA12 | `accountRegistration.test.ts` (sin secretos en claro; verificadores `nfc` y `free-text-folded`) | Base cifrada sin marcadores |
| HU1-CA08 | `registrationValidation.test.ts` (catálogo de indicativos); `RegistrationWizard.test.tsx` (México +52) | `04-paso2.png` (Colombia +57 por defecto) |
| HU1-CA09 | `registrationValidation.test.ts`, `RegistrationWizard.test.tsx` | `05-paso2-errores.png` («Verificar correo») |
| HU1-CA10, CA11 | `securityQuestionPolicy.test.ts`, `RegistrationWizard.test.tsx` | `07-preguntas-similares.png` |
| HU1-CA14, E03-V03 | `identityRepository.test.ts` (disparadores e índices), `accountRegistration.test.ts`, `RegistrationWizard.test.tsx` | `11-colision-documento-celular.png`, `12-correo-duplicado.png` |
| HU1-CA15, CA16, CA17 | `accountRegistration.test.ts`, `RegistrationWizard.test.tsx` | `09-registro-exitoso.png` (mensaje y asistente vacío en el paso 1); registro en unos 22 s con 6 derivaciones PBKDF2 |
| HU1-CA18 | `RegistrationWizard.test.tsx`, `App.test.tsx` | `14-cancelar.png` (pantalla provisional de HU2); `hu1-closure-20261027-160501/ca18-01` a `ca18-04` |
| HU1-CA19 | `RegistrationWizard.test.tsx` | `13-confirmar-limpiar.png` |
| E03-V04, E03-W06 | `identityRepository.test.ts` y `accountRegistration.test.ts` (registros simultáneos, atomicidad) | — |
| E03-V07 | `accountRegistration.test.ts`, `RegistrationWizard.test.tsx` | — |
| E03-V08 | `RegistrationWizard.test.tsx` | `08-registrando.png` |
| E03-V09 | `App.test.tsx` (cinco causas de fallo) | `01-inicio.png` (apertura correcta); `hu1-closure-20261027-160501/v09-01` a `v09-04` (fallo controlado y restauración) |
| E03-V10 | `securityQuestionPolicy.test.ts`, `accountRegistration.test.ts` (recuperación compatible) | Registro con respuestas escritas; plegado en Hermes (P-D2) |
| E03-W01 a E03-W10 | `RegistrationWizard.test.tsx` | Indicador de paso y navegación en las capturas |

## HU1 — correcciones de usabilidad (2026-10-26 y 2026-10-27)

Dos rondas autorizadas por el responsable sobre el mismo worktree, sin integrar en `main`:
`hu1-usability-fixes.patch` (SHA-256 `222f5781…8d57`) y `hu1-usability-fixes-2.patch`
(SHA-256 `ba0b51a1…54cbc8`). Las carpetas de evidencias forman parte del
paquete `GFP-e03-evidencias`, fuera del repositorio (ver «HU1 — evidencias de la implementación»).

| Control | Resultado | Evidencia |
|---|---|---|
| Jest, `typecheck`, `lint` y `format:check` en Windows con las dos rondas | 17 suites, 216 pruebas; los cuatro con código 0 | `hu1-fixes2-20261027-144924/` (`jest.log`, `typecheck.log`, `lint.log`, `format-check.log`) |
| `assembleDebug` e instalación con `adb install -r` | Código 0; APK Debug `A8698FD7…C4260E` instalado en el emulador API 29 | `hu1-fixes2-20261027-144924/summary.txt`, `apk-debug.txt` |
| Primera ronda en el emulador | 22 PASS, 3 FAIL de detección del script (estado del teclado y tipo de teclado leídos de secciones equivocadas del volcado del sistema); la app se comportó correctamente según las capturas y el registro del teclado | `hu1-fixes-20261026-155552/summary.txt` |
| Segunda ronda en el emulador | 39 PASS, 10 FAIL en la navegación entre campos. Causa: el script pulsaba «Siguiente» con una tecla Enter física inyectada (`input keyevent 66`), que React Native trata cerrando el teclado (`ReactEditText.onKeyUp`) y sacando la ventana del modo táctil; el foco sí avanzaba | `hu1-fixes2-20261027-144924/summary.txt`, `ime-dumps/` (fuera del repositorio) |
| Comprobación aislada de la navegación con la tecla de acción del teclado en pantalla | 19 PASS, 0 FAIL: foco, teclado visible y campo sobre el teclado en cada salto de los tres pasos; cierre del teclado en el último campo; selección de Estados Unidos (+1) | `hu1-a1-recheck-20261027-151116/summary.txt` y capturas |
| Banderas | Colombia (selección inicial), lista y Canadá verificadas en capturas; Estados Unidos confirmada visualmente por el responsable (2026-10-27) | `hu1-fixes2-20261027-144924/b-01`, `b-02`, `b-04`; `hu1-a1-recheck-20261027-151116/b-05-estados-unidos-seleccionado.png` |
| Regresión | Registro completo con una respuesta «Te», respuesta de un carácter rechazada, duplicado tras reiniciar la app, documento igual al celular rechazado, `gfp.db` cifrada sin datos de prueba en claro, `logcat` sin errores fatales, APK de la Etapa 01 y repositorio canónico sin cambios | `hu1-fixes2-20261027-144924/summary.txt`, `reg-01`, `reg-02`, `d-01`, `d-02` |

| Corrección | Pruebas automatizadas | Emulador |
|---|---|---|
| Campo oculto por el teclado; navegación entre campos (E03-V12) | `RegistrationWizard.test.tsx` (`returnKeyType` y `submitBehavior` por campo); el desplazamiento y el teclado solo se verifican en el emulador | `hu1-fixes-20261026-155552/fix1-02` (mensaje visible con el teclado); `hu1-a1-recheck-20261027-151116/` (19 PASS) |
| Línea en el campo de teléfono | `RegistrationWizard.test.tsx` (mismo estilo en todos los campos, sin subrayado de Android) | `hu1-fixes-20261026-155552/fix2-02` (sin línea, análisis de píxeles) |
| Documento según su tipo (E03-V06, E03-V13) | `registrationValidation.test.ts`, `accountRegistration.test.ts`, `RegistrationWizard.test.tsx` | `hu1-fixes-20261026-155552/fix3-02`; `hu1-fixes2-20261027-144924/a2-01` |
| Indicadores de listas desplegables | `RegistrationWizard.test.tsx` | `hu1-fixes-20261026-155552/fix4-01`, `fix4-04` |
| Teclado telefónico (E03-V13) | `RegistrationWizard.test.tsx` | `hu1-fixes2-20261027-144924/a3-01` |
| Banderas (E03-V14) | `registrationValidation.test.ts` (códigos ISO, banderas distintas, +1 y +7 compartidos), `RegistrationWizard.test.tsx` | Fila «Banderas» de la tabla anterior |
| Mensajes específicos y ayuda de contraseña (E03-V15) | `registrationValidation.test.ts`, `RegistrationWizard.test.tsx` | `hu1-fixes2-20261027-144924/c-01` a `c-06` |
| Respuestas de 2 a 100 puntos de código (E03-D5, E03-V10) | `securityQuestionPolicy.test.ts` (1, 2 y 100 en NFC y NFD), `accountRegistration.test.ts` (registro y recuperación HU3 con «Te») | `hu1-fixes2-20261027-144924/d-01`, `d-02`, `reg-01` |

## HU1 — cierre de validación (2026-10-27)

Ejecución de `stage03-hu1-closure.ps1` en el AVD aislado `emulator-5554` (AVD `Pixel_4`,
Android 14, API 34, x86_64; la app no estaba instalada), con el worktree aislado de HU1 y
`hu1-document-rules.patch` (SHA-256 `b72dd2a6…f0b6b3`): 27 PASS, 0 FAIL
(`hu1-closure-20261027-160501/summary.txt`). Las carpetas `hu1-closure-20261027-160154` y `-160321`, fuera del
repositorio, son dos intentos anteriores interrumpidos; no se usan como evidencia.

| Caso | Resultado | Evidencia |
|---|---|---|
| Controles con las reglas de documento | `typecheck`, `lint`, `format:check` y Jest (17 suites, 220 pruebas) con código 0 | `hu1-closure-20261027-160501/jest.log` y registros |
| P-D3 (definición de `validacion/etapa-02-pruebas-dispositivo.md`) | Primera apertura crea clave (`RN_KEYCHAIN.preferences_pb`) y base; tras desinstalar no queda el directorio de datos; antes de abrir la app reinstalada no existe `gfp.db`; al abrirla se crean clave y base nuevas sin error (otra suma SHA-256 y otro usuario de Linux de la app) | `hu1-closure-20261027-160501/database-states.txt`, `p-d3-*.log`, `p-d3-01`, `p-d3-02` |
| E03-V09 con la clave ausente (`key_lost`) | Mensaje aprobado como único texto, sin controles ni asistente, `gfp.db` intacta y sin clave nueva; al restaurar la clave la app abre la misma base | `hu1-closure-20261027-160501/v09-01-clave-ausente.png` y `.xml`, `v09-02` |
| E03-V09 con la clave rechazada (`key_rejected`) | Mismo mensaje y bloqueo; el archivo que no se pudo abrir no se borra, sustituye ni reinicializa; al restaurar la base original la app vuelve a abrirla | `hu1-closure-20261027-160501/v09-03-clave-rechazada.png` y `.xml`, `v09-04` |
| HU1-CA18 | Cancelar en los pasos 2 y 3 lleva a la vista de inicio de sesión sin confirmación; con los mismos documento, celular y correo se vuelve a llegar al paso 3 (no quedó cuenta); la base cifrada no contiene los datos cancelados | `hu1-closure-20261027-160501/ca18-01` a `ca18-04` |
| Regla del pasaporte en el emulador | Un pasaporte con «#» se rechaza. La ejecución usó la regla A-Z, retirada después en la revisión del 2026-10-27 (E03-D4); la regla de letras y dígitos que la sustituye se verificó en el emulador cuando se aplicaba al PPT (`hu1-fixes2-20261027-144924`, `C-DOC-CHARS`) y está cubierta en Jest | `hu1-closure-20261027-160501/v06-01-pasaporte-caracter-no-permitido.png` |
| Excepciones | `logcat` sin `FATAL EXCEPTION` | `logcat.txt` (fuera del repositorio) |

Fallo al abrir la base: el fallo se provocó de forma reversible y solo con archivos de prueba
del AVD aislado (se apartó el almacén de la clave o se sustituyó la base por un archivo
ajeno), y en ambos casos se restauró el estado original.

Estado de las reservas al 2026-10-27:

| Reserva | Estado | Motivo |
|---|---|---|
| E03-V06 | Verificado, con reserva documental | CE y PPT se apoyan en especificaciones oficiales sectoriales (MinSalud) a falta de una norma de Migración Colombia sobre el formato del número; si se publica, se revisa la regla |
| P-D1 | Aplazada (decisión del responsable, 2026-10-27); diferida a la Etapa 06 o posterior (E05-APROBACION, 2026-11-04) | Requiere el dispositivo físico mínimo. No bloquea el cierre de HU1 en emuladores ni el de la Etapa 05 |
| P-D3 | Verificada | `hu1-closure-20261027-160501/` |
| P-D7 | Diferida | Su definición exige procesar con OCR las 6 imágenes sintéticas en un Release sin `INTERNET`; el flujo de OCR llega con HU7 (Etapa 10) |

## HU1 — versión candidata consolidada (2026-10-27)

Reglas de documento definitivas (E03-D4: CC, CE y PPT solo dígitos; PA letras y dígitos; sin
longitud fija) en `hu1-passport-rule.patch` (SHA-256 `0c9a18bb…a43298`) y
`hu1-document-rules-final.patch` (SHA-256 `ea7253af…cc1fc65`). El manifiesto
`hu1-candidate-manifest.txt` (SHA-256 `ccb80749…a78b3`) fija la suma SHA-256 de los 41 archivos
de `app/` que difieren de `b5b4140`.

| Control | Resultado | Evidencia |
|---|---|---|
| Alineación del worktree aislado de HU1 | Parches aplicados; 41 archivos iguales al manifiesto, sin archivos extra ni faltantes | `hu1-candidate-20261027-175324/summary.txt`, `worktree-status-after.txt`, `manifest-mismatches.txt` (vacío) |
| `typecheck`, `lint`, `format:check` y Jest | Código 0; 17 suites, 221 pruebas | `hu1-candidate-20261027-175324/` |
| CE y PPT en el emulador (`emulator-5554`) | Letras rechazadas con el mensaje de su tipo; dígitos aceptados | `hu1-candidate-20261027-175324/v06-ce-solo-digitos.png`, `v06-ppt-solo-digitos.png` |
| Tipo de teclado (E03-V13) | La primera comprobación dio 3 FAIL porque el script buscaba el formato de registro del teclado de Android 10 y en Android 14 no lo encuentra; además borraba el registro de cada caso. Con la lectura corregida, 14 PASS y 0 FAIL: CC, CE y PPT `inputType=0x83002` (numérico), PA `0x81001` (texto), teclado mostrado, letras rechazadas y dígitos aceptados en CC, CE y PPT, y PA alfanumérico aceptado; el worktree sigue igual al manifiesto | `hu1-candidate-20261027-175324/summary.txt`; `hu1-v13-keyboard-20261027-181849/summary.txt`, `ime-cc.log` a `ime-pa.log`, `teclado-*.png` |

## HU2 — criterios de aceptación (Etapa 04)

Transcripción literal de los 11 criterios de HU2, en el orden del documento fuente.
Verificación: U, C e I como en HU1; E (ejecución en el emulador). Implementación en la rama
`e04/hu2-login`, integrada en `main` el 2026-10-30 desde `e04/hu2-login-pbkdf2` (`96d00cb`);
decisiones E04-D1 a E04-D8 en `decisiones-etapa-04.md`, ratificadas el 2026-10-30. Estado
final: con `2e5fd6c`, que incluye `a4831e9` y la corrección de PBKDF2, Jest 265/265 en Windows y
recorridos de HU2, regresión de HU1 y P-D2 sin fallos en Android 10 y 14
(`validacion/etapa-04-diagnostico-memoria-pbkdf2.md`, sección 9; `cierre-etapa-04.md`).
Historial al 2026-10-28: con el commit `438a9f6`, Jest en Linux y en Windows (19
suites, 264 pruebas) y recorrido completo en los emuladores de Android 10 (API 29) y Android 14
(API 34) sin fallos; resultados y evidencias en `validacion/etapa-04-pruebas-dispositivo.md`.
El commit `a4831e9` corrige el doble envío del formulario (HU2-CA06) y añade una prueba. Con
`d91dfbc` pasaron Jest en Linux y en Windows (265 pruebas) y los tres recorridos en Android 10;
en Android 14 pasaron la regresión de HU1 y P-D2, y el recorrido de HU2 quedó bloqueado en el
registro de la cuenta sintética, con la app fuera del primer plano. La ejecución siguiente, con
`logcat`, mostró el agotamiento de memoria de PBKDF2, ya corregido, y la repetición con
`2e5fd6c` pasó.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Comprobación en dispositivo prevista | Estado |
|---|---|---|---|---|---|
| HU2-CA01 | El campo identificador debe recibir correo electrónico, número de documento o número de celular. | Campo único «Identificador»; búsqueda de A-ID1 a A-ID4 (`lookupIdentifier`) | U, I: `accountLogin.test.ts` (correo, documento normalizado, E.164 con y sin separadores, celular nacional inequívoco) | `HU2-CA01-EMAIL`, `-DOCUMENT`, `-PHONE` | Verificado (Jest; Android 10 y 14) |
| HU2-CA02 | Los campos identificador y contraseña deben ser obligatorios. | `validateLoginInput()` en la pantalla y en el servicio, sin contar intentos | U, C: `accountLogin.test.ts`, `LoginScreen.test.tsx` | `HU2-CA02` | Verificado (Jest; Android 10 y 14) |
| HU2-CA03 | No se debe exponer ni almacenar la contraseña en texto plano. | `secureTextEntry`; verificación PBKDF2 (E02-D1); la contraseña no se devuelve, guarda ni registra (E04-D7) | U, C: `accountLogin.test.ts`, `LoginScreen.test.tsx` | `HU2-CA03-DB`, `HU2-CA03-LOGCAT` | Verificado (Jest; Android 10 y 14) |
| HU2-CA04 | Si el usuario ingresa el correo electrónico, se debe garantizar la validación del símbolo @ y un dominio; de no contar con estos parámetros, debe indicarse al usuario por mensaje “Verificar identificación”. | Si el identificador contiene `@`, se valida con la regla de correo de HU1 | U, C | `HU2-CA04` | Verificado (Jest; Android 10 y 14) |
| HU2-CA05 | Si el usuario y/o contraseña es incorrecta, se debe generar un mensaje de alerta indicando “El campo identificación o contraseña son incorrectos”. | Diálogo de alerta con el texto literal; mismo resultado y costo para identificador inexistente y contraseña incorrecta (E04-D7) | U, C | `HU2-CA05-PASSWORD`, `-UNKNOWN` | Verificado (Jest; Android 10 y 14) |
| HU2-CA06 | Si el identificador y/o contraseña son incorrectos en 3 oportunidades, debe bloquearse el acceso a la plataforma por 15 minutos. | Contador único del dispositivo en `auth_throttles` (E04-D1), persistente; intentos en serie | U, C: tercer fallo, bloqueo con la contraseña correcta, fin del bloqueo, reinicio tras éxito, persistencia, reloj hacia atrás, 10 intentos simultáneos | `HU2-CA06` | Verificado (Jest; Android 10 y 14) |
| HU2-CA07 | El botón “Ingresar” debe validar la información contra los datos almacenados en la base de datos. | `AccountLoginService` sobre la base cifrada; sesión del `SessionManager` | U, I, C: `accountLogin.test.ts`, `LoginScreen.test.tsx`, `App.test.tsx` | `HU2-CA07` | Verificado (Jest; Android 10 y 14) |
| HU2-CA08 | El botón “Registrar” debe redirigir al formulario de registro de usuario. | Navegación a `register` | C: `LoginScreen.test.tsx`, `App.test.tsx` | `HU2-CA08` | Verificado (Jest; Android 10 y 14) |
| HU2-CA09 | El vínculo “Olvidé mi contraseña” redirige al formulario de recuperación de contraseña. | Navegación a `passwordRecovery` (pantalla provisional de G-07 hasta HU3) | C | `HU2-CA09` | Verificado en la rama de E05 (Jest; Android 10 y 14 con el formulario real de HU3, 2026-10-30); en `main` sigue la pantalla provisional hasta integrar E05 |
| HU2-CA10 | La información financiera no debe estar disponible mediante la aplicación sin una autenticación válida. | `requiresSession` y `resolveRoute()` (E04-D3) | C: `App.test.tsx` | `HU2-CA10` (reinicio: vuelve al inicio de sesión) | Verificado (Jest) en la consolidación para todas las pantallas con sesión; validación manual final G2-10 |
| HU2-CA11 | Después de una autenticación válida, el usuario debe acceder únicamente a la información asociada a su cuenta. | Sesión de un único usuario; cada inicio de sesión sustituye la anterior (E04-D4); repositorios basados en la sesión (E02-D4) | U: `accountLogin.test.ts`, `userIsolation.test.ts` | — | Verificado (Jest) en la consolidación para todos los datos financieros; validación manual final G2-11 |

Regresión de HU1 en la Etapa 04: HU1-CA18 se verifica en Jest con la pantalla real de inicio
de sesión (`App.test.tsx`: «Cancelar» vuelve a HU2 con los campos vacíos) y en Android 10 y 14
(`HU1-CA18`, 2026-10-28); en los mismos emuladores pasaron el registro completo de una cuenta y
P-D3, E03-V09, E03-V06, E03-V13 y P-D2. Se actualizaron tres pruebas de `App.test.tsx` cuyo
comportamiento cambia con HU2: la app empieza en el inicio de sesión, «Cancelar» lleva a la
pantalla real y el registro de rutas declara HU1 y HU2 implementadas.

## HU3 — criterios de aceptación (Etapa 05)

Transcripción literal de los 13 criterios de HU3, en el orden del documento fuente.
Verificación: U, C e I como en HU1 y HU2. Implementación en la rama `e05/hu3-recuperar-contrasena`
sobre el servicio de recuperación de la Etapa 02 (`accountRecovery.ts`) y la pantalla
`PasswordRecoveryScreen.tsx`. Decisiones E05-D1 a E05-D9 en `decisiones-etapa-05.md`,
ratificadas por el responsable el 2026-11-04 (E05-APROBACION), con los riesgos conocidos H-1 y
H-2. Cierre en `cierre-etapa-05.md`. Estado al 2026-11-04, sobre `81b03e5`:

- Jest sin fallos en Linux y Windows (20 suites, 293 pruebas).
- Regresión automatizada de HU1 y HU2 en Android 10 y 14 (2026-10-30) sin fallos, salvo el
  defecto conocido de `E03-V13` en Android 14.
- Recorrido manual R01 a R16 en Android 10 y 14: ejecución culminada el 2026-11-04. R01 a R15 y
  R14b aceptados con las excepciones de `validacion/etapa-05-observaciones-validacion.md`; R16
  no verificable en ambos emuladores.

Procedimiento y resultados en `validacion/etapa-05-pruebas-dispositivo.md`. La columna
«Dispositivo» indica los pasos del recorrido y las observaciones (O-xx) que los afectan.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Dispositivo (Android 10 y 14) | Estado |
|---|---|---|---|---|---|
| HU3-CA01 | Se debe solicitar primero el identificador para conocer el usuario que intenta recuperar la contraseña. | Primera fase de la pantalla: solo «Identificador» y «Comenzar recuperación» (E05-D4) | C: `PasswordRecoveryScreen.test.tsx` | R01 | Verificado (Jest; Android 10 y 14) |
| HU3-CA02 | El campo identificador debe recibir correo electrónico, número de documento o número de celular. | Búsqueda de A-ID1 a A-ID4 (`lookupIdentifier`); celular nacional ambiguo según A-ID2 (E05-D7) | U, C: `accountRecovery.test.ts`, `PasswordRecoveryScreen.test.tsx` | R05, R06, R07 (correo, documento y celular); R06 con O-08 | Verificado (Jest; Android 10 y 14) |
| HU3-CA03 | El botón “Comenzar recuperación” deberá validar el identificador y mostrar error si no es un identificador válido mediante un mensaje “Identificador incorrecto”. | `validateRecoveryIdentifier()` y `start()`: correo con formato inválido o identificador inexistente dan «Identificador incorrecto»; vacío, «Ingresa tu identificador.» (E05-D5) | U, C | R02, R03, R04; Android 10: O-03, O-04 | Verificado (Jest; Android 10 y 14) |
| HU3-CA04 | Cuando se confirme el identificador válido, se deberá solicitar responder las preguntas de seguridad y solicitar la nueva contraseña. | Segunda fase con 2 de las 5 preguntas configuradas, elegidas al azar y mantenidas en un reto de 15 minutos (E05-D2), y los campos de la nueva contraseña | U, C | R06, R07 | Verificado (Jest; Android 10 y 14) |
| HU3-CA05 | La contraseña nueva debe ser una contraseña segura, de mínimo 8 caracteres, entre los cuales debe contener mínimo 1 número, 1 letra, 1 símbolo. | `validateNewPassword()` de HU1 en la pantalla y en el servicio; requisitos visibles (`PasswordRequirements`) | U, C | R09 | Verificado (Jest; Android 10 y 14) |
| HU3-CA06 | La aplicación no debe almacenar la contraseña en texto plano. | Verificador PBKDF2 (E02-D1); campos con `secureTextEntry` | U, C: la fila de `credentials` no contiene la contraseña | R16: no verificable (O-11); la base no se inspeccionó en el recorrido | Verificado (Jest); sin verificación en dispositivo |
| HU3-CA07 | La nueva contraseña y la confirmación deben ser idénticas para poder realizar la recuperación. | Comprobación en la pantalla y en el servicio (`confirmation_mismatch`) | U, C | R10; Android 10: O-06 | Verificado (Jest; Android 10 y 14) |
| HU3-CA08 | El botón “Actualizar contraseña” deberá validar que los datos ingresados cumplan las reglas de formato y de seguridad y que sean correctos con los valores esperados. | Respuestas obligatorias, política y confirmación en la pantalla; respuestas verificadas en el servicio | U, C | R08, R09, R10, R11; Android 10: O-05, O-06 | Verificado (Jest; Android 10 y 14) |
| HU3-CA09 | Si los datos ingresados son incorrectos, se debe mostrar un error mediante el mensaje “Datos ingresados incorrectos”. | Aviso con el texto literal para datos con formato inválido y respuestas incorrectas (E05-D5) | C | R08 a R11, R14 | Verificado (Jest; Android 10 y 14) |
| HU3-CA10 | Si las respuestas no son correctas, no debe permitirse el cambio de contraseña. | Se verifican siempre las 2 respuestas; un fallo no cambia la credencial y cuenta un intento (E05-D1) | U, C | R11, R14 y R14b (tras tres respuestas incorrectas, B inicia sesión con su contraseña anterior: no cambió); Android 14: O-01, O-02; Android 10: O-05 | Verificado (Jest; Android 10 y 14) |
| HU3-CA11 | Si las respuestas son correctas y la nueva contraseña es confirmada y cumple las condiciones de seguridad, se debe proceder a actualizar la nueva contraseña en la base de datos. | `replaceCredential()` en una transacción que elimina el reto y reinicia los contadores | U, C | R12 | Verificado (Jest; Android 10 y 14) |
| HU3-CA12 | Después de completar correctamente el proceso, la nueva contraseña debe permitir iniciar sesión. | La transacción reinicia también el bloqueo del inicio de sesión del dispositivo (E05-D8) | U: `accountRecovery.test.ts` (incluido un dispositivo bloqueado); I: `App.test.tsx` | R13 | Verificado (Jest; Android 10 y 14) |
| HU3-CA13 | Si el proceso de recuperación es exitoso, se debe redirigir al formulario de inicio de sesión. | Aviso de éxito y, al aceptarlo, ruta `login` | C: `PasswordRecoveryScreen.test.tsx`; I: `App.test.tsx` | R12 | Verificado (Jest; Android 10 y 14) |

Regresión de HU1 y HU2 en la Etapa 05: la suite completa de Jest pasa, incluidas las pruebas de
registro, inicio de sesión y navegación. Cambian dos pruebas de `App.test.tsx` cuyo comportamiento
cambia con HU3: el enlace «Olvidé mi contraseña» abre el formulario real y el registro de rutas
declara HU3 implementada. La regresión en Android 10 y 14 se ejecutó el 2026-10-30 sin fallos,
salvo el defecto conocido de `E03-V13` en Android 14, confirmado a mano.

## HU8 — criterios de aceptación (Etapa 06)

Transcripción literal de los criterios de HU8, en el orden del documento fuente. HU8-CA07 se
divide en los subcriterios a, b y c, uno por viñeta del documento. Verificación: U (unitaria), C
(componente), I (integración con SQLite). Decisiones E06-D1 a E06-D9 en
`decisiones-etapa-06.md`. Implementación en la rama `e06/hu8-administrar-categorias`, desde
`main` (`e19d9ab`), a partir del código del repositorio paralelo `daniela888-li/GFP` (commits
`76d5821` y `12dcbcb`) con las adaptaciones de `5efd51d`.

Estado al 2026-11-04: Jest en Linux sin fallos (24 suites, 362 pruebas), con `typecheck`, `lint`
y `format:check` sin errores. La validación en Windows y en emulador está pendiente; procedimiento
en `validacion/etapa-06-pruebas-dispositivo.md`, cuyos pasos C01 a C16 figuran en la columna
«Dispositivo».

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Dispositivo | Estado |
|---|---|---|---|---|---|
| HU8-CA01 | Poblado inicial (Seeding): Al instalar o iniciar la aplicación por primera vez, el sistema debe crear automáticamente las siguientes categorías del sistema si la tabla categories está vacía: Alimentación, Transporte, Vivienda, Entretenimiento, Salud, Educación, Compras, Salario y Otros. | Migración 4 `categories-schema-and-system-seed`: tabla `categories` creada vacía y carga de las 9 categorías con identificadores fijos, tipos del prototipo (E06-D2) e íconos (E06-D5); se aplica una sola vez | I: `categoryMigration.test.ts`; C: `CategoriesScreen.test.tsx` | C01 | Verificado (Jest) |
| HU8-CA02 | Protección de categorías del sistema: Las categorías creadas por defecto no podrán ser editadas ni eliminadas bajo ninguna circunstancia. Los botones de acción rápida para estas filas estarán deshabilitados o no visibles. | Disparadores `system_category_protected` (también frente a SQL directo); el servicio responde `protected`; las filas del sistema muestran un candado y no tienen botones | I: `categoryMigration.test.ts`; U: `categoryManagement.test.ts`; C: `CategoriesScreen.test.tsx` | C01 | Verificado (Jest) |
| HU8-CA03 | Creación de categorías personalizadas: El usuario podrá crear nuevas categorías ingresando un nombre, tipo y seleccionando un ícono. | Formulario «Nueva categoría» (`CategoryFormSheet.tsx`); `CategoryManagementService.create()` asociado al usuario de la sesión (E06-D1); «Guardar» deshabilitado sin nombre o sin ícono (E06-D6c) | U: `categoryRules.test.ts`, `categoryManagement.test.ts`; C: `CategoriesScreen.test.tsx` | C03, C05, C07 | Verificado (Jest) |
| HU8-CA04 | Validación de duplicados: No se permitirá crear ni modificar una categoría con un nombre que ya exista en la base de datos (insensible a mayúsculas/minúsculas e independiente de si es del sistema o personalizada). De lo contrario, muestra el mensaje: "La categoría ya existe". | Clave `name_normalized` (E06-D9); comparación con las categorías del sistema y las del usuario actual (E06-D1a); índices únicos y disparador; aviso mientras se escribe y «Guardar» deshabilitado | U, I: `categoryManagement.test.ts`, `categoryMigration.test.ts`, `userIsolation.test.ts`; C: `CategoriesScreen.test.tsx` | C04, C06, C09, C14 | Verificado (Jest), con el alcance de E06-D1a |
| HU8-CA05 | Reutilización de íconos: Múltiples categorías pueden compartir el mismo ícono gráfico sin restricción. | `icon` sin índice único; selector de 12 íconos (E06-D5) | U, I: `categoryManagement.test.ts`, `categoryMigration.test.ts`; C: `CategoriesScreen.test.tsx` | C07 | Verificado (Jest) |
| HU8-CA06 | Edición restringida: El usuario solo podrá editar el nombre, tipo e ícono de las categorías creadas por él mismo. | `CategoryRepository.updateOwn()` filtra por el usuario de la sesión y `is_system = 0`; una categoría ajena responde `not_found` | U, I: `categoryManagement.test.ts`, `userIsolation.test.ts`; C: `CategoriesScreen.test.tsx` | C08, C14 | Verificado (Jest) |
| HU8-CA07a | Eliminación y reasignación automática a "Otros": El usuario solo podrá eliminar categorías personalizadas. | `deleteOwn()` filtra por el usuario y `is_system = 0`; disparador de protección | U, I: `categoryManagement.test.ts`, `categoryMigration.test.ts`, `userIsolation.test.ts`; C: `CategoriesScreen.test.tsx` | C01, C12, C14 | Verificado (Jest) |
| HU8-CA07b | Al presionar "Eliminar", el sistema debe desplegar un modal de confirmación con el mensaje: “¿Está seguro de eliminar esta categoría?” y la advertencia: "Los movimientos asociados a esta categoría serán reasignados automáticamente a la categoría 'Otros'.". | Modal con `MessageDialog`, la categoría afectada, «Cancelar» y «Confirmar» | C: `CategoriesScreen.test.tsx` | C11 | Verificado (Jest) |
| HU8-CA07c | Al presionar "Confirmar", la categoría es eliminada de la base de datos local y todos los movimientos financieros vinculados a ella cambian automáticamente su categoría asociada al ID de "Otros". | E06: eliminación transaccional e identificador fijo `other`; E07: reasignación de los movimientos en la misma transacción, conservando su tipo (E06-D3, E06-D7) | U, I: eliminación (`categoryManagement.test.ts`, `CategoriesScreen.test.tsx`); E07: reasignación, recuento del modal y transacción (`categoryManagement.test.ts`, `CategoriesScreen.test.tsx`) | C12 (solo la eliminación); validación final: M13 de `validacion/etapa-07-verificacion.md` | Verificado (Jest) en E07 (rama `e07/hu4-registrar-movimiento`, E07-D7) |
| HU8-CA08 | Disponibilidad en el sistema: Las categorías personalizadas creadas o modificadas deben reflejarse inmediatamente en las listas desplegables del formulario de registro (HU4) y filtros (HU5). | `listActiveCategories(session, type?)` sin caché (E06-D7); consultada al abrir el formulario de HU4 (E07) y el historial de HU5 (E08) | I: `categoryManagement.test.ts`; C: `MovementFormScreen.test.tsx` (E07), `MovementHistoryScreen.test.tsx` y `App.test.tsx` (E08) | — | Verificado (Jest) en E08 |

Decisiones verificadas además en Jest: E06-D4 (acceso desde la pantalla provisional de HU5 y botón
Atrás, `App.test.tsx` y `CategoriesScreen.test.tsx`), E06-D5 (12 íconos en el selector), E06-D6b
(«Guardar»), E06-D6c y E06-D9b (40 puntos de código). HU2-CA10: la ruta `categories` exige sesión
(`App.test.tsx`).

## HU4 — criterios de aceptación (Etapa 07)

Transcripción literal de los criterios de HU4, en el orden del documento fuente. Verificación: U
(unitaria), C (componente), I (integración con SQLite). Decisiones E07-D1 a E07-D9 en
`decisiones-etapa-07.md`. Implementación en la rama `e07/hu4-registrar-movimiento`, desde `main`
(`d6c1713`).

Estado al 2026-11-04: Jest en Linux sin fallos (30 suites, 491 pruebas), con `typecheck`, `lint`
y `format:check` sin errores; integrada en `main` (`7558a3f`). Los criterios de edición y
CA12 se completaron en E08 (pasos H07 y H08 de `validacion/etapa-08-verificacion.md`). Sin pruebas manuales en esta etapa (D-07): la columna
«Validación final» remite a los pasos M01 a M14 de ese documento, que se ejecutan en la validación
integral posterior a la Etapa 13.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Validación final | Estado |
|---|---|---|---|---|---|
| HU4-CA01 | Los campos Tipo de movimiento, Categoría, Fecha y Monto deben ser obligatorios. | `validateMovementInput()` (`movementRules.ts`); restricciones `NOT NULL` y `CHECK` de la migración 5 | U: `movementRules.test.ts`, `movementManagement.test.ts`; C: `MovementFormScreen.test.tsx`; I: `movementMigration.test.ts` | M03 | Verificado (Jest) |
| HU4-CA02 | El selector "Categoría" debe poblarse con los registros activos del maestro 'categories'. | `listActiveCategories()` sin caché al abrir el formulario, filtrado por tipo con «Otros» para ambos (E07-D1, D-02) | U: `movementRules.test.ts`; C: `MovementFormScreen.test.tsx` (incluye una categoría personalizada recién creada, HU8-CA08) | M02 | Verificado (Jest) |
| HU4-CA03 | El selector “Fecha” debe inicializarse con la fecha actual del sistema por defecto. | `todayIso()` con la fecha local; campo `DD/MM/AAAA` y calendario nativo (E07-D6) | U: `localDate.test.ts`; C: `MovementFormScreen.test.tsx` | M04 | Verificado (Jest) |
| HU4-CA04 | La fecha no puede ser posterior a la fecha actual del sistema. De lo contrario, se muestra un mensaje: "La fecha no puede ser futura". | Validación de la fecha frente a hoy; `maximumDate` del calendario (D-03) | U: `movementRules.test.ts`, `movementManagement.test.ts`; C: `MovementFormScreen.test.tsx` | M05, M06 | Verificado (Jest) |
| HU4-CA05 | El campo monto debe recibir solo valores numéricos positivos mayores a cero. De lo contrario, se muestra un mensaje cerca del campo: “Ingrese un monto válido”. | `parseAmountInput()` (`money.ts`, E07-D5); mensaje bajo el campo; `CHECK` de `amount_cents` | U: `money.test.ts`, `movementRules.test.ts`; C: `MovementFormScreen.test.tsx`; I: `movementMigration.test.ts` | M07 | Verificado (Jest) |
| HU4-CA06 | El campo "Descripción" es opcional y permite una longitud máxima de 250 caracteres. | `normalizeDescription()` y contador `n/250` (E07-D8); `CHECK` de `description` | U: `movementRules.test.ts`; C: `MovementFormScreen.test.tsx`; I: `movementMigration.test.ts` | M08 | Verificado (Jest) |
| HU4-CA07 | Al presionar el botón "Registrar" (o “Actualizar”), si la información es válida, la transacción se almacena en la base de datos local vinculada al userId del usuario autenticado. | `MovementManagementService.create()` y `update()`; `MovementRepository` toma el usuario de la sesión (E02-D4) | U, I: `movementManagement.test.ts`; C: `MovementFormScreen.test.tsx`, `App.test.tsx` (edición desde el historial, E08) | M09; edición: H07 | Verificado (Jest); la edición se completó en E08 |
| HU4-CA08 | Al guardar correctamente, el sistema muestra el mensaje de confirmación: "El movimiento fue registrado exitosamente" (o "El movimiento fue actualizado exitosamente" para ediciones). | Pantalla «¡Operación exitosa!» (E07-D4); mensaje de actualización en el formulario | C: `MovementFormScreen.test.tsx`, `App.test.tsx` (edición desde el historial, E08) | M09; edición: H07 | Verificado (Jest); la edición se completó en E08 |
| HU4-CA09 | Al completar el registro exitoso, se limpian los campos del formulario. | Estado del formulario restablecido al guardar (E07-D4) | C: `MovementFormScreen.test.tsx`, `App.test.tsx` | M10 | Verificado (Jest) |
| HU4-CA10 | Al presionar el botón "Editar" en un movimiento existente, la vista carga previamente todos los datos registrados para su modificación. | Botón «Editar» del historial (HU5-CA07) y modo `edit` de `MovementFormScreen` con `MovementManagementService.get()` | C: `MovementFormScreen.test.tsx`; integración: `App.test.tsx` (E08) | H07 | Verificado (Jest) en E08 |
| HU4-CA11 | El botón "Limpiar" borra el contenido de todos los campos del formulario. | «Limpiar» restablece tipo, monto, fecha, categoría, descripción y errores (E07-D2) | C: `MovementFormScreen.test.tsx` | M11 | Verificado (Jest) |
| HU4-CA12 | El botón "Cancelar" descarta los cambios y redirige a la vista principal o al historial. | «Cancelar», Atrás y la pestaña «Movimientos» regresan al historial sin guardar (E07-D3, E08-D4) | C: `MovementFormScreen.test.tsx`; integración: `App.test.tsx` (historial real, al crear y al editar, E08) | M12, H08 | Verificado (Jest) en E08 |
| HU4-CA13 | Si los datos ingresados son inválidos o incompletos al intentar guardar, se debe mostrar un error con el mensaje: “Error en los campos ingresados”. | Aviso sobre el formulario con los errores de cada campo | C: `MovementFormScreen.test.tsx` | M03 | Verificado (Jest) |

Criterios de otras historias completados o ampliados en esta etapa:

- **HU8-CA07c:** reasignación de los movimientos a «Otros» en la transacción de la eliminación,
  conservando su tipo (E07-D7, E06-D3). I: `categoryManagement.test.ts`; C:
  `CategoriesScreen.test.tsx`. Validación final: M13. Estado: verificado (Jest).
- **HU8-CA08:** la categoría creada aparece en el selector de HU4 al abrir el formulario
  (`MovementFormScreen.test.tsx`). Sigue parcial previsto hasta los filtros de HU5 (E08).
- **HU2-CA10:** la ruta `movementForm` exige sesión; una sesión vencida al guardar vuelve al
  inicio de sesión sin escribir (`App.test.tsx`, `MovementFormScreen.test.tsx`,
  `movementManagement.test.ts`).
- **HU2-CA11:** otra cuenta no puede leer, editar ni usar las categorías de la propietaria
  (`movementManagement.test.ts`, `movementMigration.test.ts`, `categoryManagement.test.ts`).

## HU5 — criterios de aceptación (Etapa 08)

Transcripción literal de los criterios de HU5, en el orden del documento fuente. Verificación: U
(unitaria), C (componente), I (integración con SQLite). Decisiones E08-D1 a E08-D7 en
`decisiones-etapa-08.md`. Implementación en la rama `e08/hu5-historial-movimientos`, desde
`main` (`7558a3f`).

Estado al 2026-11-04: Jest en Linux sin fallos (32 suites, 519 pruebas), con `typecheck`, `lint`
y `format:check` sin errores. La compilación Android en Windows está pendiente
(`validacion/etapa-08-verificacion.md`). Sin pruebas manuales en esta etapa (D-07): la columna
«Validación final» remite a los pasos H01 a H12 de ese documento.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Validación final | Estado |
|---|---|---|---|---|---|
| HU5-CA01 | La vista debe desplegar la lista de transacciones registradas del usuario autenticado, ordenadas cronológicamente desde la más reciente a la más antigua. | `MovementRepository.listOwn()` (usuario de la sesión; `occurred_on` y `created_at` descendentes, E08-D6); `MovementHistoryScreen` | I: `movementManagement.test.ts`; C: `MovementHistoryScreen.test.tsx`; integración: `App.test.tsx` | H01, H02 | Verificado (Jest) |
| HU5-CA02 | Las opciones del filtro "Categoría" deben poblarse con el maestro ‘categories’. | `listActiveCategories()` al abrir el historial, con «Categoría (Todas)» (E08-D5) | C: `MovementHistoryScreen.test.tsx`; integración: `App.test.tsx` (HU8-CA08) | H03 | Verificado (Jest) |
| HU5-CA03 | Al presionar "Filtrar", la lista debe refrescarse mostrando únicamente los movimientos que cumplan simultáneamente con los criterios aplicados. | `toMovementFilters()` y `validateFilterInput()` (`movementFilters.ts`, E08-D3); condiciones combinadas con `AND` en `listOwn()` | U: `movementFilters.test.ts`; I: `movementManagement.test.ts`; C: `MovementHistoryScreen.test.tsx` | H04, H05 | Verificado (Jest) |
| HU5-CA04 | Si no existen registros coincidentes, la aplicación debe mostrar el contenedor de estado vacío con el título: "No se encontraron movimientos" con el subtítulo “Intenta cambiar los filtros seleccionados o realiza otra búsqueda”. | Estado vacío con filtros aplicados (E08-D5) | C: `MovementHistoryScreen.test.tsx` | H06 | Verificado (Jest) |
| HU5-CA05 | Al hacer clic en "Eliminar", se despliega un modal flotante emergente con los botones “Cancelar” y “Confirmar” y con la pregunta: “¿Está seguro de eliminar este movimiento?” con el texto aclaratorio “Esta acción es irreversible y afectará su balance.”. | `MessageDialog` con los textos literales | C: `MovementHistoryScreen.test.tsx` | H09 | Verificado (Jest) |
| HU5-CA06 | Al presionar “Confirmar” en el modal, el registro se elimina de la base de datos local y la lista se actualiza automáticamente mostrando el mensaje: "Movimiento eliminado correctamente". | `MovementManagementService.remove()`, borrado físico (E08-D1); recarga con los filtros aplicados | I: `movementManagement.test.ts`; C: `MovementHistoryScreen.test.tsx` | H10 | Verificado (Jest) |
| HU5-CA07 | Al hacer clic en "Editar", el sistema redirige al formulario (HU4) cargando los datos del movimiento seleccionado. | Botón «Editar» de la tarjeta; ruta `movementForm` en modo `edit` | C: `MovementHistoryScreen.test.tsx`; integración: `App.test.tsx` | H07 | Verificado (Jest) |

Criterios de otras historias completados o ampliados en esta etapa: HU4-CA07 y CA08 (edición),
HU4-CA10, HU4-CA12 y HU8-CA08 (tablas de HU4 y HU8); HU2-CA10 (el historial con la sesión
vencida vuelve al inicio de sesión: `App.test.tsx`, `MovementHistoryScreen.test.tsx`,
`movementManagement.test.ts`) y HU2-CA11 (otra cuenta no lista ni elimina movimientos ajenos:
`movementManagement.test.ts`).

## HU6 — criterios de aceptación (consolidación)

Transcripción literal de los criterios de HU6. Verificación: U (unitaria), C (componente), I
(integración con SQLite). Decisión E-CONS-D2 en `decisiones-consolidacion.md`. Estado al
2026-11-04: Jest en Linux, 38 suites y 605 pruebas sin fallos. La columna «Validación final»
remite a `validacion/guia-pruebas-manuales-finales.md`.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Validación final | Estado |
|---|---|---|---|---|---|
| HU6-CA01 | El cálculo del balance consolidado debe realizarse dinámicamente y en tiempo real mediante la fórmula: Balance = sum(Ingresos) - sum(Gastos) de los registros del usuario. | `MovementRepository.totalsOwn()`; `BalanceSummary` | I: `movementManagement.test.ts`; C: `MovementHistoryScreen.test.tsx` | G6-01 | Verificado (Jest) |
| HU6-CA02 | Los valores monetarios deben mostrarse con el formato de moneda estándar local con separador de miles y dos decimales (p. ej., $1.250.000,00). | `formatMoney()` (D-01) | U: `money.test.ts`; C: `MovementHistoryScreen.test.tsx` | G6-01 | Verificado (Jest) |
| HU6-CA03 | Si el resultado del balance es negativo, el valor del balance debe resaltarse visualmente en color rojo. | Estilo rojo del bloque BALANCE | C: `MovementHistoryScreen.test.tsx` | G6-02 | Verificado (Jest); el color se confirma en la validación final |
| HU6-CA04 | Los valores de Ingresos, Gastos y Balance deben recalcularse automáticamente en tiempo real ante cualquier evento de creación, edición o eliminación de un movimiento. | Totales leídos con cada carga del historial | I: `movementManagement.test.ts`; C: `MovementHistoryScreen.test.tsx`; integración: `App.test.tsx` | G6-03 | Verificado (Jest) |

## HU7 — criterios de aceptación (consolidación)

Decisiones E-CONS-D3 y E-CONS-D4. En Jest la cámara, la galería, ML Kit y el borrado nativo se
sustituyen por dobles (`ReceiptGateway`); el código nativo (`nativeReceiptGateway.ts`,
`GfpFilesModule.kt`) solo se verifica en la validación final.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Validación final | Estado |
|---|---|---|---|---|---|
| HU7-CA01 | El sistema debe permitir capturar una foto directamente desde la cámara o seleccionar una imagen existente desde la galería local del dispositivo. | `nativeReceiptGateway` (`launchCamera`, `launchImageLibrary`); `ReceiptCaptureScreen` | C: `ReceiptCaptureScreen.test.tsx` (con dobles) | G7-01, G7-02 | Implementado; flujo verificado en Jest; cámara y galería reales pendientes de validación manual |
| HU7-CA02 | La imagen debe pertenecer a un formato válido (‘.jpg’, ‘.jpeg’, ‘.png’) y no superar un tamaño máximo de 5 MB. De lo contrario, muestra el mensaje: "Formato o tamaño de imagen no soportado. Usa una imagen JPG o PNG de máximo 5 MB.". | `isSupportedReceiptImage()` | U: `receiptExtraction.test.ts`; C: `ReceiptCaptureScreen.test.tsx` | G7-03 | Verificado (Jest) |
| HU7-CA03 | Al presionar “Tomar fotografia”, la aplicación debe procesar la imagen mediante el servicio de OCR para extraer los siguientes campos clave: Monto, Fecha y Comercio/Descripción. | OCR tras la captura (ML Kit local); `extractReceiptData()` | U: `receiptExtraction.test.ts`; C: `ReceiptCaptureScreen.test.tsx` | G7-04 | Extracción verificada en Jest; OCR real pendiente de validación manual; calidad sin evaluar (P-CONS-03) |
| HU7-CA04 | Una vez procesada la imagen, el sistema debe desplegar en la misma pantalla: la vista previa (preview) de la fotografía; la barra de botones en línea (Cancelar, Reintentar, Continuar); la tarjeta de resumen con los datos extraídos, ubicada debajo de los botones en línea. | Vista de revisión de `ReceiptCaptureScreen` | C: `ReceiptCaptureScreen.test.tsx` | G7-04 | Verificado (Jest); disposición visual en la validación final |
| HU7-CA05 | Ninguna transacción leída por OCR debe guardarse de forma automática en la base de datos sin la revisión y confirmación explícita del usuario. | La pantalla no escribe; solo `MovementFormScreen` guarda | Integración: `App.test.tsx` (sin filas hasta «Guardar movimiento») | G7-06 | Verificado (Jest) |
| HU7-CA06 | Si al finalizar el procesamiento de la imagen, ningún dato pudo ser identificado, se mostrará la previsualización con un mensaje de advertencia: "No se pudo leer la información de la imagen. Por favor, intente con otra imagen o continúe para ingresar los datos manualmente". | Estado `none`; fallo del OCR tratado igual | C: `ReceiptCaptureScreen.test.tsx` | G7-05 | Verificado (Jest) |
| HU7-CA07 | Si el OCR identifica total o parcialmente la información (ej. detecta el monto pero no la fecha), cargará únicamente los datos detectados y dejará los campos restantes en blanco. | Precarga parcial (`MovementPrefill`) | C: `ReceiptCaptureScreen.test.tsx`, `MovementFormScreen.test.tsx` | G7-05 | Verificado (Jest) |
| HU7-CA08 | Si tras un fallo de lectura (ningún dato capturado) el usuario hace clic en el botón “Continuar”, el sistema redirigirá al formulario de registro (HU4) fijando el tipo en ‘Gasto’ y los demás campos totalmente limpios para su llenado manual. | Precarga vacía, tipo Gasto | C: `ReceiptCaptureScreen.test.tsx`, `MovementFormScreen.test.tsx` | G7-05 | Verificado (Jest) |
| HU7-CA09 | Al presionar "Continuar" con datos extraídos (parcial o totalmente), el sistema redirigirá al formulario de registro (HU4) fijando el tipo en Gasto y precargando los campos reconocidos para su edición final antes de guardar. | `onContinue` → `movementForm` con `prefill` | Integración: `App.test.tsx`; C: `MovementFormScreen.test.tsx` | G7-06 | Verificado (Jest) |
| HU7-CA10 | El usuario puede modificar o corregir cualquier campo precargado en la vista del formulario (HU4) antes de presionar el botón "Registrar". | Campos editables de HU4 | Integración: `App.test.tsx` (monto corregido antes de guardar) | G7-06 | Verificado (Jest) |
| HU7-CA11 | Al presionar “Reintentar”, la vista restablece el estado inicial, permitiendo capturar o subir una nueva imagen. | `retry()`; borra la imagen temporal | C: `ReceiptCaptureScreen.test.tsx` | G7-07 | Verificado (Jest) |
| HU7-CA12 | Al presionar “Cancelar”, se aborta el flujo y se regresa a la pantalla de historial (HU5). | `cancel()`; Atrás de Android | C: `ReceiptCaptureScreen.test.tsx`; integración: `App.test.tsx` | G7-07 | Verificado (Jest) |

Decisión verificada además en Jest: borrado de la imagen temporal al reintentar, cancelar,
continuar, salir y rechazar una imagen (`ReceiptCaptureScreen.test.tsx`, `App.test.tsx`). El
borrado real en la caché (`GfpFiles`) se comprueba en G7-08.

## HU9 — criterios de aceptación (consolidación)

Decisión E-CONS-D5.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Validación final | Estado |
|---|---|---|---|---|---|
| HU9-CA01 | Cálculo dinámico de KPIs: Las tarjetas informativas de la cabecera deben calcular en tiempo real: Total Ingresos = sum(Ingresos del período). Total Gastos = sum(Gastos del período). Balance = Total Ingresos - Total Gastos. | `summarize()` sobre el período | U: `financialAnalysis.test.ts`; C: `AnalysisAndRecommendations.test.tsx` | G9-01 | Verificado (Jest) |
| HU9-CA02 | Gráfico de Distribución por Categoría: Debe representar visualmente el porcentaje correspondiente a cada categoría sobre el total de gastos del período. Al interactuar con un segmento, se despliega el monto total de esa categoría. | `categoryShares()`; `DonutChart`; detalle de la categoría elegida | U: `financialAnalysis.test.ts`; C: `AnalysisAndRecommendations.test.tsx` | G9-02 | Verificado (Jest); el dibujo se confirma en la validación final |
| HU9-CA03 | Gráfico de Evolución Temporal: Debe mostrar la relación o tendencia entre Ingresos y Gastos agrupados por mes o semana según el rango seleccionado. | `evolution()`; `LineChart` | U: `financialAnalysis.test.ts`; C: `AnalysisAndRecommendations.test.tsx` | G9-03 | Verificado (Jest); el dibujo se confirma en la validación final |
| HU9-CA04 | Reactividad ante cambios: Todos los gráficos y totales de esta vista deben recalcularse automáticamente cuando el usuario cree (HU4), edite (HU4), elimine (HU5) o escanee (HU7) movimientos que correspondan al período consultado. | Lectura de la base al abrir la pantalla y al cambiar el período | Integración: `App.test.tsx` (crear y eliminar) | G9-04 | Verificado (Jest) para crear y eliminar; editar y escanear usan el mismo camino y se cubren en la validación final |
| HU9-CA05 | Formato monetario unificado: Todos los montos deben desplegarse con el estándar de moneda local y dos decimales (ej. $1,250.00). | `formatMoney()` (D-01; E11-D4) | C: `AnalysisAndRecommendations.test.tsx` | G9-01 | Verificado (Jest) con el formato D-01 |
| HU9-CA06 | Manejo de estado sin datos: Si no existen registros en el período seleccionado, la vista ocultará los gráficos y mostrará el mensaje: "No hay suficientes movimientos registrados para generar el análisis financiero de este período". | Estado vacío | C: `AnalysisAndRecommendations.test.tsx`; integración: `App.test.tsx` | G9-05 | Verificado (Jest) |

## HU10 — criterios de aceptación (consolidación)

Decisión E-CONS-D6.

| ID | Criterio (literal) | Implementación | Pruebas automatizadas | Validación final | Estado |
|---|---|---|---|---|---|
| HU10-CA01 | Ejecución local y privada: El motor de reglas debe ejecutarse de manera 100% local en el dispositivo, procesando únicamente los movimientos registrados de la base de datos SQLite del usuario autenticado. | `RecommendationService` lee `listOwn()` de la sesión; sin red | I: `recommendationService.test.ts` (aislamiento y sesión) | G10-01 | Verificado (Jest) |
| HU10-CA02a | Regla 1 (Balance negativo): Si la suma de gastos supera la suma de ingresos en el mes actual. | `evaluateRecommendations()` | U: `recommendations.test.ts` | G10-02 | Verificado (Jest) |
| HU10-CA02b | Regla 2 (Categoría crítica): Si una sola categoría representa más del 50% del total de gastos del período. | Ídem, sobre el mes actual (E12-D1) | U: `recommendations.test.ts` | G10-02 | Verificado (Jest) |
| HU10-CA02c | Regla 3 (Incremento inusual): Si los gastos de la categoría en el mes actual superan en más de un 30% a los del mes anterior. | Ídem; exige gastos de la categoría en el mes anterior | U: `recommendations.test.ts` | G10-02 | Verificado (Jest) |
| HU10-CA03 | Estructura de la recomendación: Cada tarjeta de recomendación presentada en la vista debe incluir: Título y Descripción: Explicación clara del hallazgo (ej. "Tus gastos en Alimentación subieron un 35% este mes"). Datos de origen: Referencia explícita al período, monto o categoría evaluada. Ícono de severidad: Identificador visual representativo. | Tarjeta de `RecommendationsScreen` | U: `recommendations.test.ts`; C: `AnalysisAndRecommendations.test.tsx` | G10-03 | Verificado (Jest) |
| HU10-CA04 | Estado vacío (sin recomendaciones): Si el comportamiento financiero no activa ninguna regla, la vista debe mostrar el estado vacío con el mensaje: "¡Todo en orden! No hay recomendaciones o alertas por el momento.". | Estado vacío | C: `AnalysisAndRecommendations.test.tsx`; integración: `App.test.tsx` | G10-04 | Verificado (Jest) |
| HU10-CA05 | Navegación al detalle: Al hacer clic en "Ver movimientos asociados", el sistema redirige a la pantalla de Historial (HU5) aplicando automáticamente los filtros de la categoría y período que generaron la alerta. | `historyFiltersOf()`; filtros iniciales del historial | C: `AnalysisAndRecommendations.test.tsx`, `MovementHistoryScreen.test.tsx`; integración: `App.test.tsx` | G10-05 | Verificado (Jest) |
| HU10-CA06 | Limitación de responsabilidad (Disclaimer): Toda recomendación o la vista debe incluir visiblemente la leyenda estática: "Las recomendaciones son generadas automáticamente con fines informativos basados en tus registros y no constituyen asesoramiento financiero profesional ni sobre productos de inversión o crédito.". | Pie de la vista | C: `AnalysisAndRecommendations.test.tsx` | G10-04 | Verificado (Jest) |

Decisión verificada además en Jest: descarte guardado por usuario y mes, oculto al reabrir la
pantalla y evaluado de nuevo el mes siguiente (I-27; `recommendationService.test.ts`,
`AnalysisAndRecommendations.test.tsx`, `movementMigration.test.ts`).

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
experimental `6caa2ac`, emulador API 34) en `evidencias/ETAPA-02/V4/`, copia idéntica de la
carpeta `20261023-163848-6caa2ac` del paquete local `GFP-spike02-evidencias`, no versionado (ver `evidencias/ETAPA-02/README.md`).
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
| E02-C8 | Fundamentos de identidad y seguridad implementados y probados: verificadores PBKDF2 nativos, normalización NFC, política de contraseñas, preguntas de seguridad, limitación de intentos, recuperación, clave SQLCipher, migraciones y aislamiento entre usuarios | Verificado (Jest, `javac` y compilación Debug en Windows); P-D2 verificada en emulador API 29 el 2026-10-26; `GfpCrypto` y `op-sqlite` ejecutados en emulador durante el registro de HU1; P-D3 verificada en `emulator-5554` el 2026-10-27 (paquete de evidencias `GFP-e03-evidencias`, carpeta `hu1-closure-20261027-160501/`, fuera del repositorio); P-D1 aplazada por el responsable hasta la Etapa 05 o 06 | `claude-20261025/` (vectores PBKDF2 en Java, codegen, `npm audit`); `claude-20261025-review/` (76 pruebas Jest; corrección de la serialización de la recuperación en `a592e1b`, cubierta por las pruebas de regresión «evaluates at most three concurrent wrong attempts before locking» y «shares the attempt limit between service instances of the same database» de `app/__tests__/services/authentication/accountRecovery.test.ts`); `windows-identity-20261025/` (compilación Debug y manifiestos); `docs/arquitectura-identidad.md`; actualización de la Etapa 03 en el paquete de evidencias `GFP-e03-evidencias`, carpetas `p-d2-20261026-150452/` y `hu1-20261026-143817/`, fuera del repositorio |

Rutas relativas a `evidencias/ETAPA-02/`. Estado del cierre: aprobado formalmente con reservas
por el responsable el 2026-10-25 (E02-D6, E02-APROBACION), con E02-C6 parcial y E02-C8 sin
ejecución en dispositivo. Este cierre no autoriza el inicio de la Etapa 03, que requiere la
autorización explícita del responsable y los prerrequisitos de `decisiones.md`.
