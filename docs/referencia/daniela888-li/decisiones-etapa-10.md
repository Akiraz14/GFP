# Decisiones de la Etapa 10 (HU7 Capturar gasto mediante factura o comprobante)

Fuentes:

- HU7 del documento de historias de usuario
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en `trazabilidad.md`);
- su prototipo, páginas 29 a 36 de la copia PDF revisada.

**Estado:** propuesta. Ninguna decisión está aprobada por el responsable.

## Resumen

| Decisión | Resolución propuesta |
|---|---|
| E10-D1 | La imagen se procesa al capturarla o elegirla. HU7-CA03 lo pide al presionar «Tomar fotografía» y el prototipo no muestra «Procesar imagen», aunque la lista de botones sí lo incluye |
| E10-D2 | Subtítulo del prototipo; HU7 trae otro texto en sus elementos visuales |
| E10-D3 | Un campo dudoso queda vacío: el monto se toma de una línea de total, de «Monto» o «Valor», o de un único valor con «$», la fecha debe ser válida y no futura, y con varias fechas sin rótulo no se elige ninguna (plan OCR, sección 4) |
| E10-D4 | Sin pantalla «Completar movimiento»: el formulario de HU4 cumple esa función con el aviso «No fue posible identificar toda la información. Complete los datos manualmente» |
| E10-D5 | Un fallo del OCR se trata como lectura sin datos (HU7-CA06). Un error de cámara o galería muestra un aviso propio |
| E10-D6 | «Registrar gasto con foto» (HU7) y «Movimiento con foto» (prototipo de HU5) son el mismo acceso; se usa el segundo |

## Calidad del OCR

No está evaluada. El plan de `plan-evaluacion-ocr.md` (60 imágenes) no se ha ejecutado y sus umbrales no están aprobados. Dos comprobantes reales probados en emulador obligaron a ajustar la extracción: una factura electrónica con columnas y un comprobante cuyo valor aparece como «Monto». Eso muestra que hay formatos sin cubrir.

