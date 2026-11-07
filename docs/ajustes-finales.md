# Ajustes finales de cierre (AJ-01 a AJ-05)

**Fecha:** 2026-11-06  
**Base:** `main` en `eae3374`, con cambios sin confirmar (sin commits, sin push).  
**Estado:** finalizado. Verificado con Jest, validado manualmente por el responsable en
Android 10 y aprobado el 2026-11-07, junto con E-AJ-D1 y E-AJ-D2. Cierre en
`cierre-proyecto.md`.

## 1. Ajustes

| ID | Cambio | Archivos principales | Pruebas automatizadas |
|---|---|---|---|
| AJ-01 | «Nuevo movimiento» y «Movimiento con foto» son botones flotantes sobre el historial (HU5, la pantalla principal tras iniciar sesión). Son los mismos botones de HU5 (`open-movement-form`, `open-receipt-capture`) con su navegación de siempre. El ícono `plus` se suma a `Icon` | `MovementHistoryScreen.tsx`, `historyTexts.ts`, `Icon.tsx` | `MovementHistoryScreen.test.tsx` «AJ-01» y navegación existente |
| AJ-02 | OCR: (1) `uprightLines()` mide la dirección de lectura con las esquinas de cada línea de ML Kit y endereza el documento antes de ordenar las filas (90°, 180° o 270°); un documento derecho no cambia. (2) Un número solo es importe si está suelto: se descartan los que forman parte de códigos o referencias y los enteros con cero inicial («03», «0003»). (3) Con «TOTAL» u otro rótulo, el importe es el primer número tras el rótulo. (4) El comercio omite avisos como «DOCUMENTO SINTÉTICO - SIN VALIDEZ» y el número de sucursal final con cero inicial. Si no hay un total fiable, el monto queda vacío y se corrige en HU4, como antes | `receiptExtraction.ts` | `receiptExtraction.test.ts` «AJ-02» (8): «COMERCIO DE PRUEBA 03» a 90°, 0°, 180° y 270°, «TIENDA FICTICIA 02», filas mezcladas y códigos |
| AJ-03 | Placeholder «Ingrese su contraseña» en la contraseña del inicio de sesión; seguridad, ojo y validación sin cambios | `LoginScreen.tsx`, `loginTexts.ts` | `LoginScreen.test.tsx` «AJ-03» |
| AJ-04 | «Consejo de Ahorro» cuando el mes actual tiene ingresos y su balance es positivo (E-AJ-D1) | `recommendations.ts`, `RecommendationsScreen.tsx` | `recommendations.test.ts` «AJ-04» (2), pantalla «AJ-04 and AJ-05» |
| AJ-05 | «Descartar» oculta la tarjeta solo durante la sesión (E-AJ-D2) | `recommendationService.ts`, `RecommendationsScreen.tsx` | `recommendationService.test.ts` «AJ-05» (4), pantalla |

Los dos documentos de prueba son las fichas 02 y 03 del plan OCR de la Etapa 02
(`ocrFixtures.ts` de `refs/revision/spike-02-v4`; generador en
`evidencias/ETAPA-02/archivo-spike-v4/tools/ocr-fixtures/`). Las imágenes no llegaron
adjuntas a la conversación, así que las pruebas reproducen su texto y su geometría (líneas de
ML Kit con recuadro y esquinas, giro horario de 90°) a partir de esa definición. La ejecución
real con ML Kit en el dispositivo queda para la validación manual. En la evidencia de la Etapa
02 (`V4/p4-batch.txt`), ML Kit reconoció todas las palabras de la ficha 03 (`tokenRecall=1`)
pero en otro orden (`similarity=0.355`): el defecto estaba en el orden de las filas y en tomar
el último número de la fila, no en el reconocimiento.

## 2. Hallazgos y decisiones

| ID | Hallazgo | Ajuste mínimo | Estado |
|---|---|---|---|
| E-AJ-D1 | AJ-04: el consejo no aparecía porque no existía la regla. E-CONS-D6 lo descartó porque los criterios de HU10 solo listan R1, R2 y R3. Sin embargo, HU10 incluye en sus elementos visuales la tarjeta «Informativo / Consejo (Azul/Verde): Comparativas positivas o hábitos estables», y el mockup muestra «Consejo de Ahorro» con «Mantienes un balance positivo este mes…» y «Balance actual». El modelo no tiene metas de ahorro | Se muestra cuando el mes actual tiene ingresos y los ingresos superan a los gastos (lo contrario de R1). Es la condición de E12-D2 de la compañera, con los datos existentes. Usa los textos del mockup, borde verde y «Ver movimientos asociados» (no hay «Ajustar meta de ahorro», por E12-D4). R1, R2 y R3 no cambian | Aprobada (2026-11-07). Desde E-REC-D1 tampoco se muestra con la «Alerta temprana de gasto» (`recomendaciones-ampliadas.md`) |
| E-AJ-D2 | AJ-05: el descarte se guardaba en la tabla cifrada `recommendation_dismissals` (migración 6) y duraba hasta fin de mes (I-27, E-CONS-D6) | El descarte se guarda en memoria, ligado al `sessionId`: se pierde al cerrar sesión o la aplicación, y la regla no cambia. Ya no se lee ni se escribe la tabla. La migración 6 no se modifica (son inmutables), así que los descartes guardados antes quedan sin efecto. HU10 describe el botón como «cerrar o quitar temporalmente» | Aprobada (2026-11-07); se aplica también a las reglas R4 a R8 |

`RecommendationDismissalRepository` y su tabla quedan sin uso en producción. Se conservan
porque la migración 6 ya fue entregada.

## 3. Validación manual (Android 10, AVD `Pixel_4_Android_10`)

Pruebas ejecutadas por el responsable (usuario) en el emulador Pixel 4 con Android 10, y
aprobadas el 2026-11-07 con el cierre del proyecto. Evidencias en
`C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\ajustes-finales\`, con capturas
adicionales de cada paso (`-final`, `-historial`, `-confirmacion`, `-continuar`, etc.) junto a la
principal.

| Paso | Escenario | Resultado esperado | Captura |
|---|---|---|---|
| AJ-V1 | Historial tras iniciar sesión; desplazar la lista; pulsar cada botón flotante | Los dos botones flotan abajo a la derecha y no tapan el último movimiento; abren el formulario de HU4 y la captura de HU7 | `AJ-V1-flotantes.png` |
| AJ-V2 | «Nuevo movimiento»: guardar un gasto de `45500` | Se guarda «$45.500» y vuelve al historial | `AJ-V2-movimiento.png` |
| AJ-V3 | «Movimiento con foto» con la imagen girada de «COMERCIO DE PRUEBA 03» | Monto «7.250», descripción «COMERCIO DE PRUEBA», fecha 21/03/2026 | `AJ-V3-comercio-03.png` |
| AJ-V4 | Ídem con «TIENDA FICTICIA 02» | Monto «58.900», descripción «TIENDA FICTICIA», fecha 03/02/2026 | `AJ-V4-tienda-02.png` |
| AJ-V5 | Inicio de sesión | La contraseña muestra «Ingrese su contraseña»; el ojo y la validación siguen igual | `AJ-V5-placeholder.png` |
| AJ-V6 | Recomendaciones con ingresos mayores que los gastos en el mes actual | Tarjeta verde «Consejo de Ahorro» con «Balance actual: +$…» | `AJ-V6-ahorro.png` |
| AJ-V7 | Pulsar la X de una tarjeta, cambiar de pestaña y volver | La tarjeta sigue oculta en la sesión | `AJ-V7-descartada.png` |
| AJ-V8 | Cerrar la app por completo (`am force-stop`), abrirla e iniciar sesión | La tarjeta vuelve a mostrarse si su condición se sigue cumpliendo | `AJ-V8-reaparece.png` |
