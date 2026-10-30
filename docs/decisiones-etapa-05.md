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

**Estado de todas las decisiones de este documento:** adoptadas para la implementación técnica;
**pendientes de ratificación del responsable**. Ninguna cambia un criterio literal ni una decisión
aprobada. El prototipo de HU3 no se pudo consultar: el documento fuente lo incluye como imagen y
solo se dispuso de su texto (igual que en la observación 5 de la Etapa 04).

## E05-D1 — Límite de intentos de respuesta

Se mantiene lo adelantado en la WU del 2026-10-25 y ya implementado en la Etapa 02
(`RECOVERY_THROTTLE_POLICY`):

- tres respuestas incorrectas bloquean la recuperación de esa cuenta durante 15 minutos;
- cada bloqueo siguiente dobla la espera (30, 60, 120… minutos) hasta 24 horas;
- tres identificadores inexistentes bloquean el inicio de la recuperación en el dispositivo con la misma regla.

Un identificador vacío o con formato de correo inválido, y un celular nacional ambiguo, no cuentan
como intento, igual que en HU2 (E04-D1, E04-D6). Durante el bloqueo no se verifican respuestas.

## E05-D2 — Preguntas elegidas al azar

Se mantiene lo adelantado: las 2 preguntas se eligen al azar (`RNGetRandomValues`) entre las 5
configuradas y se guardan en un reto de 15 minutos (`recovery_challenges`). Repetir «Comenzar
recuperación» mientras el reto sigue vigente devuelve las mismas preguntas, para que no se puedan
buscar preguntas más fáciles.

**Precisión de esta etapa:** si el reto vence antes de pulsar «Actualizar contraseña», el servicio
devuelve `challenge_expired`, sin contar un intento, y la pantalla pide comenzar de nuevo. Antes
devolvía el mismo resultado que unas respuestas incorrectas, de modo que el usuario no podía saber
por qué fallaba.

## E05-D3 — Normalización de respuestas

Igual que E03-D9: las respuestas se comparan con la normalización `free-text-folded` (sin tildes,
sin distinguir mayúsculas y con los espacios colapsados), la misma del registro.

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

Las respuestas y las contraseñas se borran de la pantalla tras cada intento fallido y tras el éxito.

## E05-D6 — Volver al inicio de sesión

HU3 no define un botón para salir. El botón Atrás de Android vuelve al inicio de sesión en lugar de
cerrar la app. Así no se añade un control que la historia no pide y no se deja al usuario sin
salida. Se cambia en una línea si el prototipo muestra otra cosa.

## E05-D7 — Celular nacional ambiguo en la recuperación

Se aplica A-ID2 como en HU2 (E04-D6): si un número sin código de país coincide con más de una
cuenta, se pide el código de país y no se cuenta un intento. Antes, el servicio de la Etapa 02
trataba el caso como un identificador inexistente.

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

## E05-D9 — Evidencias

Se aplica G-10 (`flujo-de-trabajo.md`): las evidencias de esta etapa se guardan en
`GFP-evidencias\e05\`, fuera del repositorio.
