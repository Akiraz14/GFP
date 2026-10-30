# Validación de la Etapa 05 — HU3 Recuperar contraseña

Procedimiento para la validación final de HU3 en Windows y en los emuladores del estándar del
proyecto: Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-10-30):** Jest, `typecheck`, `lint` y `format:check` pasaron en Linux sobre
`cdc8923`, con 20 suites y 293 pruebas (`GFP-evidencias\e05\hu3-static-linux-20261030-030652\`). La
validación en Windows y en los emuladores está pendiente de ejecución por el responsable.

## Evidencias

- Todas las evidencias de esta etapa van a `GFP-evidencias\e05\` (G-10), fuera del repositorio.
- Los scripts de `scripts/stage-04/` usan por defecto `GFP-e04-evidencias`, así que en esta etapa
  se ejecutan siempre con `-EvidenceRoot` y una ruta absoluta.
- Cada ejecución crea su propia carpeta (los scripts le ponen el prefijo `hu2-` por herencia de la
  Etapa 04) y se niega a sobrescribir una existente.
- Los scripts rechazan una ruta de evidencias dentro del repositorio y al terminar comprueban que
  el estado de Git no cambió. `npm ci` y Gradle solo escriben en carpetas ignoradas
  (`node_modules`, `build`, `.gradle`).
- No se modifica ninguna evidencia anterior. Las de las Etapas 03 y 04 siguen en
  `GFP-e03-evidencias\` y `GFP-e04-evidencias\`.

## 1. Windows: controles estáticos, Jest y APK

Desde el repositorio canónico, en la rama de la etapa y con el árbol limpio:

```powershell
cd "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
git switch e05/hu3-recuperar-contrasena
git status --porcelain            # vacío
git log --oneline -1              # commit entregado
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\e05"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch e05/hu3-recuperar-contrasena -ExpectedTests 293 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot $Ev
```

| Paso | Qué ejecuta | Resultado esperado |
|---|---|---|
| `Test-ScriptSyntax.ps1` | Análisis sintáctico de los scripts | Sin errores |
| `Invoke-StaticChecks.ps1` | `npm ci`, `typecheck`, `lint`, `format:check` y Jest | PASS=8 FAIL=0; Jest 293/293 |
| `Invoke-AndroidBuild.ps1` | `assembleDebug` con JDK 17 | PASS=4 FAIL=0; registra el SHA-256 de `app\android\app\build\outputs\apk\debug\app-debug.apk` |

El APK Debug no incluye el JavaScript: Metro lo sirve desde el árbol probado.

## 2. Emulador: regresión automatizada de HU1 y HU2

Antes de cada ejecución, arranque en frío del emulador con un solo emulador activo:

1. Cierra los emuladores.
2. `emulator -avd <AVD> -no-snapshot-load`.
3. Espera a `sys.boot_completed=1`.
4. Espera 3 minutos más y comprueba que no hay avisos «… isn't responding».

Ejecuta los scripts en Android 14 y después en Android 10:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Hu2DeviceTests.ps1 -Serial emulator-5554 -AllowAppReset -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Hu1DeviceRegression.ps1 -Serial emulator-5554 -AllowAppReset -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-HermesUnicodeCheck.ps1 -Serial emulator-5554 -EvidenceRoot $Ev
```

| Script | Cambio en la Etapa 05 | Comprobaciones |
|---|---|---|
| `Invoke-Hu2DeviceTests.ps1` | Solo HU2-CA09: antes esperaba la pantalla provisional de HU3. Ahora espera el formulario real («Recuperar contraseña» y «Comenzar recuperación»), comprueba el estado de la app y guarda una captura | Las demás comprobaciones de HU2 (CA01 a CA08, CA10, CA06 con bloqueo, CA03 en la base y en `logcat`) y HU1-CA18 no cambian |
| `Invoke-Hu1DeviceRegression.ps1` | Sin cambios | P-D3, E03-V09, E03-V06 y E03-V13 |
| `Invoke-HermesUnicodeCheck.ps1` | Sin cambios | P-D2 |

Defectos conocidos de estos scripts (`etapa-04-pruebas-dispositivo.md`, conservados por E04-APROBACION):

- En el emulador Android 14, con la versión actual de Gboard, `E03-V13` da FAIL con «sin
  EditorInfo en logcat» aunque el teclado sea el correcto. Hay que confirmar a mano el tipo de
  teclado en `ime-*.log`.
- Los avisos ANR del sistema no se detectan. Por eso es necesario el arranque en frío con espera.

## 3. Emulador: recorrido manual de HU3

HU3 no tiene un recorrido automatizado. El recorrido se ejecuta a mano en cada emulador, con la app
instalada por `Invoke-AndroidBuild.ps1` y Metro en marcha (`cd app; npx react-native start`, y
`adb reverse tcp:8081 tcp:8081`). Para cada paso se guarda una captura en la carpeta de la
ejecución:

```powershell
$Run = Join-Path $Ev ("hu3-manual-emulator-5554-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory $Run | Out-Null
function Shot([string]$Name) { cmd /c "adb exec-out screencap -p > `"$Run\$Name.png`"" }
```

### Preparación

Reinstala la app (`adb uninstall co.gfpsas.gestionfinanciera` y `adb install` del APK) y registra
tres cuentas sintéticas por la interfaz (HU1). Anota en `$Run\datos.txt` las preguntas elegidas y
sus respuestas, pero nunca las contraseñas.

| Cuenta | Documento | Celular | Correo | Uso |
|---|---|---|---|---|
| A | CC 5005001 | +57 3105550001 | `hu3.a@example.com` | Recuperación correcta (R06 a R11) |
| B | CC 5005002 | +57 3105550002 | `hu3.b@example.com` | Bloqueo (R12) |
| C | CC 5005003 | +1 3105550001 (Canadá) | `hu3.c@example.com` | Celular ambiguo con A (R05) y reto vencido (R13) |

Contraseñas, respuestas y bloqueos:

- Usa contraseñas que cumplan la política, distintas por cuenta, y respuestas de 2 a 100
  caracteres.
- Solo dos identificadores inexistentes por sesión: el tercero bloquearía 15 minutos el inicio de
  la recuperación en todo el dispositivo (E05-D1).

### Pasos

| ID | Acción | Resultado esperado | Criterio |
|---|---|---|---|
| R01 | En el inicio de sesión, pulsa «Olvidé mi contraseña» | «Recuperar contraseña»; solo «Identificador» y «Comenzar recuperación» | HU2-CA09, HU3-CA01 |
| R02 | Pulsa «Comenzar recuperación» con el campo vacío | «Ingresa tu identificador.» junto al campo | HU3-CA03 |
| R03 | `hu3.a@example` | «Identificador incorrecto»; no cuenta como intento | HU3-CA03 |
| R04 | `noexiste@example.com` (una sola vez) | «Identificador incorrecto» | HU3-CA03 |
| R05 | `3105550001` | «Ingresa el número celular con el código de país» | A-ID2, E05-D7 |
| R06 | `HU3.A@example.com` | Aparecen 2 de las preguntas de A, «Nueva contraseña», «Confirmar nueva contraseña» y «Actualizar contraseña»; el identificador no se puede editar | HU3-CA02, HU3-CA04 |
| R07 | Atrás de Android; vuelve a entrar y empieza con `5005001` y después con `+573105550001` | El inicio de sesión aparece al pulsar Atrás; con los tres identificadores se muestran las mismas 2 preguntas (reto vigente) | E05-D6, HU3-CA02, E05-D2 |
| R08 | Respuestas vacías y una contraseña válida | «Ingresa la respuesta.» en ambas y el aviso «Datos ingresados incorrectos» | HU3-CA08, HU3-CA09 |
| R09 | Respuestas correctas y la contraseña `sinnumero!` | Requisito «Al menos un número» pendiente y aviso «Datos ingresados incorrectos» | HU3-CA05, HU3-CA09 |
| R10 | Respuestas correctas y una confirmación distinta | «La confirmación no coincide con la nueva contraseña.» y el aviso | HU3-CA07 |
| R11 | Una respuesta incorrecta | Aviso «Datos ingresados incorrectos»; se borran las respuestas y las contraseñas | HU3-CA09, HU3-CA10 |
| R12 | Respuestas correctas, contraseña nueva válida y confirmada | «La contraseña fue actualizada. Inicia sesión con la nueva contraseña.»; «Aceptar» abre el inicio de sesión | HU3-CA11, HU3-CA13 |
| R13 | Inicia sesión con A y la contraseña anterior; después, con la nueva | La anterior: «El campo identificación o contraseña son incorrectos»; la nueva: pantalla provisional de HU5 | HU3-CA12 |
| R14 | Con B: tres veces respuestas incorrectas; después, respuestas correctas | Tres veces «Datos ingresados incorrectos»; al cuarto intento, «Superaste los intentos permitidos. La recuperación queda bloqueada durante 15 minutos.» y vuelve el identificador. «Comenzar recuperación» con B repite el bloqueo | E05-D1 |
| R15 | Con C: «Comenzar recuperación» con `+13105550001`; espera 16 minutos; respuestas correctas y contraseña válida | «El tiempo para responder las preguntas terminó. Comienza la recuperación de nuevo.» y vuelve el identificador | E05-D2 |
| R16 | Contraseña en claro | `adb logcat -d` no contiene ninguna contraseña ni respuesta usada: `adb logcat -d \| Select-String -SimpleMatch '<valor>'` sin resultados para cada valor anotado a mano, sin guardarlo en archivos | HU3-CA06 |

Pruebas que necesitan preparación especial:

- **R05:** necesita dos cuentas con el mismo número nacional en países distintos (A y C).
- **R14:** deja B bloqueada entre 15 minutos y 24 horas, según los bloqueos previos.
- **R15:** exige esperar más de 15 minutos. Las imágenes `google_apis_playstore` no permiten
  `adb root`, así que no se puede adelantar el reloj de forma fiable.
- **HU3-CA12 con el inicio de sesión bloqueado (E05-D8):** opcional. Se hacen tres inicios de
  sesión fallidos, se recupera la cuenta y se comprueba que la contraseña nueva entra sin esperar.
  Jest ya lo cubre.

Anota el resultado de cada paso (PASS o FAIL, con una observación) en `$Run\resultados.md`.

## 4. Condiciones para aprobar la Etapa 05

1. Windows: `Invoke-StaticChecks.ps1` con 293/293 y `Invoke-AndroidBuild.ps1` sin fallos.
2. Android 14 y Android 10: `Invoke-Hu2DeviceTests.ps1`, `Invoke-Hu1DeviceRegression.ps1` e
   `Invoke-HermesUnicodeCheck.ps1` sin FAIL ni BLOCKED, salvo el defecto conocido de `E03-V13` en
   Android 14, que se confirma a mano.
3. Recorrido manual R01 a R16 en ambos emuladores, con sus capturas.
4. Comparación de la pantalla con el prototipo de HU3, que requiere sus imágenes.
5. Ratificación de E05-D1 a E05-D9 por el responsable.
