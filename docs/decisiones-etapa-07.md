# Decisiones de la Etapa 07 (HU4 Registrar y editar movimiento financiero)

Fuentes:

- HU4 del documento de historias de usuario
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en
  `trazabilidad.md`, sección «HU4 — criterios de aceptación (Etapa 07)») y su prototipo (páginas
  18 a 20 de la copia PDF revisada);
- HU8-CA07c y HU8-CA08, que se completan en esta etapa (E06-D3, E06-D7);
- el plan de las Etapas 07 a 13 aprobado por el responsable el 2026-11-04 (PLAN-E07-E13 en
  `decisiones.md`): decisiones D-01 a D-08 e interpretaciones I-01 a I-30.

**Estado (2026-11-04):** las decisiones pendientes de la Etapa 07 en `plan-etapas.md` (D1 a D5)
quedan resueltas por D-01, D-02, D-03 y las interpretaciones aprobadas. Las decisiones internas
E07-D6 a E07-D9 aplican esas decisiones sin cambiar ningún criterio literal.

## Resumen

| Decisión | Asunto | Resolución | Origen |
|---|---|---|---|
| E07-D1 | Categorías según el tipo | Del mismo tipo, más «Otros» para ambos; al cambiar el tipo se borra la categoría incompatible; al editar se acepta la categoría actual | D-02, E06-D3 |
| E07-D2 | Botones y tipo inicial | «Guardar movimiento», «Limpiar» y «Cancelar» al crear; «Actualizar» y «Cancelar» al editar; Gasto preseleccionado | HU4 y prototipo |
| E07-D3 | Destino de «Cancelar» | El historial (HU5), también con el botón Atrás de Android | HU4-CA12 |
| E07-D4 | Confirmación del registro | Pantalla «¡Operación exitosa!» con el resumen y «Volver al historial»; el formulario queda limpio | Plan aprobado (I-03) |
| E07-D5 | Montos | Centavos enteros; formato «$1.250.000,00»; máximo 999.999.999.999,99; dos decimales | D-01, I-04 |
| E07-D6 | Fechas | Sin hora, en la fecha local; «DD/MM/AAAA» escrita o elegida en el calendario nativo, que no permite fechas futuras | D-03, I-06 |
| E07-D7 | Reasignación al eliminar una categoría | En la misma transacción que la eliminación; el modal indica cuántos movimientos se reasignan | HU8-CA07c, E06-D3 |
| E07-D8 | Descripción | Espacios externos recortados; vacía se guarda como nula; máximo 250 caracteres (puntos de código) con contador | HU4-CA06 |
| E07-D9 | Alcance de la etapa | Edición sin punto de entrada hasta la Etapa 08; sin barra de navegación inferior | `trazabilidad.md`, E06-D4 |

## E07-D1 — Categorías según el tipo del movimiento

- **D-02:** el selector muestra solo las categorías activas del tipo elegido y «Otros», que sirve
  para ingresos y gastos (E06-D3). Al cambiar el tipo, si la categoría elegida no es compatible
  se borra y el usuario debe elegir otra; «Otros» se conserva.
- **Edición:** si una categoría personalizada cambió de tipo después de registrar el movimiento
  (HU8-CA06 lo permite), el movimiento conserva su categoría y el formulario la ofrece al
  editarlo. Cambiar el tipo de una categoría no modifica sus movimientos.
- **Base de datos:** la migración 5 solo admite categorías del sistema o del propietario del
  movimiento (`movement_category_not_accessible`). El tipo se comprueba en el servicio, porque
  depende de la regla anterior.

## E07-D2 — Botones y tipo inicial

HU4 nombra «Guardar movimiento» en la lista de botones y «Registrar» en el criterio CA07; se usa
«Guardar movimiento», que coincide con el prototipo. Al editar se usa «Actualizar», como dice
HU4-CA07. «Limpiar» solo aparece al crear: al editar, vaciar el formulario perdería los datos
cargados (HU4-CA10). El tipo inicial es Gasto, como en el prototipo.

## E07-D3 — Destino de «Cancelar»

HU4-CA12 permite «la vista principal o el historial». La vista principal tras iniciar sesión es el
historial (E04-D3, `AUTHENTICATED_HOME_ROUTE`), así que ambos destinos coinciden. «Cancelar» y el
botón Atrás de Android descartan los cambios sin guardar. Hasta la Etapa 08 el historial es la
pantalla provisional de HU5.

## E07-D4 — Confirmación del registro

Tras registrar, la app muestra «¡Operación exitosa!», el mensaje literal «El movimiento fue
registrado exitosamente» (HU4-CA08), un resumen (monto, tipo, categoría, fecha y descripción) y
«Volver al historial». El formulario queda limpio (HU4-CA09): al volver a abrirlo empieza con los
valores iniciales. Al editar, el mensaje «El movimiento fue actualizado exitosamente» se muestra
en el mismo formulario.

## E07-D5 — Montos

- Se guardan en centavos enteros (`amount_cents`, `INTEGER`), entre 1 y 99.999.999.999.999.
- Se aceptan dígitos con separador de miles «.» y decimal «,» («1.250.000,50»), solo dígitos
  («45500»), o el formato inverso cuando tiene los dos separadores («1,250,000.50»). Un único
  punto seguido de uno o dos dígitos se lee como decimal («45.50»). Se ignoran «$» y los espacios.
- Se rechazan: cero, negativos, más de dos decimales, grupos de miles mal formados, notación
  científica y separadores sin dígitos. El mensaje es el literal «Ingrese un monto válido».
- Se muestran como «$1.250.000,00» (D-01) con una función propia, sin depender del soporte de
  idiomas de Hermes. HU6 y HU9 usarán la misma función.

## E07-D6 — Fechas

- Se guardan como `AAAA-MM-DD`, sin hora, con la fecha local del dispositivo. La base exige una
  fecha real (`date(occurred_on) IS occurred_on`).
- El campo «Fecha» empieza con la fecha de hoy (HU4-CA03) y admite escritura manual con el
  formato «DD/MM/AAAA». El botón 📅 abre el calendario nativo de Android
  (`@react-native-community/datetimepicker` 9.2.2, `DateTimePickerAndroid.open`, modo `date`) con
  la fecha de hoy como máxima.
- Una fecha posterior a hoy muestra «La fecha no puede ser futura» (HU4-CA04); una fecha que no
  existe o con otro formato, «Ingresa una fecha válida con el formato DD/MM/AAAA».
- **Compatibilidad (D-03):** la versión 9.2.2 declara `react-native: *` como dependencia par,
  soporta la nueva arquitectura (`newArchEnabled=true`), toma `minSdkVersion` del proyecto (29),
  no declara permisos y añade `com.google.android.material:material` 1.12.0. La compilación en
  Windows no se pudo ejecutar en el entorno de Claude; se comprueba con `Invoke-AndroidBuild.ps1`
  e `Invoke-Hu4ApkCheck.ps1` (`validacion/etapa-07-verificacion.md`).

## E07-D7 — Reasignación al eliminar una categoría (HU8-CA07c)

- `CategoryManagementService.remove()` mueve los movimientos del usuario a «Otros» (`other`)
  antes de eliminar la categoría, en la misma transacción. Si la eliminación falla, no cambia
  ningún movimiento. Los movimientos conservan su tipo, monto, fecha y descripción (E06-D3).
- La clave foránea `movements.category_id` impide eliminar una categoría que todavía tenga
  movimientos, como última barrera.
- El modal de HU8-CA07b conserva el texto literal y añade, si hay movimientos, la línea
  «N movimientos serán reasignados.» («1 movimiento será reasignado.»).

## E07-D8 — Descripción

Opcional (HU4-CA06). Se normaliza a NFC, se recortan los espacios externos y una descripción
vacía se guarda como nula. El máximo de 250 caracteres se cuenta en puntos de código, como el
nombre de las categorías (E06-D9b), y la base lo comprueba también. El contador «n/250» se pone
rojo al superar el máximo, y al guardar aparece «La descripción admite máximo 250 caracteres».

## E07-D9 — Alcance de la etapa

- **Edición:** el formulario y el servicio admiten la edición y tienen pruebas, pero el punto de
  entrada (el botón «Editar» del historial, HU5-CA07) llega en la Etapa 08. Por eso HU4-CA07 y
  CA08 en su variante de edición, CA10 y CA12 siguen como parciales previstos.
- **Barra de navegación inferior** («Movimientos», «Análisis», «Recomendaciones»): no se
  implementa en esta etapa. El formulario se abre con «+ Nuevo movimiento» desde la pantalla
  provisional del historial, junto al botón «Categorías» de E06-D4.
- **Ícono del tipo:** flecha verde ↑ para ingreso y roja ↓ para gasto, con emoji y texto, sin
  dependencias nuevas (como E06-D5b).

## Pruebas automatizadas de la etapa

Jest en Linux, 30 suites y 491 pruebas, todas aprobadas (2026-11-04), con `typecheck`, `lint` y
`format:check` sin errores. Archivos nuevos: `money.test.ts`, `localDate.test.ts`,
`movementRules.test.ts`, `movementManagement.test.ts`, `movementMigration.test.ts` y
`MovementFormScreen.test.tsx`; ampliados: `categoryManagement.test.ts`,
`CategoriesScreen.test.tsx`, `App.test.tsx`, `migrator.test.ts` y `categoryMigration.test.ts`.

Sin pruebas manuales en esta etapa (D-07): el recorrido manual de HU4 forma parte de la
validación integral posterior a la Etapa 13.
