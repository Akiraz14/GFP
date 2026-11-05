# Decisiones de la Etapa 06 (HU8 Administrar categorías de movimientos financieros)

Fuentes:

- HU8 del documento de historias de usuario
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en
  `trazabilidad.md`, sección «HU8 — criterios de aceptación (Etapa 06)»);
- su prototipo, seis imágenes: lista de categorías, «Nueva categoría», «Editar categoría», nombre
  duplicado, modal de eliminación y lista tras eliminar. Son las páginas 35, 37, 39, 41 y 43 del
  documento original según el responsable; en la copia PDF revisada, las páginas 40 a 43, 45 y
  46;
- el diseño de identidad aprobado en la Etapa 02 (`arquitectura-identidad.md`, E02-ID) y E02-D4;
- las propuestas de `decisiones-etapa-06.md` del repositorio paralelo `daniela888-li/GFP`, rama
  `e06/hu8-categories`, commit `350c184` (ver «Reutilización»).

**Estado (2026-11-04):** E06-D1, E06-D2, E06-D5 (catálogo), E06-D7 y la regla de tildes de
E06-D9 se resuelven con las fuentes. El responsable aprobó el 2026-11-04 E06-D1a, E06-D3,
E06-D4, E06-D5b, E06-D6b, E06-D6c y E06-D9b (E06-DEFINICION, `decisiones.md`). Ninguna decisión
cambia un criterio literal.

## Resumen

| Decisión | Asunto | Resolución | Origen |
|---|---|---|---|
| E06-D1 | Propiedad de las categorías personalizadas | Por usuario; las 9 del sistema, compartidas | Fuentes |
| E06-D1a | Alcance de la comprobación de duplicados | Contra las del sistema y las del usuario actual | Aprobada por el responsable |
| E06-D2 | Tipo de las categorías del sistema | Salario = Ingreso; las otras 8, incluida «Otros», = Gasto | Prototipo |
| E06-D3 | Movimientos de ingreso reasignados a «Otros» | Conservan su tipo; implementación en la Etapa 07 | Aprobada por el responsable |
| E06-D4 | Acceso a «Categorías» (incluye la barra inferior) | Botón en la pantalla provisional de HU5 y botón Atrás de Android; sin barra inferior en E06 | Aprobada por el responsable |
| E06-D5 | Catálogo de íconos | 12 en el selector; 3 más solo para categorías del sistema | Prototipo |
| E06-D5b | Representación de los íconos | Emoji, sin dependencias nuevas | Aprobada por el responsable |
| E06-D6 | Textos de HU8 y del prototipo | Literales de HU8 y del prototipo | Fuentes |
| E06-D6b | Botón del formulario | «Guardar» al crear y al editar | Aprobada por el responsable |
| E06-D6c | Nombre vacío, sección vacía y errores técnicos | «Guardar» deshabilitado; sección sin texto; mensajes del patrón de E05-D5 | Aprobada por el responsable |
| E06-D7 | Alcance de HU8-CA07c y HU8-CA08 | Parciales; se completan en las Etapas 07 y 08 | `trazabilidad.md` |
| E06-D9 | Reglas del nombre | Sin distinguir mayúsculas; se distinguen tildes; espacios normalizados | HU8-CA04 |
| E06-D9b | Longitud máxima del nombre | 40 caracteres (puntos de código) | Aprobada por el responsable |

## E06-D1 — Categorías personalizadas por usuario

- **Fuentes:** HU8-CA06 («las categorías creadas por él mismo»); `arquitectura-identidad.md`
  (E02-ID): las categorías del sistema están «compartidas en una tabla» y «HU8 añadirá sus tablas
  con `user_id`»; HU2-CA11 y E02-D4 (aislamiento lógico por usuario).
- **Resolución:** cada categoría personalizada pertenece a la cuenta que la creó (`user_id`). Las
  9 del sistema no tienen propietario (`user_id` nulo, `is_system = 1`) y todas las cuentas las
  ven. Una cuenta no ve, no edita ni elimina las categorías de otra: el repositorio toma siempre
  el usuario de la sesión activa (`OwnedRepository`).

### E06-D1a — Alcance de los duplicados (aprobada, 2026-11-04)

HU8-CA04 rechaza «un nombre que ya exista en la base de datos». Leído literalmente, una cuenta no
podría crear «Mascotas» si otra cuenta del dispositivo la tuviera, y el mensaje revelaría datos
de esa otra cuenta (HU2-CA11).

**Decisión:** el nombre se compara con las 9 categorías del sistema y con las personalizadas del
usuario actual, nunca con las de otras cuentas. Dos cuentas pueden tener una categoría con el
mismo nombre. Implementación: índice único parcial `(user_id, name_normalized)` y disparador que
impide repetir el nombre de una categoría del sistema.

## E06-D2 — Tipo de las categorías del sistema (prototipo)

HU8-CA01 enumera las 9 categorías sin tipo. El prototipo (lista) muestra **Salario = Ingreso** y
las otras ocho, incluida **«Otros», = Gasto**. Íconos de las categorías del sistema según la
lista del prototipo (E06-D5).

## E06-D3 — Movimientos de ingreso reasignados a «Otros» (aprobada, 2026-11-04)

- **Problema:** «Otros» es de tipo Gasto (E06-D2). Al eliminar una categoría de Ingreso, sus
  movimientos de ingreso pasan a «Otros» (HU8-CA07c), una categoría de tipo Gasto.
- **Alternativas descartadas:** impedir eliminar categorías de Ingreso con movimientos
  (contradice HU8-CA07c), hacer «Otros» válida para ambos tipos (contradice el prototipo), crear
  «Otros ingresos» (contradice las 9 categorías de HU8-CA01) y cambiar el movimiento a Gasto
  (altera el balance de HU6 y los análisis de HU9 y HU10).
- **Decisión:** todos los movimientos se reasignan a la única «Otros» y **cada movimiento
  conserva su tipo original**. Los cálculos usan el tipo del movimiento, no el de la categoría.
- **Implementación:** en la Etapa 07, cuando exista la tabla de movimientos. Regla para E07-D1:
  si el selector de HU4 filtra las categorías por tipo, «Otros» debe aceptarse también en los
  movimientos de ingreso, o un movimiento reasignado no podría editarse sin cambiar su categoría.
  E06 no implementa HU4.

## E06-D4 — Acceso a «Categorías» (aprobada, 2026-11-04, opción A)

- **Fuentes:** el prototipo muestra «Categorías» con la pestaña «Movimientos» activa y sin
  control para volver. Ninguna historia indica desde dónde se abre. Tras iniciar sesión se abre
  `movementHistory` (E04-D3), que es la pantalla provisional de HU5 (G-07).
- **Decisión:**
  - la pantalla provisional de HU5 muestra el botón «Categorías», único acceso hasta que la
    Etapa 08 implemente el historial real;
  - el botón Atrás de Android vuelve a esa pantalla, como en E05-D6, sin añadir un control
    «Volver» que el prototipo no muestra;
  - la barra inferior «Movimientos · Análisis · Recomendaciones» no se implementa en E06: es
    común a HU4, HU5, HU7, HU8, HU9 y HU10, y sus destinos no existen todavía. La etapa en que se
    crea queda por decidir.

## E06-D5 — Catálogo de íconos (prototipo)

Las categorías guardan un **identificador** de ícono (`categories.icon`), nunca el glifo.

| Identificador | Ícono | En el selector | Uso en el sistema |
|---|---|---|---|
| `cart` | Carrito | Sí | — |
| `home` | Casa | Sí | Vivienda |
| `car` | Automóvil | Sí | Transporte |
| `food` | Cubiertos | Sí | Alimentación |
| `heart` | Corazón | Sí | Salud |
| `book` | Libro | Sí | Educación |
| `gift` | Regalo | Sí | — |
| `pet` | Huella | Sí | — |
| `dumbbell` | Pesa | Sí | — |
| `briefcase` | Maletín | Sí | — |
| `plane` | Avión | Sí | — |
| `more` | Tres puntos | Sí | Otros |
| `gamepad` | Control de juego | No | Entretenimiento |
| `shopping-bag` | Bolsa de compras | No | Compras |
| `wallet` | Billetera | No | Salario |

El selector de los formularios ofrece los **12** íconos del prototipo, en su orden. Los tres
últimos solo aparecen en la lista del prototipo, en categorías del sistema, así que no se
ofrecen para las personalizadas (diferencia con el repositorio paralelo, que ofrecía 15).

### E06-D5b — Representación (aprobada, 2026-11-04, opción a)

Emoji, sin dependencias nuevas, en un único componente (`CategoryIcon.tsx`). Los íconos de trazo
del prototipo no se reproducen; cambiar a una biblioteca de íconos más adelante solo afecta a ese
componente, sin migración de datos.

## E06-D6 — Textos

Literales de HU8: «Categorías», «Gestiona tus etiquetas de ingresos y gastos», «Nueva categoría»,
«Nombre de la categoría», «Tipo de categoría», «Ingreso», «Gasto», «Ícono», «Guardar»,
«Cancelar», «Editar», «Eliminar», «Confirmar», «La categoría ya existe», «¿Está seguro de
eliminar esta categoría?» y «Los movimientos asociados a esta categoría serán reasignados
automáticamente a la categoría 'Otros'.».

Del prototipo: «+ Nueva categoría», «Categorías del sistema», «Mis categorías», «Editar
categoría», «Personaliza tus ingresos y gastos.» y «Ej: Mascotas». El aviso de duplicado aparece
bajo el campo mientras se escribe y «Guardar» queda deshabilitado (prototipo, nombre duplicado).

No se muestran: el contador «9» junto a «Categorías del sistema» (solo en una imagen) ni la línea
«N movimientos serán reasignados» del modal, que necesita los movimientos de la Etapa 07
(E06-D7).

### E06-D6b — Botón del formulario (aprobada, 2026-11-04)

«Guardar» al crear y al editar: es el literal de HU8. El prototipo muestra «Crear categoría»,
«Guardar cambios» y «Guardar» en imágenes distintas.

### E06-D6c — Estados que las fuentes no definen (aprobada, 2026-11-04)

| Situación | Comportamiento |
|---|---|
| Nombre vacío o sin ícono elegido | «Guardar» deshabilitado, sin mensaje, igual que con el duplicado |
| «Mis categorías» sin categorías | La sección se muestra vacía, sin texto |
| Error de la base | «No fue posible cargar las categorías. Intenta de nuevo», «No fue posible guardar la categoría. Intenta de nuevo» o «No fue posible eliminar la categoría. Intenta de nuevo», en un aviso con «Aceptar», sin detalles internos (patrón de E05-D5) |
| Categoría eliminada o protegida entre la lectura y la escritura | «La categoría ya no existe.» o «Esta categoría no se puede modificar.» |

Al crear, «Gasto» está preseleccionado, como en el prototipo.

## E06-D7 — Alcance de HU8-CA07c y HU8-CA08

- **HU8-CA07c:** la tabla de movimientos se crea en la Etapa 07. En E06 la eliminación borra la
  categoría dentro de una transacción y el identificador fijo de «Otros» es `other`
  (`OTHER_CATEGORY_ID`). En E07 se añade en esa misma transacción la reasignación de los
  movimientos (E06-D3) y el recuento del modal. Recomendación para E07: la clave foránea de los
  movimientos hacia `categories` no debe borrar en cascada.
- **HU8-CA08:** `listActiveCategories(session, type?)` lee siempre de la base, sin caché; una
  categoría creada o editada aparece en la consulta siguiente. Se completa en E07 (formulario de
  HU4) y E08 (filtros de HU5), como prevé `trazabilidad.md`.

## E06-D9 — Reglas del nombre

| Regla | Resolución | Origen |
|---|---|---|
| Mayúsculas y minúsculas | No se distinguen: clave `name_normalized` calculada con `toLowerCase()` en TypeScript, porque `lower()` de SQLite solo convierte ASCII | HU8-CA04 |
| Tildes | Se distinguen («Alimentacion» ≠ «Alimentación») | HU8-CA04 solo pide no distinguir mayúsculas |
| Espacios | Se recortan al inicio y al final y los internos repetidos se reducen a uno; forma NFC | Normalización del dato: « Salud » no es un nombre distinto de «Salud» |
| Caracteres | Sin restricción | HU8 no restringe |
| Orden de «Mis categorías» | Por fecha de creación | Prototipo |

### E06-D9b — Longitud máxima (aprobada, 2026-11-04)

**Decisión funcional:** el nombre admite como máximo **40 caracteres**, contados en puntos de
código como en E03-D5 y como `length()` de SQLite. El campo no admite más de 40 caracteres y la
base lo comprueba (`CHECK`). HU8 no fija un máximo; el límite se adopta por robustez de la base y
de la pantalla.

## Reutilización del repositorio paralelo

Fuente: `https://github.com/daniela888-li/GFP`, rama `e06/hu8-categories`, creada desde
`bc824fe` (`main` anterior a la Etapa 05). Se trató solo como fuente de consulta.

| Commit de origen | Contenido | Uso |
|---|---|---|
| `350c184` | Decisiones propuestas y trazabilidad | Base de este documento, con las resoluciones de arriba |
| `76d5821` | Migración 4, catálogos y pruebas de migración | Reutilizado |
| `12dcbcb` | Repositorio, reglas, servicio, pantallas, textos, acceso y pruebas | Reutilizado con adaptaciones |
| `fd9bf4b` | Validación en emulador API 37 | No reutilizable: una sola versión de Android, árbol sin commit y evidencias fuera de G-10 |
| `main` (`b669d0f`) | Variante anterior de la Etapa 04 | Descartado |

Adaptaciones (`5efd51d`): selector de 12 íconos (E06-D5); `toLowerCase()` y longitud en puntos de
código (E06-D9, E06-D9b); «Guardar» deshabilitado en lugar de los mensajes de campo vacío
(E06-D6c); sin texto en la sección vacía (E06-D6c); botón Atrás de Android en lugar del enlace
«Volver» (E06-D4); `update()` devuelve solo campos de `Category`; fusión con la pantalla de
recuperación de la Etapa 05 en `AppNavigator.tsx` y `App.test.tsx` (`a6092af`).
