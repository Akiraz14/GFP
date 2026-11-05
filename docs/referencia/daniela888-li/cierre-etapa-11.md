# Cierre de la Etapa 11 — HU9 Consultar análisis financiero

**Veredicto: etapa pendiente de cierre.** La pestaña Análisis calcula totales por período y muestra la dona y las líneas del prototipo. Los seis criterios tienen pruebas en Jest. `react-native-svg` es una dependencia nativa nueva y necesita aprobación; falta confirmar su compilación y los gráficos en emulador.

**Rama de trabajo:** `e11/hu9-analisis`  
**Fecha del informe:** 2026-11-04

Este informe no aprueba la etapa ni autoriza su integración en `main`: esa decisión es del
responsable.

## Objetivo y alcance

Implementar HU9 Consultar análisis financiero según sus 6 criterios literales (`trazabilidad.md`).

- Períodos: mes actual, últimos 3 meses, año actual y rango personalizado.
- Tarjetas de Total Ingresos, Total Gastos y Balance.
- Dona de gastos por categoría; al tocar un segmento se ve su monto y se puede abrir el historial filtrado.
- Evolución de Ingresos y Gastos por semana o por mes.

Fuera del alcance: compartir el análisis, que ninguna historia define.

## Decisiones de la etapa

Texto completo en `decisiones-etapa-11.md`. Ninguna está ratificada.

| Decisión | Asunto | Estado |
|---|---|---|
| E11-D1 | Dona y líneas, como el prototipo, con `react-native-svg` 15.16.0 (dependencia nativa nueva, exacta, pendiente de aprobación). Es compatible por declaración de la librería; falta la compilación en Windows. El dibujo sin curvas suavizadas difiere del prototipo | Propuesta |
| E11-D2 | «Cambiar tipo de gráfico»: botones «Por categoría» y «Evolución», un gráfico a la vez | Propuesta |
| E11-D3 | Hasta 62 días se agrupa por semana desde el inicio del rango; más, por mes | Propuesta |
| E11-D4 | Moneda local, `$1.250,00`, aunque HU9 muestre `$1,250.00`: prevalece HU6-CA02 | Propuesta |
| E11-D5 | El botón de compartir del prototipo no se implementa: ninguna historia lo define | Propuesta |
| E11-D6 | El estado vacío usa «+ Nuevo movimiento» en lugar de «Registrar movimiento» (E07-D2) | Propuesta |

## Cambios principales

| Archivo | Cambio |
|---|---|
| `financialAnalysis.ts` | Cálculos como funciones puras |
| `charts.tsx` | Dona y líneas |
| `AnalysisScreen.tsx` | Pantalla nueva |
| `package.json` | `react-native-svg` 15.16.0 |
| `AppNavigator.tsx` | Abre el historial con filtros desde Análisis |

## Validación

Jest 33 suites y 483 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e11/hu9-analisis`.

Esos resultados corresponden a un entorno Linux de desarrollo. Falta repetirlos en el repositorio
canónico.
Los casos manuales de `validacion/etapa-11-pruebas-dispositivo.md` están pendientes en Android 10 y
Android 14.

## Reservas y pendientes

- Solo se muestra un gráfico a la vez (E11-D2).
- Las líneas son rectas, sin el suavizado del prototipo.
- HU9 muestra `$1,250.00`; se usa `$1.250,00` por HU6-CA02.

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
  `etapa-11-aprobada`.
