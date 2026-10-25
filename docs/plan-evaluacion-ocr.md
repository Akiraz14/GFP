# Plan de evaluación de calidad del OCR (E02-D8)

Plan para la Etapa 10 (HU7). No implementa OCR ni aprueba su calidad: la evidencia de
la Etapa 02 (6 imágenes sintéticas, `evidencias/ETAPA-02/V4/p4-batch.txt`) solo
demuestra viabilidad, y la anomalía `similarity=0.355` de la imagen 03 sigue
registrada como limitación (E02-OCR). Este plan no bloquea HU1.

## 1. Campos evaluados

Los de HU7: **Monto**, **Fecha** y **Comercio/Descripción**.

## 2. Conjunto de pruebas

| Elemento | Definición |
|---|---|
| Tamaño mínimo | 60 imágenes: 40 fotografías de comprobantes reales con los datos personales tachados antes de capturarlas y 20 sintéticas |
| Variedad | Supermercado, restaurante, transporte, servicios públicos y facturas electrónicas impresas; iluminación buena y baja; inclinación hasta 15°; papel arrugado; formatos JPG y PNG de hasta 5 MB (HU7) |
| Etiquetado | Un archivo CSV versionado por imagen con `image_id`, `amount`, `date` (AAAA-MM-DD), `merchant`, `category_hint` y `capture_conditions`, revisado por dos personas |
| Privacidad | Ninguna imagen con nombres, documentos, direcciones o números de tarjeta legibles. Las imágenes reales no se versionan: se guardan fuera del repositorio con su manifiesto SHA-256 |

## 3. Métricas y umbrales propuestos

| Métrica | Definición | Umbral propuesto |
|---|---|---|
| Exactitud de monto | Monto extraído = monto etiquetado (dos decimales) | ≥ 90 % |
| Exactitud de fecha | Fecha extraída = fecha etiquetada | ≥ 85 % |
| Exactitud de comercio | Coincidencia normalizada (sin tildes ni mayúsculas) o similitud de tokens ≥ 0,8 | ≥ 75 % |
| Tasa de error silencioso | Campos completados con un valor incorrecto | ≤ 5 % por campo |
| Sin datos | Imágenes sin ningún campo identificado | Se informan; deben mostrar el mensaje de HU7 |
| Tiempo | Desde «Procesar imagen» hasta el resumen, en el dispositivo de P-D1 | p95 ≤ 5 s |

Los umbrales son una propuesta para aprobar al iniciar la Etapa 10.

## 4. Baja confianza y errores

- Un campo sin coincidencia clara o con varias candidatas se deja vacío en vez de adivinarlo (HU7: los campos no identificados quedan en blanco).
- Un monto o una fecha incompatibles con las reglas de HU4 (monto ≤ 0, fecha futura) no se precargan.
- Cada caso fallido se clasifica por causa (iluminación, inclinación, formato, tipografía, extracción) para dirigir las mejoras.

## 5. Confirmación humana

Ninguna transacción leída por OCR se guarda automáticamente (HU7): los datos van al
formulario de HU4, el usuario los revisa y guarda con su confirmación explícita. Las
pruebas de la Etapa 10 incluyen este criterio.

## 6. Registro reproducible

Cada ejecución guarda en `evidencias/ETAPA-10/<fecha>/` la versión de la app y de ML
Kit, el manifiesto SHA-256 del conjunto, los resultados por imagen y campo, las
métricas agregadas y el dispositivo. Solo se versionan resultados sin datos personales.
