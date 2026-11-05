# Cierre de la Etapa 10 — HU7 Capturar gasto mediante factura o comprobante

**Veredicto: etapa pendiente de cierre.** El flujo de HU7 está completo con cámara, galería y ML Kit, y nada se guarda sin pasar por el formulario de HU4. **La calidad del OCR no está evaluada.** En las pruebas del emulador, una factura electrónica y un comprobante de RappiCard mostraron fallos de lectura que obligaron a ajustar la extracción; el resultado del último ajuste no se ha confirmado.

**Rama de trabajo:** `e10/hu7-movimiento-foto`  
**Fecha del informe:** 2026-11-04

Este informe no aprueba la etapa ni autoriza su integración en `main`: esa decisión es del
responsable.

## Objetivo y alcance

Implementar HU7 Capturar gasto mediante factura o comprobante según sus 12 criterios literales (`trazabilidad.md`).

- Tomar fotografía y seleccionar de la galería, con validación de JPG, PNG y 5 MB.
- Lectura de Monto, Fecha y Comercio en el dispositivo.
- Revisión con los estados COMPLETADO, INCOMPLETO e IMAGEN BORROSA.
- Paso al formulario de HU4 con los datos reconocidos y el resto en blanco.

Fuera del alcance: la evaluación de calidad del plan E02-D8 y la selección automática de categoría.

## Decisiones de la etapa

Texto completo en `decisiones-etapa-10.md`. Ninguna está ratificada.

| Decisión | Asunto | Estado |
|---|---|---|
| E10-D1 | La imagen se procesa al capturarla o elegirla. HU7-CA03 lo pide al presionar «Tomar fotografía» y el prototipo no muestra «Procesar imagen», aunque la lista de botones sí lo incluye | Propuesta |
| E10-D2 | Subtítulo del prototipo; HU7 trae otro texto en sus elementos visuales | Propuesta |
| E10-D3 | Un campo dudoso queda vacío: el monto se toma de una línea de total, de «Monto» o «Valor», o de un único valor con «$», la fecha debe ser válida y no futura, y con varias fechas sin rótulo no se elige ninguna (plan OCR, sección 4) | Propuesta |
| E10-D4 | Sin pantalla «Completar movimiento»: el formulario de HU4 cumple esa función con el aviso «No fue posible identificar toda la información. Complete los datos manualmente» | Propuesta |
| E10-D5 | Un fallo del OCR se trata como lectura sin datos (HU7-CA06). Un error de cámara o galería muestra un aviso propio | Propuesta |
| E10-D6 | «Registrar gasto con foto» (HU7) y «Movimiento con foto» (prototipo de HU5) son el mismo acceso; se usa el segundo | Propuesta |

## Cambios principales

| Archivo | Cambio |
|---|---|
| `receiptExtraction.ts` | Extracción de datos y unión de columnas por posición |
| `receiptImage.ts` | Validación de formato y tamaño |
| `nativeReceiptGateway.ts` | Adaptador de `react-native-image-picker` y ML Kit |
| `ReceiptCaptureScreen.tsx` | Pantalla nueva |
| `MovementFormScreen.tsx` | Admite datos precargados |

## Validación

Jest 31 suites y 473 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e10/hu7-movimiento-foto`.

Esos resultados corresponden a un entorno Linux de desarrollo. Falta repetirlos en el repositorio
canónico.
Los casos manuales de `validacion/etapa-10-pruebas-dispositivo.md` están pendientes en Android 10 y
Android 14.

## Reservas y pendientes

- Faltan la evaluación con 60 imágenes y la aprobación de sus umbrales.
- La cámara no se ha probado en esta pantalla.
- El adaptador nativo no tiene pruebas en Jest.
- La pantalla «Completar movimiento» del prototipo se reemplaza por el formulario de HU4 (E10-D4).

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
  `etapa-10-aprobada`.
