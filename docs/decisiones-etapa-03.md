# Decisiones previas a la Etapa 03 (HU1 Registrar usuario)

Análisis de G-07 y E03-D1 a E03-D10. Los títulos son los literales de `plan-etapas.md`
("Decisiones pendientes por etapa"). Los textos citados de HU1 y HU2 proceden del
documento de historias de usuario. Estados: **Resuelta** (técnica, respaldada por los
requisitos), **Requiere aprobación** (elección de producto o alcance no definida) o
**Propuesta** (contenido preparado que el responsable debe confirmar).

Esta preparación no inicia la Etapa 03: la implementación de HU1 empieza solo con
autorización explícita.

| ID | Título literal | Estado |
|---|---|---|
| G-07 | Tratamiento de navegaciones hacia pantallas de etapas futuras | Resuelta |
| E03-D1 | Formulario único (texto) vs. asistente de 3 pasos (prototipo) | Requiere aprobación |
| E03-D2 | Celular obligatorio u opcional | Requiere aprobación |
| E03-D3 | Criterio de usuario ya registrado | Resuelta (implementada) |
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

- **Requisito:** el texto de HU1 pide «un formulario que me permita registrarme» y sus botones «Registrar», «Limpiar» y «Cancelar» actúan sobre «todos los campos del formulario». El prototipo muestra un asistente de 3 pasos. El plan establece que cada discrepancia entre texto y prototipo se decide individualmente.
- **Alternativas:** (a) un formulario único desplazable; (b) un asistente de 3 pasos con validación por paso.
- **Recomendación:** (a), porque coincide con el texto y con los criterios de aceptación literales («Limpiar» y «Cancelar» limpian todos los campos), y simplifica las pruebas de los 19 criterios. Con (b) hay que definir qué limpian «Limpiar» y «Cancelar» en cada paso.
- **Requiere aprobación:** es una elección de experiencia de usuario entre dos fuentes del requisito.

## E03-D2 — Celular obligatorio u opcional

- **Requisito:** la lista de campos obligatorios de HU1 no incluye el celular, pero la lista de campos lo enumera sin la marca «(opcional)» que sí llevan el segundo nombre y el segundo apellido. HU2 permite iniciar sesión con el número de celular.
- **Alternativas:** (a) opcional; (b) obligatorio.
- **Recomendación:** (a), porque el criterio de aceptación de obligatoriedad es el verificable y no lo incluye. Una cuenta sin celular inicia sesión con correo o documento.
- **Impacto técnico:** el esquema ya admite ambas opciones (`phone_country_code` y `phone_number` opcionales, siempre juntos). Si se elige (b), solo cambia la validación de HU1.
- **Requiere aprobación:** las dos lecturas del requisito son defendibles.

## E03-D3 — Criterio de usuario ya registrado

- **Requisito:** HU1 exige el mensaje «El usuario se encuentra registrado»; HU2 permite iniciar sesión con correo, número de documento o número de celular.
- **Decisión:** una cuenta está registrada si ya existe el número de documento (con independencia del tipo), el correo (sin distinguir mayúsculas ni espacios externos) o el celular con el mismo indicativo. Es una consecuencia técnica de HU2: cada identificador debe corresponder a una sola cuenta.
- **Implementación y pruebas:** índices únicos de `users`; `IdentityRepository.isAlreadyRegistered()` y `createAccount()`; `__tests__/services/session/userIsolation.test.ts`.
- **Dependencia abierta:** si se inicia sesión con un número de celular sin indicativo que coincide con dos cuentas de países distintos, el identificador no se resuelve (E04-D2).

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
