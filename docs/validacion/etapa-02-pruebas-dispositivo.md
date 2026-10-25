# Pruebas pendientes en dispositivo — Etapa 02

Pruebas acotadas que no pueden ejecutarse en el entorno de Claude ni en Jest. Ningún
resultado está registrado todavía; cada prueba indica dónde se archiva su evidencia.
Ejecutor: Juan (G-02).

## P-D1 — Calibración de PBKDF2 (E02-D1)

**Objetivo:** confirmar o ajustar las 600 000 iteraciones provisionales para que una
derivación tarde aproximadamente un segundo en el dispositivo mínimo compatible.

**Dispositivo:** el teléfono físico con Android 10 (API 29) o superior de menor
rendimiento disponible para el proyecto. El emulador solo sirve como referencia: no
sustituye esta prueba.

**Procedimiento (no instala la app ni toca sus datos):**

```powershell
adb devices
adb push app\android\app\build\outputs\apk\debug\app-debug.apk /data/local/tmp/gfp-calibration.apk
adb shell CLASSPATH=/data/local/tmp/gfp-calibration.apk app_process /system/bin co.gfpsas.gestionfinanciera.crypto.Pbkdf2Calibration 600000 5
adb shell rm /data/local/tmp/gfp-calibration.apk
```

`Pbkdf2Calibration` usa la misma clase `Pbkdf2HmacSha256` y el mismo proveedor
`Mac("HmacSHA256")` que la app. Primero comprueba 5 vectores de referencia y después
mide 5 derivaciones de 32 bytes.

**Criterio de aceptación:**

1. `GFP-PBKDF2|vectors_result|OK|failed=0`. Si falla, la implementación nativa no se usa y se informa el bloqueo.
2. Con `medianMs` ≤ 1 200 se mantienen 600 000 iteraciones.
3. Con `medianMs` > 1 200, el nuevo valor es `600000 × 1000 / medianMs`, redondeado hacia abajo a la decena de millar, y se repite la medición con ese valor.
4. El valor nunca baja de 310 000 iteraciones. Si hiciera falta menos para acercarse a un segundo, se mantiene 310 000 y se registra el tiempo real para que el responsable decida.
5. Un cambio se aplica en `PROVISIONAL_PBKDF2_ITERATIONS` (con su nombre actualizado) y en este documento. Los registros existentes se regeneran tras un inicio de sesión correcto (`needsRehash()`).

**Evidencia:** salida completa, modelo, versión de Android y fecha en
`evidencias/ETAPA-02/dispositivo-<YYYYMMDD>/p-d1.txt`.

## P-D2 — Normalización Unicode en Hermes (E02-D2)

**Objetivo:** confirmar que Hermes ofrece `String.prototype.normalize('NFC')` y las
expresiones `\p{L}`, `\p{M}` y `\p{Nd}` que usan las políticas.

**Entorno:** emulador o dispositivo con el APK Debug y Metro; el motor Hermes es el
mismo en ambos.

**Procedimiento:** con la app abierta, abrir React Native DevTools (tecla `j` en Metro)
y evaluar en la consola:

```js
['n\u0303'.normalize('NFC') === '\u00f1', /\p{L}/u.test('\u00f1'), /\p{Nd}/u.test('7'), /\p{M}/u.test('\u0303')]
```

**Criterio de aceptación:** `[true, true, true, true]`. Cualquier `false` o excepción
bloquea HU1 hasta sustituir la función afectada.

**Evidencia:** captura o copia de la consola en `evidencias/ETAPA-02/dispositivo-<YYYYMMDD>/p-d2.txt`.

## P-D3 — Clave SQLCipher ante reinstalación (E02-D3)

**Objetivo:** confirmar que, tras desinstalar y reinstalar, la app empieza de cero sin
datos residuales, y que una base sin su clave no se borra ni se sustituye.

**Entorno:** un AVD nuevo dedicado a la prueba, nunca el emulador con la app de pruebas
de concepto ni datos del usuario. Requiere la apertura de la base desde la app, que se
conecta al iniciar la Etapa 03.

**Procedimiento:** instalar el Debug en el AVD aislado; abrir la app para crear la clave y
la base; desinstalar con `adb uninstall co.gfpsas.gestionfinanciera`; reinstalar y abrir.

**Criterio de aceptación:** tras reinstalar, `openEncryptedDatabase` crea una clave y una
base nuevas sin error. La base anterior no existe.

**Evidencia:** `evidencias/ETAPA-03/<fecha>/p-d3/`.

## P-D7 — Retirada de `INTERNET` (E02-D7)

**Objetivo:** decidir si el APK final puede prescindir de `INTERNET`, que hoy declaran el
manifiesto de la app (Metro en Debug) y `com.google.android.datatransport`, la
telemetría de ML Kit.

**Procedimiento:** en una rama de prueba, añadir
`<uses-permission android:name="android.permission.INTERNET" tools:node="remove" />` a
un manifiesto solo de Release; compilar el Release en la ruta corta; instalarlo en el AVD
aislado; procesar con OCR las 6 imágenes sintéticas con el modo avión activado y sin él;
revisar logcat.

**Criterio de aceptación:** el OCR devuelve resultados en ambos casos y no aparece
ninguna `SecurityException` ni cierre. Si se cumple, se propone retirar `INTERNET` del
Release; si no, se conserva con su motivo.

**Evidencia y momento:** al implementar HU7 (Etapa 10) o, a más tardar, en la Etapa 13.
