# Validación de la Etapa 06 — HU8 Administrar categorías

Procedimiento para la validación de HU8 en Windows y en los emuladores del estándar del
proyecto: Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama
`e06/hu8-administrar-categorias`, con 24 suites y 362 pruebas. La validación en Windows y en los
emuladores está pendiente de ejecución por el responsable.

## Evidencias

- Todas las evidencias de esta etapa van a `GFP-evidencias\e06\` (G-10), fuera del repositorio.
- Los scripts de `scripts/stage-04/` usan por defecto `GFP-e04-evidencias`, así que se ejecutan
  siempre con `-EvidenceRoot` y una ruta absoluta. Cada ejecución crea su propia carpeta (con el
  prefijo `hu2-` heredado de la Etapa 04) y no sobrescribe ninguna existente.
- No se modifica ninguna evidencia anterior.
- Las cuentas son sintéticas. Las contraseñas no se anotan en ningún archivo.

## 1. Windows: controles estáticos, Jest y APK

Desde el repositorio canónico, en la rama de la etapa y con el árbol limpio:

```powershell
cd "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
git switch e06/hu8-administrar-categorias
git status --porcelain            # vacío
git log --oneline -1              # commit entregado
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\e06"
New-Item -ItemType Directory -Force $Ev | Out-Null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch e06/hu8-administrar-categorias -ExpectedTests 362 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot $Ev
```

| Paso | Resultado esperado |
|---|---|
| `Test-ScriptSyntax.ps1` | Sin errores |
| `Invoke-StaticChecks.ps1` | PASS=8 FAIL=0; Jest 362/362 |
| `Invoke-AndroidBuild.ps1` | PASS=4 FAIL=0; registra el SHA-256 del APK Debug |

## 2. Emulador: regresión automatizada de HU1 y HU2

En cada emulador, tras un arranque en frío con un solo emulador activo (mismo procedimiento que
en la Etapa 05):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Hu2DeviceTests.ps1 -Serial emulator-5554 -AllowAppReset -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Hu1DeviceRegression.ps1 -Serial emulator-5554 -AllowAppReset -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-HermesUnicodeCheck.ps1 -Serial emulator-5554 -EvidenceRoot $Ev
```

| Script | Resultado esperado |
|---|---|
| `Invoke-Hu2DeviceTests.ps1` | PASS=26 FAIL=0. La pantalla provisional de HU5 conserva su texto y ahora muestra además el botón «Categorías» |
| `Invoke-Hu1DeviceRegression.ps1` | Android 10: PASS=30 FAIL=0. Android 14: los 4 FAIL de `E03-V13` son el defecto conocido del script; se comprueban a mano en `ime-*.log` |
| `Invoke-HermesUnicodeCheck.ps1` | PASS=15 FAIL=0 |

La migración 4 se aplica al abrir la base en todas estas ejecuciones; ningún script debe
registrar `FATAL EXCEPTION`.

## 3. Recorrido manual de HU8

### Preparación

Metro en una ventana aparte:

```powershell
cd "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP\app"; npx react-native start --reset-cache
```

En la ventana principal, con el emulador encendido:

```powershell
Set-Location "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\e06"
& {
  $ErrorActionPreference = 'Stop'
  if ((adb devices | Select-String '^emulator-5554\s+device$').Count -ne 1) { throw 'emulator-5554 no esta conectado' }
  adb reverse tcp:8081 tcp:8081; if ($LASTEXITCODE -ne 0) { throw 'adb reverse fallo' }
  adb uninstall co.gfpsas.gestionfinanciera | Out-Null
  adb install app\android\app\build\outputs\apk\debug\app-debug.apk; if ($LASTEXITCODE -ne 0) { throw 'instalacion fallida' }
}
$Sdk = (adb shell getprop ro.build.version.sdk | Out-String).Trim()
$Run = Join-Path $Ev ("hu8-manual-api$Sdk-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory $Run | Out-Null
function Shot([string]$Name) { cmd /c "adb exec-out screencap -p > `"$Run\$Name.png`"" }
function Res([string]$Id, [string]$Estado, [string]$Obs) { Add-Content "$Run\resultados.md" "| $Id | $Estado | $Obs |" -Encoding UTF8 }
"sdk=$Sdk" | Out-File "$Run\entorno.txt" -Encoding UTF8
"| Paso | Estado | Observaciones |`n|---|---|---|" | Out-File "$Run\resultados.md" -Encoding UTF8
adb logcat -c
```

Registra por la app dos cuentas sintéticas, A y B (por ejemplo CC 6006001 y CC 6006002). En
cada paso: acción, `Shot 'c01'` (o `'c01a'`, `'c01b'`…) y `Res 'C01' 'PASS' '…'`. Atrás:
`adb shell input keyevent 4`.

### Pasos

| Paso | Criterio | Acción | Resultado esperado |
|---|---|---|---|
| C01 | HU8-CA01, CA02, E06-D2, E06-D4 | Inicia sesión con A. En la pantalla provisional de HU5, pulsa «Categorías» | «Categorías», «Gestiona tus etiquetas de ingresos y gastos», «+ Nueva categoría». En «Categorías del sistema», las 9 en el orden de HU8-CA01; Salario con «Ingreso» y las demás con «Gasto»; cada fila con candado y sin lápiz ni caneca. «Mis categorías» vacía, sin texto. Sin control «Volver» |
| C02 | E06-D4 | Atrás. Vuelve a pulsar «Categorías» | Atrás regresa a la pantalla provisional de HU5, sin cerrar la app |
| C03 | HU8-CA03, E06-D5, E06-D6b, E06-D6c | «+ Nueva categoría» | Formulario «Nueva categoría», «Personaliza tus ingresos y gastos.», «Nombre de la categoría» con «Ej: Mascotas», «Tipo de categoría» con «Gasto» seleccionado, «Ícono» con 12 opciones (carrito, casa, automóvil, cubiertos, corazón, libro, regalo, huella, pesa, maletín, avión y «•••»), «Cancelar» y «Guardar» deshabilitado |
| C04 | HU8-CA04 | Escribe `alimentación` | Bajo el campo, «La categoría ya existe»; «Guardar» deshabilitado |
| C05 | HU8-CA03 | Cambia el nombre a `Mascotas`, deja «Gasto», elige la huella y pulsa «Guardar» | El formulario se cierra; «Mascotas» aparece en «Mis categorías» con «Gasto», lápiz y caneca |
| C06 | HU8-CA04 | «+ Nueva categoría» → `MASCOTAS` | «La categoría ya existe»; «Guardar» deshabilitado. Pulsa «Cancelar»: no se crea nada |
| C07 | HU8-CA03, CA05 | Crea `Veterinaria`, «Gasto», huella; luego `Freelance`, «Ingreso», maletín | Las tres en «Mis categorías», por orden de creación; Mascotas y Veterinaria con el mismo ícono; Freelance con «Ingreso» |
| C08 | HU8-CA06, E06-D6b | Lápiz de «Mascotas» | «Editar categoría» con «Mascotas», «Gasto» y la huella cargados; botón «Guardar». Cambia a `Gimnasio` y la pesa → «Guardar»: la lista muestra «Gimnasio» en lugar de «Mascotas» |
| C09 | HU8-CA04 | Lápiz de «Gimnasio» → nombre `salud` | «La categoría ya existe»; «Guardar» deshabilitado. «Cancelar»: «Gimnasio» no cambia |
| C10 | E06-D9b | «+ Nueva categoría» → escribe 45 caracteres seguidos | El campo admite solo 40. «Cancelar» |
| C11 | HU8-CA07b | Caneca de «Veterinaria» | Modal con «¿Está seguro de eliminar esta categoría?», la categoría y la advertencia «Los movimientos asociados a esta categoría serán reasignados automáticamente a la categoría 'Otros'.»; «Cancelar» y «Confirmar». Pulsa «Cancelar»: «Veterinaria» sigue en la lista |
| C12 | HU8-CA07a, CA07c (eliminación) | Caneca de «Veterinaria» → «Confirmar» | «Veterinaria» desaparece; las 9 del sistema no cambian |
| C13 | Persistencia | Cierra la app (`adb shell am force-stop co.gfpsas.gestionfinanciera`), ábrela, inicia sesión con A y abre «Categorías» | «Gimnasio» y «Freelance» siguen en «Mis categorías» |
| C14 | HU8-CA04, CA06, CA07a, E06-D1a | Cierra la app, ábrela e inicia sesión con B; abre «Categorías». Crea `Gimnasio`, «Gasto», pesa | «Mis categorías» de B está vacía (no ve las de A). «Gimnasio» se crea sin aviso de duplicado |
| C15 | Estabilidad | `(adb logcat -d \| Select-String 'FATAL EXCEPTION\|Fatal signal').Count` | 0. Si no es 0, guarda `adb logcat -d > "$Run\logcat.txt"` y anótalo |

Las contraseñas no se escriben en ningún archivo. Ninguna categoría contiene datos personales.

## 4. Condiciones para aprobar

1. Windows: Jest 362/362, APK compilado.
2. Scripts de regresión en Android 10 y Android 14 sin fallos, salvo el defecto conocido de
   `E03-V13` en Android 14 confirmado a mano.
3. C01 a C15 en PASS en ambos emuladores, o con observaciones aceptadas por el responsable.
4. Comparación de las capturas con el prototipo de HU8 (E06-D5b: los emoji difieren de los
   íconos de trazo del prototipo).

## 5. Resultados

Pendiente de ejecución.
