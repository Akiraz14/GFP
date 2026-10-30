# Decisiones de la Etapa 04 (HU2 Iniciar sesión)

Fuentes: HU2 del documento de historias de usuario (criterios literales en
`trazabilidad.md`, sección «HU2 — criterios de aceptación»), las decisiones A-ID1 a A-ID4
(`decisiones-etapa-03.md`), el diseño de identidad (`arquitectura-identidad.md`) y la WU del
2026-10-28, que autoriza a Claude a implementar HU2 y a adoptar, justificándolas, las
decisiones técnicas no definidas.

**Estado de todas las decisiones de este documento:** adoptadas para la implementación
técnica por la autorización de la WU del 2026-10-28 y **ratificadas por el responsable el
2026-10-30** (E04-APROBACION, `decisiones.md`), con las precisiones de E04-D1 y E04-D5, la
alineación de E04-D3 en `trazabilidad.md` y la reserva de E04-D4. `plan-etapas.md` prevé que
E04-D1 a E04-D4 se resuelvan antes de iniciar la etapa; la WU autorizó adoptarlas durante la
implementación. Ninguna cambia un criterio literal ni una decisión aprobada.

## E04-D1 — Alcance y persistencia del bloqueo

- **Requisito:** HU2: «Si el identificador y/o contraseña son incorrectos en 3 oportunidades, debe bloquearse el acceso a la plataforma por 15 minutos».
- **Alternativas:** (a) un contador por cuenta y otro para los identificadores inexistentes, como la recuperación; (b) un único contador del dispositivo para todos los intentos fallidos.
- **Decisión:** (b). El criterio bloquea «el acceso a la plataforma» y cuenta los fallos del identificador «y/o» de la contraseña, sin distinguir cuentas. Con (b) un identificador inexistente y una contraseña incorrecta cuentan igual, lo que no revela qué cuentas existen. Con (a), quien tiene el dispositivo podría probar 3 contraseñas por cada cuenta y distinguir cuentas existentes por el contador que avanza.
- **Implementación:** política `LOGIN_THROTTLE_POLICY` (3 fallos, 15 minutos, sin esperas crecientes) en `auth_throttles` con `scope = 'login'` y `subject = 'device'`. El bloqueo se guarda en la base cifrada, así que sobrevive al cierre de la app; un inicio de sesión correcto reinicia el contador; al vencer el bloqueo hay 3 intentos nuevos; si el reloj retrocede, el bloqueo vigente se mantiene (comportamiento existente de `attemptThrottle`). Durante el bloqueo no se verifica la contraseña, ni siquiera la correcta.
- **No cuentan como intento:** campos vacíos (HU2-CA02), correo con formato inválido (HU2-CA04) y celular nacional ambiguo (E04-D6), porque no se llega a comparar ninguna credencial.
- **Sí cuenta como intento (precisión ratificada el 2026-10-30):** un identificador que empieza por `+` sin formato E.164 válido se trata como inexistente y cuenta como intento fallido.
- **Riesgo aceptado:** cualquiera que use el dispositivo puede bloquear el acceso durante 15 minutos; en una app local sin servidor, esa persona ya tiene el dispositivo. La manipulación del reloj sigue siendo una limitación conocida (`arquitectura-identidad.md`, sección 6).

## E04-D2 — Distinción entre documento, celular y correo

Resuelta por A-ID1 a A-ID4: `classifyLoginIdentifier()` e `IdentityRepository.lookupIdentifier()`
(HU1) clasifican la entrada (contiene `@`: correo; empieza por `+`: celular E.164; en otro
caso: documento normalizado o celular nacional). HU2 reutiliza esa búsqueda sin duplicarla.
Solo se consideran cuentas con `status = 'active'`.

## E04-D3 — Destino tras iniciar sesión y protección de rutas

- **Requisito:** HU2 no fija el destino. HU2-CA10 exige que la información financiera no esté disponible sin una autenticación válida.
- **Decisión:** tras una autenticación válida se abre la ruta `movementHistory` (HU5, «Historial»), que hoy es la pantalla provisional de G-07. Las rutas con datos financieros (HU4, HU5, HU7, HU8, HU9 y HU10) declaran `requiresSession` y `resolveRoute()` solo las muestra con la sesión activa del `SessionManager`; sin ella se muestra el inicio de sesión.
- **Motivo:** el historial es la vista que reúne los movimientos y el balance (HU5, HU6); se cambia en una línea (`AUTHENTICATED_HOME_ROUTE`) si el responsable decide otro destino.
- **Ratificación (2026-10-30):** la lista de historias con datos financieros de `trazabilidad.md` (HU2-CA10) se alinea con esta decisión: HU4, HU5 (incluido el resumen de HU6, que no tiene ruta propia), HU7, HU8, HU9 y HU10.

## E04-D4 — Duración y cierre de la sesión

- **Requisito:** HU2 no define la duración ni el cierre de la sesión (`plan-etapas.md`: «no definido»).
- **Decisión:** la sesión vive solo en memoria (`SessionManager`) mientras dura el proceso de la app; no se guarda ni se restaura al reabrirla, y cada inicio de sesión sustituye la sesión anterior. No se implementa un botón «Cerrar sesión» porque ninguna historia lo pide; su ubicación se decide con la pantalla principal.
- **Motivo:** es la opción más restrictiva: no deja tokens ni sesiones persistidas en el dispositivo.
- **Reserva (ratificación del 2026-10-30):** mientras el proceso sigue vivo, la sesión no expira. El cierre de sesión y el tiempo de inactividad quedan como decisión pendiente para la etapa de la pantalla principal.

## E04-D5 — Textos no definidos por HU2

Se usan literalmente «Ingresar», «Registrar», «Olvidé mi contraseña», «Verificar
identificación» y «El campo identificación o contraseña son incorrectos» (HU2), e «Ingresa el
número celular con el código de país» (A-ID2, aprobado el 2026-10-25). Propuestas para lo que
HU2 no define:

| Situación | Texto propuesto |
|---|---|
| Etiqueta y ayuda del identificador | «Identificador»; «Correo electrónico, número de documento o número de celular» |
| Campos obligatorios vacíos (HU2-CA02) | «Ingresa tu identificador.» y «Ingresa tu contraseña.» junto al campo |
| Tercer fallo (HU2-CA06) | El mensaje literal de HU2-CA05 seguido de «Superaste los intentos permitidos. El acceso queda bloqueado durante 15 minutos.» |
| Intento durante el bloqueo | «Superaste los intentos permitidos. El acceso queda bloqueado durante N minutos.» (minutos restantes, redondeados hacia arriba) |
| Error de la base al iniciar sesión | «No fue posible iniciar sesión. Intenta de nuevo», sin detalles internos |
| Verificación en curso | «Ingresando…», con los controles deshabilitados |
| Título de la pantalla | «Iniciar sesión» (nombre de la historia) |
| Botón del diálogo de alerta | «Aceptar» |

Ratificación (2026-10-30): se añaden el título y el botón «Aceptar». En el tercer fallo, el
mensaje literal y el aviso de bloqueo se separan con un punto y un salto de línea. Los campos
se rotulan «Identificador» y «Contraseña», según la convención de HU1 («Ingresar primer
nombre» se muestra como «Primer nombre»), aunque el documento fuente dice «Ingresar
identificador» e «Ingresar contraseña».

## E04-D6 — Celular nacional ambiguo

Si un número sin código de país coincide con más de una cuenta (A-ID2), se muestra junto al
campo «Ingresa el número celular con el código de país», no se verifica la contraseña y no se
cuenta un intento. Riesgo aceptado: revela que ese número nacional está registrado en más de
un país, el mismo efecto que ya tenía la decisión aprobada A-ID2.

## E04-D7 — Seguridad de la verificación

- La contraseña se verifica con `verifySecret()` (PBKDF2-HMAC-SHA256, comparación en tiempo constante, E02-D1); nunca se guarda, devuelve ni registra.
- Un identificador inexistente se verifica contra un registro señuelo con los mismos parámetros, así que cuesta la misma derivación que una contraseña incorrecta y devuelve el mismo resultado (HU2-CA05).
- Los intentos se ejecutan en serie por base de datos (`serializedByDatabase`), igual que la recuperación (`a592e1b`), para que intentos simultáneos no superen el límite (`arquitectura-identidad.md`: «El inicio de sesión (HU2) debe aplicar la misma regla»).
- Tras un inicio de sesión correcto, una credencial con parámetros antiguos se regenera (`needsRehash()`), como prevé `arquitectura-identidad.md`.
- Un error de la base devuelve un fallo genérico y no abre sesión.
- La pantalla oculta la contraseña (`secureTextEntry`), la borra tras cada intento fallido y tras el éxito, y no usa autocorrección.

## E04-D8 — Evidencias de HU2 (práctica de esta etapa)

Propuesta aplicada solo a HU2, coherente con lo aprendido en E03. **La política global de
evidencias sigue pendiente de decisión del responsable** (`cierre-etapa-03.md`).

| Aspecto | Práctica de HU2 |
|---|---|
| Qué produce evidencia | Controles en Windows (`npm ci`, `typecheck`, `lint`, `format:check`, Jest y `assembleDebug`), recorrido de HU2 en cada emulador del estándar del proyecto (Android 10, API 29, y Android 14, API 34) y regresión de HU1 en dispositivo |
| Qué se versiona | Los scripts (`scripts/stage-04/`, sin datos personales ni secretos) y los resultados comprobados, resumidos en `trazabilidad.md` y `validacion/etapa-04-pruebas-dispositivo.md` |
| Qué queda fuera de Git | Registros, capturas, volcados de la interfaz, `logcat`, hashes de las bases de prueba y el APK: forman el paquete de evidencias `GFP-e04-evidencias`, que conserva el responsable |
| Nombres | Una carpeta por ejecución: `hu2-<grupo>-<dispositivo o windows>-<aaaaMMdd-HHmmss>`, con `summary.txt` que registra el commit probado, el estado del árbol y el dispositivo |
| Relación con los criterios | Cada comprobación lleva el identificador del criterio (`HU2-CA05`, `HU1-CA18`, …) y un resultado `PASS`, `FAIL`, `BLOCKED` o `NOT RUN`; la matriz de `trazabilidad.md` cita esos identificadores |
| Higiene | Cuentas sintéticas (`@example.com`, números generados); la contraseña de prueba no se escribe en los resúmenes; se comprueba que no aparezca en `logcat` ni en claro en la base; las copias de la base se analizan y se eliminan; no se guardan APK ni copias de bases; una ejecución nueva nunca sobrescribe otra |

## Fork de referencia (`daniela888-li/GFP`)

Estado comprobado el 2026-10-28: una sola rama (`main`, `b669d0f`), un commit sobre
`b5b4140`, anterior a HU1. No se integra ni se copia; se consultó como referencia.

| Origen (`b669d0f`) | Qué intenta resolver | Compatibilidad y riesgos | Decisión |
|---|---|---|---|
| `app/src/services/login/loginService.ts` | Autenticación y bloqueo | Busca con el esquema anterior a HU1, sin serializar los intentos ni proteger los identificadores inexistentes; mensajes distintos de los literales | Reimplementar (`accountLogin.ts`), conservando la idea de usar `SessionManager` y `LOGIN_THROTTLE_POLICY` |
| `app/src/presentation/screens/login/LoginScreen.tsx` | Pantalla de HU2 | Etiquetas no literales («Iniciar sesion», «Crear cuenta», «Recuperar contrasena»), sin tildes ni gestión del teclado de HU1 | Reimplementar con los componentes de HU1 |
| `app/App.tsx`, `navigation/Navigator.tsx`, `navigation/routes.ts`, `AppServicesContext.tsx` | Arranque y navegación | Sustituyen el arranque de HU1, muestran errores internos (contradice A-W9) y anulan el registro | Descartar; se extiende la navegación de HU1 |
| `components/Button.tsx`, `FormField.tsx`, `Dialog.tsx`, `presentation/theme.ts` | Componentes de interfaz | Duplican `ActionButton`, `TextField`, `MessageDialog` y el tema de HU1 | Descartar |
| `screens/HomeScreen.tsx`, `PendingScreen.tsx`, `StatusScreen.tsx` | Destino y pantallas auxiliares | Fuera del alcance de HU2 o sustituidas por G-07 | Descartar; el destino se decide en E04-D3 |
| `__tests__/services/login/loginService.test.ts` | Escenarios de prueba | Útiles como lista de escenarios (correcto, contraseña incorrecta, bloqueo) | Adaptar como ideas; las pruebas se reescriben sobre el esquema de HU1 |
| `docs/` y `evidencias/ETAPA-04/` | Documentación y evidencia | Evidencia de otra implementación (API 37) | Descartar como evidencia de aceptación |
