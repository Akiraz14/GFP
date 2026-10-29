# Etapa 04: compatibilidad de una cuenta real tras la correccion de PBKDF2. Instala desde cero
# el APK Debug anterior (-OldApk), registra una cuenta sintetica por la interfaz, conserva la
# base cifrada y la clave, actualiza la app con el APK Debug de este arbol (adb install -r, sin
# borrar datos) y comprueba que la cuenta inicia sesion y que una contrasena incorrecta se
# rechaza. Tras el registro, la app anterior se detiene sin pulsar Aceptar ni iniciar sesion
# con ella (autorizado por el responsable el 2026-10-29): su defecto de memoria puede cerrarla
# y la prueba no lo necesita. La contrasena de prueba se genera en cada ejecucion y no se
# escribe en los resumenes.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Pbkdf2UpgradeCheck.ps1 -Serial emulator-5554 -OldApk <APK anterior> [-AllowAppReset] [-EvidenceRoot <carpeta>]
param(
  [Parameter(Mandatory = $true)][string]$Serial,
  [Parameter(Mandatory = $true)][string]$OldApk,
  [switch]$AllowAppReset,
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot 'lib\Common.ps1')
try { $null = Initialize-Run 'pbkdf2-upgrade' $EvidenceRoot $Serial } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }
$Pkg = 'co.gfpsas.gestionfinanciera'
$Adb = Get-AdbPath
. (Join-Path $PSScriptRoot 'lib\DeviceUi.ps1')
if ($Adb -and $Adb -match '\s') { Stop-Blocked 'ADB' "la ruta de adb contiene espacios: $Adb" }
$App = Join-Path $script:RepoRoot 'app'
$NewApk = Get-DebugApk
if (-not (Test-Path -LiteralPath $NewApk)) { Stop-Blocked 'APK' 'no existe el APK Debug de este arbol; ejecute antes Invoke-AndroidBuild.ps1' }
if (-not (Test-Path -LiteralPath $OldApk)) { Stop-Blocked 'OLD-APK' "no existe $OldApk" }
$oldHash = (Get-FileHash -LiteralPath $OldApk -Algorithm SHA256).Hash
$newHash = (Get-FileHash -LiteralPath $NewApk -Algorithm SHA256).Hash
Note "INFO APK anterior $oldHash ($OldApk)"
Note "INFO APK nuevo $newHash ($NewApk)"
if ($oldHash -eq $newHash) { Stop-Blocked 'APK-DIFFER' 'el APK anterior y el nuevo son el mismo archivo' }
Initialize-Device $Serial
Start-Metro $App
& $Adb logcat -c 2>&1 | Out-Null
Install-FreshApp $OldApk -AllowAppReset:$AllowAppReset
function Get-InstalledApkHash {
  $path = (([string](Invoke-Adb "shell pm path $Pkg")) -split "`n" | Where-Object { $_ -match 'base\.apk' } | Select-Object -First 1) -replace '^package:', ''
  return (([string](Invoke-Adb "shell sha256sum $($path.Trim())")).Trim() -replace '\s.*$', '').ToUpper()
}
$installedOld = Get-InstalledApkHash
Check 'UPGRADE-OLD-APK-INSTALLED' ($installedOld -eq $oldHash) "el APK instalado es el anterior (base.apk sha256=$installedOld)"

$Identifier = 'Identificador'
$Password = U 'Contrase\u00f1a'
$Invalid = U 'El campo identificaci\u00f3n o contrase\u00f1a son incorrectos'
$HomeText = U 'Pantalla provisional: se implementa con HU5.'
$run = Get-Date -Format 'HHmmss'
$doc = '8' + $run + '2'
$phone = '32' + $run + '77'
$email = "pbkdf2.$run@example.com"
$secret = 'Clave' + $run + '!x'

function Wait-Login([int]$Seconds = 60) { return [bool](Wait-Any @($script:LoginButton) $Seconds) }
function Fill-Login([string]$Id, [string]$Pw) {
  $null = Type-Into $Identifier $Id -Clear
  $null = Type-Into $Password $Pw -Clear
  $null = Tap-Text $script:LoginButton
  Start-Sleep -Milliseconds 800
}
function Find-Message([string]$Text) { return [bool](Locate { param($ui) Find-Text $ui $Text }) }
function Get-PackageTimes {
  $dump = [string](Invoke-Adb "shell dumpsys package $Pkg")
  $first = if ($dump -match 'firstInstallTime=([^\r\n]+)') { $Matches[1].Trim() } else { '' }
  $last = if ($dump -match 'lastUpdateTime=([^\r\n]+)') { $Matches[1].Trim() } else { '' }
  return @($first, $last)
}

# 1. Cuenta creada con el APK anterior
Restart-App
if (-not (Wait-Login 240)) { Screenshot 'upgrade-01-inicio' | Out-Null; Stop-Blocked 'START' 'la app anterior no mostro el inicio de sesion' }
$null = Tap-Text 'Registrar'
$null = Wait-Text 'Paso 1 de 3' 30
$null = Choose 'Tipo de documento' (U 'C\u00e9dula de ciudadan\u00eda')
$null = Type-Into 'Documento' $doc
$null = Type-Into 'Primer nombre' 'Eva'
$null = Type-Into 'Primer apellido' 'Mora'
$null = Tap-Text 'Siguiente'
$null = Wait-Text 'Paso 2 de 3' 30
$null = Type-Into (U 'N\u00famero celular') $phone
$null = Type-Into (U 'Correo electr\u00f3nico') $email
$null = Type-Into $Password $secret
$null = Tap-Text 'Siguiente'
if (-not (Wait-Text 'Paso 3 de 3' 40)) { Screenshot 'upgrade-registro-paso2' | Out-Null; Stop-Blocked 'OLD-REGISTER' 'no se pudo llegar al paso 3 del registro' }
$questions = @(
  ([string][char]0x00BF + 'Cu' + [char]0x00E1 + 'l es tu color favorito?'),
  ([string][char]0x00BF + 'Qu' + [char]0x00E9 + ' tipo de animal fue tu primera mascota?'),
  ([string][char]0x00BF + 'Cu' + [char]0x00E1 + 'l es tu deporte favorito?'),
  ([string][char]0x00BF + 'Cu' + [char]0x00E1 + 'l es tu plato favorito?'),
  ([string][char]0x00BF + 'C' + [char]0x00F3 + 'mo ibas normalmente a la escuela primaria?')
)
for ($i = 0; $i -lt 5; $i++) { $null = Choose "Pregunta de seguridad $($i + 1)" $questions[$i] }
$answers = @('Verde', 'Gato', 'Tenis', 'Arroz', 'En bus')
for ($i = 0; $i -lt 5; $i++) { $null = Type-Into "Respuesta $($i + 1)" $answers[$i] }
$null = Tap-Text 'Registrar'
$registered = Wait-Text 'El registro fue exitoso' 240
Screenshot 'upgrade-02-registro-apk-anterior' | Out-Null
Check 'UPGRADE-OLD-REGISTER' $registered 'cuenta sintetica registrada con el APK anterior'
if (-not $registered) {
  Assert-AppState 'UPGRADE-OLD-REGISTER'
  Stop-Blocked 'OLD-REGISTER' 'sin cuenta creada con el APK anterior no se puede probar la compatibilidad'
}
Assert-AppState 'UPGRADE-OLD-STOP'
$null = Invoke-Adb "shell am force-stop $Pkg"
$script:AppPid = ''
Check 'UPGRADE-OLD-STOPPED' (-not (Get-AppPid)) 'la app anterior se detuvo con am force-stop justo despues del registro'
Skip 'UPGRADE-OLD-LOGIN' 'omitido deliberadamente: iniciar sesion con el APK anterior no es parte de la prueba y su defecto de memoria puede cerrarlo antes de la actualizacion'

# 2. Estado antes de actualizar
$dbBefore = Db-State 'antes-de-actualizar'
$keysBefore = (Keychain-Files) -join ','
$timesBefore = Get-PackageTimes
Note "INFO antes: base sha256=$dbBefore clave=$keysBefore firstInstallTime=$($timesBefore[0]) lastUpdateTime=$($timesBefore[1])"
if (-not $dbBefore) { Stop-Blocked 'DB-BEFORE' 'no se pudo leer el hash de la base antes de actualizar' }
if (-not $keysBefore) { Stop-Blocked 'KEY-BEFORE' 'no se encontro la clave de la base antes de actualizar' }

# 3. Actualizacion sin borrar datos
Start-Sleep -Seconds 2
& $Adb install -r $NewApk 2>&1 | Out-File (Join-Path $script:Out 'install-upgrade.log') -Encoding UTF8
Check 'UPGRADE-INSTALL' ((Get-Content (Join-Path $script:Out 'install-upgrade.log') -Raw) -match 'Success') 'adb install -r con el APK nuevo (install-upgrade.log)'
$timesAfter = Get-PackageTimes
Note "INFO despues: firstInstallTime=$($timesAfter[0]) lastUpdateTime=$($timesAfter[1])"
Check 'UPGRADE-IN-PLACE' ($timesAfter[0] -eq $timesBefore[0] -and $timesAfter[1] -ne $timesBefore[1]) 'actualizacion sobre la instalacion existente: firstInstallTime igual, lastUpdateTime nuevo'
$installedHash = Get-InstalledApkHash
Check 'UPGRADE-APK-IS-NEW' ($installedHash -eq $newHash) "el APK instalado es el nuevo (base.apk sha256=$installedHash)"
$dbAfter = Db-State 'despues-de-actualizar'
$keysAfter = (Keychain-Files) -join ','
Check 'UPGRADE-DB-PRESERVED' ($dbAfter -and $dbAfter -eq $dbBefore) 'la base cifrada no cambio con la actualizacion (database-states.txt)'
Check 'UPGRADE-KEY-PRESERVED' ($keysAfter -and $keysAfter -eq $keysBefore) "la clave de la base sigue presente ($keysAfter)"

# 4. Inicio de sesion con el APK nuevo
Restart-App
if (-not (Wait-Login 240)) { Screenshot 'upgrade-03-inicio-apk-nuevo' | Out-Null; Assert-AppState 'UPGRADE-START'; Stop-Blocked 'NEW-START' 'la app actualizada no mostro el inicio de sesion' }
Fill-Login $email ('Mala' + $run + '!x')
$rejected = Find-Message $Invalid
Screenshot 'upgrade-04-contrasena-incorrecta' | Out-Null
Assert-AppState 'UPGRADE-WRONG-REJECTED'
Check 'UPGRADE-WRONG-REJECTED' $rejected 'con el APK nuevo, una contrasena incorrecta se rechaza con el mensaje literal'
$null = Tap-Text 'Aceptar'
Fill-Login $email $secret
$reached = Wait-Text $HomeText 120
Screenshot 'upgrade-05-inicio-sesion-apk-nuevo' | Out-Null
Assert-AppState 'UPGRADE-LOGIN'
Check 'UPGRADE-LOGIN' $reached 'la cuenta creada con el APK anterior inicia sesion con el APK nuevo'
Restart-App
$null = Wait-Login 120
Fill-Login $doc $secret
$reached = Wait-Text $HomeText 120
Assert-AppState 'UPGRADE-LOGIN-DOCUMENT'
Check 'UPGRADE-LOGIN-DOCUMENT' $reached 'la misma cuenta inicia sesion con el documento'

# 5. Registros
$log = Save-Logcat
$logText = Get-Content -LiteralPath $log -Raw
Check 'UPGRADE-LOGCAT-PASSWORD' (-not $logText.Contains($secret)) 'la contrasena de prueba no aparece en logcat'
Check 'LOGCAT' (-not ($logText -match 'FATAL EXCEPTION')) 'sin FATAL EXCEPTION'
Note 'INFO la app queda instalada con el APK nuevo y una cuenta sintetica'
Finish-Run
