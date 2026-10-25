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
| E03-D4 | Contenido de `document_types` | Propuesta revisada (2026-10-25); requiere aprobación |
| E03-D5 | Catálogo de preguntas de seguridad | Propuesta revisada (2026-10-25); requiere aprobación |
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

### Decisiones del asistente pendientes de aprobación (propuestas del 2026-10-25)

HU1 no define estas situaciones. Son recomendaciones; no se usan como requisito hasta que
el responsable las apruebe.

| ID | Tema | Recomendación | Contraste con HU1 |
|---|---|---|---|
| A-W7 | Fallo técnico al registrar (base no disponible, error al derivar los verificadores o al escribir) | No se guarda nada (la transacción se revierte), se conservan los datos del asistente para reintentar y se muestra un mensaje general. Texto propuesto: «No fue posible completar el registro. Intenta de nuevo». No se muestran detalles técnicos | HU1 solo define mensajes de validación, de usuario registrado y de éxito |
| A-W8 | Registro en curso | Al pulsar «Registrar», el asistente muestra un indicador de progreso y deshabilita «Registrar», «Atrás», «Limpiar» y «Cancelar» hasta que termina, para evitar un doble envío. Texto propuesto: «Registrando…» | HU1 no lo define. La derivación de 6 verificadores (contraseña y 5 respuestas) tarda varios segundos con los parámetros provisionales (P-D1) |
| A-W9 | Apertura de la base de datos | La base se abre y se migra al iniciar la aplicación, antes de mostrar la primera pantalla de identidad. Si falla (`key_lost`, `key_rejected`, `cipher_unavailable`, `newer_schema`, `checksum_mismatch`), se muestra una pantalla de error sin opción de borrar ni de reiniciar la base; el reinicio queda para la etapa que lo necesite (E02-D3) | HU1 no lo define. Hoy `App.tsx` no abre la base; HU1 es la primera historia que la usa en ejecución |

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

**A-ID5 — Dígito de verificación del NIT (recomendación pendiente de aprobación).** HU1
solo indica «Ingresar documento (DNI/NIT)» y no define cómo se valida el NIT: lo que sigue
es una recomendación apoyada en una fuente externa, no un requisito de la historia. La
regla A-ID3 no cambia: no elimina ni calcula el dígito.

- **Riesgo:** el mismo NIT escrito con dígito («900123456-8») y sin él («900123456») produce dos valores normalizados distintos. Podría registrarse dos veces, y quien se registró con una forma no podría iniciar sesión con la otra. Validar el dígito no basta si se admite la forma sin separador: un NIT de 9 dígitos escrito sin dígito parece válido como NIT de 8 dígitos con su dígito en 1 de cada 11 casos aproximadamente (9,95 % en una prueba con 200 000 números aleatorios, 2026-10-25).
- **Fuente externa:** DIAN, Orden Administrativa 4 de 1989 (compilación jurídica de la DIAN, `normograma.dian.gov.co`, consultada el 2026-10-25; la compilación indica que no incluye análisis de vigencia). Los 9 dígitos del NIT se multiplican, de izquierda a derecha, por 41, 37, 29, 23, 19, 17, 13, 7 y 3; la suma se divide por 11; si el residuo es 0 o 1, el dígito es el residuo; si no, es 11 menos el residuo. Comprobación: el ejemplo de la norma (860324218 → 1) y 800197268 → 4. La norma solo cubre bases de hasta 9 dígitos; la extensión de factores (43, 47, 53, 59, 67 y 71) que usan implementaciones públicas para bases más largas no figura en ella.
- **Ejemplos de A-ID3:** «900123456-7» y «900.123.456-7» ilustran la normalización. Con esta recomendación se rechazarían, porque el dígito correcto de 900123456 es 8. La tabla de A-ID3 no se modifica.

| Aspecto | Recomendación |
|---|---|
| Obligatoriedad | Dígito de verificación obligatorio cuando el tipo es `NIT` |
| Formato de entrada | Número base, guion y dígito (`900123456-8`); se admiten puntos en la base (`900.123.456-8`). Para el tipo `NIT`, sin guion se rechaza, porque no se puede saber si el último dígito es el de verificación |
| Validación del dígito | Base de 1 a 9 dígitos: algoritmo de la Orden Administrativa 4 de 1989, con ceros a la izquierda hasta completar 9. Base de 10 o más dígitos (NIT de personas naturales derivado de una cédula de 10 dígitos): **requiere decisión**. Opción recomendada: exigir el formato con guion sin comprobar el dígito, porque ninguna fuente oficial consultada define el cálculo. Alternativas: aplicar la extensión no oficial o rechazar esas bases |
| Almacenamiento | El valor original, para mostrarlo, y el normalizado según A-ID3 (`9001234568`), sin cambiar la regla |
| Comparación y unicidad | Por el valor normalizado y el índice único existente, como los demás tipos. Como el dígito siempre está presente, un NIT no tiene dos formas aceptadas |
| Inicio de sesión (HU2) | El NIT se escribe con su dígito, con o sin guion y puntos; sin el dígito no coincide y se aplica el mensaje literal de HU2. No se propone un mensaje nuevo |
| Mensajes | Formato o dígito incorrecto: «Error en los campos ingresados», junto al campo (HU1). Opcional, requiere aprobación: texto de ayuda bajo el campo cuando el tipo es `NIT`, «Incluye el dígito de verificación, por ejemplo 900123456-8» |
| Cédula y NIT de la misma persona | El NIT de una persona natural es su cédula más el dígito: «1020304050» (CC) y «1020304050-8» (NIT) se normalizan distinto y no colisionan según A-ID1. La misma persona podría tener una cuenta con cada documento; HU1 no lo prohíbe |

- **Alcance:** solo el tipo `NIT` de HU1. No afecta a ningún requisito ni criterio de cierre de la Etapa 02. Sigue pendiente hasta que el responsable apruebe la recomendación.

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

- **Requisito:** HU1 exige poblar el selector con el maestro `document_types` (HU1-CA02 y CA03) e indica «Ingresar documento (DNI/NIT)». No enumera los tipos ni define su formato; el glosario define DNI como el documento nacional de identidad de un ciudadano en su país.
- **Propuesta revisada (2026-10-25), pendiente de aprobación.** El identificador estable es `document_types.code` (clave primaria), que se guarda en `users.document_type_code`; el nombre se muestra en el selector.

| Código | Nombre visible | Origen | Caracteres admitidos tras A-ID3 (recomendación) |
|---|---|---|---|
| `CC` | Cédula de ciudadanía | Interpretación de «DNI» (HU1 y glosario) en el contexto colombiano del proyecto (+57 en E03-D8, formato monetario de HU6) | Solo dígitos |
| `CE` | Cédula de extranjería | Recomendación nueva | Letras y dígitos |
| `PA` | Pasaporte | Recomendación nueva | Letras y dígitos |
| `PPT` | Permiso por protección temporal | Recomendación nueva | Letras y dígitos |
| `NIT` | NIT | Literal de HU1 («DNI/NIT») | Dígitos y dígito de verificación obligatorio (A-ID5) |

- **Reglas respaldadas por HU1:** solo la obligatoriedad del tipo y del número (HU1-CA01) y el selector poblado con el maestro (HU1-CA02 y CA03). La longitud de 1 a 30 caracteres es el límite técnico del esquema. Los caracteres por tipo son una recomendación sin fuente oficial verificada en esta revisión; con ellos, cualquier otro carácter que quede tras A-ID3 se rechaza con «Error en los campos ingresados».
- **Compatibilidad:** el número normalizado es único sin importar el tipo, porque HU2 inicia sesión solo con el número (E03-D3, A-ID1 y A-ID3); ningún tipo propuesto usa espacios, puntos ni guiones para distinguir documentos. Las reglas por tipo se definen en el código, indexadas por `code`, sin cambiar el esquema del catálogo.
- **Tipos no propuestos:** tarjeta de identidad (menores de edad), registro civil y permiso especial de permanencia. HU1 no los menciona ni define el registro de menores; se añadirían solo por decisión del responsable.
- Mientras no haya una entrega de la Etapa 03, el catálogo se ajusta en la migración 2.

## E03-D5 — Catálogo de preguntas de seguridad

- **Requisito:** HU1 exige seleccionar 5 preguntas de una lista desplegable con las preguntas de la base de datos (HU1-CA10), sin preguntas similares (HU1-CA11), y no almacenar las respuestas en texto plano (HU1-CA12); HU3 pregunta 2 de ellas al azar. Las respuestas se seleccionan entre opciones (C-03).
- **Origen:** ninguna pregunta ni opción figura en HU1 ni en el texto extraído del prototipo (A-W6). Todo el contenido es una recomendación preparada en la Etapa 02 (migración 2, `seedCatalogs.ts`), revisada el 2026-10-25 y **pendiente de aprobación**.

| Identificador | Pregunta | Grupo | Opciones | Tipo |
|---|---|---|---|---|
| `favorite-color` | ¿Cuál es tu color favorito? | `color` | Rojo, Azul, Verde, Amarillo, Naranja, Morado, Rosado, Negro, Blanco, Gris, Café (11) | Preferencia |
| `first-pet` | ¿Qué tipo de animal fue tu primera mascota? | `pets` | Perro, Gato, Pez, Ave, Conejo, Hámster, Tortuga, Caballo, Otro animal, Nunca tuve mascota (10) | Hecho |
| `favorite-sport` | ¿Cuál es tu deporte favorito? | `sports` | Fútbol, Baloncesto, Voleibol, Tenis, Natación, Ciclismo, Atletismo, Béisbol, Ajedrez, Ninguno (10) | Preferencia |
| `favorite-dish` | ¿Cuál es tu plato favorito? | `food` | Bandeja paisa, Ajiaco, Sancocho, Arepa, Empanada, Tamal, Pizza, Hamburguesa, Pasta, Sushi (10) | Preferencia |
| `favorite-fruit` | ¿Cuál es tu fruta favorita? | `food` | Mango, Banano, Fresa, Manzana, Piña, Maracuyá, Lulo, Guanábana, Papaya, Uva (10) | Preferencia |
| `favorite-drink` | ¿Cuál es tu bebida favorita? | `food` | Café, Té, Chocolate, Jugo natural, Gaseosa, Agua, Aromática, Limonada, Avena, Kumis (10) | Preferencia |
| `favorite-music-genre` | ¿Cuál es tu género musical favorito? | `music` | Salsa, Vallenato, Reguetón, Rock, Pop, Merengue, Bachata, Clásica, Electrónica, Jazz, Rap (11) | Preferencia |
| `dream-destination` | ¿Qué región del mundo te gustaría conocer primero? | `travel` | Europa, Asia, África, Norteamérica, Suramérica, Centroamérica y el Caribe, Oceanía, Antártida (8) | Preferencia |
| `school-transport` | ¿Cómo ibas normalmente a la escuela primaria? | `childhood` | Caminando, Bus escolar, Transporte público, Carro familiar, Bicicleta, Moto, Otro medio (7) | Hecho |
| `favorite-school-subject` | ¿Cuál era tu materia favorita en el colegio? | `education` | Matemáticas, Lengua castellana, Ciencias naturales, Ciencias sociales, Inglés, Educación física, Artes, Música, Tecnología e informática, Ética y valores (10) | Preferencia pasada |

Revisión del 2026-10-25:

- **Similitud (E03-D6):** 10 preguntas en 8 grupos; las tres de comida comparten grupo, así que se puede elegir como mucho una de ellas. Con 8 grupos se cumplen las 5 preguntas no similares que exige HU1.
- **Opciones:** dentro de cada pregunta son distintas y su etiqueta es única (`UNIQUE (question_id, label)`); «Café» aparece en dos preguntas distintas sin conflicto. Las opciones genéricas («Otro animal», «Nunca tuve mascota», «Ninguno», «Otro medio») son necesarias para que cualquier persona pueda responder, pero son respuestas más predecibles.
- **Estabilidad:** 8 de las 10 preguntas son de preferencia y la respuesta puede cambiar con el tiempo, lo que dificulta recordarla en HU3. Las de hechos (`first-pet` y `school-transport`) son más estables.
- **Nomenclatura (G-09):** los identificadores de opciones están en inglés, salvo nombres propios de platos y frutas sin traducción habitual (`bandeja-paisa`, `ajiaco`, `sancocho`, `arepa`, `empanada`, `tamal`, `lulo`, `kumis`) y `avena`, que tiene traducción. Recomendación: renombrar `avena` a `oat-drink` en la migración 2 al implementar; los demás se conservan como nombres propios.
- **Desacoplamiento:** el catálogo vive en `security_questions` y `security_question_options`; la autenticación solo usa `question_id`, `option_id` y `similarity_group`, y no contiene textos. Tras la primera entrega, un cambio requiere una migración nueva; una pregunta se retira con `is_active = 0` sin borrar las respuestas de quienes ya la configuraron.
- **No exposición:** las respuestas se guardan como verificadores PBKDF2 independientes sobre el identificador de la opción; la interfaz no muestra la respuesta guardada, y HU3 verifica siempre las dos respuestas y devuelve un único resultado, sin indicar cuál falló (`arquitectura-identidad.md`, sección 4).
- **Limitaciones que se aceptan al aprobar el catálogo:** con 7 a 11 opciones, dos respuestas admiten como mucho 121 combinaciones. La limitación de intentos de recuperación (3 fallos y esperas de 15, 30, 60… minutos) permite 21 intentos en las primeras 24 horas: si las respuestas fueran equiprobables, cubrirían cerca del 17 % de las combinaciones, y la probabilidad es mayor con respuestas predecibles. Las preguntas seleccionables no equivalen a un canal externo verificado (correo o SMS), que está fuera del alcance.
- **Recomendación:** aprobar el catálogo con estas limitaciones, con el cambio de `avena`. Alternativa: sustituir preguntas de preferencia por otras de hechos; aumentaría la estabilidad, pero no la entropía.

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

## Especificación consolidada de HU1 (preparación del 2026-10-25)

Consolida HU1, las decisiones aprobadas y las recomendaciones pendientes. No autoriza
la implementación. Clasificación de las fuentes:

| Clase | Contenido |
|---|---|
| Requisito literal de HU1 | Campos, botones y los 19 criterios HU1-CA01 a CA19 (`trazabilidad.md`) |
| Decisión aprobada por el responsable | E03-D1 y E03-D2; A-W1 a A-W6; A-ID1 a A-ID4; textos de interfaz aprobados |
| Decisión técnica resuelta, respaldada por los requisitos | G-07; E03-D3; E03-D6 a E03-D10 |
| Recomendación pendiente de aprobación | E03-D4, E03-D5, A-ID5, A-W7, A-W8, A-W9 y los criterios propuestos E03-V05 a E03-V08 |

### Flujo del asistente

1. **Paso 1, «Identificación y datos personales»:** tipo de documento, documento, primer nombre, segundo nombre (opcional), primer apellido y segundo apellido (opcional). «Siguiente» valida el paso (E03-W02).
2. **Paso 2, «Contacto y acceso»:** código de país y número celular, correo y contraseña. «Siguiente» valida el paso y comprueba si el documento, el celular o el correo ya pertenecen a una cuenta (A-W3); si es así, muestra «El usuario se encuentra registrado» y no avanza.
3. **Paso 3, «Preguntas de seguridad»:** 5 preguntas no similares y la opción elegida para cada una. «Registrar» revalida los tres pasos (E03-W05), deriva los verificadores de la contraseña y de las 5 respuestas fuera de la transacción y, en una sola transacción, repite la comprobación de usuario registrado y crea usuario, credencial y respuestas (E03-W06, E03-W09).
4. **Resultado:** «El registro fue exitoso», limpieza de los campos y de los secretos en memoria, y navegación al inicio de sesión, que mientras HU2 no exista es la pantalla provisional de G-07 (E03-W08, E03-W10). El registro no inicia sesión.

«Atrás» conserva los datos (E03-W03 y E03-W04). «Limpiar» pide confirmación con el texto
aprobado si hay datos y, solo tras «Borrar», limpia los tres pasos y vuelve al paso 1;
«Cancelar» limpia todo y regresa al inicio de sesión sin confirmación (A-W2, HU1-CA18 y
CA19). Distribución, validaciones por paso y mensajes: sección E03-D1.

### Persistencia y seguridad

| Necesidad | Regla | Estado |
|---|---|---|
| Creación atómica | `IdentityRepository.createAccount()` se invoca dentro de `database.transaction()`; un fallo revierte usuario, credencial y respuestas | Implementado en el repositorio; la invocación transaccional desde HU1 está pendiente (revisión consolidada, `decisiones.md`) |
| Unicidad respaldada por la base | Índices únicos de documento, correo y celular; documento normalizado (A-ID3) y celular E.164 (A-ID2) únicos; colisión documento–celular rechazada por disparadores (A-ID1); una violación de restricción por un registro simultáneo se traduce en «El usuario se encuentra registrado» | Índices actuales implementados; A-ID1 a A-ID3 aprobados, implementación pendiente |
| Celular obligatorio | Código de país, número nacional y canónico `NOT NULL` (A-ID4) | Aprobado, implementación pendiente |
| Migraciones | Se modifican la migración 1 (A-ID1 a A-ID4) y la 2 (catálogos E03-D4 y E03-D5) porque no se han distribuido; si constara alguna entrega o base que dependa de ellas, se crea una migración nueva | Pendiente de autorización |
| Secretos | Contraseña y respuestas solo como verificadores PBKDF2 con sal propia (E02-D1, HU1-CA06 y CA12); nunca en registros, mensajes ni almacenamiento temporal; descartados de la memoria al terminar (E03-W08) | Verificadores implementados; manejo en la UI pendiente |
| Aislamiento de cuentas | El registro no abre una sesión (`SessionManager`) ni lee datos privados; la sesión la crea solo el inicio de sesión de HU2 tras autenticar | Regla de diseño |
| Apertura de la base | Al iniciar la app, con pantalla de error no destructiva (A-W9) | Pendiente de aprobación |

### Dependencias de HU1 y reservas de la Etapa 02

| Reserva | Relación con HU1 | Clasificación |
|---|---|---|
| P-D1 — calibración de PBKDF2 | El registro deriva 6 verificadores; el tiempo de espera depende de las iteraciones | Dependencia directa. No bloquea la preparación ni el inicio; se ejecuta antes del cierre de la Etapa 03 (E02-D1). El parámetro está versionado |
| P-D2 — NFC y `\p{…}` en Hermes | La contraseña se normaliza con NFC y la validación de nombres (HU1-CA04, E03-D7) usa `\p{L}` y `\p{M}` | Dependencia directa. Recomendación: ejecutarla al empezar la implementación, antes de la UI, porque un fallo cambiaría la validación de nombres |
| P-D3 y ejecución del módulo nativo (E02-C8) | HU1 es la primera historia que abre la base y usa `GfpCrypto` en ejecución (primera ejecución, generación de la clave, BLOB de `op-sqlite`) | Dependencia directa para verificar HU1 en el emulador; se ejecuta durante la Etapa 03 |
| P-D7 — permiso `INTERNET` | HU1 no usa la red | Reserva no bloqueante |
| E02-D8 — umbrales del OCR | Pertenece a HU7 (Etapa 10) | Reserva no bloqueante |
| Keystore sin respaldo por hardware demostrado | Protege la clave de la base donde se guardarán los datos de HU1; no cambia el diseño | Reserva no bloqueante; no se afirma protección por hardware |
| Entropía de las preguntas | Afecta directamente al contenido de E03-D5 | Limitación que se acepta, o no, al aprobar E03-D5; no bloquea la preparación |
| E02-C6 parcial | Sus pendientes son P-D1, P-D7 y E02-D8 | Permanece parcial |

Riesgo propio de HU1: la comprobación de usuario registrado al terminar el paso 2 permite
saber si un identificador ya existe. El mensaje es literal de HU1 y HU3 ya lo permite con
«Identificador incorrecto»; no se propone una limitación adicional.

## Decisiones de otras etapas adelantadas por la WU del 2026-10-25

| ID | Decisión | Estado |
|---|---|---|
| E05-D1 | Límite de intentos de respuesta: 3 fallos bloquean 15 minutos y la espera se dobla en cada bloqueo hasta 24 horas | Resuelta técnicamente; se ratifica al iniciar la Etapa 05 |
| E05-D2 | Re-aleatorización de preguntas: las 2 preguntas se eligen al azar y se mantienen 15 minutos en un reto persistente | Resuelta técnicamente; se ratifica al iniciar la Etapa 05 |
| E05-D3 | Normalización de respuestas | Igual que E03-D9 |
| E04-D1 | Alcance y persistencia del bloqueo de inicio de sesión | Abierta para la Etapa 04; el esquema admite bloqueo por cuenta y por dispositivo |
| E04-D2 | Distinción documento/celular/correo | Definida en lo esencial por A-ID1 y A-ID2; se ratifica al iniciar la Etapa 04 |
