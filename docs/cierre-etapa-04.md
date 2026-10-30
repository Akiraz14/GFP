# Cierre de la Etapa 04 — HU2 Iniciar sesión

**Veredicto: HU2 y la corrección de memoria de PBKDF2 están implementadas, validadas en los
emuladores Android 10 (API 29) y Android 14 (API 34) e integradas en `main`, con reservas
documentadas.** Los criterios HU2-CA01 a HU2-CA08 y la regresión de HU1 están verificados en
Jest y en emulador. HU2-CA09 a HU2-CA11 quedan parciales, como estaba previsto. Siguen abiertas
las reservas de la sección «Reservas y deuda técnica». Este cierre no autoriza el inicio de la
Etapa 05.

**Estado de aprobación (E04-APROBACION, `decisiones.md`):** el 2026-10-30 el responsable:

- ratificó E04-D1 a E04-D8 con las recomendaciones y los ajustes documentales del anexo;
- aprobó integrar `e04/hu2-login-pbkdf2` y `fix/pbkdf2-memory` en `main` con dos merges
  `--no-ff`;
- decidió conservar `scripts/stage-04` con sus defectos documentados;
- aceptó las reservas de este documento;
- limitó la publicación a `main`.

**Publicación:** pendiente. Se hará con `git push origin main`, ejecutado por el responsable.

## Objetivo y alcance

Implementar HU2 Iniciar sesión según sus 11 criterios literales (`trazabilidad.md`, sección
«HU2 — criterios de aceptación», sin cambios en su texto):

- Formulario con «Identificador» (correo, documento o celular) y «Contraseña», botones «Ingresar» y «Registrar» y enlace «Olvidé mi contraseña».
- Verificación contra la base cifrada con PBKDF2, mensaje literal de HU2-CA05 y bloqueo de 15 minutos tras 3 fallos (HU2-CA06).
- Sesión en memoria y protección de las rutas con datos financieros (HU2-CA10, HU2-CA11).
- Regresión de HU1, cuyo «Cancelar» lleva ahora a la pantalla real de inicio de sesión (HU1-CA18).

Durante la etapa se incorporó la corrección del consumo de memoria nativa de PBKDF2. Con la
implementación anterior, el registro de HU1 agotaba la memoria en Android 14 (WU del
2026-10-28; nota de implementación de E02-D1 en `decisiones.md`). La corrección no cambia el
algoritmo ni sus parámetros.

Fuera del alcance:

- la recuperación de contraseña: HU3, Etapa 05; el enlace abre la pantalla provisional;
- las pantallas con datos financieros: HU4 a HU10;
- el cierre de sesión, que ninguna historia pide (E04-D4).

## Decisiones de la etapa

Texto completo en `decisiones-etapa-04.md`. Todas fueron ratificadas por el responsable el
2026-10-30 (E04-APROBACION).

| Decisión | Asunto | Ratificación |
|---|---|---|
| E04-D1 | Alcance y persistencia del bloqueo | Aprobada con una precisión documental: un identificador que empieza por `+` sin formato E.164 cuenta como intento |
| E04-D2 | Distinción entre documento, celular y correo | Aprobada (aplica A-ID1 a A-ID4) |
| E04-D3 | Destino tras iniciar sesión y protección de rutas | Aprobada; lista de historias con datos financieros alineada en `trazabilidad.md` |
| E04-D4 | Duración y cierre de la sesión | Aprobada con reserva: cierre de sesión y tiempo de inactividad se deciden con la pantalla principal |
| E04-D5 | Textos no definidos por HU2 | Aprobada con cambios: se añaden el título «Iniciar sesión» y el botón «Aceptar», y se confirma la convención de rótulos de HU1 |
| E04-D6 | Celular nacional ambiguo | Aprobada |
| E04-D7 | Seguridad de la verificación | Aprobada |
| E04-D8 | Evidencias de HU2 | Aprobada para HU2; la política global de evidencias sigue pendiente |

## Cambios principales

| Área | Archivos | Cambio |
|---|---|---|
| Servicio | `app/src/services/authentication/accountLogin.ts` | `AccountLoginService`: validación de entrada, búsqueda con `lookupIdentifier` (A-ID1 a A-ID4), `verifySecret` con registro señuelo, bloqueo del dispositivo en `auth_throttles`, intentos en serie y regeneración de credenciales antiguas |
| Pantalla | `app/src/presentation/login/LoginScreen.tsx`, `loginTexts.ts` | Formulario de HU2 con los componentes de HU1; un único intento por envío (`a4831e9`) |
| Navegación | `routes.ts`, `AppNavigator.tsx` | Inicio en `login`; `requiresSession` y `resolveRoute()`; destino `movementHistory` tras la autenticación |
| Servicios de la app | `appServices.ts`, `nativeAppServices.ts` | `login` y `sessions` comparten la base y el motor PBKDF2 del registro |
| PBKDF2 (Android) | `Pbkdf2HmacSha256.java`, `Pbkdf2Calibration.java` | `SecretKeyFactory("PBKDF2WithHmacSHA256")` en lugar de `Mac`, decodificación UTF-8 estricta y borrado en `finally`; vectores U1 a U8 y comprobaciones de rechazo |
| Pruebas | `accountLogin.test.ts`, `LoginScreen.test.tsx`, `App.test.tsx` | 19 suites y 265 pruebas en Jest |
| Scripts | `scripts/stage-04/` | Análisis sintáctico, controles estáticos, compilación, recorridos en emulador y prueba de actualización (`Invoke-Pbkdf2UpgradeCheck.ps1`) |
| Documentación | `decisiones-etapa-04.md`, `trazabilidad.md`, `arquitectura-identidad.md`, `decisiones.md`, `validacion/etapa-04-pruebas-dispositivo.md`, `validacion/etapa-04-diagnostico-memoria-pbkdf2.md`, `validacion/correccion-pbkdf2-memoria.md` | Decisiones, criterios, resultados, diagnóstico y validación de la corrección |

## Integración en `main`

| Commit | Contenido |
|---|---|
| `96d00cb` | `merge: integrate HU2 login and the PBKDF2 memory fix (stage 04)`: merge `--no-ff` de `e04/hu2-login-pbkdf2` (`cf57a54`, 19 commits sobre `b59948c`, incluida toda la rama `e04/hu2-login`); padres `b59948c` y `cf57a54` |
| `611a7ef` | `merge: integrate the PBKDF2 memory fix validation (stage 04)`: merge `--no-ff` de `fix/pbkdf2-memory` (`2001abf`); padres `96d00cb` y `2001abf`. Su código Java es idéntico al ya integrado, así que solo añade `validacion/correccion-pbkdf2-memoria.md`. El único conflicto, las filas «Motivo» y «Validación» de la nota de E02-D1 en `decisiones.md`, se resolvió con el texto de `fix/pbkdf2-memory` |

El cambio de `Pbkdf2HmacSha256.java` aparece dos veces en el historial (`40cda90` y `6564d95`),
con el mismo contenido. El árbol `app/` de `main` tras los merges (`e1ea0c2`) es idéntico al de
`2e5fd6c`, el commit validado en los emuladores. Los cambios posteriores a `2e5fd6c` son solo de
documentación y scripts. Las ramas, los worktrees y las evidencias locales se conservan.

## Validación

Resultados en `validacion/etapa-04-pruebas-dispositivo.md`,
`validacion/etapa-04-diagnostico-memoria-pbkdf2.md` (sección 9) y
`validacion/correccion-pbkdf2-memoria.md`.

| Comprobación | Commit | Evidencia | Resultado |
|---|---|---|---|
| Controles estáticos en Windows | `2e5fd6c` | `hu2-static-windows-20261028-235504` | PASS=8 FAIL=0; Jest 265/265 |
| Compilación del APK Debug | `2e5fd6c` | `hu2-build-windows-20261028-235608` | PASS=4 FAIL=0; APK `26D3F94F…045F` |
| HU2 en Android 10 / 14 | `2e5fd6c` | `hu2-device-emulator-5554-20261029-001949` / `…-003847` | PASS=26 FAIL=0 BLOCKED=0 en ambos; sin `Scudo OOM` ni `lowmemorykiller` |
| Regresión de HU1 y P-D2 en Android 10 / 14 | `2e5fd6c` | `hu2-hu1-regression-…-20261029-002709` y `-004840`; `hu2-p-d2-…-20261029-003054` y `-010313` | PASS=30 y PASS=15 en ambos |
| Cuenta creada con el APK anterior que inicia sesión tras `adb install -r` (Android 10) | `1df52d8` | `hu2-pbkdf2-upgrade-emulator-5554-20261029-011328` | PASS=14 FAIL=0 BLOCKED=0 NOT RUN=1 |
| Corrección PBKDF2 desde `main`: controles, compilación, calibración y regresión de HU1 con registro completo y arranque en frío | `4d9b632` | `validacion/correccion-pbkdf2-memoria.md` | Jest 221/221; vectores 13/13; HU1 36/36 en Android 10 y 14; sin `Scudo OOM` ni `lowmemorykiller` |
| `main` integrada (Linux, Claude, 2026-10-30) | `611a7ef` | Salida de terminal | `typecheck`, `lint` y `format:check` correctos; Jest 19 suites y 265/265; 9 scripts de `scripts/stage-04` sin errores de sintaxis; árbol `app/` = `e1ea0c2` |

No se repitieron las pruebas en emulador sobre `main`: el código de la app es el mismo árbol ya
validado. El APK Debug no incluye el JavaScript, que Metro sirve desde el árbol probado.

## Criterios de aceptación

| Criterio | Estado | Observación |
|---|---|---|
| HU2-CA01 a HU2-CA05, HU2-CA07, HU2-CA08 | Verificado (Jest; Android 10 y 14) | Ver `trazabilidad.md` |
| HU2-CA06 | Verificado (Jest; Android 10 y 14) | Con la corrección del doble envío (`a4831e9`), verificada con `2e5fd6c` |
| HU2-CA09 | Parcial | Navegación verificada; el formulario de recuperación llega con HU3 (E05) |
| HU2-CA10 | Parcial | Rutas protegidas y sesión no conservada al reabrir; re-verificación en E07–E12 y E13 |
| HU2-CA11 | Parcial | Sesión de un único usuario (Jest); aislamiento de datos en E07, E08, E11, E12 y E13 |
| HU1-CA18 (regresión) | Verificado (Jest; Android 10 y 14) | «Cancelar» vuelve al inicio de sesión real con los campos vacíos |

## Observaciones de la auditoría técnica

| Observación | Resolución |
|---|---|
| 1. Identificador con `+` mal formado cuenta como intento | Precisión añadida a E04-D1 |
| 2. Listas de rutas protegidas distintas | Alineada en `trazabilidad.md` (HU2-CA10) según E04-D3 |
| 3. La introducción de `arquitectura-identidad.md` dice que no implementa HU1 a HU3 | Reserva aceptada, sin cambio |
| 4. Las pantallas provisionales no tienen navegación de salida | Reserva aceptada: comportamiento de G-07 hasta HU3 y HU5 |
| 5. Pantalla no comparada con el prototipo de HU2 | Convención de rótulos de HU1 confirmada en E04-D5 |

## Reservas y deuda técnica

| Asunto | Estado | Condición o etapa |
|---|---|---|
| HU2-CA09, HU2-CA10, HU2-CA11 | Parciales previstos | E05; E07–E12 y E13 |
| Sesión sin cierre ni expiración por inactividad | Reserva de E04-D4 | Se decide con la pantalla principal |
| Bloqueo y reloj manipulado | Limitación conocida | Adelantar el reloj acorta el bloqueo (`arquitectura-identidad.md`) |
| Bloqueo del dispositivo | Riesgo aceptado en E04-D1 | Cualquiera que use el dispositivo puede bloquear el acceso 15 minutos |
| Fin del bloqueo tras 15 minutos | Verificado solo en Jest | En dispositivo exigiría esperar 15 minutos |
| P-D1 (dispositivo físico) | Diferida desde la Etapa 03 | Todas las pruebas son en emuladores; la corrección de PBKDF2 depende de BouncyCastle interno, cuya versión debe comprobarse con `Pbkdf2Calibration` en cada versión soportada |
| Prueba de actualización con una cuenta real | Solo en Android 10 | En Android 14, el APK anterior no consigue registrar una cuenta |
| Cierre de la app en Android 14 sin causa conocida | Una ejecución (`fix-pbkdf2-hu1-device-emulator-5554-20261029-123420`) | Antes de cualquier derivación PBKDF2; no se repitió en las ejecuciones válidas |
| Defectos conocidos de `scripts/stage-04` | Se conservan sin cambios (decisión del responsable) | `validacion/etapa-04-pruebas-dispositivo.md`, sección «Defectos conocidos de los scripts» |
| Observaciones 3 y 4 de la auditoría | Aceptadas | Sección anterior |
| Política global de evidencias | Pendiente del responsable | E04-D8 se aplica solo a HU2 |
| Congelamiento del emulador del 2026-10-28 | Causa desconocida | Desde `438a9f6` los scripts terminan con `BLOCKED DEVICE-RESPONSIVE` |

## Criterio común de cierre (`plan-etapas.md`)

| # | Criterio | Estado |
|---|---|---|
| 1 | Cada criterio literal figura en `trazabilidad.md` con estado y evidencia | Cumplido: HU2-CA01 a HU2-CA11, con su texto literal sin cambios |
| 2 | Solo quedan parciales los criterios de «Criterios parciales previstos» | Cumplido: HU2-CA09, HU2-CA10 y HU2-CA11 |
| 3 | Pruebas automatizadas ejecutadas con resultados reales | Cumplido: Jest 265/265 en Windows (`2e5fd6c`) y en Linux sobre `main` integrada (`611a7ef`) |
| 4 | Compilación e instalación en Android 10 (API 29) o superior | Cumplido: APK `26D3F94F…045F` instalado en API 29 y API 34 |
| 5 | Regresión de las etapas anteriores sin fallos | Cumplido: regresión de HU1 y P-D2 en Android 10 y 14 con `2e5fd6c`; HU1 con registro completo y arranque en frío con `4d9b632` |
| 6 | Decisiones de la etapa resueltas | Cumplido: E04-D1 a E04-D8 ratificadas el 2026-10-30 |
| 7 | Informe de cierre y pausa obligatoria | Este documento (E04-APROBACION) |

## Evidencias

Las evidencias de la Etapa 04 no se incluyen en el repositorio (E04-D8). Forman el paquete
`GFP-e04-evidencias`, que conserva el responsable. Las carpetas citadas son carpetas de ese
paquete y los resultados comprobados constan en las tablas.

## Pendiente del responsable

1. Publicar `main` en `origin` (`git push origin main`).
2. Decidir si se crea una etiqueta de la etapa.
3. Decidir si se retiran las ramas `e04/hu2-login`, `e04/hu2-login-pbkdf2` y `fix/pbkdf2-memory` y sus worktrees, que se conservan.
4. Definir la política global de evidencias.
5. Autorizar la Etapa 05 (HU3 Recuperar contraseña).

## Anexo — Análisis de E04-D1 a E04-D8

Análisis previo a la ratificación del 2026-10-30, conservado como base de las recomendaciones
aprobadas. El texto completo de cada decisión está en `decisiones-etapa-04.md`; aquí se resume
sin cambiar su contenido.

### E04-D1 — Alcance y persistencia del bloqueo

| Aspecto | Análisis |
|---|---|
| Decisión | Un único contador del dispositivo para todos los intentos fallidos (`LOGIN_THROTTLE_POLICY`: 3 fallos, 15 minutos, sin esperas crecientes; `auth_throttles`, `scope = 'login'`, `subject = 'device'`), guardado en la base cifrada; un éxito reinicia el contador; durante el bloqueo no se verifica la contraseña; no cuentan los campos vacíos, el correo con formato inválido ni el celular ambiguo |
| Problema | HU2-CA06 no dice si el bloqueo es por cuenta o general, ni si sobrevive al cierre de la app |
| Impacto | Implementación: reutiliza `attemptThrottle` y la tabla de la recuperación. Seguridad: el contador no revela qué cuentas existen y el bloqueo no se evita cerrando la app. Experiencia: tres errores con cualquier identificador bloquean a todos los usuarios del dispositivo. Mantenimiento: bajo |
| Evidencia | `accountLogin.ts` (`LOGIN_THROTTLE_SUBJECT`, comprobación del bloqueo antes de la búsqueda); pruebas de HU2-CA06, «the lock survives a restart…», «a clock moved backwards keeps the lock», «evaluates at most three concurrent wrong attempts…»; `HU2-CA06-THIRD`, `HU2-CA06`, `HU2-CA06-RESTART` en ambos emuladores |
| Riesgos | Bloqueo deliberado por quien tiene el dispositivo (aceptado); el reloj adelantado acorta el bloqueo (limitación conocida); el identificador con `+` mal formado cuenta como intento y no está mencionado; el doble envío contaba dos intentos (corregido en `a4831e9`, sin cambiar la decisión) |
| Recomendación | **Aprobar con una precisión documental**: añadir que un identificador que empieza por `+` sin formato E.164 cuenta como intento fallido |
| Si se aprueba | Se mantiene el comportamiento verificado |
| Si se rechaza (contador por cuenta) | Cambiar el sujeto del contador a la cuenta y añadir uno para los inexistentes, reescribir las pruebas de HU2-CA06 y repetir la validación en dispositivo; el contador permitiría distinguir cuentas existentes |

### E04-D2 — Distinción entre documento, celular y correo

| Aspecto | Análisis |
|---|---|
| Decisión | Resuelta por A-ID1 a A-ID4: `classifyLoginIdentifier()` y `lookupIdentifier()` de HU1 clasifican la entrada; HU2 los reutiliza; solo cuentas activas |
| Problema | Un mismo texto puede ser documento o celular y cada identificador debe señalar una sola cuenta |
| Impacto | Implementación: sin código nuevo de búsqueda. Seguridad: búsqueda inequívoca. Experiencia: un solo campo. Mantenimiento: una regla para registro, inicio de sesión y recuperación |
| Evidencia | `identifiers.ts`, `identityRepository.ts`; pruebas de HU2-CA01 (correo, documento normalizado, E.164 con y sin separadores, celular nacional) y «a disabled account cannot log in…»; `HU2-CA01-EMAIL`, `-DOCUMENT`, `-PHONE`, `HU2-CA07` en ambos emuladores |
| Riesgos | Ninguno nuevo; depende de A-ID1 a A-ID4, ya aprobadas en la Etapa 03 |
| Recomendación | **Aprobar** |
| Si se aprueba | Se confirma la aplicación de decisiones aprobadas |
| Si se rechaza | Habría que reabrir A-ID1 a A-ID4, que afectan al registro de HU1 ya integrado |

### E04-D3 — Destino tras iniciar sesión y protección de rutas

| Aspecto | Análisis |
|---|---|
| Decisión | Tras autenticarse se abre `movementHistory` (HU5, «Historial»), hoy provisional; las rutas de HU4, HU5, HU7, HU8, HU9 y HU10 exigen la sesión activa mediante `requiresSession` y `resolveRoute()` |
| Problema | HU2 no fija el destino; HU2-CA10 exige proteger la información financiera |
| Impacto | Implementación: una constante (`AUTHENTICATED_HOME_ROUTE`). Seguridad: toda ruta con datos queda protegida en un solo lugar. Experiencia: hoy el destino es una pantalla provisional sin salida. Mantenimiento: cada historia futura declara si exige sesión |
| Evidencia | `routes.ts`, `AppNavigator.tsx`; pruebas «HU2-CA07, CA10: a valid login opens the authenticated home route» y «HU2-CA10: routes with financial data need the active session»; destino provisional de HU5 en ambos emuladores. En el documento fuente, HU4 («Cancelar» redirige «a la vista principal o al historial») y HU5 (título «Historial» con el resumen de HU6) son coherentes con este destino |
| Riesgos | La lista de rutas no coincide con la de `trazabilidad.md` (observación 2); sin navegación desde las pantallas provisionales (observación 4) |
| Recomendación | **Aprobar con un ajuste documental**: alinear la lista de historias con datos financieros en `trazabilidad.md` |
| Si se aprueba | Se mantiene el comportamiento verificado |
| Si se rechaza | Cambiar `AUTHENTICATED_HOME_ROUTE` y una prueba de `App.test.tsx`, y repetir `HU2-CA01-*` y `HU2-CA07` en dispositivo |

### E04-D4 — Duración y cierre de la sesión

| Aspecto | Análisis |
|---|---|
| Decisión | Sesión solo en memoria mientras vive el proceso; no se guarda ni se restaura; cada inicio de sesión sustituye al anterior; no hay botón «Cerrar sesión» |
| Problema | `plan-etapas.md` registra la duración y el cierre como no definidos |
| Impacto | Implementación: `SessionManager` existente. Seguridad: no quedan tokens en el dispositivo. Experiencia: hay que iniciar sesión cada vez que se abre la app. Mantenimiento: el cierre se añade cuando exista la pantalla principal |
| Evidencia | `sessionManager.ts`, `nativeAppServices.ts`; prueba «HU2-CA11: each login opens a session only for its own account…»; `HU2-CA01-*-RESTART` y `HU2-CA07-RESTART` en ambos emuladores |
| Riesgos | Mientras la app sigue en memoria (también en segundo plano), la sesión no expira: otra persona con el dispositivo desbloqueado podría usarla. HU2 no pide expiración |
| Recomendación | **Aprobar con reserva**: registrar el cierre de sesión y el tiempo de inactividad como decisión pendiente para la etapa de la pantalla principal |
| Si se aprueba | Se mantiene el comportamiento verificado y queda abierta la reserva |
| Si se rechaza (sesión persistente) | Diseñar el almacenamiento de un token con caducidad en el Keystore, migración, pruebas y validación en dispositivo; aumenta la superficie de ataque |

### E04-D5 — Textos no definidos por HU2

| Aspecto | Análisis |
|---|---|
| Decisión | Textos literales de HU2 y de A-ID2, y propuestas para lo que HU2 no define (etiqueta y ayuda del identificador, campos vacíos, tercer fallo, intento durante el bloqueo, error de la base, verificación en curso) |
| Problema | HU2 solo fija cinco textos |
| Impacto | Experiencia: mensajes coherentes con HU1. Seguridad: el error de la base no muestra detalles internos. Mantenimiento: textos centralizados en `loginTexts.ts` |
| Evidencia | `loginTexts.ts`; pruebas de `LoginScreen.test.tsx`; los scripts de dispositivo buscan los textos literales |
| Riesgos | La tabla no recoge dos textos visibles: el título «Iniciar sesión» (nombre de la historia) y el botón «Aceptar» del diálogo. En el tercer fallo se añade un punto y un salto de línea entre el mensaje literal y el aviso de bloqueo. Los campos se rotulan «Identificador» y «Contraseña», aunque el documento fuente dice «Ingresar identificador» e «Ingresar contraseña», según la convención de HU1 (observación 5) |
| Recomendación | **Aprobar con cambios**: añadir el título y «Aceptar» a la tabla y confirmar la convención de los rótulos |
| Si se aprueba | Se mantienen los textos verificados |
| Si se rechaza o se cambia algún texto | Cambiar `loginTexts.ts`, las pruebas y los textos que buscan los scripts, y repetir la validación en dispositivo |

### E04-D6 — Celular nacional ambiguo

| Aspecto | Análisis |
|---|---|
| Decisión | Si un número sin código de país coincide con más de una cuenta, se pide el código de país junto al campo, sin verificar la contraseña ni contar un intento |
| Problema | A-ID2 permite el mismo número nacional en países distintos |
| Impacto | Experiencia: el usuario sabe cómo corregir la entrada. Seguridad: revela que el número existe en más de un país. Mantenimiento: reutiliza el texto aprobado de A-ID2 |
| Evidencia | `accountLogin.ts` (`phone_country_code_required`); pruebas «A-ID2: an ambiguous national number asks for the country code without counting an attempt» y su equivalente en `LoginScreen.test.tsx`. No se probó en dispositivo, porque exigiría registrar dos cuentas con el mismo número |
| Riesgos | Como no cuenta intentos, la consulta se puede repetir sin bloqueo; solo revela la ambigüedad, no una cuenta concreta |
| Recomendación | **Aprobar** |
| Si se aprueba | Se mantiene el comportamiento |
| Si se rechaza (contar el intento) | Un usuario legítimo que olvide el código de país consumiría intentos; cambio en `accountLogin.ts` y en dos pruebas |

### E04-D7 — Seguridad de la verificación

| Aspecto | Análisis |
|---|---|
| Decisión | `verifySecret()` con PBKDF2; registro señuelo para identificadores inexistentes; intentos en serie por base de datos; regeneración tras un éxito con parámetros antiguos; fallo genérico ante un error de la base; contraseña oculta, borrada tras cada intento y sin autocorrección |
| Problema | HU2-CA03 y HU2-CA05 exigen no exponer la contraseña y no distinguir el motivo del fallo; la arquitectura exige serializar los intentos |
| Impacto | Seguridad: alto beneficio. Experiencia: cada intento tarda lo que una derivación PBKDF2. Mantenimiento: misma estructura que la recuperación |
| Evidencia | `accountLogin.ts`, `LoginScreen.tsx`; pruebas de HU2-CA03, HU2-CA05, concurrencia, regeneración y error de la base; `HU2-CA03-DB` y `HU2-CA03-LOGCAT` en ambos emuladores |
| Riesgos | Diferencia de tiempo de una consulta entre cuenta existente e inexistente (despreciable frente a PBKDF2); la contraseña permanece en la memoria de JavaScript hasta que se borra (limitación de React Native); duración en dispositivo físico no medida (P-D1) |
| Recomendación | **Aprobar** |
| Si se aprueba | Se mantiene el comportamiento |
| Si se rechaza alguna medida | Según la medida: quitar el señuelo permitiría distinguir cuentas por el tiempo; quitar la serialización permitiría superar el límite de HU2-CA06 con intentos simultáneos |

### E04-D8 — Evidencias de HU2

| Aspecto | Análisis |
|---|---|
| Decisión | Práctica solo para HU2: scripts versionados; resultados resumidos en la documentación; registros, capturas y volcados fuera de Git, en `GFP-e04-evidencias`; una carpeta por ejecución sin sobrescribir; cuentas sintéticas y contraseña fuera de los resúmenes |
| Problema | La política global de evidencias sigue pendiente (`cierre-etapa-03.md`) |
| Impacto | Trazabilidad: cada resultado indica commit, dispositivo y estado del árbol. Seguridad: sin datos personales ni secretos en el repositorio. Mantenimiento: el paquete de evidencias depende de que el responsable lo conserve |
| Evidencia | Las 10 carpetas de `GFP-e04-evidencias`; `summary.txt` con identificadores enmascarados (`HU#.######@EXAMPLE.COM`); `worktree-status-*.txt` |
| Riesgos | Las evidencias no están en Git; si se pierde la carpeta, solo queda el resumen documental |
| Recomendación | **Aprobar para HU2**, sin prejuzgar la política global |
| Si se aprueba | Se conserva la práctica actual |
| Si se rechaza | Definir otra práctica y, si exige versionar evidencias, revisar antes qué datos contienen |
