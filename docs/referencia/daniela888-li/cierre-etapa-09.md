# Cierre de la Etapa 09 — HU6 Visualizar balance financiero

**Veredicto: etapa pendiente de cierre.** El resumen de Ingresos, Gastos y Balance queda en la parte superior del historial. Los cuatro criterios tienen pruebas en Jest; la actualización tras crear o editar se da al volver a la pantalla.

**Rama de trabajo:** `e09/hu6-balance`  
**Fecha del informe:** 2026-11-04

Este informe no aprueba la etapa ni autoriza su integración en `main`: esa decisión es del
responsable.

## Objetivo y alcance

Implementar HU6 Visualizar balance financiero según sus 4 criterios literales (`trazabilidad.md`).

- Bloques en verde, rojo y azul; el balance pasa a rojo si es negativo.
- Totales calculados con `SUM` sobre todos los movimientos del usuario.
- Formato `$1.250.000,00`, aplicado desde esta etapa a toda la app.

Fuera del alcance: los totales por período, que corresponden a HU9.

## Decisiones de la etapa

Texto completo en `decisiones-etapa-09.md`. Ninguna está ratificada.

| Decisión | Asunto | Estado |
|---|---|---|
| E09-D1 | Los totales cubren todos los movimientos del usuario y no cambian con los filtros del historial (HU6-CA01: «los registros del usuario») | Propuesta |
| E09-D2 | Formato `$1.250.000,00` con dos decimales en toda la app (HU6-CA02) | Propuesta |

## Cambios principales

| Archivo | Cambio |
|---|---|
| `BalanceSummary.tsx` | Componente nuevo |
| `movementRepository.ts` | `totalsOwn` |
| `movementRules.ts` | `formatAmount` con dos decimales y signo negativo |
| `MovementHistoryScreen.tsx` | Carga los totales y los recalcula al eliminar |

## Validación

Jest 29 suites y 435 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e09/hu6-balance`.

Esos resultados corresponden a un entorno Linux de desarrollo. Falta repetirlos en el repositorio
canónico.
Los casos manuales de `validacion/etapa-09-pruebas-dispositivo.md` están pendientes en Android 10 y
Android 14.

## Reservas y pendientes

- Los montos largos reducen su letra para caber; falta verlos en pantalla.
- Los totales no cambian con los filtros, según E09-D1.

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
  `etapa-09-aprobada`.
