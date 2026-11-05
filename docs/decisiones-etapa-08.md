# Decisiones de la Etapa 08 (HU5 Consultar historia de movimientos financieros)

Fuentes:

- HU5 del documento de historias de usuario
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en
  `trazabilidad.md`, sección «HU5 — criterios de aceptación (Etapa 08)») y su prototipo
  (páginas 24 y 25 de la copia PDF revisada);
- los criterios parciales previstos de HU4 (CA07 y CA08 al editar, CA10, CA12) y HU8-CA08;
- el plan de las Etapas 07 a 13 aprobado el 2026-11-04 (PLAN-E07-E13 en `decisiones.md`).

**Estado (2026-11-04):** las decisiones pendientes de la Etapa 08 en `plan-etapas.md` (D1 a D3)
quedan resueltas como E08-D1 a E08-D3. E08-D4 a E08-D7 aplican el plan sin cambiar ningún
criterio literal.

## Resumen

| Decisión | Asunto | Resolución | Origen |
|---|---|---|---|
| E08-D1 | Tipo de borrado | Borrado físico del movimiento | Plan aprobado (interpretación de borrado físico) |
| E08-D2 | Botón «Movimiento con foto» | No se muestra hasta la Etapa 10 (HU7) | Alcance de la etapa |
| E08-D3 | Rango de fechas | Ambos extremos opcionales e incluidos; fecha fin no anterior a la de inicio | Propuesta de E08 |
| E08-D4 | Barra de navegación inferior | «Movimientos», «Análisis» y «Recomendaciones» en todas las pantallas con sesión | HU4, HU5, HU8, HU9, HU10 |
| E08-D5 | Aplicación de los filtros y estado inicial | Solo con «Filtrar»; al abrir y con «Limpiar filtros» se ve todo el historial | HU5-CA03, botón «Limpiar filtros» |
| E08-D6 | Tarjeta del movimiento | Ícono y nombre de la categoría, monto con signo, descripción, fecha y tipo; sin hora | Prototipo, D-01, I-06 |
| E08-D7 | Resumen de totales (HU6) | No se implementa en esta etapa | Plan de etapas (HU6 en E09) |

## E08-D1 — Borrado físico

«Confirmar» elimina la fila de `movements` (`DELETE`), solo si pertenece al usuario de la
sesión. No hay papelera ni recuperación, como advierte el texto literal del modal («Esta acción
es irreversible y afectará su balance.»).

## E08-D2 — Botón «Movimiento con foto»

El prototipo y la lista de botones de HU5 incluyen «Movimiento con foto», que abre HU7. HU7 es
la Etapa 10; un botón sin función sería engañoso y quedaría fuera del alcance. Se añade en la
Etapa 10 junto con la captura. Hasta entonces la ruta `receiptCapture` sigue provisional y sin
acceso.

## E08-D3 — Rango de fechas

- «Fecha inicio» y «Fecha fin» admiten `DD/MM/AAAA` escrita o el calendario nativo (D-03), con
  hoy como fecha máxima del calendario.
- Ambas son opcionales: sin inicio no hay límite inferior y sin fin no hay límite superior.
  Ambos extremos se incluyen.
- Una fecha que no existe o con otro formato muestra «Ingresa una fecha válida con el formato
  DD/MM/AAAA». Si la fecha fin es anterior a la de inicio, se muestra «La fecha fin no puede ser
  anterior a la fecha inicio». En ambos casos no se filtra.
- El prototipo muestra «Últimos 30 días» como valor del campo; HU5 no define rangos
  predefinidos y «Limpiar filtros» debe mostrar «todo el historial», así que el rango empieza
  vacío.

## E08-D4 — Barra de navegación inferior

- Pestañas «Movimientos» (historial, HU5), «Análisis» (HU9) y «Recomendaciones» (HU10), con
  glifos de emoji y texto, sin dependencias nuevas (como E06-D5b).
- Aparece en todas las pantallas con sesión: historial, formulario de HU4, categorías de HU8 y
  las pantallas de HU9 y HU10. En el formulario y en las categorías se marca «Movimientos».
- Cambiar de pestaña desde el formulario lo cierra sin guardar, como «Cancelar».
- «Análisis» y «Recomendaciones» abren las pantallas provisionales hasta las Etapas 11 y 12.
- El acceso a «Categorías» (E06-D4) pasa a un botón en la cabecera del historial.

## E08-D5 — Aplicación de los filtros

- Los filtros se editan sin cambiar la lista; solo «Filtrar» la actualiza (HU5-CA03).
- «Limpiar filtros» restablece los cuatro filtros y muestra todo el historial.
- El filtro «Categoría» ofrece «Categoría (Todas)» y todas las categorías activas (sistema y
  propias), consultadas al abrir el historial, sin caché (HU5-CA02, HU8-CA08). No se filtra por
  el tipo elegido: la combinación de un tipo y una categoría incompatibles da el estado vacío
  de HU5-CA04.
- Tras eliminar, la lista se recarga con los filtros aplicados.
- Sin movimientos y sin filtros, el estado vacío dice «No hay movimientos registrados» (elemento
  visual de HU5) con el subtítulo «Registra tu primer ingreso o gasto con «Nuevo movimiento».»
  (propuesta). Con filtros aplicados se usa el texto literal de HU5-CA04.

## E08-D6 — Tarjeta del movimiento

- Ícono de la categoría (E06-D5b), su nombre en mayúsculas, el monto con signo («+» para
  ingresos en verde, «-» para gastos en rojo, formato D-01), la descripción, o el nombre de la
  categoría si no tiene, y «DD/MM/AAAA • Gasto».
- Sin hora: los movimientos guardan solo la fecha (I-06); el prototipo muestra «Hoy, 14:32».
- Orden: fecha del movimiento descendente y, en la misma fecha, el último registrado primero
  (HU5-CA01).
- La lista se dibuja completa dentro de la pantalla desplazable, sin paginación. Es suficiente
  para el volumen esperado de una persona; si la validación final mostrara lentitud con muchos
  movimientos, se registraría como limitación.

## E08-D7 — Resumen de totales

El banner «Ingresos, Gastos y Balance» del historial es HU6, que el plan ubica en la Etapa 09.
No se muestra en esta etapa.

## Edición desde el historial (HU4)

«Editar» abre el formulario de HU4 en modo edición con los datos del movimiento (HU5-CA07,
HU4-CA10). «Actualizar» guarda y muestra «El movimiento fue actualizado exitosamente» en el
formulario (E07-D4). «Cancelar», Atrás o la pestaña «Movimientos» vuelven al historial sin
guardar (HU4-CA12), y el historial se recarga al volver.

## Pruebas automatizadas de la etapa

Jest en Linux, 32 suites y 519 pruebas, todas aprobadas (2026-11-04), con `typecheck`, `lint` y
`format:check` sin errores. Archivos nuevos: `movementFilters.test.ts` y
`MovementHistoryScreen.test.tsx`; ampliados: `movementManagement.test.ts` y `App.test.tsx`.

Sin pruebas manuales en esta etapa (D-07): el recorrido manual de HU5 forma parte de la
validación integral posterior a la Etapa 13.
