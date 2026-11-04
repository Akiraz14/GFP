# Decisiones de la Etapa 05 (HU3 Recuperar contraseña)

Fuentes:

- HU3 del documento de historias de usuario (criterios literales en `trazabilidad.md`, sección
  «HU3 — criterios de aceptación»);
- el diseño de la recuperación aprobado en la Etapa 02 (E02-ID; `arquitectura-identidad.md`,
  sección 4);
- E05-D1 a E05-D3, adelantadas por la WU del 2026-10-25 (`decisiones-etapa-03.md`);
- A-ID1 a A-ID4 y las decisiones de HU2 (`decisiones-etapa-04.md`);
- la WU del 2026-10-30, que autoriza implementar HU3 y adoptar, justificándolas, las decisiones
  técnicas que no estén definidas.

**Estado de todas las decisiones de este documento: RATIFICADAS por el responsable el 2026-11-04**
(E05-APROBACION, `decisiones.md`), sin cambios en su contenido. E05-D5 se ratifica con los textos
propuestos y E05-D8 aceptando expresamente el riesgo H-1. Ninguna cambia un criterio literal ni una
decisión aprobada. Resumen y riesgos al final de este documento. El prototipo de HU3 no se pudo consultar: el documento fuente lo incluye como imagen y
solo se dispuso de su texto (igual que en la observación 5 de la Etapa 04).

## E05-D1 — Límite de intentos de respuesta

Se mantiene lo adelantado en la WU del 2026-10-25 y ya implementado en la Etapa 02
(`RECOVERY_THROTTLE_POLICY`):

- tres respuestas incorrectas bloquean la recuperación de esa cuenta durante 15 minutos;
- cada bloqueo siguiente dobla la espera (30, 60, 120… minutos) hasta 24 horas;
- tres identificadores inexistentes bloquean el inicio de la recuperación en el dispositivo con la misma regla.

Un identificador vacío o con formato de correo inválido, y un celular nacional ambiguo, no cuentan
como intento, igual que en HU2 (E04-D1, E04-D6). Durante el bloqueo no se verifican respuestas.

El tercer fallo responde «Datos ingresados incorrectos», como los anteriores. El bloqueo se
anuncia en el intento siguiente, ya sea al pulsar «Actualizar contraseña» o «Comenzar
recuperación». A diferencia de HU2, que lo anuncia en el mismo tercer fallo (E04-D5), el servicio
de la Etapa 02 no devuelve el estado del bloqueo junto con el fallo, y esta etapa no lo modifica.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: límite de intentos adelantado por la WU del 2026-10-25 y ya presente en el servicio de la Etapa 02; se acepta que el bloqueo se anuncie en el intento siguiente, a diferencia de HU2 (E04-D5). Respaldo: Jest y R14 en Android 10 y 14.

## E05-D2 — Preguntas elegidas al azar

Se mantiene lo adelantado: las 2 preguntas se eligen al azar (`RNGetRandomValues`) entre las 5
configuradas y se guardan en un reto de 15 minutos (`recovery_challenges`). Repetir «Comenzar
recuperación» mientras el reto sigue vigente devuelve las mismas preguntas, para que no se puedan
buscar preguntas más fáciles.

**Precisión de esta etapa:** si el reto vence antes de pulsar «Actualizar contraseña», el servicio
devuelve `challenge_expired`, sin contar un intento, y la pantalla pide comenzar de nuevo. Antes
devolvía el mismo resultado que unas respuestas incorrectas, de modo que el usuario no podía saber
por qué fallaba.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: impide buscar preguntas más fáciles y distingue el reto vencido de unas respuestas incorrectas. Respaldo: Jest, R07 y R15 en Android 10 y 14.

## E05-D3 — Normalización de respuestas

Igual que E03-D9, con las respuestas escritas de E03-D11 (que sustituye a las respuestas
seleccionables de C-03): se aplica la normalización `free-text-folded`, la misma del registro.
Consiste en NFC, eliminación de tildes y diacríticos, minúsculas, espacios internos reducidos a
uno y recorte de los externos (`normalizeFreeTextAnswer()`). El verificador de cada respuesta
guarda `normalization = 'free-text-folded'`, y la recuperación usa el valor guardado.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: coherencia con el registro de HU1 (E03-D9, E03-D11); se mantiene el riesgo residual de E03-D11. Respaldo: Jest y P-D2 en Android 10 y 14.

## E05-D4 — Flujo de la pantalla

- **Requisito:** HU3-CA01 pide primero el identificador; HU3-CA04, que tras confirmarlo se
  pidan las respuestas y la nueva contraseña. HU3 define dos botones.
- **Decisión:** una sola pantalla en dos fases.
  - En la primera solo están «Identificador» y «Comenzar recuperación».
  - Con un identificador válido aparecen las 2 preguntas, como etiqueta de su campo de
    respuesta, junto con «Nueva contraseña», «Confirmar nueva contraseña» y «Actualizar
    contraseña».
  - El identificador queda fijo durante la segunda fase.
- **Ayuda de la contraseña:** se reutilizan la política y el componente de requisitos de HU1
  (`PasswordRequirements`).
- **Al terminar:** una recuperación correcta muestra un aviso y, al aceptarlo, abre el inicio de
  sesión (HU3-CA13). No inicia sesión.
- **Motivo:** cumple el orden de HU3-CA01 y HU3-CA04 con los dos botones de HU3, sin añadir
  pantallas.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: cumple el orden de HU3-CA01 y HU3-CA04 con los dos botones de HU3, sin pantallas adicionales. Respaldo: Jest, R01 y R06 en Android 10 y 14. Sin comparación con el prototipo (reserva documental aceptada).

## E05-D5 — Mensajes

Literales de HU3: «Comenzar recuperación», «Actualizar contraseña», «Identificador incorrecto» y
«Datos ingresados incorrectos». Se reutilizan «Identificador» y su ayuda (E04-D5), «Ingresa tu
identificador.» (E04-D5) y el texto aprobado de A-ID2. Propuestas para lo que HU3 no define:

| Situación | Texto propuesto |
|---|---|
| Identificador vacío | «Ingresa tu identificador.» junto al campo |
| Identificador inexistente o correo con formato inválido (HU3-CA03) | «Identificador incorrecto» junto al campo |
| Celular nacional ambiguo (A-ID2) | «Ingresa el número celular con el código de país» junto al campo |
| Título de la segunda fase | «Responde las preguntas de seguridad» |
| Respuesta vacía | «Ingresa la respuesta.» junto al campo, y el aviso «Datos ingresados incorrectos» |
| Contraseña que no cumple la política | Los requisitos pendientes de HU1, «Datos ingresados incorrectos» junto al campo y en un aviso |
| Confirmación distinta | «La confirmación no coincide con la nueva contraseña.» junto al campo, y el aviso «Datos ingresados incorrectos» |
| Respuestas incorrectas | Aviso «Datos ingresados incorrectos», sin indicar cuál falló |
| Bloqueo | «Superaste los intentos permitidos. La recuperación queda bloqueada durante N minutos.» |
| Reto vencido | «El tiempo para responder las preguntas terminó. Comienza la recuperación de nuevo.» |
| Recuperación correcta | «La contraseña fue actualizada. Inicia sesión con la nueva contraseña.» |
| Error de la base | «No fue posible recuperar la contraseña. Intenta de nuevo» |
| Verificación en curso | «Verificando…», con los controles deshabilitados |

Las respuestas y las contraseñas se borran de la pantalla tras cada respuesta del servicio que no sea
un éxito (respuestas incorrectas, bloqueo, reto vencido o error) y tras el éxito, que borra también
el identificador. Si la validación local de la pantalla falla (respuesta vacía, contraseña débil o
confirmación distinta), no se llama al servicio, no se cuenta un intento y los campos se conservan
para corregirlos.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: HU3 define solo cuatro textos; se aprueban los textos propuestos de la tabla. Respaldo: Jest y R02 a R15 en Android 10 y 14; el error de la base solo en Jest.

## E05-D6 — Volver al inicio de sesión

HU3 no define un botón para salir. El botón Atrás de Android vuelve al inicio de sesión en lugar de
cerrar la app, en cualquiera de las dos fases. Mientras hay una verificación en curso, la pulsación
se ignora. Así no se añade un control que la historia no pide y no se deja al usuario sin
salida. Se cambia en una línea si el prototipo muestra otra cosa.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: HU3 no define cómo salir de la pantalla; se evita añadir un control que la historia no pide. Respaldo: Jest y R07 en Android 10 y 14.

## E05-D7 — Celular nacional ambiguo en la recuperación

Se aplica A-ID2 como en HU2 (E04-D6): si un número sin código de país coincide con más de una
cuenta, se pide el código de país y no se cuenta un intento. Antes, el servicio de la Etapa 02
trataba el caso como un identificador inexistente.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: coherencia con A-ID2 y E04-D6. Respaldo: Jest y R05 en Android 10 y 14.

## E05-D8 — Recuperación y bloqueo del inicio de sesión

`arquitectura-identidad.md` establece que recuperar una cuenta «reinicia sus contadores de
intentos». Desde E04-D1, el contador del inicio de sesión es único para el dispositivo
(`subject = 'device'`). El servicio de la Etapa 02 reiniciaba un contador por cuenta que ya no se
usa, de modo que tras una recuperación correcta el bloqueo de HU2 seguía vigente y la nueva
contraseña no permitía iniciar sesión hasta que venciera (contrario a HU3-CA12).

**Decisión:** una recuperación correcta reinicia el contador del inicio de sesión del dispositivo,
en la misma transacción que cambia la credencial. Es la regla ya aprobada, aplicada al contador
vigente. La recuperación exige las respuestas correctas, que es una prueba más fuerte que una
contraseña, así que reiniciar el contador no debilita el bloqueo de HU2.

**Ratificación (2026-11-04):** RATIFICADA. Justificación: conserva el comportamiento de HU3-CA12 con el contador único del dispositivo (E04-D1), con el riesgo H-1 aceptado expresamente (ver abajo). Respaldo: Jest; no probado en dispositivo.

## E05-D9 — Evidencias

Se aplica G-10 (`flujo-de-trabajo.md`): las evidencias de esta etapa se guardan en
`GFP-evidencias\e05\`, fuera del repositorio. Los scripts de `scripts/stage-04/` usan por defecto
`GFP-e04-evidencias`, así que en esta etapa se ejecutan siempre con
`-EvidenceRoot "..\GFP-evidencias\e05"` (`validacion/etapa-05-pruebas-dispositivo.md`).

**Ratificación (2026-11-04):** RATIFICADA. Justificación: aplica G-10. Respaldo: todas las
evidencias de la etapa están en `GFP-evidencias\e05\`. La ruta por defecto de `Common.ps1`
(`GFP-e04-evidencias`) no se cambia en esta etapa.

## Ratificación y riesgos conocidos (2026-11-04)

| Decisión | Resolución |
|---|---|
| E05-D1 a E05-D4, E05-D6, E05-D7, E05-D9 | RATIFICADAS |
| E05-D5 | RATIFICADA, incluidos los textos propuestos |
| E05-D8 | RATIFICADA, aceptando expresamente el riesgo H-1 |

### H-1 — Reinicio del bloqueo compartido del dispositivo (E05-D8)

Una recuperación correcta reinicia el contador de inicio de sesión, que es único para el
dispositivo (`subject = 'device'`, E04-D1). Quien pueda recuperar su propia cuenta puede, por
tanto, reiniciar un bloqueo que también afecta a las demás cuentas del dispositivo y volver a
intentar contraseñas de otra cuenta sin esperar los 15 minutos de HU2-CA06.

- Decisión del responsable: se mantiene por el alcance académico del proyecto y para conservar el
  comportamiento de HU3-CA12.
- No es un defecto frente a la decisión funcional aprobada; es un riesgo conocido de seguridad.
- Se suma al riesgo heredado de adelantar el reloj del dispositivo, que también acorta o anula el
  bloqueo (`arquitectura-identidad.md`, sección 6) y al riesgo residual de E03-D11.
- No se modifican el código ni el mecanismo de bloqueo en la Etapa 05. Una posible mejora (por
  ejemplo, no reiniciar el contador del dispositivo o usar contadores por cuenta) debe evaluarse
  en una etapa o un cambio independiente.

### H-2 — Distinción entre identificadores existentes e inexistentes

«Comenzar recuperación» muestra las preguntas para un identificador registrado y «Identificador
incorrecto» para uno inexistente, como exige HU3-CA03. Quien use la pantalla puede, por tanto,
saber si un correo, documento o celular tiene cuenta en el dispositivo. HU2 no lo revela (E04-D7).

- Decisión del responsable: riesgo conocido aceptado; el comportamiento funcional no cambia.
- Mitigación existente: tres identificadores inexistentes bloquean el inicio de la recuperación en
  el dispositivo con la regla de E05-D1.
