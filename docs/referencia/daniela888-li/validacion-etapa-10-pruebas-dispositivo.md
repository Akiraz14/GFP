# Validación de la Etapa 10 — HU7 Capturar gasto mediante factura o comprobante

Procedimiento para validar la etapa en Windows y en los emuladores del estándar del proyecto:
Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest 31 suites y 473 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e10/hu7-movimiento-foto`. La validación en esos emuladores está pendiente. La integrante
del equipo abrió la app en `Medium_Phone_API_37.0`, sin ejecutar este procedimiento completo.

## Evidencias

Van a `GFP-evidencias\e10\` (G-10), fuera del repositorio, con cuentas sintéticas y sin
contraseñas ni datos personales.

## 1. Windows: controles y compilación

Desde `app/`, con JDK 17:

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run android
```

Resultado esperado: sin errores, 473 pruebas aprobadas y app instalada.

## 2. Pruebas manuales

Ejecutar cada caso en ambos emuladores y anotar el resultado.

| Caso | Procedimiento y resultado esperado | Estado |
|---|---|---|
| C01 | Elegir una imagen de la galería y, en dispositivo físico, tomar una foto (CA01). | Pendiente |
| C02 | Imagen GIF o mayor de 5 MB: mensaje literal (CA02). | Pendiente |
| C03 | Lectura completa: etiqueta COMPLETADO y resumen (CA03, CA04). | Pendiente |
| C04 | Lectura parcial: INCOMPLETO y «No identificado» (CA07). | Pendiente |
| C05 | Imagen ilegible: advertencia literal (CA06). | Pendiente |
| C06 | Continuar sin datos: formulario en Gasto y vacío (CA08). | Pendiente |
| C07 | Continuar con datos: campos precargados y editables (CA09, CA10). | Pendiente |
| C08 | Nada se guarda hasta confirmar en HU4 (CA05). | Pendiente |
| C09 | Reintentar y Cancelar (CA11, CA12). | Pendiente |
