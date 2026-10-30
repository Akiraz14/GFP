# Etapa 04 (HU2): regresion de HU1 en un emulador desechable con la app de la rama de HU2,
# que ahora empieza en el inicio de sesion. Repite las comprobaciones de E03 en dispositivo:
# P-D3 (instalacion limpia y reinstalacion), E03-V09 (fallo controlado y reversible al abrir
# la base), E03-V06 y E03-V13 (regla y teclado por tipo de documento). HU1-CA18 se comprueba
# en Invoke-Hu2DeviceTests.ps1. Solo usa datos de prueba del emulador y los restaura.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Hu1DeviceRegression.ps1 -Serial emulator-5554 [-AllowAppReset] [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [Parameter(Mandatory = $true)][string]$Serial,
  [switch]$AllowAppReset,
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot 'lib\Common.ps1')
try { $null = Initialize-Run 'hu1-regression' $EvidenceRoot $Serial } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }
$Pkg = 'co.gfpsas.gestionfinanciera'
$Adb = Get-AdbPath
. (Join-Path $PSScriptRoot 'lib\DeviceUi.ps1')
if ($Adb -and $Adb -match '\s') { Stop-Blocked 'ADB' "la ruta de adb contiene espacios: $Adb" }
$App = Join-Path $script:RepoRoot 'app'
$Apk = Get-DebugApk
if (-not (Test-Path -LiteralPath $Apk)) { Stop-Blocked 'APK' 'no existe el APK Debug; ejecute antes Invoke-AndroidBuild.ps1' }
Initialize-Device $Serial
Start-Metro $App
& $Adb logcat -c 2>&1 | Out-Null
Install-FreshApp $Apk -AllowAppReset:$AllowAppReset
$Ready = $script:LoginButton

function Check-ErrorScreen([string]$Id, [string]$Shot) {
  $seen = Wait-Any @($script:DbError, $Ready) 120
  $ui = Get-Ui; Save-Ui $Shot
  Screenshot $Shot | Out-Null
  $texts = @(Get-Nodes $ui | ForEach-Object { $_.text } | Where-Object { $_ })
  $inputs = @(Get-Nodes $ui | Where-Object { $_.class -eq 'android.widget.EditText' -or $_.clickable -eq 'true' })
  $leak = @($texts | Where-Object { $_ -match 'Error:|Exception|key_lost|key_rejected|SQLITE|sqlcipher|stack|undefined' })
  Check $Id ($seen -eq $script:DbError) "pantalla de error con el mensaje aprobado (visto: '$seen')"
  Check "$Id-BLOCKED" (($texts -notcontains $Ready) -and ($texts -notcontains 'Paso 1 de 3') -and $inputs.Count -eq 0) "sin inicio de sesion, asistente ni controles accionables (elementos accionables: $($inputs.Count))"
  Check "$Id-NO-LEAK" ($leak.Count -eq 0 -and $texts.Count -eq 1) ('solo se muestra el mensaje aprobado; textos visibles: ' + ($texts -join ' | '))
}

# ---------- P-D3 ----------
Start-Fresh
$first = Wait-Any @($Ready, $script:DbError) 240
Screenshot 'p-d3-01-primera-apertura' | Out-Null
Check 'P-D3-FIRST-OPEN' ($first -eq $Ready) "primera apertura: clave y base creadas, inicio de sesion visible (visto: '$first')"
$sha1 = Db-State 'p-d3 primera apertura'
$keys1 = Keychain-Files
Check 'P-D3-FIRST-DB' ($sha1 -ne '' -and $keys1.Count -gt 0) "gfp.db creada y clave guardada ($($keys1 -join ', '))"
& $Adb shell am force-stop $Pkg | Out-Null
& $Adb uninstall $Pkg 2>&1 | Out-File (Join-Path $script:Out 'p-d3-uninstall.log') -Encoding UTF8
$gone = -not ((& $Adb shell pm list packages $Pkg | Out-String) -match [regex]::Escape("package:$Pkg"))
Check 'P-D3-UNINSTALL' $gone 'app desinstalada'
& $Adb install $Apk 2>&1 | Out-File (Join-Path $script:Out 'p-d3-install-2.log') -Encoding UTF8
Check 'P-D3-INSTALL-2' ((Get-Content (Join-Path $script:Out 'p-d3-install-2.log') -Raw) -match 'Success') 'reinstalacion'
$preOpen = Run-As 'ls databases 2>&1'
Check 'P-D3-NO-OLD-DB' ($preOpen -notmatch 'gfp\.db') "antes de abrir la app reinstalada no existe gfp.db ($preOpen)"
Start-Fresh
$second = Wait-Any @($Ready, $script:DbError) 240
Screenshot 'p-d3-02-tras-reinstalar' | Out-Null
$sha2 = Db-State 'p-d3 tras reinstalar y abrir'
Check 'P-D3-REOPEN' ($second -eq $Ready -and $sha2 -ne '' -and $sha2 -ne $sha1) 'tras reinstalar se crean clave y base nuevas sin error'

# ---------- E03-V09 (a): clave ausente con la base presente ----------
& $Adb shell am force-stop $Pkg | Out-Null
$shaBefore = Db-State 'v09a antes'
$moved = @()
foreach ($file in (Keychain-Files)) {
  $null = Run-As "mkdir -p files/gfp-v09-backup && mv $file files/gfp-v09-backup/"
  $moved += $file
}
Start-Fresh
Check-ErrorScreen 'E03-V09-KEY-LOST' 'v09-01-clave-ausente'
& $Adb shell am force-stop $Pkg | Out-Null
$shaAfter = Db-State 'v09a despues'
Check 'E03-V09-KEY-LOST-DB-KEPT' ($shaBefore -ne '' -and $shaAfter -eq $shaBefore -and (Keychain-Files).Count -eq 0) 'gfp.db intacta y sin clave nueva creada'
foreach ($file in $moved) { $null = Run-As "mv files/gfp-v09-backup/$(Split-Path -Leaf $file) $file" }
$null = Run-As 'rmdir files/gfp-v09-backup'
Start-Fresh
$restored = Wait-Any @($Ready, $script:DbError) 120
$shaRestored = Db-State 'v09a restaurada'
Check 'E03-V09-KEY-LOST-REVERSIBLE' ($restored -eq $Ready -and $shaRestored -ne '' -and (Keychain-Files).Count -eq $moved.Count) 'al restaurar la clave la app abre la base existente sin crear otra clave'

# ---------- E03-V09 (b): la clave no abre la base ----------
& $Adb shell am force-stop $Pkg | Out-Null
$shaOriginal = Db-State 'v09b original'
$null = Run-As 'mkdir -p files/gfp-v09-backup && for f in databases/gfp.db*; do mv $f files/gfp-v09-backup/; done'
$null = Run-As 'head -c 8192 /dev/urandom > databases/gfp.db'
$shaInjected = Db-State 'v09b archivo ajeno inyectado'
Start-Fresh
Check-ErrorScreen 'E03-V09-KEY-REJECTED' 'v09-03-clave-rechazada'
& $Adb shell am force-stop $Pkg | Out-Null
$shaAfterB = Db-State 'v09b despues'
Check 'E03-V09-KEY-REJECTED-DB-KEPT' ($shaInjected -ne '' -and $shaAfterB -eq $shaInjected) 'el archivo que no se pudo abrir no se borra, sustituye ni reinicializa'
$null = Run-As 'rm -f databases/gfp.db databases/gfp.db-wal databases/gfp.db-shm databases/gfp.db-journal; for f in files/gfp-v09-backup/gfp.db*; do mv $f databases/; done; rmdir files/gfp-v09-backup'
Start-Fresh
$restoredB = Wait-Any @($Ready, $script:DbError) 120
$shaRestoredB = Db-State 'v09b restaurada'
Check 'E03-V09-KEY-REJECTED-REVERSIBLE' ($restoredB -eq $Ready -and $shaRestoredB -eq $shaOriginal) 'al restaurar la base original la app vuelve a abrirla'

$null = Save-Logcat 'logcat-before-v13.txt'
# ---------- E03-V06 y E03-V13: regla y teclado por tipo de documento ----------
if (-not (Open-Registration)) { Stop-Blocked 'REGISTRATION' 'no se pudo abrir el registro desde el inicio de sesion' }
$null = Choose 'Tipo de documento' 'Pasaporte'
$null = Type-Into 'Documento' 'AB#1' -Clear
$null = Tap-Text 'Siguiente'
$passportMsg = U 'Error en los campos ingresados. Usa solo letras y n\u00fameros. Puedes separarlos con espacios, puntos o guiones.'
Check 'E03-V06-PA-SYMBOL' ([bool](Locate { param($ui) Find-Text $ui $passportMsg })) 'pasaporte con # rechazado con el mensaje de caracteres permitidos'
$null = Type-Into 'Primer nombre' 'Ana'
$null = Type-Into 'Primer apellido' 'Rojas'
$cases = @(
  @('CC', (U 'C\u00e9dula de ciudadan\u00eda'), 'Number', (U 'la c\u00e9dula de ciudadan\u00eda')),
  @('CE', (U 'C\u00e9dula de extranjer\u00eda'), 'Number', (U 'la c\u00e9dula de extranjer\u00eda')),
  @('PPT', (U 'Permiso por protecci\u00f3n temporal'), 'Number', (U 'el permiso por protecci\u00f3n temporal')),
  @('PA', 'Pasaporte', 'Text', '')
)
foreach ($case in $cases) {
  $code = $case[0]
  $null = Choose 'Tipo de documento' $case[1]
  & $Adb logcat -c 2>&1 | Out-Null
  Tap-Node (Locate { param($ui) Find-Input $ui 'Documento' })
  Start-Sleep -Milliseconds 1500
  $log = & $Adb logcat -d -v time 2>&1 | Out-String
  Set-Content -LiteralPath (Join-Path $script:Out "ime-$($code.ToLower()).log") -Value $log -Encoding UTF8
  $editor = Get-EditorClass $log
  $state = Get-ImeState "teclado-$($code.ToLower())"
  Screenshot "teclado-$($code.ToLower())" | Out-Null
  $shown = $state.Visible -or ($log -match 'ImeTracker[^\r\n]*co\.gfpsas\.gestionfinanciera[^\r\n]*onShown')
  Check "E03-V13-$code" ($editor[0] -eq $case[2] -and $shown) "$code : el IME recibe inputType de clase $($editor[0]) ($($editor[1])); esperado $($case[2]); teclado mostrado=$shown"
  if ($case[2] -eq 'Number') {
    Clear-Focused
    Send-Text 'E123'
    Hide-Keyboard
    $null = Tap-Text 'Siguiente'
    Start-Sleep -Milliseconds 800
    $message = (U 'Error en los campos ingresados. Para ') + $case[3] + (U ', ingresa solo n\u00fameros.')
    $text = (Find-Id (Get-Ui) 'registration-documentNumber').text
    $specific = [bool](Locate { param($ui) Find-Text $ui $message })
    Check "E03-V06-$code-LETTERS" ($specific -or ($text -notmatch '[A-Za-z]')) "$code con letras: mensaje especifico=$specific"
    $null = Type-Into 'Documento' '1234567' -Clear
    Check "E03-V06-$code-DIGITS" (-not (Find-Id (Get-Ui) 'registration-documentNumber-error')) "$code 1234567 aceptado"
  } else {
    Clear-Focused
    Send-Text ('AB' + (Get-Date -Format 'HHmmss'))
    Hide-Keyboard
    $null = Tap-Text 'Siguiente'
    Check "E03-V06-$code-ALNUM" (Wait-Text 'Paso 2 de 3' 30) 'PA con letras y numeros aceptado (avanza al paso 2)'
  }
}
$null = Tap-Text 'Cancelar'
$null = Save-Logcat
$fatal = @(Get-ChildItem -LiteralPath $script:Out -File | Where-Object { $_.Name -match '^(logcat.*\.txt|ime-.*\.log)$' } | Select-String -Pattern 'FATAL EXCEPTION' -SimpleMatch)
Check 'LOGCAT' ($fatal.Count -eq 0) 'sin FATAL EXCEPTION en los registros del recorrido'
Note 'INFO la app queda instalada con una base de prueba sin cuentas'
Finish-Run
