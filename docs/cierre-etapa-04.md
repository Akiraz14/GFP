# Cierre de la Etapa 04 — HU2 Iniciar sesión

**Estado: BORRADOR PARA REVISIÓN. La Etapa 04 no está cerrada.** HU2 está implementada en la
rama local `e04/hu2-login`, que no está integrada en `main` ni publicada. Las decisiones E04-D1
a E04-D8 están **pendientes de ratificación** del responsable. Con el commit `438a9f6`, los
criterios HU2-CA01 a HU2-CA08 se verificaron en Jest y en Android 10 y Android 14. El commit
`a4831e9`, posterior, corrige un defecto de HU2-CA06; su validación en Windows y en los
emuladores está pendiente (sección «Validación pendiente»).

## Objetivo y alcance

Implementar HU2 Iniciar sesión según sus 11 criterios literales (`trazabilidad.md`, sección
«HU2 — criterios de aceptación», sin cambios en su texto):

- Formulario con «Identificador» (correo, documento o celular) y «Contraseña», botones «Ingresar» y «Registrar» y enlace «Olvidé mi contraseña».
- Verificación contra la base cifrada con PBKDF2, mensaje literal de HU2-CA05 y bloqueo de 15 minutos tras 3 fallos (HU2-CA06).
- Sesión en memoria y protección de las rutas con datos financieros (HU2-CA10, HU2-CA11).
- Regresión de HU1, cuyo «Cancelar» lleva ahora a la pantalla real de inicio de sesión (HU1-CA18).

Fuera del alcance: la recuperación de contraseña (HU3, Etapa 05; el enlace abre la pantalla
provisional), las pantallas con datos financieros (HU4 a HU10) y el cierre de sesión, que
ninguna historia pide (E04-D4).

## Decisiones de la etapa

Texto completo y motivos en `decisiones-etapa-04.md`. Ninguna está ratificada. El análisis de
cada una y la recomendación técnica están en el anexo «Análisis de E04-D1 a E04-D8».

| Decisión | Asunto | Estado | Recomendación técnica |
|---|---|---|---|
| E04-D1 | Alcance y persistencia del bloqueo | Pendiente de ratificación | Aprobar con una precisión documental |
| E04-D2 | Distinción entre documento, celular y correo | Pendiente de ratificación (aplica A-ID1 a A-ID4, aprobadas) | Aprobar |
| E04-D3 | Destino tras iniciar sesión y protección de rutas | Pendiente de ratificación | Aprobar con un ajuste documental |
| E04-D4 | Duración y cierre de la sesión | Pendiente de ratificación | Aprobar con reserva |
| E04-D5 | Textos no definidos por HU2 | Pendiente de ratificación | Aprobar con cambios (completar la lista) |
| E04-D6 | Celular nacional ambiguo | Pendiente de ratificación | Aprobar |
| E04-D7 | Seguridad de la verificación | Pendiente de ratificación | Aprobar |
| E04-D8 | Evidencias de HU2 | Pendiente de ratificación (la política global sigue pendiente) | Aprobar para HU2 |

## Cambios principales

| Área | Archivos | Cambio |
|---|---|---|
| Servicio | `app/src/services/authentication/accountLogin.ts` | `AccountLoginService`: validación de entrada, búsqueda con `lookupIdentifier` (A-ID1 a A-ID4), `verifySecret` con registro señuelo, bloqueo del dispositivo en `auth_throttles`, intentos en serie y regeneración de credenciales antiguas |
| Pantalla | `app/src/presentation/login/LoginScreen.tsx`, `loginTexts.ts` | Formulario de HU2 con los componentes de HU1 |
| Navegación | `routes.ts`, `AppNavigator.tsx` | Inicio en `login`; `requiresSession` y `resolveRoute()`; destino `movementHistory` tras la autenticación |
| Servicios de la app | `appServices.ts`, `nativeAppServices.ts` | `login` y `sessions` comparten la base y el motor PBKDF2 del registro |
| Pruebas | `accountLogin.test.ts` (27), `LoginScreen.test.tsx` (13), `App.test.tsx` (12 en total) | Pruebas nuevas y tres de `App.test.tsx` actualizadas porque la app empieza ahora en el inicio de sesión |
| Scripts | `scripts/stage-04/` | Análisis sintáctico, controles estáticos, compilación y recorridos en emulador |
| Documentación | `decisiones-etapa-04.md`, `trazabilidad.md`, `arquitectura-identidad.md`, `validacion/etapa-04-pruebas-dispositivo.md` | Decisiones, criterios literales, matriz y resultados |

## Commits de la rama

Base: `b59948c` (`main`, cierre de la Etapa 03).

| Commit | Tipo | Contenido | Cambia código de la app |
|---|---|---|---|
| `00ac561` | feat(auth) | Implementación de HU2 y sus pruebas | Sí |
| `b18210d` | docs | Decisiones E04-D1 a E04-D8 y trazabilidad | No |
| `a13bddc` | chore(scripts) | Scripts de validación | No |
| `35a8150` | fix(scripts) | El script de compilación deja de esperar al demonio de Gradle | No |
| `438a9f6` | fix(scripts) | Límite de tiempo en `adb` | No |
| `b2d9a19` | docs | Resultados de Windows y de los emuladores | No |
| `a4831e9` | fix(login) | Un único intento por envío del formulario; prueba de regresión | Sí: `LoginScreen.tsx` |
| (este documento) | docs | Borrador de cierre | No |

## Relación entre commits, compilación y evidencias

`git diff --name-only 00ac561 438a9f6 -- app` no devuelve ningún archivo: entre `00ac561` y
`438a9f6` solo cambian scripts y documentación. Por eso los resultados obtenidos con
`a13bddc`, `35a8150` y `438a9f6` corresponden al mismo código de la app (el de `00ac561`).

| Comprobación | Commit | Evidencia | Resultado |
|---|---|---|---|
| Controles estáticos en Windows | `a13bddc` | `hu2-static-windows-20261028-144946` | PASS=8 FAIL=0; Jest 264/264 |
| Compilación del APK Debug | `35a8150` | `hu2-build-windows-20261028-162954` | PASS=4 FAIL=0; SHA-256 `B9544684…6F28` |
| HU2 en Android 14 (API 34) | `438a9f6` | `hu2-device-emulator-5554-20261028-181257` | PASS=26 FAIL=0 BLOCKED=0 |
| Regresión de HU1 en Android 14 | `438a9f6` | `hu2-hu1-regression-emulator-5554-20261028-182906` | PASS=30 FAIL=0 BLOCKED=0 |
| P-D2 en Android 14 | `438a9f6` | `hu2-p-d2-emulator-5554-20261028-183403` | PASS=15 FAIL=0 BLOCKED=0 |
| HU2 en Android 10 (API 29) | `438a9f6` | `hu2-device-emulator-5554-20261028-190159` | PASS=26 FAIL=0 BLOCKED=0 |
| Regresión de HU1 en Android 10 | `438a9f6` | `hu2-hu1-regression-emulator-5554-20261028-191251` | PASS=30 FAIL=0 BLOCKED=0 |
| P-D2 en Android 10 | `438a9f6` | `hu2-p-d2-emulator-5554-20261028-191606` | PASS=15 FAIL=0 BLOCKED=0 |
| Controles estáticos en Linux | `a4831e9` | Ejecución de Claude del 2026-10-28 | `typecheck`, `lint` y `format:check` correctos; Jest 265/265 (19 suites) |

Comprobaciones de coherencia en las evidencias:

- Cada `summary.txt` registra el commit, la rama y el dispositivo; `device.txt` confirma `sdk=34` y `sdk=29`.
- Todas las ejecuciones en dispositivo instalaron el mismo APK (`B9544684…6F28`) y su `metro.log` sirvió el JavaScript desde `GFP-e04-hu2`.
- `worktree-status-start.txt` y `worktree-status-end.txt` están vacíos en todas: el árbol estaba limpio y no cambió.
- El APK Debug no incluye el JavaScript: la variante `debug` no lo empaqueta (`app/android/app/build.gradle`, valor predeterminado de `debuggableVariants`) y Metro lo sirve desde el árbol probado. Por eso un APK compilado con `35a8150` es válido para probar `438a9f6` y `a4831e9`, cuyo cambio es solo de JavaScript.

Dos ejecuciones interrumpidas se conservan sin contar como resultado
(`hu2-build-windows-20261028-145142` y `hu2-device-emulator-5554-20261028-164615`; motivos en
`validacion/etapa-04-pruebas-dispositivo.md`).

## Criterios de aceptación

| Criterio | Estado con `438a9f6` | Observación |
|---|---|---|
| HU2-CA01 | Verificado (Jest; Android 10 y 14) | Correo en mayúsculas, documento, celular E.164 y celular nacional |
| HU2-CA02 | Verificado (Jest; Android 10 y 14) | Campos vacíos sin contar intento |
| HU2-CA03 | Verificado (Jest; Android 10 y 14) | Base cifrada sin la contraseña ni el correo en claro; `logcat` sin la contraseña |
| HU2-CA04 | Verificado (Jest; Android 10 y 14) | «Verificar identificación» |
| HU2-CA05 | Verificado (Jest; Android 10 y 14) | Mismo mensaje literal para contraseña incorrecta e identificador inexistente |
| HU2-CA06 | Verificado (Jest; Android 10 y 14) | El defecto de doble envío corregido en `a4831e9` requiere repetir la verificación |
| HU2-CA07 | Verificado (Jest; Android 10 y 14) | Validación contra la base cifrada |
| HU2-CA08 | Verificado (Jest; Android 10 y 14) | Abre el paso 1 del registro |
| HU2-CA09 | Parcial | Navegación verificada; el formulario de recuperación llega con HU3 (E05) |
| HU2-CA10 | Parcial | Rutas protegidas y sesión no conservada al reabrir; re-verificación en E07–E12 y E13 |
| HU2-CA11 | Parcial | Sesión de un único usuario (Jest); aislamiento de datos en E07, E08, E11, E12 y E13 |
| HU1-CA18 (regresión) | Verificado (Jest; Android 10 y 14) | «Cancelar» vuelve al inicio de sesión real con los campos vacíos |

## Auditoría técnica

| Aspecto | Resultado | Evidencia |
|---|---|---|
| Autenticación y contraseñas | `verifySecret` (PBKDF2-HMAC-SHA256, comparación en tiempo constante); la contraseña no se devuelve, guarda ni registra; regeneración con parámetros antiguos dentro de una transacción | `accountLogin.ts`; pruebas «HU2-CA03: credentials are never returned…» y «regenerates a credential with outdated parameters…»; `HU2-CA03-DB`, `HU2-CA03-LOGCAT` |
| Normalización e identificadores | Correo en minúsculas y NFC; documento sin separadores y en mayúsculas; `+` indica E.164; un número sin `+` se busca como documento y como celular nacional; solo cuentas `active`. Una misma entrada no puede ser documento de una cuenta y celular de otra, porque el registro lo impide (A-ID1) | `identifiers.ts`, `identityRepository.ts` (`lookupIdentifier`, `isAlreadyRegistered`); pruebas de HU2-CA01 y A-ID2 |
| Errores y enumeración | Mismo resultado y misma derivación PBKDF2 para identificador inexistente y contraseña incorrecta; la diferencia es una consulta adicional (`getCredential`) frente a una derivación de cientos de milisegundos. El bloqueo se comprueba antes de la búsqueda. El aviso de celular ambiguo revela que el número nacional existe en más de un país (E04-D6, A-ID2) | Prueba «HU2-CA05: a wrong password and an unknown identifier give the same result and cost» |
| Defecto corregido | Dos envíos del formulario antes de que la pantalla se actualizara (acción del teclado y botón, o doble toque rápido) llegaban ambos al servicio: una sola acción consumía dos de los tres intentos de HU2-CA06. La comprobación usaba el estado `busy`, que no cambia hasta el siguiente renderizado | Prueba nueva «HU2-CA06: two submissions before the screen updates make a single attempt»: falla sin la corrección (2 llamadas) y pasa con ella (1); commit `a4831e9` |
| Sesión y navegación | `SessionManager` en memoria; `resolveRoute()` exige que la sesión de la pantalla sea la activa; cada inicio de sesión sustituye la anterior; tras autenticarse se abre `movementHistory` | `AppNavigator.tsx`, `routes.ts`; pruebas de `App.test.tsx`; comprobaciones `…-RESTART` |
| Persistencia, cifrado y logs | El bloqueo se guarda en la base cifrada (`auth_throttles`) y sobrevive al reinicio; el código de la app no escribe en consola; la contraseña no aparece en `logcat` | Prueba «the lock survives a restart…»; `HU2-CA06-RESTART`; `HU2-CA03-LOGCAT` |
| Regresión de HU1 | Sin fallos en Jest y en ambos emuladores: registro completo, HU1-CA18, P-D3, E03-V09, E03-V06, E03-V13 y P-D2 | Evidencias de la tabla anterior |

Observaciones que no son defectos y no se han modificado:

1. Un identificador que empieza por `+` sin formato E.164 válido se trata como inexistente y cuenta como intento, mientras que un correo con formato inválido no cuenta (HU2-CA04). E04-D1 no menciona el caso del `+`.
2. `decisiones-etapa-04.md` (E04-D3) protege las rutas de HU4, HU5, HU7, HU8, HU9 y HU10; `trazabilidad.md` («Criterios parciales previstos», HU2-CA10) cita HU4, HU5, HU6, HU9 y HU10. HU6 no tiene ruta propia (es el resumen de la pantalla de HU5) y HU7 y HU8 están protegidas además. Las listas deberían alinearse.
3. `arquitectura-identidad.md` dice en su introducción que no implementa las pantallas de HU1, HU2 ni HU3; es una frase del diseño de la Etapa 02 que ya no describe el estado del proyecto.
4. Las pantallas provisionales no tienen navegación: tras iniciar sesión, o al abrir «Olvidé mi contraseña», solo se sale cerrando la app (el botón Atrás de Android la cierra). Es el comportamiento de G-07 hasta que HU3 y HU5 sustituyan esas pantallas.
5. No comparé la pantalla con el prototipo de HU2: el documento fuente lo incluye como imagen y no lo pude extraer como texto. Los nombres de los campos siguen la convención de HU1 («Ingresar primer nombre» se muestra como «Primer nombre»).

## Validación pendiente

| Paso | Por qué | Cómo |
|---|---|---|
| Controles estáticos en Windows con `a4831e9` | Cambia `LoginScreen.tsx` y el número de pruebas (265) | `Invoke-StaticChecks.ps1` |
| HU2 en Android 10 y Android 14 con `a4831e9` | Cambia la pantalla de inicio de sesión | `Invoke-Hu2DeviceTests.ps1` en cada emulador |
| Regresión de HU1 y P-D2 con `a4831e9` (recomendada) | No dependen del cambio, pero dejan las tres pruebas en el mismo commit | `Invoke-Hu1DeviceRegression.ps1` e `Invoke-HermesUnicodeCheck.ps1` |

No hace falta compilar otra vez: el cambio es solo de JavaScript (sección anterior).

## Reservas y deuda técnica

| Asunto | Estado | Condición o etapa |
|---|---|---|
| HU2-CA09, HU2-CA10, HU2-CA11 | Parciales previstos | E05; E07–E12 y E13 |
| Bloqueo y reloj manipulado | Limitación conocida | Adelantar el reloj acorta el bloqueo (`arquitectura-identidad.md`); mitigación propuesta, no implementada |
| Bloqueo del dispositivo | Riesgo aceptado en E04-D1 | Cualquiera que use el dispositivo puede bloquear el acceso 15 minutos |
| Sesión sin cierre ni expiración por inactividad | E04-D4 | Mientras el proceso sigue vivo, la sesión permanece abierta; cierre y tiempo de inactividad se deciden con la pantalla principal |
| Fin del bloqueo tras 15 minutos | Verificado solo en Jest | En dispositivo exigiría esperar 15 minutos |
| P-D1 (calibración de PBKDF2) | Diferida (cierre de la Etapa 03) | El tiempo real de inicio de sesión en un dispositivo físico mínimo no está medido |
| Política global de evidencias | Pendiente del responsable | E04-D8 se aplica solo a HU2 |
| Congelamiento del emulador del 2026-10-28 | Causa desconocida | Desde `438a9f6` los scripts terminan con `BLOCKED DEVICE-RESPONSIVE` en lugar de esperar sin límite |
| `GFP-spike02` y el archivo de bloqueo renombrado en `.git` | Fuera de la rama | Limpieza local que decide el responsable |

## Cómo repetir las pruebas

Desde el worktree `GFP-e04-hu2`, con el árbol limpio (`validacion/etapa-04-pruebas-dispositivo.md`):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-04\Invoke-StaticChecks.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-04\Invoke-AndroidBuild.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-04\Invoke-Hu2DeviceTests.ps1 -Serial emulator-5554 -AllowAppReset
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-04\Invoke-Hu1DeviceRegression.ps1 -Serial emulator-5554 -AllowAppReset
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-04\Invoke-HermesUnicodeCheck.ps1 -Serial emulator-5554
```

En Linux, desde `app/`: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check` y
`npx jest`.

## Criterio común de cierre (`plan-etapas.md`)

| # | Criterio | Estado |
|---|---|---|
| 1 | Cada criterio literal figura en `trazabilidad.md` con estado y evidencia | Cumplido: HU2-CA01 a HU2-CA11, con su texto literal sin cambios |
| 2 | Solo quedan parciales los criterios de «Criterios parciales previstos» | Cumplido: HU2-CA09, HU2-CA10 y HU2-CA11 |
| 3 | Pruebas automatizadas ejecutadas con resultados reales | Cumplido con `438a9f6` (Windows y Linux); con `a4831e9`, solo en Linux |
| 4 | Compilación e instalación en Android 10 (API 29) o superior | Cumplido: APK `B9544684…6F28` instalado en API 29 y API 34 |
| 5 | Regresión de las etapas anteriores sin fallos | Cumplido con `438a9f6`; pendiente de repetir con `a4831e9` |
| 6 | Decisiones de la etapa resueltas | **No cumplido**: E04-D1 a E04-D8 pendientes de ratificación |
| 7 | Informe de cierre y pausa obligatoria | Este borrador; pendiente de revisión y aprobación |

## Condiciones antes de considerar cerrada la Etapa 04

1. El responsable ratifica E04-D1 a E04-D8, con los cambios que decida; si alguno cambia el comportamiento, se implementa y se vuelve a validar.
2. Los pasos de «Validación pendiente» se ejecutan con el commit final de la rama, sin `FAIL` ni `BLOCKED`, y sus resultados se registran.
3. El responsable decide sobre las observaciones 1 a 5 de la auditoría.
4. Este informe se actualiza con los resultados finales y el responsable lo aprueba.
5. El responsable autoriza expresamente la integración en `main`, la publicación y, si procede, la etiqueta de la etapa.

## Anexo — Análisis de E04-D1 a E04-D8

El texto completo de cada decisión está en `decisiones-etapa-04.md`; aquí se resume sin
cambiar su contenido.

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
