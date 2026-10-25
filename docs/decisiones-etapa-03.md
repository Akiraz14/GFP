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
| E03-D1 | Formulario único (texto) vs. asistente de 3 pasos (prototipo) | Definida por el responsable (2026-10-25): asistente de 3 pasos; A-W1 a A-W6 aprobadas por el responsable |
| E03-D2 | Celular obligatorio u opcional | Definida por el responsable (2026-10-25): obligatorio; A-ID1 a A-ID4 aprobadas por el responsable |
| E03-D3 | Criterio de usuario ya registrado | Resuelta; ampliada por A-ID1 a A-ID3 (implementación pendiente) |
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

Agrupa los campos por afinidad y conserva el orden literal en que HU1 los enumera. La
distribución se basa en los campos de HU1 y **no afirma coincidir con el prototipo**, cuyas
imágenes no pudieron inspeccionarse (A-W6).

| Paso | Título propuesto | Campos de HU1 | Obligatorios según HU1 y E03-D2 |
|---|---|---|---|
| 1 | «Identificación y datos personales» | Tipo de documento (selector poblado con `document_types`); documento; primer nombre; segundo nombre (opcional); primer apellido; segundo apellido (opcional) | Tipo de documento, documento, primer nombre, primer apellido |
| 2 | «Contacto y acceso» | Código de país (listado) y número celular; correo electrónico; contraseña | Celular con su código de país (E03-D2), correo, contraseña |
| 3 | «Preguntas de seguridad» | 5 preguntas de seguridad (listas desplegables con las preguntas de la base de datos) y la respuesta de cada una (C-03: opciones de la pregunta elegida) | Las 5 preguntas y sus 5 respuestas |

Controles (A-W5): indicador «Paso n de 3»; «Siguiente» en los pasos 1 y 2; «Atrás» en los
pasos 2 y 3; «Limpiar» y «Cancelar» en los tres pasos; «Registrar» solo en el paso 3.
«Siguiente» y «Atrás» son controles de navegación que exige el asistente, no campos.

### Validaciones por paso (todas proceden de HU1)

| Paso | Validación | Mensaje |
|---|---|---|
| 1 | Obligatorios; tipo de documento del maestro `document_types`; nombres y apellidos sin símbolos ni números (E03-D7) | «Error en los campos ingresados», cerca del campo |
| 2 | Obligatorios, incluido el celular (E03-D2); código de país de la lista (E03-D8); correo con `@` y un dominio; contraseña de 8 a 128 caracteres con al menos 1 letra, 1 número y 1 símbolo (E03-D10) | «Verificar correo» para el correo; «Error en los campos ingresados» para el resto |
| 3 | 5 preguntas distintas y no similares (E03-D6), cada una con una respuesta de sus opciones | «Error en los campos ingresados», cerca del campo |
| Final del paso 2 | Comprobación previa de usuario ya registrado con documento, celular y correo (A-W3) | «El usuario se encuentra registrado» |
| Al registrar | Todas las validaciones de los pasos 1 a 3 y comprobación definitiva y atómica de usuario ya registrado (A-W3) | «El usuario se encuentra registrado» |

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
| E03-W07 | «Limpiar» borra los campos de los tres pasos y vuelve al paso 1; si hay datos ingresados, pide confirmación antes de descartarlos (A-W2). «Cancelar» limpia todos los campos y regresa a la vista de inicio de sesión (HU1) |
| E03-W08 | La contraseña y las respuestas solo existen en memoria mientras el asistente está abierto y se descartan con «Limpiar», «Cancelar», el registro correcto o al salir de la pantalla |
| E03-W09 | Al terminar el paso 2 se comprueba si el documento, el celular o el correo ya pertenecen a una cuenta; la comprobación definitiva se repite al «Registrar» dentro de la transacción de creación y la respaldan las restricciones de la base de datos (A-W3) |
| E03-W10 | Tras «El registro fue exitoso», se descartan los datos del asistente y se dirige al usuario a la vista de inicio de sesión (A-W4) |

### Decisiones del asistente (aprobadas por el responsable, 2026-10-25)

| ID | Tema | Decisión aprobada | Contraste con HU1 |
|---|---|---|---|
| A-W1 | Confirmación de contraseña | No se añade: HU1 no la exige | Coincide con la lista de campos de HU1 |
| A-W2 | Alcance de «Limpiar» | Borra los campos de los tres pasos y vuelve al paso 1. Si hay datos ingresados, pide confirmación antes de descartarlos. Texto aprobado por el responsable (2026-10-25): «¿Deseas borrar todos los datos ingresados?», con los botones «Cancelar» y «Borrar» | HU1: «El botón “Limpiar” limpia todos los campos del formulario». La confirmación es un paso adicional aprobado, sin cambiar el resultado. «Cancelar» conserva el comportamiento literal, sin confirmación |
| A-W3 | Comprobación de usuario ya registrado | Previa al terminar el paso 2 y definitiva al «Registrar». La definitiva se ejecuta en la transacción que crea la cuenta y la garantizan las restricciones de la base de datos; si una restricción falla por un registro simultáneo, se muestra el mismo mensaje y no se guarda nada | HU1 exige el mensaje «El usuario se encuentra registrado» y guardar solo si el usuario no está registrado; no fija el momento |
| A-W4 | Destino tras el registro | Descartar los datos del asistente y dirigir al usuario a la vista de inicio de sesión. **Definición de producto aprobada:** HU1 no especifica el destino; solo exige el mensaje «El registro fue exitoso» y limpiar los campos. Mientras HU2 no esté implementada, la ruta de inicio de sesión usa la pantalla provisional de G-07 | No contradice HU1: los campos se limpian y el mensaje se muestra antes de navegar |
| A-W5 | Textos del asistente | Títulos de los pasos: «Identificación y datos personales», «Contacto y acceso» y «Preguntas de seguridad»; botones «Atrás», «Siguiente» y «Registrar»; indicador «Paso n de 3» | «Registrar», «Limpiar» y «Cancelar» son los literales de HU1 |
| A-W6 | Prototipo | Las imágenes del prototipo no pudieron inspeccionarse: solo se dispuso del texto extraído del documento de historias. La distribución se basa en los campos de HU1 y no afirma coincidir con el prototipo | Si el prototipo distribuye los campos de otra forma, se decide de nuevo antes de implementar |

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

Las reglas anteriores son las vigentes en el código. Las decisiones A-ID1 a A-ID4 las
sustituyen; su implementación está pendiente (sección siguiente).

### Decisiones de los identificadores (aprobadas por el responsable, 2026-10-25)

**A-ID1 — Espacio de identificadores inequívoco.** Correo, documento y celular forman un
único espacio: cada valor con el que se puede iniciar sesión identifica a una sola cuenta.
El correo contiene `@` y nunca coincide con los otros dos. El documento normalizado de una
cuenta no puede coincidir con el número nacional ni con el número canónico del celular de
otra cuenta, y viceversa. Una colisión rechaza el registro con el mensaje de HU1 «El
usuario se encuentra registrado», que no indica qué identificador coincide ni a qué cuenta
pertenece. Evidencia del problema: prueba temporal del 2026-10-25 (una cuenta registró
como celular el documento de otra y la búsqueda devolvió esa otra cuenta).

**A-ID2 — Celular en formato canónico con código de país.** El celular se guarda y se
compara en formato E.164: `+`, código de país y número nacional sin espacios ni
separadores (por ejemplo, `+573001112233`); el código de país y el número nacional se
conservan también por separado. El canónico es único. Al iniciar sesión:

| Entrada | Búsqueda | Resultado |
|---|---|---|
| Empieza por `+` | Celular canónico | Una cuenta o ninguna |
| Sin `@` ni `+` (documento o celular sin código de país) | Documento normalizado (A-ID3) y número nacional | Una cuenta: se usa; ninguna: «El campo identificación o contraseña son incorrectos»; varias (el mismo número nacional en países distintos): se pide el número completo con código de país |

Texto aprobado por el responsable (2026-10-25) para el último caso: «Ingresa el número
celular con el código de país». HU2 no define un mensaje para esta situación.

**A-ID3 — Documento normalizado para comparar.** Para comparar y garantizar la unicidad,
el documento se normaliza con NFC, eliminando espacios, puntos y guiones y pasando las
letras a mayúsculas. El valor original se conserva para mostrarlo. No se eliminan ceros a
la izquierda, letras ni otros caracteres.

| Caso comprobado | Ejemplo | Resultado de la regla | Valoración |
|---|---|---|---|
| Separadores de miles en cédulas | «1.020.304.050» y «1020304050» | Mismo documento | Deseado: es el mismo número |
| NIT con dígito de verificación | «900.123.456-7» y «9001234567» | Mismo documento | Deseado: el guion solo separa el dígito de verificación, que se conserva |
| NIT con y sin dígito de verificación | «900123456-7» y «900123456» | Documentos distintos | No se fusionan: la regla no inventa ni quita el dígito. Riesgo pendiente de definición (A-ID5) |
| Pasaporte con letras | «ab123456» y «AB123456» | Mismo documento | Deseado: los pasaportes usan mayúsculas |
| Ceros a la izquierda | «0012345» y «12345» | Documentos distintos | Se conservan: pueden distinguir documentos válidos |
| Mismo número en tipos distintos | CC «9001234567» y NIT «900123456-7» | Colisión | Inherente a HU2, que inicia sesión solo con el número: se rechaza como usuario registrado (A-ID1). Ya ocurría sin normalizar |

Ningún tipo del catálogo propuesto (E03-D4: CC, CE, PA, PPT y NIT) usa espacios, puntos ni
guiones para distinguir documentos distintos. Si el catálogo aprobado cambia, la regla se
revisa antes de fijarse.

**A-ID4 — Celular obligatorio en la validación y en el modelo.** HU1 lo valida como
obligatorio (E03-D2) y el esquema declara `NOT NULL` el código de país, el número nacional
y el canónico. Comprobación previa (2026-10-25): la migración 1 se creó en `03195e9`, que no
está publicado en `origin/main` (`a9b86dc`); ni `App.tsx` ni `index.js` abren la base ni
ejecutan migraciones, y el APK que la contiene no se instaló. No existe ninguna base creada
con ella. Por eso se modifica la migración 1 antes de la primera entrega. Si al
implementarlo constara alguna entrega, instalación o base de datos que dependa de ella, se
crearía una migración nueva y la migración 1 no se tocaría.

**A-ID5 — Dígito de verificación del NIT (pendiente de definición para HU1).** No está
decidido si el NIT exige el dígito de verificación ni cómo se trata al comparar. La regla
A-ID3 no cambia: no se elimina ni se calcula el dígito.

- **Riesgo:** el mismo NIT escrito con dígito («900123456-7») y sin él («900123456») produce dos valores normalizados distintos. Podría registrarse dos veces, y quien se registró con dígito no podría iniciar sesión escribiéndolo sin él, ni al revés.
- **Recomendación:** al implementar HU1, exigir el dígito de verificación para el tipo `NIT` y validarlo con el algoritmo de la DIAN (módulo 11). Así cada NIT tiene una única forma válida y la regla A-ID3 no cambia. Requiere decisión del responsable, porque añade una validación que HU1 no establece.
- **Alcance:** afecta solo al tipo `NIT` de HU1. No afecta a ningún requisito ni criterio de cierre de la Etapa 02.

### Implementación pendiente

Estas decisiones no están implementadas. Su implementación, junto con sus pruebas, es un
cambio de código que requiere autorización y precede a la UI de HU1:

| Elemento | Situación actual | Cambio previsto |
|---|---|---|
| `users` (migración 1) | `phone_country_code` y `phone_number` opcionales; sin documento normalizado ni celular canónico | Columnas `NOT NULL`; `document_number_normalized` único; `phone_e164` único |
| Espacio de identificadores (A-ID1) | Sin restricción entre documento y celular | Restricción en la base de datos, con disparadores que rechacen un documento igual al celular de otra cuenta y viceversa, comprobada en la transacción de registro |
| `normalizeDocumentNumber()` | Solo recorta y pasa a mayúsculas | Regla A-ID3 |
| `findUserIdByIdentifier()` | Documento primero y celular por número nacional; un número ambiguo no resuelve | Reglas de A-ID2, con el resultado «se necesita el código de país» |
| Pruebas | `userIsolation.test.ts` cubre el comportamiento actual | Colisiones entre documento y celular, formatos de documento, celular canónico y ambiguo, `NOT NULL` y registros simultáneos |

## E03-D3 — Criterio de usuario ya registrado

- **Requisito:** HU1 exige el mensaje «El usuario se encuentra registrado»; HU2 permite iniciar sesión con correo, número de documento o número de celular.
- **Decisión:** una cuenta está registrada si ya existe el número de documento (con independencia del tipo), el correo (sin distinguir mayúsculas ni espacios externos) o el celular con el mismo indicativo. Es una consecuencia técnica de HU2: cada identificador debe corresponder a una sola cuenta.
- **Implementación y pruebas:** índices únicos de `users`; `IdentityRepository.isAlreadyRegistered()` y `createAccount()`; `__tests__/services/session/userIsolation.test.ts`.
- **Ampliación aprobada (2026-10-25):** también hay usuario registrado si el documento normalizado coincide con el celular de otra cuenta o el celular con su documento (A-ID1), comparando el documento según A-ID3 y el celular en formato canónico (A-ID2). Implementación pendiente.

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
| E04-D2 | Distinción documento/celular/correo | Definida en lo esencial por A-ID1 y A-ID2; se ratifica al iniciar la Etapa 04 |
