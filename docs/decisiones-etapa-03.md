# Decisiones previas a la Etapa 03 (HU1 Registrar usuario)

Análisis de G-07 y E03-D1 a E03-D10. Los títulos son los literales de `plan-etapas.md`
("Decisiones pendientes por etapa"). Los textos citados de HU1 y HU2 proceden del
documento de historias de usuario. Estados: **Resuelta** (técnica, respaldada por los
requisitos), **Requiere aprobación** (elección de producto o alcance no definida) o
**Propuesta** (contenido preparado que el responsable debe confirmar) o **Definida por el
responsable** (decisión de producto tomada por Juan).

Esta preparación no inicia la Etapa 03: la implementación de HU1 empieza solo con
autorización explícita.

| ID | Título literal | Estado |
|---|---|---|
| G-07 | Tratamiento de navegaciones hacia pantallas de etapas futuras | Resuelta |
| E03-D1 | Formulario único (texto) vs. asistente de 3 pasos (prototipo) | Definida por el responsable (2026-10-25): asistente de 3 pasos. Distribución propuesta y A-W1 a A-W6 pendientes |
| E03-D2 | Celular obligatorio u opcional | Definida por el responsable (2026-10-25): obligatorio. A-ID1 a A-ID4 pendientes |
| E03-D3 | Criterio de usuario ya registrado | Resuelta (implementada); ampliación pendiente de A-ID1 y A-ID2 |
| E03-D4 | Contenido de `document_types` | Propuesta |
| E03-D5 | Catálogo de preguntas de seguridad | Propuesta |
| E03-D6 | Definición de "preguntas similares" | Resuelta (implementada) |
| E03-D7 | Caracteres permitidos en nombres | Resuelta |
| E03-D8 | Lista de códigos de país | Resuelta |
| E03-D9 | Normalización de respuestas | Resuelta (implementada) |
| E03-D10 | Longitud máxima de contraseña | Resuelta (implementada) |

## G-07 — Tratamiento de navegaciones hacia pantallas de etapas futuras

- **Requisito:** HU1 exige que «Cancelar» regrese «a la vista de inicio de sesión», que pertenece a HU2 (Etapa 04). `trazabilidad.md` ya prevé HU1-CA18 como parcial, con la prueba de que se emite la navegación.
- **Alternativas:** (a) no navegar hasta que exista el destino; (b) registrar desde el principio las rutas de todas las pantallas, con una pantalla provisional para los destinos futuros; (c) implementar antes la pantalla de destino.
- **Decisión:** (b). Un registro central de rutas declara los nombres de las rutas de HU1 a HU10. Una ruta cuya historia no esté implementada apunta a una pantalla provisional mínima, sin funcionalidad, que se sustituye al implementar la historia. Las pruebas verifican que el botón emite la navegación hacia la ruta correcta. (a) incumpliría el criterio de HU1 en tiempo de ejecución y (c) adelantaría trabajo de otra etapa.
- **Impacto y pruebas:** criterios parciales según `trazabilidad.md`; prueba de navegación en E03 y verificación definitiva en E04.

## E03-D1 — Formulario único (texto) vs. asistente de 3 pasos (prototipo)

**Definida por el responsable (Juan, 2026-10-25): asistente de registro de tres pasos.**
Motivo indicado: la cantidad de campos y la configuración de las preguntas de seguridad
hacen preferible dividir el proceso. El documento de historias no se modifica: el
asistente es la forma de presentar «un formulario que me permita registrarme».

### Distribución propuesta

Agrupa los campos por afinidad y conserva el orden literal en que HU1 los enumera. Las
imágenes del prototipo no pudieron consultarse (solo está disponible el texto del
documento), así que debe contrastarse con él (A-W6).

| Paso | Título propuesto | Campos de HU1 | Obligatorios según HU1 y E03-D2 |
|---|---|---|---|
| 1 | Identificación y datos personales | Tipo de documento (selector poblado con `document_types`); documento; primer nombre; segundo nombre (opcional); primer apellido; segundo apellido (opcional) | Tipo de documento, documento, primer nombre, primer apellido |
| 2 | Contacto y acceso | Código de país (listado) y número celular; correo electrónico; contraseña | Celular con su código de país (E03-D2), correo, contraseña |
| 3 | Preguntas de seguridad | 5 preguntas de seguridad (listas desplegables con las preguntas de la base de datos) y la respuesta de cada una (C-03: opciones de la pregunta elegida) | Las 5 preguntas y sus 5 respuestas |

Controles: indicador «Paso n de 3»; «Siguiente» en los pasos 1 y 2; «Atrás» en los pasos
2 y 3; «Limpiar» y «Cancelar» en los tres pasos; «Registrar» solo en el paso 3.
«Siguiente» y «Atrás» son controles de navegación que exige el asistente, no campos.

### Validaciones por paso (todas proceden de HU1)

| Paso | Validación | Mensaje |
|---|---|---|
| 1 | Obligatorios; tipo de documento del maestro `document_types`; nombres y apellidos sin símbolos ni números (E03-D7) | «Error en los campos ingresados», cerca del campo |
| 2 | Obligatorios; código de país de la lista (E03-D8); correo con `@` y un dominio; contraseña de 8 a 128 caracteres con al menos 1 letra, 1 número y 1 símbolo (E03-D10) | «Verificar correo» para el correo; «Error en los campos ingresados» para el resto |
| 3 | 5 preguntas distintas y no similares (E03-D6), cada una con una respuesta de sus opciones | «Error en los campos ingresados», cerca del campo |
| Al registrar | Todas las validaciones de los pasos 1 a 3 y comprobación de usuario ya registrado (E03-D3) | «El usuario se encuentra registrado» |

### Criterios de aceptación del asistente

Derivados de E03-D1; no son criterios literales de HU1 y no alteran los 19 de la
historia (`trazabilidad.md`, sección "HU1 — decisiones de producto").

| ID interno | Criterio |
|---|---|
| E03-W01 | El asistente muestra el paso actual y el total («Paso n de 3») |
| E03-W02 | «Siguiente» valida solo los campos del paso actual; si hay errores no avanza y muestra el mensaje junto a cada campo |
| E03-W03 | «Atrás» vuelve al paso anterior sin validar y sin perder datos |
| E03-W04 | Los datos de los tres pasos se conservan al navegar entre pasos, solo en memoria |
| E03-W05 | «Registrar», en el paso 3, vuelve a validar los tres pasos; si alguno no es válido, muestra el primer paso con errores y no guarda nada |
| E03-W06 | No se escribe nada en la base de datos hasta que «Registrar» termina correctamente; usuario, credencial y 5 respuestas se guardan en una sola transacción |
| E03-W07 | «Limpiar» y «Cancelar» actúan según HU1 sobre todos los campos del formulario (alcance en A-W2) |
| E03-W08 | La contraseña y las respuestas solo existen en memoria mientras el asistente está abierto y se descartan con «Limpiar», «Cancelar», el registro correcto o al salir de la pantalla |

### Ambigüedades del asistente (pendientes de decisión)

| ID | Ambigüedad | Recomendación |
|---|---|---|
| A-W1 | HU1 no tiene campo de confirmación de contraseña (HU3 sí lo tiene para la nueva contraseña) | No añadirlo: sería un campo nuevo no exigido por HU1 |
| A-W2 | «Limpiar» limpia «todos los campos del formulario»: no precisa si en un asistente afecta solo al paso actual | Literal: limpia los tres pasos y vuelve al paso 1, igual que «Cancelar» salvo la navegación |
| A-W3 | HU1 no indica en qué momento se informa «El usuario se encuentra registrado» | Comprobarlo al pulsar «Siguiente» en el paso 2, cuando ya se conocen documento, celular y correo, y de nuevo al «Registrar», que es la comprobación definitiva |
| A-W4 | Tras «El registro fue exitoso», HU1 solo exige limpiar los campos; no indica el destino | Literal: permanecer en el asistente, limpio y en el paso 1 |
| A-W5 | Textos visibles nuevos: títulos de los pasos y botones «Siguiente» y «Atrás» | Los de la tabla anterior, salvo que el prototipo indique otros |
| A-W6 | La distribución no se ha contrastado con las imágenes del prototipo | Confirmarla contra el prototipo antes de implementar |

## E03-D2 — Celular obligatorio u opcional

**Definida por el responsable (Juan, 2026-10-25): el número celular es obligatorio.**
Motivo indicado: HU2 permite iniciar sesión con correo electrónico, número de documento o
número de celular, junto con la contraseña, así que el registro debe recoger los tres
identificadores. HU1 enumera el campo sin la marca «(opcional)», y el código de país es
obligatorio con él.

### Correo, documento y celular como identificadores

Se distingue el identificador interno de la cuenta (`users.id`, un UUID que nunca ve el
usuario) de los tres identificadores con los que la persona inicia sesión y del campo
único «Ingresar identificador» de la pantalla de HU2, que acepta cualquiera de los tres.

| Identificador | Registro (HU1) | Validación | Almacenamiento y unicidad |
|---|---|---|---|
| Correo electrónico | Obligatorio | Contiene `@` y un dominio; si no, «Verificar correo» | `email` tal como se escribió (sin espacios externos) y `email_normalized` (NFC y minúsculas), con índice único |
| Documento | Tipo (del maestro) y número, obligatorios | HU1 no define el formato del número; solo es obligatorio | `document_type_code` y `document_number` (sin espacios externos, en mayúsculas), con índice único sobre el número sin importar el tipo, porque HU2 inicia sesión solo con el número |
| Celular | Código de país (de la lista) y número, obligatorios | HU1 solo exige la lista de códigos de país; el número se guarda sin espacios ni separadores | `phone_country_code` y `phone_number` (solo dígitos), con índice único sobre el par |

Inicio de sesión (HU2): una entrada con `@` se trata como correo y, si no tiene un
dominio, se muestra «Verificar identificación». Cualquier otra entrada se busca como
documento y, si no coincide, como celular. La contraseña se verifica solo contra la
cuenta encontrada; si no hay exactamente una, el mensaje es «El campo identificación o
contraseña son incorrectos».

### Ambigüedades de los identificadores (pendientes de decisión)

| ID | Ambigüedad | Evidencia | Recomendación |
|---|---|---|---|
| A-ID1 | Documento y celular comparten el mismo campo de inicio de sesión. Hoy una cuenta Y puede registrar como celular el número de documento de otra cuenta X; al iniciar sesión con ese número, la búsqueda encuentra a X y Y nunca puede entrar con su celular | Comprobado el 2026-10-25 con una prueba temporal: el registro de Y se acepta y la búsqueda devuelve X. La contraseña se verifica contra X, así que no da acceso a datos ajenos | Tratar los números de documento y de celular como un único espacio de identificadores: rechazar el registro, con «El usuario se encuentra registrado», si el documento coincide con un celular existente o el celular con un documento existente. Requiere ampliar E03-D3 y un índice que lo garantice en la migración 1, antes de la primera entrega |
| A-ID2 | HU2 no indica si el celular se escribe al iniciar sesión con o sin código de país. Hoy pueden existir dos cuentas con el mismo número en países distintos, y entonces ese número no identifica a nadie | `userIsolation.test.ts` («refuses ambiguous phones») | Exigir que el número nacional sea único sin importar el código de país, y aceptar al iniciar sesión el número con o sin el código. Alternativa: exigir siempre el código de país en el inicio de sesión. Coincide con E04-D2 |
| A-ID3 | HU1 no define el formato del documento. Un NIT con dígito de verificación puede escribirse «900.123.456-7» o «9001234567»; un pasaporte tiene letras | Revisión de `normalizeDocumentNumber()`: solo elimina espacios externos y pasa a mayúsculas | Comparar el documento sin espacios, puntos ni guiones y sin distinguir mayúsculas, conservando lo que escribió el usuario para mostrarlo |
| A-ID4 | El esquema admite el celular vacío (`phone_country_code` y `phone_number` opcionales), lo que ya no coincide con E03-D2 | `migrations.ts`, migración 1 | Declararlos `NOT NULL` en la migración 1, antes de la primera entrega. Mientras tanto, la validación de HU1 exige el celular |

Ninguna de estas ambigüedades se ha resuelto en el código: requieren decisión antes de
implementar HU1.

## E03-D3 — Criterio de usuario ya registrado

- **Requisito:** HU1 exige el mensaje «El usuario se encuentra registrado»; HU2 permite iniciar sesión con correo, número de documento o número de celular.
- **Decisión:** una cuenta está registrada si ya existe el número de documento (con independencia del tipo), el correo (sin distinguir mayúsculas ni espacios externos) o el celular con el mismo indicativo. Es una consecuencia técnica de HU2: cada identificador debe corresponder a una sola cuenta.
- **Implementación y pruebas:** índices únicos de `users`; `IdentityRepository.isAlreadyRegistered()` y `createAccount()`; `__tests__/services/session/userIsolation.test.ts`.
- **Pendiente:** A-ID1 y A-ID2 pueden ampliar el criterio a la coincidencia entre documento y celular y a la unicidad del número nacional.

## E03-D4 — Contenido de `document_types`

- **Requisito:** HU1 exige poblar el selector con el maestro `document_types` e indica «Ingresar documento (DNI/NIT)». No enumera los tipos.
- **Propuesta (migración 2):** `CC` Cédula de ciudadanía, `CE` Cédula de extranjería, `PA` Pasaporte, `PPT` Permiso por protección temporal y `NIT`.
- **Requiere aprobación del contenido.** Mientras no haya una entrega de la Etapa 03 se ajusta en la misma migración.

## E03-D5 — Catálogo de preguntas de seguridad

- **Requisito:** HU1 exige seleccionar 5 preguntas de una lista desplegable con las preguntas de la base de datos; HU3 pregunta 2 de ellas. Según la WU del 2026-10-25, las respuestas se seleccionan entre opciones (C-03).
- **Propuesta (migración 2, `seedCatalogs.ts`):** 10 preguntas en 8 grupos de similitud, cada una con 7 a 11 opciones: color favorito; primera mascota; deporte favorito; plato, fruta y bebida favoritos (grupo «comida»); género musical; región del mundo; transporte a la escuela primaria; materia favorita del colegio.
- **Requiere aprobación del contenido.** Las opciones tienen entropía limitada (ver `arquitectura-identidad.md`, sección 4).

## E03-D6 — Definición de "preguntas similares"

- **Requisito:** HU1 «No permitir que se seleccionen preguntas de seguridad similares».
- **Decisión:** cada pregunta pertenece a un `similarity_group`; dos preguntas son similares si comparten grupo. No se puede elegir la misma pregunta dos veces ni dos preguntas del mismo grupo. El catálogo debe tener al menos 5 grupos.
- **Implementación y pruebas:** `validateRegistrationAnswers()`; `securityQuestionPolicy.test.ts`.

## E03-D7 — Caracteres permitidos en nombres

- **Requisito:** HU1 «Los campos primer nombre, segundo nombre, primer apellido, segundo apellido no deben aceptar símbolos o números».
- **Decisión:** se admiten letras Unicode (`\p{L}`, incluidas tildes, ñ y diéresis) y marcas combinantes (`\p{M}`), con un solo espacio entre palabras. Se normalizan a NFC y se eliminan los espacios externos. Se rechazan dígitos y cualquier símbolo, incluidos el apóstrofo y el guion, porque el criterio literal no admite excepciones. Longitud máxima: 50 puntos de código por campo, como límite técnico de almacenamiento y presentación.
- **Consecuencia registrada:** nombres como «O'Connor» o «Ana-María» deben escribirse sin el símbolo. Cambiarlo exigiría modificar el criterio.
- **Implementación:** validación de HU1 en la Etapa 03.

## E03-D8 — Lista de códigos de país

- **Requisito:** HU1 «Para el campo número de celular se debe tener un listado para seleccionar el código de país».
- **Decisión:** catálogo estático con los indicativos internacionales asignados por la UIT (recomendación E.164), sin dependencias nuevas, con +57 (Colombia) como valor inicial, coherente con el formato monetario colombiano de HU6. El número se guarda solo con dígitos y el indicativo por separado.
- **Implementación:** en la Etapa 03, con el formulario.

## E03-D9 — Normalización de respuestas

- **Decisión:** con respuestas seleccionables (C-03), el verificador se calcula sobre el identificador estable de la opción (`option-id`), y las tildes, las mayúsculas o los espacios no pueden alterarlo. Si el responsable optara por respuestas escritas, se aplica `free-text-folded`: NFC, eliminación de tildes y diacríticos, minúsculas, espacios internos reducidos a uno y recorte de los externos. Ambas variantes se registran en `security_answers.normalization`.
- **Relación:** E05-D3 equivale a esta decisión.
- **Implementación y pruebas:** `canonicalSecret()`, `normalizeFreeTextAnswer()`; `secretNormalization.test.ts` y `secretVerifier.test.ts`.

## E03-D10 — Longitud máxima de contraseña

- **Decisión:** 128 puntos de código tras NFC; mínimo 8 (HU1, HU3). El límite evita entradas desmedidas sin restringir frases de contraseña largas.
- **Implementación y pruebas:** `PASSWORD_MAX_LENGTH`; `passwordPolicy.test.ts`.

## Decisiones de otras etapas adelantadas por la WU del 2026-10-25

| ID | Decisión | Estado |
|---|---|---|
| E05-D1 | Límite de intentos de respuesta: 3 fallos bloquean 15 minutos y la espera se dobla en cada bloqueo hasta 24 horas | Resuelta técnicamente; se ratifica al iniciar la Etapa 05 |
| E05-D2 | Re-aleatorización de preguntas: las 2 preguntas se eligen al azar y se mantienen 15 minutos en un reto persistente | Resuelta técnicamente; se ratifica al iniciar la Etapa 05 |
| E05-D3 | Normalización de respuestas | Igual que E03-D9 |
| E04-D1 | Alcance y persistencia del bloqueo de inicio de sesión | Abierta para la Etapa 04; el esquema admite bloqueo por cuenta y por dispositivo |
| E04-D2 | Distinción documento/celular/correo | Abierta para la Etapa 04; la búsqueda actual trata como correo lo que contiene `@`, después busca el documento y, solo si no hay coincidencia y la entrada es numérica, el celular |
