# Guía de pruebas manuales en el emulador Android

Procedimiento reutilizable para probar cualquier módulo de GFP en el emulador, empezando siempre
por un arranque en frío (el emulador se cierra al terminar para liberar memoria RAM). Todos los
comandos son para **Windows PowerShell** y usan variables para las rutas.

| Etiqueta | Significado |
|---|---|
| **OBLIGATORIO** | Se ejecuta en todas las sesiones de prueba |
| **CONDICIONAL** | Solo si se cumple la condición indicada en el bloque |
| **OPCIONAL** | Para evidencia o diagnóstico adicional |

Datos del proyecto usados como valores predeterminados:

| Dato | Valor |
|---|---|
| Repositorio | `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP` |
| Paquete Android | `co.gfpsas.gestionfinanciera` |
| AVD | `Pixel_4_Android_10` (Android 10, API 29) |
| Evidencias | `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\` (fuera del repositorio) |
| APK Debug | `app\android\app\build\outputs\apk\debug\app-debug.apk` |
| APK Release | `app\android\app\build\outputs\apk\release\app-release.apk`; la copia de entrega está en `GFP Proyecto\entregables\` |

---

## 1. Secuencia recomendada de principio a fin

| Paso | Etiqueta | Bloque | Cuándo |
|---|---|---|---|
| 1 | OBLIGATORIO | [A. Preparación de la sesión](#a-preparación-de-la-sesión) | Siempre, en una terminal PowerShell nueva |
| 2 | OBLIGATORIO | [B. Arranque en frío](#b-arranque-en-frío) | Siempre |
| 3 | CONDICIONAL | [D. Verificaciones y compilación](#d-verificaciones-y-compilación) | Si hay que generar un APK nuevo (ver la tabla del bloque D) |
| 4 | CONDICIONAL | [C. Preparación de la aplicación](#c-preparación-de-la-aplicación) | Si la app no está instalada o hay un APK nuevo |
| 5 | CONDICIONAL | [E.1 Metro](#e1-metro-condicional-solo-con-el-apk-debug) | Solo con el APK Debug |
| 6 | OBLIGATORIO | [F.1 Iniciar Logcat](#f1-iniciar-logcat-obligatorio) | Antes de abrir la app |
| 7 | OBLIGATORIO | [E.2 Abrir la aplicación](#e2-abrir-la-aplicación-obligatorio) | Siempre |
| 8 | OPCIONAL | [G. Screenshots](#g-screenshots) | Durante la prueba, cuando se necesite evidencia |
| 9 | CONDICIONAL | [F.3 Consultar errores](#f3-consultar-los-logs-cuando-ocurre-un-error-condicional) | Si algo falla |
| 10 | OBLIGATORIO | [H. Finalización](#h-finalización) | Siempre, al terminar |

Sesión típica cuando el APK ya está instalado y solo se va a probar: pasos 1, 2, (5 si es Debug),
6, 7, 8 y 10.

> **Ninguna secuencia predeterminada desinstala la app ni borra datos.** `adb uninstall` y
> `pm clear` aparecen solo en el bloque C.4, con su advertencia.

---

## A. Preparación de la sesión

**OBLIGATORIO.** En una terminal PowerShell nueva. Cambie solo las tres variables marcadas para
otro módulo, otro AVD u otra carpeta de evidencias.

```powershell
Set-StrictMode -Version Latest

# Valores que se pueden cambiar en cada sesión
$Avd     = "Pixel_4_Android_10"                  # AVD a usar (ver la lista con -list-avds)
$Pkg     = "co.gfpsas.gestionfinanciera"         # paquete de la app
$Session = "sesion-$(Get-Date -Format 'yyyyMMdd-HHmm')"   # o un nombre: "ux-edicion", "hu4-movimientos"

# Rutas del proyecto y del SDK
$Repo   = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
$EvRoot = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias"
$Ev     = Join-Path $EvRoot $Session
$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$Adb = "$Sdk\platform-tools\adb.exe"
$Emu = "$Sdk\emulator\emulator.exe"
$ApkDebug   = "$Repo\app\android\app\build\outputs\apk\debug\app-debug.apk"
$ApkRelease = "$Repo\app\android\app\build\outputs\apk\release\app-release.apk"

# Repositorio, rama y estado de Git
Set-Location $Repo
git branch --show-current
git status --short          # vacío si no hay cambios sin confirmar
git log --oneline -1

# Herramientas y carpetas de evidencias
Test-Path $Adb; Test-Path $Emu                  # ambos deben ser True
"logs", "build" | ForEach-Object { New-Item -ItemType Directory -Force (Join-Path $Ev $_) | Out-Null }
Write-Host "Evidencias de esta sesión: $Ev"

# El AVD debe existir
& $Emu -list-avds
if (-not (& $Emu -list-avds | Where-Object { $_ -eq $Avd })) { Write-Warning "No existe el AVD $Avd" }
```

Las evidencias de cada sesión quedan en su propia carpeta y no se sobrescriben las anteriores.
Las carpetas de las capturas se crean solas al guardar la primera (bloque G).

**CONDICIONAL: hay más de un dispositivo conectado** (por ejemplo, el emulador y el celular). ADB
necesita saber a cuál dirigirse; la variable `ANDROID_SERIAL` lo fija para toda la terminal:

```powershell
& $Adb devices                      # muestra los seriales, p. ej. emulator-5554
$env:ANDROID_SERIAL = "emulator-5554"
```

---

## B. Arranque en frío

**OBLIGATORIO.** Inicia el AVD sin cargar el snapshot anterior. El arranque en frío **no borra**
los datos de la app instalada en el emulador (eso solo lo haría `-wipe-data`, que no se usa en
esta guía).

```powershell
# 1. Cerrar una instancia anterior del emulador, si existe (si no hay ninguna, no pasa nada)
& $Adb emu kill 2>$null
Start-Sleep -Seconds 3

# 2. Iniciar el AVD sin snapshot (se abre la ventana del emulador)
Start-Process -FilePath $Emu -ArgumentList '-avd', $Avd, '-no-snapshot-load'

# 3. Esperar a que ADB detecte el dispositivo
& $Adb wait-for-device

# 4. Esperar a que Android termine de arrancar (máximo 5 minutos)
$limit = (Get-Date).AddMinutes(5)
do {
  Start-Sleep -Seconds 3
  $boot = "$(& $Adb shell getprop sys.boot_completed 2>$null)".Trim()
} until ($boot -eq '1' -or (Get-Date) -gt $limit)
if ($boot -ne '1') { Write-Warning "Android no terminó de arrancar en 5 minutos" } else { Write-Host "Android arrancado" }

# 5. Versión de Android y SDK, y dispositivo disponible
& $Adb shell getprop ro.build.version.release   # 10
& $Adb shell getprop ro.build.version.sdk       # 29
& $Adb devices                                  # el emulador debe aparecer como "device", no "offline"
```

Si `adb devices` muestra `offline` o `unauthorized`, espere unos segundos y repítalo; si sigue
igual, cierre el emulador (bloque H) y repita este bloque.

---

## C. Preparación de la aplicación

Primero compruebe qué hay instalado:

```powershell
& $Adb shell pm list packages $Pkg              # vacío si la app no está instalada
& $Adb shell dumpsys package $Pkg | Select-String "versionName|versionCode|lastUpdateTime"
```

Android solo actualiza una app instalada si el APK nuevo tiene **el mismo paquete y la misma
firma**. El APK Debug está firmado con la clave de depuración y el Release con la clave propia
`gfp-release`; por eso uno no puede actualizar al otro.

| Caso | Bloque | ¿Conserva los datos? |
|---|---|---|
| La app no está instalada | C.1 Primera instalación | No hay datos previos |
| Hay un Debug instalado y se instala otro Debug | C.2 Reinstalar Debug | Sí |
| Hay un Release instalado y se instala otro Release | C.3 Actualizar | Sí |
| Hay que cambiar entre Debug y Release, o probar desde cero | C.4 Instalación limpia | **No: se borran** |

### C.1 Primera instalación (CONDICIONAL: la app no está instalada)

```powershell
& $Adb install $ApkDebug          # o $ApkRelease
```

### C.2 Reinstalar una versión Debug (CONDICIONAL: hay un APK Debug nuevo y ya hay un Debug instalado)

```powershell
& $Adb install -r $ApkDebug       # -r reemplaza la app y conserva la base cifrada y las cuentas
```

Con el APK Debug, los cambios **solo de JavaScript/TypeScript** no necesitan reinstalar: Metro
sirve el código nuevo (bloque E). Hay que compilar e instalar un Debug nuevo cuando cambia algo
nativo: recursos de Android (íconos, textos nativos), `build.gradle`, `AndroidManifest.xml` o
dependencias nativas.

### C.3 Actualizar una instalación existente (CONDICIONAL: hay un APK nuevo con la misma firma)

```powershell
& $Adb install -r $ApkRelease     # Success; conserva los datos
```

Si devuelve `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, la firma no coincide (por ejemplo, un Release
sobre un Debug). No desinstale sin pensarlo: vea C.4.

### C.4 Instalación limpia (CONDICIONAL: solo cuando la prueba exige empezar sin datos o la firma no coincide)

> **Advertencia.** `adb uninstall` borra la base cifrada, su clave del Android Keystore y todas
> las cuentas y movimientos de la app en ese dispositivo. No hay copia en la nube ni copia de
> seguridad de Android (`allowBackup="false"`): los datos **no se pueden recuperar**. `pm clear`
> también borra los datos. No los use por costumbre ni en un celular con datos reales.

```powershell
& $Adb uninstall $Pkg
& $Adb shell pm list packages $Pkg   # vacío
& $Adb install $ApkDebug             # o $ApkRelease
```

---

## D. Verificaciones y compilación

Estos comandos **no se ejecutan en cada sesión**. Use la tabla para decidir.

| Objetivo de la sesión | Comandos |
|---|---|
| Repetir una prueba con el APK ya instalado | Ninguno |
| Probar un cambio solo de JavaScript/TypeScript con Debug | Ninguno (Metro sirve el código); opcionalmente las pruebas de Jest (`guia-pruebas-automatizadas.md`) |
| Probar un cambio nativo (íconos, recursos, Gradle, manifiesto, dependencias nativas) | D.3 y, si falla, D.2 y de nuevo D.3 |
| Preparar una versión para integrar o entregar | D.1, D.3 y, para la entrega, el Release (D.4) |
| Se modificó algún script de `scripts\stage-04` | D.5 |

### D.1 Controles completos (CONDICIONAL: antes de integrar o tras cambiar dependencias)

`Invoke-StaticChecks.ps1` comprueba Node, la rama y el árbol de Git, y ejecuta `npm ci`,
`typecheck`, `lint`, `format:check` y Jest. Guarda los registros en una carpeta nueva dentro de
`-EvidenceRoot`.

- **Exige el árbol limpio:** con cambios sin confirmar termina en `BLOCKED CLEAN-TREE`. Mientras
  trabaja con cambios sin confirmar, use los comandos de `guia-pruebas-automatizadas.md`.
- **`-ExpectedBranch`:** su valor predeterminado es `e04/hu2-login` (histórico); indique la rama
  actual.
- **`-ExpectedTests`:** el número de pruebas que se espera que pasen. Si no coincide, solo falla
  la comprobación `JEST-COUNT`. Consulte el número real antes (sección H de
  `guia-pruebas-automatizadas.md`); no copie una cifra de una sesión anterior.
- **`-SkipNpmCi`:** omite `npm ci` (que reinstala `node_modules` y tarda) cuando las
  dependencias no cambiaron.

```powershell
$ExpectedTests = 712   # 712 era el total el 2026-11-07; sustitúyalo por el número real de hoy
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 `
  -ExpectedBranch (git branch --show-current) -ExpectedTests $ExpectedTests -EvidenceRoot "$Ev\build"
```

Si Jest falla por tiempo en Windows: `Set-Location "$Repo\app"; npx jest --testTimeout=30000 --runInBand; Set-Location $Repo`.

### D.2 `gradlew clean` (CONDICIONAL: errores de compilación inexplicables o cambios nativos que no se reflejan)

Borra las compilaciones nativas anteriores; la siguiente compilación tarda más.

```powershell
$env:JAVA_HOME = (Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' | Sort-Object Name -Descending | Select-Object -First 1).FullName
Push-Location "$Repo\app\android"; .\gradlew.bat clean --console=plain; Pop-Location
```

### D.3 APK Debug (CONDICIONAL: cambio nativo o no hay APK Debug)

`Invoke-AndroidBuild.ps1` usa JDK 17 solo en su proceso, ejecuta `assembleDebug` y registra el
SHA-256 en `apk-debug.txt`. Necesita `app\node_modules` instalado. Funciona con cambios sin
confirmar (solo comprueba que el estado de Git no cambie durante la compilación).

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot "$Ev\build"
Test-Path $ApkDebug; Get-FileHash $ApkDebug -Algorithm SHA256
```

Resultado esperado: `RESULTADO PASS=4 FAIL=0`. Después, instale según el bloque C.

### D.4 APK Release (CONDICIONAL: versión de entrega)

Pide las contraseñas de la clave `gfp-release` sin mostrarlas. Detalle en
`docs/guia-instalacion-ejecucion.md`, sección 5.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\release\Invoke-ReleaseBuild.ps1 -EvidenceRoot "$Ev\build"
```

### D.5 Sintaxis de los scripts (CONDICIONAL: se modificó un script de `scripts\stage-04`)

`Test-ScriptSyntax.ps1` analiza sin ejecutar los `.ps1` de `scripts\stage-04` (no los de
`release` ni `stage-07`) y exige que sean solo ASCII.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1   # RESULTADO ... con errores=0
```

---

## E. Inicio de Metro y de la aplicación

| APK | ¿Necesita Metro? |
|---|---|
| Debug (`app-debug.apk`) | **Sí.** No incluye el JavaScript: lo carga de Metro por el puerto 8081 |
| Release (`app-release.apk` o el de `entregables`) | **No.** Incluye el bundle JavaScript (`assets/index.android.bundle`) y abre sin Metro, sin servidor y sin USB |

### E.1 Metro (CONDICIONAL: solo con el APK Debug)

En una **segunda** terminal PowerShell, y dejándola abierta durante toda la prueba:

```powershell
Set-Location "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP\app"
npm start
```

Si aparece una pantalla roja de error de caché, detenga Metro con `Ctrl+C` y use
`npm start -- --reset-cache`.

En la terminal principal, redirija el puerto 8081 del emulador al PC. Hay que repetirlo **después
de cada arranque del emulador**:

```powershell
& $Adb reverse tcp:8081 tcp:8081
& $Adb reverse --list              # debe mostrar tcp:8081 tcp:8081
```

### E.2 Abrir la aplicación (OBLIGATORIO)

Primero inicie Logcat (bloque F.1) para registrar el arranque.

```powershell
& $Adb shell monkey -p $Pkg -c android.intent.category.LAUNCHER 1
```

Para reiniciar la app desde cero (sin borrar datos):

```powershell
& $Adb shell am force-stop $Pkg
& $Adb shell monkey -p $Pkg -c android.intent.category.LAUNCHER 1
```

---

## F. Registro de logs

Se usan dos registros complementarios:

- **Continuo** (F.1): escribe en un archivo mientras dura la prueba, filtrado a la app
  (`ReactNativeJS`, `ReactNative`) y a los cierres inesperados (`AndroidRuntime`).
- **Volcado completo** (F.2): al final se copia todo el búfer del dispositivo. Es el registro de
  referencia, porque al detener el proceso continuo con `Stop-Process` se puede perder lo que aún
  no había escrito.

> No use `>` para guardar la salida de `adb` en Windows PowerShell 5.1: crea archivos UTF‑16 (es
> lo que pasó con `GFP-evidencias\recomendaciones\build\logcat-completo.txt`). Esta guía guarda el
> volcado en el dispositivo y lo descarga con `adb pull`, como las capturas.

### F.1 Iniciar Logcat (OBLIGATORIO)

**Antes de abrir la app**, para capturar también su arranque:

```powershell
& $Adb logcat -c                   # limpia los logs anteriores
& $Adb logcat -G 16M               # búfer más grande para que el volcado final cubra la sesión (si falla, continúe)
$Logcat = Start-Process -FilePath $Adb -NoNewWindow -PassThru `
  -ArgumentList 'logcat', '-v', 'time', 'ReactNativeJS:V', 'ReactNative:V', 'AndroidRuntime:E', '*:S' `
  -RedirectStandardOutput "$Ev\logs\logcat-app.txt" -RedirectStandardError "$Ev\logs\logcat-app-err.txt"
Write-Host "Logcat activo (proceso $($Logcat.Id))"
```

Déjelo activo durante toda la prueba; no necesita otra ventana.

### F.2 Volcado completo (OBLIGATORIO al finalizar; OPCIONAL en cualquier momento)

```powershell
$Stamp = Get-Date -Format 'HHmmss'
& $Adb shell "logcat -d -v time > /sdcard/gfp-logcat.txt"
& $Adb pull /sdcard/gfp-logcat.txt "$Ev\logs\logcat-completo-$Stamp.txt" | Out-Null
& $Adb shell rm /sdcard/gfp-logcat.txt
```

### F.3 Consultar los logs cuando ocurre un error (CONDICIONAL)

Tome primero un volcado (F.2) y una captura (G). Después:

```powershell
# Cierres inesperados de la app (excepción nativa)
Select-String -Path "$Ev\logs\logcat-completo-*.txt" -Pattern 'FATAL EXCEPTION' -Context 0,30

# Mensajes del JavaScript y errores de React Native
Select-String -Path "$Ev\logs\logcat-app.txt", "$Ev\logs\logcat-completo-*.txt" -Pattern 'ReactNativeJS|AndroidRuntime' |
  Select-Object -Last 50

# Todo lo que registró el proceso de la app (si sigue abierta)
$AppPid = "$(& $Adb shell pidof $Pkg)".Trim()
if ($AppPid) { & $Adb logcat -d -v time --pid $AppPid | Select-Object -Last 100 }
```

Si `logcat-app.txt` queda vacío, use el volcado completo: contiene los mismos mensajes.

---

## G. Screenshots

**OPCIONAL** (obligatorio cuando el escenario pide evidencia). Defina la función una vez por
terminal, después de los bloques A y B:

```powershell
function Save-Screenshot {
  param(
    [Parameter(Mandatory = $true)][string]$Module,   # subcarpeta: "hu4-movimientos", "recomendaciones"...
    [Parameter(Mandatory = $true)][string]$Name      # nombre sin extensión: "REC-V1-sin-ingresos"
  )
  $dir = Join-Path $Ev $Module
  New-Item -ItemType Directory -Force $dir | Out-Null
  $file = Join-Path $dir "$Name.png"
  if (Test-Path -LiteralPath $file) { $file = Join-Path $dir ("{0}-{1}.png" -f $Name, (Get-Date -Format 'HHmmss')) }
  & $Adb shell screencap -p /sdcard/gfp-shot.png      # la captura se hace en el dispositivo
  & $Adb pull /sdcard/gfp-shot.png $file | Out-Null   # se descarga sin pasar por la consola (PNG intacto)
  & $Adb shell rm /sdcard/gfp-shot.png
  if (Test-Path -LiteralPath $file) { Write-Host "Captura: $file" } else { Write-Warning "No se guardó la captura $Name" }
}
```

Uso, tantas veces como haga falta:

```powershell
Save-Screenshot 'hu4-movimientos' 'HU4-V1-editar-antes'
Save-Screenshot 'hu4-movimientos' 'HU4-V1-editar-confirmacion'
```

Patrón de nombres usado en el proyecto: `<ID del escenario>-<escenario>[-<detalle>]`, por ejemplo
`REC-V6-reducido-estable-otras-categorias`. Si el nombre ya existe, la función añade la hora y no
sobrescribe la captura anterior.

**No use** `& $Adb exec-out screencap -p > archivo.png` en PowerShell: la redirección altera los
bytes y el PNG queda dañado.

---

## H. Finalización

**OBLIGATORIO** al terminar la sesión.

```powershell
# 1. Volcado final y detener Logcat
$Stamp = Get-Date -Format 'HHmmss'
& $Adb shell "logcat -d -v time > /sdcard/gfp-logcat.txt"
& $Adb pull /sdcard/gfp-logcat.txt "$Ev\logs\logcat-completo-$Stamp.txt" | Out-Null
& $Adb shell rm /sdcard/gfp-logcat.txt
if ((Get-Variable Logcat -ErrorAction SilentlyContinue) -and -not $Logcat.HasExited) { Stop-Process -Id $Logcat.Id }

# 2. Cerrar la app y el emulador (los datos de la app se conservan)
& $Adb shell am force-stop $Pkg
& $Adb emu kill
Start-Sleep -Seconds 5

# 3. Detener el servidor ADB
& $Adb kill-server

# 4. Evidencias conservadas
Get-ChildItem $Ev -Recurse -File | Select-Object FullName, Length
```

**CONDICIONAL: se usó Metro.** En su terminal, `Ctrl+C` y después cierre esa ventana.

**CONDICIONAL: se compiló en esta sesión.** Los procesos de Gradle quedan en memoria; deténgalos:

```powershell
Push-Location "$Repo\app\android"; .\gradlew.bat --stop; Pop-Location
```

**OPCIONAL: comprobar que no quedan procesos que consuman RAM.**

```powershell
Get-Process | Where-Object { $_.ProcessName -match '^(emulator|qemu-system|adb|java|node)' } |
  Select-Object ProcessName, Id, @{ n = 'RAM (MB)'; e = { [int]($_.WorkingSet64 / 1MB) } }
```

- `emulator` o `qemu-system-*`: el emulador sigue abierto. Ciérrelo desde su ventana o repita
  `& $Adb emu kill`.
- `java`: puede ser Gradle (use `gradlew --stop`) u otra aplicación; no la cierre si no sabe de
  qué proceso se trata.
- `node`: Metro u otra herramienta de Node.

Las evidencias quedan en `$Ev` (fuera del repositorio): `logs\` con los registros, `build\` con
los de compilación y una subcarpeta por módulo con las capturas. No se borran al cerrar.
