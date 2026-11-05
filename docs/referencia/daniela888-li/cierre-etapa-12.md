# Cierre de la Etapa 12 — HU10 Consultar recomendaciones financieras automáticas

**Veredicto: etapa pendiente de cierre.** El motor evalúa las tres reglas de la historia en el dispositivo, sobre los movimientos del mes actual y del anterior. Los criterios tienen pruebas en Jest, incluidos los límites del 50 % y del 30 %.

**Rama de trabajo:** `e12/hu10-recomendaciones`  
**Fecha del informe:** 2026-11-04

Este informe no aprueba la etapa ni autoriza su integración en `main`: esa decisión es del
responsable.

## Objetivo y alcance

Implementar HU10 Consultar recomendaciones financieras automáticas según sus 6 criterios literales (`trazabilidad.md`).

- Regla 1 de balance negativo, Regla 2 de categoría crítica y Regla 3 de incremento inusual.
- Tarjetas con severidad, descripción y datos de origen.
- «Ver movimientos asociados» abre el historial con filtros; Descartar oculta la tarjeta.
- Estado vacío y leyenda legal visibles según la historia.

Fuera del alcance: la meta de ahorro y compartir, que ninguna historia define.

## Decisiones de la etapa

Texto completo en `decisiones-etapa-12.md`. Ninguna está ratificada.

| Decisión | Asunto | Estado |
|---|---|---|
| E12-D1 | Regla 2 evaluada sobre el mes actual. Regla 3 exige gastos en el mes anterior; sin ellos no hay base de comparación. Se compara el mes en curso, aunque esté incompleto, con el mes anterior completo | Propuesta |
| E12-D2 | Se añade el «Consejo de Ahorro» con balance positivo, por los elementos visuales y el prototipo; los criterios solo listan tres reglas. Si se retira, HU10 queda solo con alertas | Propuesta |
| E12-D3 | Descartar quita la tarjeta hasta volver a abrir la pantalla («temporalmente») | Propuesta |
| E12-D4 | «Ajustar meta de ahorro» no se implementa, porque no existen metas; la tarjeta usa «Ver movimientos asociados» | Propuesta |
| E12-D5 | Compartir no se implementa, igual que en HU9 | Propuesta |

## Cambios principales

| Archivo | Cambio |
|---|---|
| `recommendations.ts` | Motor de reglas |
| `RecommendationsScreen.tsx` | Pantalla nueva |
| `AppNavigator.tsx` | Conecta la pestaña y los filtros |

## Validación

Jest 34 suites y 492 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e12/hu10-recomendaciones`.

Esos resultados corresponden a un entorno Linux de desarrollo. Falta repetirlos en el repositorio
canónico.
Los casos manuales de `validacion/etapa-12-pruebas-dispositivo.md` están pendientes en Android 10 y
Android 14.

## Reservas y pendientes

- La Regla 2 se evalúa sobre el mes actual (E12-D1).
- La Regla 3 compara el mes en curso, aún incompleto, con el anterior completo.
- El «Consejo de Ahorro» sale del prototipo y no de los criterios (E12-D2).
- Descartar no se conserva al volver a abrir la pantalla (E12-D3).

## Criterio común de cierre (`plan-etapas.md`)

| Punto | Estado |
|---|---|
| 1. Criterios en `trazabilidad.md` con estado y evidencia | Parcial: falta la evidencia en emulador |
| 2. Criterios parciales listados | Cumplido |
| 3. Pruebas automatizadas ejecutadas | Cumplido en Linux |
| 4. Compilación e instalación en Android 10 o superior | Pendiente |
| 5. Regresión de etapas anteriores | Solo en Jest |
| 6. Decisiones resueltas | Pendiente del responsable |
| 7. Informe de cierre | Este documento, sin aprobar |

## Pendiente del responsable

- Revisar la rama y ratificar o cambiar las decisiones.
- Ejecutar la validación en Windows y en los emuladores.
- Autorizar la integración con `git merge --no-ff`, la publicación y la etiqueta
  `etapa-12-aprobada`.
