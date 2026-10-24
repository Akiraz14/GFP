# Imágenes sintéticas para P4 (rama experimental)

Fuente única de datos: `app/src/poc/ocrFixtures.ts`. Las imágenes `ocr-NN.jpg`, sus
`ocr-NN.expected.json` y `manifest.json` se generan a partir de ese archivo y **no se
versionan**: se guardan fuera de los repositorios.

```
node --experimental-strip-types tools/ocr-fixtures/export-fixtures.mjs > fixtures.json
python3 tools/ocr-fixtures/generate_synthetic_receipts.py fixtures.json <carpeta-externa-nueva> --font DejaVuSans.ttf
```

Todos los datos son ficticios (comercios «DE PRUEBA»/«FICTICIA», NIT 000000000-0,
documentos SINT-NNNN) y cada imagen lleva la leyenda «DOCUMENTO SINTÉTICO - SIN VALIDEZ»
y un testigo único `SINTOCR-NN-XXXXXX` que el análisis de privacidad busca en las
evidencias.
