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
| E03-D4 | Contenido de `document_types` | Aprobada provisionalmente por el responsable (2026-10-25): CC, CE, PA y PPT; sin TI ni NIT (la app es solo para personas naturales); migración 2 sin cambios y desactivación del NIT en una migración posterior (pendiente de implementación); reglas de caracteres por tipo pendientes de verificación |
| E03-D5 | Catálogo de preguntas de seguridad | Definida por el responsable (2026-10-25): se conservan las 10 preguntas y sus grupos; respuestas escritas de 3 a 100 puntos de código Unicode tras normalizar (E03-D11); opciones conservadas sin uso. Adaptación del código pendiente de autorización |
| E03-D6 | Definición de "preguntas similares" | Resuelta (implementada) |
| E03-D7 | Caracteres permitidos en nombres | Resuelta |
| E03-D8 | Lista de códigos de país | Resuelta |
| E03-D9 | Normalización de respuestas | Resuelta (implementada) |
| E03-D10 | Longitud máxima de contraseña | Resuelta (implementada) |
| E03-D11 | Modo de respuesta de las preguntas de seguridad ante su baja entropía | Definida por el responsable (2026-10-25): respuestas escritas, riesgo residual aceptado solo para una demostración académica controlada |

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
| 1 | «Identificación y datos personales» | Tipo de documento (selector poblado con los tipos activos de `document_types`: CC, CE, PA y PPT); documento; primer nombre; segundo nombre (opcional); primer apellido; segundo apellido (opcional) | Tipo de documento, documento, primer nombre, primer apellido |
| 2 | «Contacto y acceso» | Código de país (listado) y número celular; correo electrónico; contraseña | Celular con su código de país (E03-D2), correo, contraseña |
| 3 | «Preguntas de seguridad» | 5 preguntas de seguridad (listas desplegables con las preguntas de la base de datos) y la respuesta escrita de cada una (E03-D11) | Las 5 preguntas y sus 5 respuestas |

El campo de documento se describe como «Ingresar documento» de uno de los tipos de E03-D4.
El documento fuente de HU1 lo enumera como «Ingresar documento (DNI/NIT)»; esa mención del
NIT no está vigente (C-04).

Controles (A-W5): indicador «Paso n de 3»; «Siguiente» en los pasos 1 y 2; «Atrás» en los
pasos 2 y 3; «Limpiar» y «Cancelar» en los tres pasos; «Registrar» solo en el paso 3.
«Siguiente» y «Atrás» son controles de navegación que exige el asistente, no campos.

### Validaciones por paso (todas proceden de HU1)

| Paso | Validación | Mensaje |
|---|---|---|
| 1 | Obligatorios; tipo de documento del maestro `document_types`; nombres y apellidos sin símbolos ni números (E03-D7) | «Error en los campos ingresados», cerca del campo |
| 2 | Obligatorios, incluido el celular (E03-D2); código de país de la lista (E03-D8); correo con `@` y un dominio; contraseña de 8 a 128 caracteres con al menos 1 letra, 1 número y 1 símbolo (E03-D10) | «Verificar correo» para el correo; «Error en los campos ingresados» para el resto |
| 3 | 5 preguntas distintas y no similares (E03-D6), cada una con una respuesta escrita de 3 a 100 puntos de código tras la normalización `free-text-folded` (E03-D5, E03-D11) | «Error en los campos ingresados», cerca del campo |
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

### Decisiones del asistente sobre fallos y registro en curso (aprobadas por el responsable, 2026-10-25)

HU1 no define estas situaciones. Las decisiones funcionales están aprobadas; ninguna está
implementada ni probada.

| ID | Tema | Decisión aprobada | Implementación técnica pendiente | Contraste con HU1 |
|---|---|---|---|---|
| A-W7 | Fallo técnico al registrar (base no disponible, error al derivar los verificadores o al escribir) | No queda ninguna cuenta parcial: la transacción se revierte. Se conservan los campos no sensibles (tipo y número de documento, nombres, celular, correo y las preguntas elegidas, que no son secretas); no se conservan la contraseña ni las respuestas de seguridad, que se ingresan de nuevo. Mensaje aprobado: «No fue posible completar el registro. Intenta de nuevo». No se muestran detalles técnicos | Manejo del error en el registro y en el asistente, con sus pruebas (E03-V07) | HU1 solo define mensajes de validación, de usuario registrado y de éxito |
| A-W8 | Registro en curso | Al pulsar «Registrar», el asistente muestra «Registrando…» y deshabilita los controles que podrían provocar un envío duplicado («Registrar», «Atrás», «Limpiar» y «Cancelar») hasta que termina | Indicador y bloqueo de controles, con sus pruebas (E03-V08) | HU1 no lo define. La derivación de 6 verificadores (contraseña y 5 respuestas) tarda varios segundos con los parámetros provisionales (P-D1) |
| A-W9 | Fallo al abrir la base de datos | La base se abre y se verifica al iniciar la aplicación. Si la apertura falla (`key_lost`, `key_rejected`, `cipher_unavailable`, `newer_schema`, `checksum_mismatch`), no se permiten las funciones que dependen de ella y se muestra el mensaje aprobado «No fue posible abrir la base de datos. Reinicia la aplicación.». La base no se borra, no se reinicializa ni se recrea para ocultar el error, de modo que los datos existentes no se comprometen (E02-D3). El producto no tiene ni tendrá un canal de soporte (decisión del responsable, 2026-10-25), así que el mensaje no remite a ninguno. Sustituye al mensaje aprobado anteriormente, que remitía a un soporte inexistente | Apertura al iniciar la app y pantalla de error, con sus pruebas (E03-V09). Hoy `App.tsx` no abre la base | HU1 no lo define; HU1 es la primera historia que usa la base en ejecución |

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
| Pasaporte con letras | «ab123456» y «AB123456» | Mismo documento | Deseado: los pasaportes usan mayúsculas |
| Ceros a la izquierda | «0012345» y «12345» | Documentos distintos | Se conservan: pueden distinguir documentos válidos |
| Mismo número en tipos distintos | CC «9001234567» y CE «9001234567» | Colisión | Inherente a HU2, que inicia sesión solo con el número: se rechaza como usuario registrado (A-ID1). Ya ocurría sin normalizar |

Ningún tipo del catálogo aprobado provisionalmente (E03-D4: CC, CE, PA y PPT) usa espacios, puntos ni
guiones para distinguir documentos distintos. Si el catálogo aprobado cambia, la regla se
revisa antes de fijarse. Los ejemplos de esta tabla con NIT se retiraron el 2026-10-25 al
excluirse ese tipo (E03-D4); la regla A-ID3 no cambia.

**A-ID4 — Celular obligatorio en la validación y en el modelo.** HU1 lo valida como
obligatorio (E03-D2) y el esquema declara `NOT NULL` el código de país, el número nacional
y el canónico. Comprobación previa (2026-10-25): la migración 1 se creó en `03195e9`, que no
está publicado en `origin/main` (`a9b86dc`); ni `App.tsx` ni `index.js` abren la base ni
ejecutan migraciones, y el APK que la contiene no se instaló. No existe ninguna base creada
con ella. Por eso se modifica la migración 1 antes de la primera entrega. Si al
implementarlo constara alguna entrega, instalación o base de datos que dependa de ella, se
crearía una migración nueva y la migración 1 no se tocaría.

**A-ID5 — Validación del NIT (sin objeto desde el 2026-10-25).** El responsable decidió
que la aplicación se dirige exclusivamente a personas naturales y excluyó el NIT del
catálogo de tipos de documento (E03-D4). A-ID5 queda sin objeto: no se definen reglas de
formato, longitud ni dígito de verificación del NIT, y se retira el análisis anterior
(aplazamiento de la validación y recomendación de exigir el dígito). El identificador se
conserva para mantener la trazabilidad.

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

- **Requisito:** HU1 exige poblar el selector con el maestro `document_types` (HU1-CA02 y CA03) e indica en su lista de campos «Ingresar documento (DNI/NIT)». No enumera los tipos ni define su formato; el glosario define DNI como el documento nacional de identidad de un ciudadano en su país.
- **Aprobada provisionalmente por el responsable (2026-10-25): CC, CE, PA y PPT.** La aplicación se dirige exclusivamente a personas naturales; no se contempla el registro de empresas ni de personas jurídicas, así que el NIT se excluye. La aprobación del catálogo no cierra las reglas de validación por tipo. El identificador estable es `document_types.code` (clave primaria), que se guarda en `users.document_type_code`; el nombre se muestra en el selector.

| Código | Nombre visible | Origen | Caracteres por tipo (recomendación pendiente de verificación; no se aplica) |
|---|---|---|---|
| `CC` | Cédula de ciudadanía | Interpretación de «DNI» (HU1 y glosario) en el contexto colombiano del proyecto (+57 en E03-D8, formato monetario de HU6) | Solo dígitos |
| `CE` | Cédula de extranjería | Recomendación nueva | Letras y dígitos |
| `PA` | Pasaporte | Recomendación nueva | Letras y dígitos |
| `PPT` | Permiso por protección temporal | Recomendación nueva | Letras y dígitos |

- **Exigido por HU1:** un selector poblado con el maestro (HU1-CA02 y CA03) y la obligatoriedad del tipo y del número (HU1-CA01). `CC` es la interpretación de «DNI»; `CE`, `PA` y `PPT` son extensiones aprobadas para residentes extranjeros en Colombia.
- **Discrepancia con el texto de HU1 (C-04), resuelta (2026-10-25):** la lista de campos del documento fuente de HU1 dice «Ingresar documento (DNI/NIT)». La especificación de la Etapa 03 describe el campo sin el NIT (sección E03-D1). El documento fuente queda fuera del repositorio y no se modifica (D-FUENTES), así que conserva la mención; prevalece la decisión registrada. Los criterios HU1-CA01 a HU1-CA19 no mencionan el NIT y no cambian.
- **Reglas de caracteres por tipo:** **pendientes de verificación.** No se encontró una fuente oficial que las respalde para cada tipo, así que no se presentan como reglas oficiales ni se aplican. Evidencia que falta: la especificación oficial del formato de cada documento (Registraduría Nacional para la CC, Migración Colombia para la CE y el PPT, y el formato del pasaporte). Hasta verificarlas, la única regla aplicable es la técnica: tras A-ID3 solo quedan letras y dígitos, de 1 a 30 caracteres (límite del esquema), y cualquier otro carácter se rechaza con «Error en los campos ingresados».
- **Compatibilidad:** el número normalizado es único sin importar el tipo, porque HU2 inicia sesión solo con el número (E03-D3, A-ID1 y A-ID3); ningún tipo propuesto usa espacios, puntos ni guiones para distinguir documentos. Las reglas por tipo se definen en el código, indexadas por `code`, sin cambiar el esquema del catálogo.
- **Tarjeta de identidad (TI) — excluida provisionalmente por el responsable (2026-10-25)** mientras el requisito no defina el registro de menores. La TI es el documento de los menores de edad, y ni HU1 ni ningún documento del proyecto establece que el sistema los admita; incluirla supondría decidir que la app registra menores, con implicaciones sobre el tratamiento de sus datos personales que requerirían revisión. Si el requisito llega a definirlo, la TI se añade al catálogo antes de la primera entrega o en una migración nueva.
- **Otros tipos no propuestos:** registro civil y permiso especial de permanencia, por las mismas razones de alcance; se añadirían solo por decisión del responsable.
- **Migración 2 y desactivación del NIT (decisión del responsable, 2026-10-25):** la migración 2 se conserva sin modificar, incluidos sus datos: sigue sembrando el NIT en `document_types` (`PROPOSED_DOCUMENT_TYPES` de `seedCatalogs.ts`). Requisitos para la implementación futura, **no implementados ni validados**:
  1. Una migración posterior a la 2 marca el NIT como inactivo (`UPDATE document_types SET is_active = 0 WHERE code = 'NIT'`). El esquema lo permite: la migración 1 define `document_types.is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))`.
  2. El selector de tipo de documento muestra solo los tipos activos (`is_active = 1`).
  3. El registro rechaza cualquier tipo de documento inactivo, aunque el intento llegue por una vía distinta al selector, con «Error en los campos ingresados». La validación se hace también en la lógica de registro, no solo en la interfaz. **Aprobado por el responsable (2026-10-25)** como requisito derivado (E03-V11): la clave foránea por sí sola aceptaría `NIT`.

  Hoy ningún código lee `document_types`, así que el NIT no aparece en ninguna pantalla. Criterio derivado: E03-V11.

## E03-D5 — Catálogo de preguntas de seguridad

- **Requisito:** HU1 exige seleccionar 5 preguntas de una lista desplegable con las preguntas de la base de datos (HU1-CA10), sin preguntas similares (HU1-CA11), ingresar sus respuestas y no almacenarlas en texto plano (HU1-CA12); HU3 pregunta 2 de ellas al azar.
- **Definida por el responsable (2026-10-25):** se conservan las 10 preguntas existentes y sus grupos de similitud, que son compatibles con el requisito, y las respuestas pasan a escribirse (E03-D11). Ninguna pregunta figura en HU1 ni en el texto extraído del prototipo (A-W6): el contenido procede de la migración 2 de la Etapa 02.

| Identificador | Pregunta | Grupo | Opciones del catálogo actual (sin uso como respuesta tras E03-D11) | Tipo |
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

- **Similitud (E03-D6):** 10 preguntas en 8 grupos; las tres de comida comparten grupo, así que se puede elegir como mucho una de ellas. Con 8 grupos se cumplen las 5 preguntas no similares que exige HU1. La regla no depende de las opciones.
- **Estabilidad y ambigüedad:** 8 de las 10 preguntas son de preferencia y su respuesta puede cambiar. Las preguntas se redactaron para responder con opciones; con texto, algunas admiten respuestas de distinto nivel de detalle (por ejemplo, «Europa» o «Francia» en `dream-destination`, «Bus» o «Bus escolar» en `school-transport`), lo que puede hacer fallar la recuperación aunque la persona recuerde su elección. Es un riesgo de uso conocido; las preguntas no se cambian.
- **Opciones del catálogo (decisión del responsable, 2026-10-25):** la tabla `security_question_options` y sus datos de la migración 2 se conservan por compatibilidad con las migraciones y los datos del proyecto, pero no forman parte del flujo funcional aprobado: no se usan en las respuestas escritas, no se eliminan, no se renombran sus identificadores y la migración 2 no se modifica. Sustituye a la nota anterior que dejaba su retirada para la implementación. Se retira también la recomendación de renombrar `avena`.
- **Compatibilidad del esquema:** el esquema no exige las opciones para guardar una respuesta escrita: `security_answers` referencia `security_questions` (no las opciones) y su columna `normalization` admite `free-text-folded`. La dependencia de las opciones está en el código (siguiente punto).
- **Inconsistencia registrada entre la documentación y el código de la Etapa 02:** el código vigente implementa respuestas seleccionables (C-03): `SecurityAnswerInput.optionId`, la violación `unknown_option` de `validateRegistrationAnswers()`, la verificación `answer?.optionId` de `AccountRecoveryService.complete()` y sus pruebas. La documentación de HU1 describe ahora respuestas escritas. **Impacto:** el flujo de respuestas escritas no puede completarse con ese código. Adaptar esos tipos, la validación del paso 3, la verificación de la recuperación (también de HU3, Etapa 05) y sus pruebas es una tarea futura que requiere autorización expresa; la normalización `free-text-folded` y el valor del esquema ya existen. Mientras no se autorice, el código no refleja E03-D11.
- **Desacoplamiento:** el catálogo vive en `security_questions`; la autenticación usa `question_id` y `similarity_group` y no contiene textos de preguntas. Una pregunta se retira con `is_active = 0` sin borrar las respuestas de quienes ya la configuraron.
- **Longitud de las respuestas (decisión del responsable, 2026-10-25):** de 3 a 100 puntos de código Unicode, ambos incluidos, contados después de la normalización `free-text-folded` (la misma unidad que E03-D7 y E03-D10); una respuesta vacía o fuera de ese rango se rechaza con «Error en los campos ingresados».

## E03-D11 — Respuestas de las preguntas de seguridad y riesgo residual

**Definida por el responsable (Juan, 2026-10-25): respuestas escritas**, conforme al texto
de HU1 («Ingresar respuestas de seguridad correspondientes a las preguntas
seleccionadas»), con la normalización existente `free-text-folded` (E03-D9). Sustituye a
C-03 en cuanto a la forma de responder. El responsable reconoce la baja entropía del
mecanismo como un problema real de seguridad y acepta su riesgo residual **solo** para una
demostración académica controlada.

**Requisito frente a decisión técnica.** HU1 y HU3 exigen expresamente las preguntas de
seguridad: el mecanismo no se retira ni se sustituye por otro de mayor alcance. La forma de
responder no la fija HU1: la decidió el responsable en C-03 (WU del 2026-10-25), y E03-D11
la devuelve al texto literal de HU1.

**Justificación.** Las opciones limitaban cada respuesta a entre 7 y 11 valores
previsibles. Las respuestas escritas siguen el requisito literal y eliminan ese límite
artificial sin ampliar el alcance. No convierten las preguntas en una verificación robusta.

**Por qué el mecanismo no es seguro:**

- Las respuestas pueden ser **conocidas** por personas cercanas o averiguadas en redes sociales, y **adivinadas** con respuestas comunes. Bonneau y otros (Google, 2015) midieron que la comida favorita de usuarios de habla inglesa se acertaba en el 19,7 % de los casos con un solo intento, y que la recuperación con preguntas tuvo menos éxito (61 % en inglés y 44 % en francés) que la de SMS (81 %) o correo (75 %), porque las respuestas se olvidan.
- Quien obtenga el archivo de la base y su clave puede **probar respuestas fuera de línea**, sin límite de intentos: cada respuesta tiene su propio verificador y PBKDF2 solo encarece cada prueba frente a un diccionario de respuestas comunes.
- NIST SP 800-63B-4 (sección 3.1.1.2) prohíbe que los verificadores pidan autenticación basada en conocimiento, con el ejemplo de la primera mascota. Es una guía de EE. UU., no vinculante para el proyecto, pero refleja el consenso técnico.
- La seguridad efectiva de una cuenta es la del eslabón más débil: la recuperación es más débil que la contraseña.

**Controles, riesgos, mitigaciones y pruebas:**

| Clase | Elemento | Situación |
|---|---|---|
| Control existente y verificado (Jest, revisión del código del 2026-10-25) | Límite de intentos de recuperación por cuenta: 3 fallos bloquean 15 minutos y la espera se dobla hasta 24 horas (`RECOVERY_THROTTLE_POLICY`) | Implementado; no ejecutado en un dispositivo |
| Control existente y verificado | Límite sobre identificadores inexistentes en el dispositivo, con la misma política | Implementado |
| Control existente y verificado | Serialización de `start()` y `complete()` por base de datos (`a592e1b`) | Implementado, con pruebas de regresión |
| Control existente y verificado | Reto persistente de 2 preguntas durante 15 minutos | Implementado |
| Control existente y verificado | Resultado único («Datos ingresados incorrectos») que no indica qué respuesta falló; se verifican siempre las dos | Implementado |
| Control existente y verificado | Verificadores PBKDF2 con sal propia por respuesta; nada en texto plano | Implementado para respuestas con opciones; las respuestas escritas requieren el cambio de código descrito en E03-D5 |
| Riesgo conocido | El bloqueo depende de la hora del dispositivo (`remainingLockMs` compara con `Date.now()`): adelantar el reloj lo anula, así que quien tiene el dispositivo no tiene un límite real de intentos | Abierto |
| Riesgo conocido | No hay protección suficiente contra automatización: los controles anteriores son los únicos y dependen del reloj | Abierto |
| Riesgo conocido | Con el archivo de la base y su clave, las respuestas se prueban fuera de línea | Abierto |
| Riesgo conocido | La normalización de las respuestas no está validada en Hermes, incluida la descomposición `normalize('NFD')` | Abierto hasta la prueba correspondiente |
| Riesgo conocido | Respuestas conocidas, adivinables, cambiantes u olvidadas; preguntas redactadas para opciones (E03-D5) | Abierto |
| Mitigación futura propuesta | Combinar la hora del sistema con un reloj monótono en el límite de intentos | No implementada; cambio de código que requiere autorización |
| Mitigación futura propuesta | Mecanismo de mayor garantía: código de recuperación de alta entropía mostrado una vez al registrarse, o un canal verificado si algún día existe un servidor | Fuera del alcance actual; requiere modificar HU1 y HU3 |
| Prueba pendiente | Pruebas de registro y recuperación con respuestas escritas (normalización, respuesta vacía, longitud de 3 a 100 puntos de código, tildes, mayúsculas y espacios) | Tras autorizar la implementación |
| Prueba pendiente | P-D2 comprueba NFC, `\p{L}`, `\p{M}` y `\p{Nd}`, pero no `normalize('NFD')`, que usa `free-text-folded`; la comprobación en Hermes debe incluirlo | Pendiente; el procedimiento de P-D2 no se modifica en esta tarea |
| Prueba pendiente | P-D1 y ejecución del módulo nativo en un dispositivo | Pendiente (Etapa 02) |

**Consecuencias:**

- El paso 3 pide una respuesta escrita por pregunta, de 3 a 100 puntos de código tras normalizar (E03-D5); una respuesta vacía o fuera de ese rango se rechaza con «Error en los campos ingresados».
- La normalización `free-text-folded` (NFC, eliminación de tildes y diacríticos, minúsculas, espacios internos reducidos a uno y sin espacios externos) hace iguales «Bogotá» y «bogota». También iguala «ñ» y «n», porque elimina la virgulilla. No elimina la puntuación: «D.C.» y «DC» son distintas. La normalización no cambia.
- HU3 (Etapa 05) recibirá respuestas escritas con la misma normalización (E05-D3).
- El código de la Etapa 02 debe adaptarse (E05-D3 y la inconsistencia registrada en E03-D5).

**Alcance permitido y condición de revisión:**

- Solo una demostración académica controlada. La estrategia de recuperación no se considera adecuada para usuarios reales sin una revisión adicional de seguridad: la aplicación **no se distribuye a usuarios reales** mientras el mecanismo de recuperación y sus riesgos no se revisen y traten.
- Ni la app ni la documentación describen la recuperación como segura ni equivalente a un canal verificado.
- **Revisión obligatoria** antes de cualquier distribución más allá de la demostración, o si cambia el alcance (servidor, sincronización o usuarios reales). La revisión debe considerar las mitigaciones futuras de la tabla anterior.
- La aprobación de esta decisión no autoriza implementar HU1 ni distribuir el producto.

**Alternativas evaluadas:** (a) mantener las respuestas seleccionables (C-03), descartada
por su espacio de respuestas de 7 a 11 valores; (c) un mecanismo de mayor garantía,
registrado como evolución futura porque amplía el alcance.

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

- **Decisión:** con respuestas escritas (E03-D11, 2026-10-25) se aplica `free-text-folded`: NFC, eliminación de tildes y diacríticos, minúsculas, espacios internos reducidos a uno y recorte de los externos. Con respuestas seleccionables (C-03, sustituida en cuanto a la forma de responder), el verificador se calculaba sobre el identificador de la opción (`option-id`). Ambas variantes existen en el código y en `security_answers.normalization`; el uso de `free-text-folded` en el registro y la recuperación está pendiente de implementación.
- **Relación:** E05-D3 equivale a esta decisión.
- **Implementación y pruebas:** `canonicalSecret()`, `normalizeFreeTextAnswer()`; `secretNormalization.test.ts` y `secretVerifier.test.ts`.

## E03-D10 — Longitud máxima de contraseña

- **Decisión:** 128 puntos de código tras NFC; mínimo 8 (HU1, HU3). El límite evita entradas desmedidas sin restringir frases de contraseña largas.
- **Implementación y pruebas:** `PASSWORD_MAX_LENGTH`; `passwordPolicy.test.ts`.

## Especificación consolidada de HU1 (preparación del 2026-10-25)

Consolida HU1, las decisiones aprobadas y las recomendaciones pendientes. **La
aprobación de esta documentación no equivale a autorizar la implementación de HU1 ni a
aprobar la distribución del producto**, que está limitada a una demostración académica
controlada (E03-D11). Clasificación de las fuentes:

| Clase | Contenido |
|---|---|
| Requisito literal de HU1 | Campos, botones y los 19 criterios HU1-CA01 a CA19 (`trazabilidad.md`) |
| Decisión aprobada por el responsable | E03-D1 y E03-D2; A-W1 a A-W9, con sus textos; A-ID1 a A-ID4; E03-D4 (catálogo provisional CC, CE, PA y PPT, sin TI ni NIT, con desactivación del NIT en una migración posterior y selector de tipos activos); E03-D5 (preguntas conservadas, respuestas de 3 a 100 puntos de código, opciones conservadas sin uso); E03-D11; alcance de las migraciones (aclaración del 2026-10-25); textos de interfaz aprobados |
| Decisión técnica resuelta, respaldada por los requisitos | G-07; E03-D3; E03-D6 a E03-D10 |
| Pendiente de decisión o de evidencia | Reglas de caracteres por tipo (E03-D4, pendientes de verificación); criterio E03-V06 |

### Flujo del asistente

1. **Paso 1, «Identificación y datos personales»:** tipo de documento, documento, primer nombre, segundo nombre (opcional), primer apellido y segundo apellido (opcional). «Siguiente» valida el paso (E03-W02).
2. **Paso 2, «Contacto y acceso»:** código de país y número celular, correo y contraseña. «Siguiente» valida el paso y comprueba si el documento, el celular o el correo ya pertenecen a una cuenta (A-W3); si es así, muestra «El usuario se encuentra registrado» y no avanza.
3. **Paso 3, «Preguntas de seguridad»:** 5 preguntas no similares y la respuesta escrita de cada una (E03-D11). «Registrar» revalida los tres pasos (E03-W05), deriva los verificadores de la contraseña y de las 5 respuestas fuera de la transacción y, en una sola transacción, repite la comprobación de usuario registrado y crea usuario, credencial y respuestas (E03-W06, E03-W09).
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
| Migraciones | **Migración 1:** se permite modificarla antes de la primera entrega para incorporar la obligatoriedad del celular en el esquema y los demás cambios de A-ID1 a A-ID4 (A-ID4). **Migración 2:** se conserva sin modificar, con sus datos, sus preguntas y las opciones de respuesta, por compatibilidad (E03-D4, E03-D5). **Migración posterior:** marca el NIT como inactivo (E03-D4). Aclaraciones del responsable del 2026-10-25; no autorizan modificar código ni bases de datos | Decisión documentada; cambios pendientes de autorización |
| Secretos | Contraseña y respuestas solo como verificadores PBKDF2 con sal propia (E02-D1, HU1-CA06 y CA12); las respuestas, normalizadas con `free-text-folded` (E03-D11); nunca en registros, mensajes ni almacenamiento temporal; descartados de la memoria al terminar (E03-W08) | Verificadores implementados; respuestas escritas y manejo en la UI pendientes |
| Aislamiento de cuentas | El registro no abre una sesión (`SessionManager`) ni lee datos privados; la sesión la crea solo el inicio de sesión de HU2 tras autenticar | Regla de diseño |
| Apertura de la base | Se abre y se verifica al iniciar la app; si falla, se bloquean las funciones que dependen de ella y no se borra, reinicializa ni recrea (A-W9) | Decisión aprobada; implementación pendiente |

### Dependencias de HU1 y reservas de la Etapa 02

| Reserva | Relación con HU1 | ¿Bloquea HU1? | Momento de resolución |
|---|---|---|---|
| Entropía de las preguntas (E03-D11) | Decidida: respuestas escritas con riesgo residual aceptado solo para la demostración académica. El riesgo sigue abierto | No como decisión. Implementarla exige adaptar código de la Etapa 02 (E03-D5) | Riesgo documentado; revisión obligatoria antes de cualquier distribución |
| P-D2 — NFC y `\p{…}` en Hermes | La contraseña se normaliza con NFC; la validación de nombres (HU1-CA04, E03-D7) usa `\p{L}` y `\p{M}`; las respuestas escritas usan `normalize('NFD')` y `\p{M}`, y P-D2 no comprueba NFD | Bloquea la validación de nombres y la normalización de respuestas: un fallo cambiaría su implementación | Al empezar la implementación, antes de la UI, incluyendo NFD |
| P-D3 y ejecución del módulo nativo (E02-C8) | HU1 es la primera historia que abre la base y usa `GfpCrypto` en ejecución (primera ejecución, generación de la clave, BLOB de `op-sqlite`) | No bloquea el inicio; sí la verificación de HU1 en el emulador | Durante la Etapa 03, antes de su cierre |
| P-D1 — calibración de PBKDF2 | El registro deriva 6 verificadores; el tiempo de espera depende de las iteraciones (A-W8) | No: el parámetro está versionado | Antes del cierre de la Etapa 03 (E02-D1) |
| P-D7 — permiso `INTERNET` | HU1 no usa la red | No | Reserva documentada (E02-D7) |
| E02-D8 — umbrales del OCR | Pertenece a HU7 (Etapa 10) | No | Etapa 10 |
| Keystore sin respaldo por hardware demostrado | Protege la clave de la base donde se guardarán los datos de HU1; no cambia el diseño | No | Reserva documentada; no se afirma protección por hardware |
| E02-C6 parcial | Sus pendientes son P-D1, P-D7 y E02-D8 | No | Parcial hasta que se resuelvan; P-D1 antes del cierre de la Etapa 03 |

Ninguna reserva se da por resuelta.

Riesgo propio de HU1: la comprobación de usuario registrado al terminar el paso 2 permite
saber si un identificador ya existe. El mensaje es literal de HU1 y HU3 ya lo permite con
«Identificador incorrecto»; no se propone una limitación adicional.

## Cierre de la revisión documental de la Etapa 03 (2026-10-25)

El responsable formalizó el cierre de la revisión documental de la Etapa 03
(E03-REVISION). **El cierre es solo documental: no autoriza ni inicia HU1.**

- **Decisiones aprobadas:** asistente de tres pasos (E03-D1) con A-W1 a A-W9 y sus textos; celular obligatorio (E03-D2) y espacio de identificadores A-ID1 a A-ID4, con la posibilidad de modificar la migración 1 antes de la primera entrega; app solo para personas naturales, con CC, CE, PA y PPT, sin TI ni NIT (E03-D4; A-ID5 sin objeto); migración 2 sin modificaciones; desactivación del NIT en una migración posterior y selector de tipos activos; rechazo de tipos inactivos también en la lógica de registro (E03-V11); respuestas de seguridad escritas de 3 a 100 puntos de código tras `free-text-folded`, con las 10 preguntas conservadas (E03-D5, E03-D11); «Error en los campos ingresados» para campos inválidos; sin canal de soporte y mensaje «No fue posible abrir la base de datos. Reinicia la aplicación.» (A-W9). Las decisiones técnicas resueltas (G-07, E03-D3, E03-D6 a E03-D10) se mantienen.
- **Criterios:** HU1-CA01 a HU1-CA19 se conservan literalmente. E03-W01 a E03-W10 y E03-V01 a E03-V11 están definidos; E03-V05 está eliminado del alcance; todos los demás siguen pendientes de implementación y validación.
- **Pendientes técnicos:** implementar A-ID1 a A-ID4 (migración 1 e `IdentityRepository`); adaptar a respuestas escritas el código de la Etapa 02 que usa opciones (E03-D5); crear la migración que desactiva el NIT y filtrar los tipos activos (E03-V11); verificar las reglas de caracteres por tipo de documento (E03-V06); ampliar la comprobación de Hermes a `normalize('NFD')`.
- **Reservas heredadas de la Etapa 02:** P-D1, P-D2, P-D3 y P-D7; E02-D8; protección de claves por hardware no demostrada; E02-C6 parcial.
- **Riesgos de la recuperación por preguntas de seguridad (E03-D11):** bloqueo eludible cambiando el reloj del dispositivo, protección insuficiente contra automatización, prueba de respuestas fuera de línea con la base y su clave, y respuestas que pueden ser conocidas, adivinadas, cambiar u olvidarse. Uso limitado a una demostración académica controlada.
- **Siguiente paso:** autorización expresa del responsable para implementar HU1.

## Decisiones de otras etapas adelantadas por la WU del 2026-10-25

| ID | Decisión | Estado |
|---|---|---|
| E05-D1 | Límite de intentos de respuesta: 3 fallos bloquean 15 minutos y la espera se dobla en cada bloqueo hasta 24 horas | Resuelta técnicamente; se ratifica al iniciar la Etapa 05 |
| E05-D2 | Re-aleatorización de preguntas: las 2 preguntas se eligen al azar y se mantienen 15 minutos en un reto persistente | Resuelta técnicamente; se ratifica al iniciar la Etapa 05 |
| E05-D3 | Normalización de respuestas | Igual que E03-D9 |
| E04-D1 | Alcance y persistencia del bloqueo de inicio de sesión | Abierta para la Etapa 04; el esquema admite bloqueo por cuenta y por dispositivo |
| E04-D2 | Distinción documento/celular/correo | Definida en lo esencial por A-ID1 y A-ID2; se ratifica al iniciar la Etapa 04 |
