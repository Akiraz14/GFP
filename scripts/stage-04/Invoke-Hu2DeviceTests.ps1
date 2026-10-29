# Etapa 04 (HU2): recorrido de inicio de sesion en un emulador desechable, con el APK Debug
# compilado en este clon o worktree y el JavaScript servido por Metro desde el mismo arbol.
# Instala la app desde cero (con -AllowAppReset si ya esta instalada), registra una cuenta
# sintetica por la interfaz y comprueba HU2-CA01 a HU2-CA10 y la regresion HU1-CA18.
# La contrasena de prueba se genera en cada ejecucion y no se escribe en los resumenes.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-Hu2DeviceTests.ps1 -Serial emulator-5554 [-AllowAppReset] [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [Parameter(Mandatory = $true)][string]$Serial,
  [switch]$AllowAppReset,
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot 'lib\Common.ps1')
try { $null = Initialize-Run 'device' $EvidenceRoot $Serial } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }
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

$Identifier = 'Identificador'
$Password = U 'Contrase\u00f1a'
$Invalid = U 'El campo identificaci\u00f3n o contrase\u00f1a son incorrectos'
$LockText = 'Superaste los intentos permitidos. El acceso queda bloqueado durante 15 minutos.'
$run = Get-Date -Format 'HHmmss'
$doc = '7' + $run + '1'
$phone = '31' + $run + '66'
$email = "hu2.$run@example.com"
$secret = 'Prueba' + $run + '!x'

function Wait-Login([int]$Seconds = 60) { return [bool](Wait-Any @($script:LoginButton) $Seconds) }
function Fill-Login([string]$Id, [string]$Pw) {
  $null = Type-Into $Identifier $Id -Clear
  if ($Pw) { $null = Type-Into $Password $Pw -Clear }
  $null = Tap-Text $script:LoginButton
  Start-Sleep -Milliseconds 800
}
function Accept-Dialog { $null = Tap-Text 'Aceptar' }
function Find-Message([string]$Text) { return [bool](Locate { param($ui) Find-Text $ui $Text }) }
function Find-Both([string]$First, [string]$Second) { return [bool](Locate { param($ui) Get-Nodes $ui | Where-Object { $_.text -and $_.text.Contains($First) -and $_.text.Contains($Second) } | Select-Object -First 1 }) }
function Login-Succeeds([string]$CheckId, [string]$Id) {
  Fill-Login $Id $secret
  $reached = Wait-Text (U 'Pantalla provisional: se implementa con HU5.') 120
  Screenshot ("$CheckId-destino".ToLower()) | Out-Null
  Assert-AppState $CheckId
  Check $CheckId $reached "inicio de sesion correcto con $(($Id -replace '\d', '#')): destino provisional de HU5"
  Restart-App
  $back = Wait-Login 120
  Assert-AppState "$CheckId-RESTART"
  Check "$CheckId-RESTART" $back 'al reabrir la app la sesion no se conserva: vuelve el inicio de sesion (E04-D4, HU2-CA10)'
}

# Primera apertura: inicio de sesion
Restart-App
$first = Wait-Any @($script:LoginButton, $script:DbError) 240
Screenshot 'hu2-01-inicio-sesion' | Out-Null
$ui = Get-Ui; Save-Ui 'hu2-01-inicio-sesion'
Check 'HU2-START' ($first -eq $script:LoginButton -and [bool](Find-Input $ui $Identifier) -and [bool](Find-Input $ui $Password)) "la app abre en el inicio de sesion con los campos identificador y contrasena (visto: '$first')"
Check 'HU2-LABELS' ([bool](Find-Text $ui 'Registrar') -and [bool](Locate { param($u) Find-Text $u (U 'Olvid\u00e9 mi contrase\u00f1a') })) 'botones Ingresar y Registrar y enlace Olvide mi contrasena'

# HU2-CA02
$null = Tap-Text $script:LoginButton
Start-Sleep -Milliseconds 800
Screenshot 'hu2-02-obligatorios' | Out-Null
Check 'HU2-CA02' ((Find-Message 'Ingresa tu identificador.') -and (Find-Message (U 'Ingresa tu contrase\u00f1a.'))) 'identificador y contrasena vacios: mensajes junto a cada campo'

# HU2-CA04
Fill-Login 'ana@example' $secret
Screenshot 'hu2-03-verificar-identificacion' | Out-Null
Check 'HU2-CA04' (Find-Message (U 'Verificar identificaci\u00f3n')) 'correo sin dominio: Verificar identificacion'

# HU2-CA09
$null = Tap-Text (U 'Olvid\u00e9 mi contrase\u00f1a')
Check 'HU2-CA09' (Wait-Text (U 'Pantalla provisional: se implementa con HU3.') 20) 'el enlace lleva a la ruta de recuperacion (pantalla provisional de HU3)'
Restart-App
$null = Wait-Login 120

# HU2-CA08 y regresion HU1-CA18
$null = Tap-Text 'Registrar'
Check 'HU2-CA08' (Wait-Text 'Paso 1 de 3' 30) 'Registrar abre el formulario de registro'
$null = Type-Into 'Primer nombre' 'Eva'
$null = Tap-Text 'Cancelar'
$back = Wait-Login 30
$ui = Get-Ui; Save-Ui 'hu1-ca18-inicio-sesion'
Screenshot 'hu1-ca18-inicio-sesion' | Out-Null
$idField = Find-Input $ui $Identifier
Assert-AppState 'HU1-CA18'
Check 'HU1-CA18' ($back -and $idField -and ([string]$idField.text) -eq '' -and -not (Find-Text $ui 'Paso 1 de 3')) 'Cancelar en el registro vuelve al inicio de sesion real de HU2 con los campos vacios'

# Cuenta sintetica por la interfaz (regresion del registro de HU1)
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
if (-not (Wait-Text 'Paso 3 de 3' 40)) { Screenshot 'registro-paso2' | Out-Null; Stop-Blocked 'REGISTER' 'no se pudo llegar al paso 3 del registro' }
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
Screenshot 'hu2-04-registro' | Out-Null
Check 'HU1-REGISTER' $registered 'registro de una cuenta sintetica completo'
if (-not $registered) {
  Assert-AppState 'HU1-REGISTER'
  Stop-Blocked 'REGISTER' 'sin cuenta registrada no se pueden probar los inicios de sesion'
}
$null = Tap-Text 'Aceptar'
$backToLogin = Wait-Login 30
Assert-AppState 'HU1-REGISTER-LOGIN'
Check 'HU1-REGISTER-LOGIN' $backToLogin 'tras el registro se vuelve al inicio de sesion (A-W4)'

# HU2-CA05 (2 fallos: contrasena incorrecta e identificador inexistente)
Fill-Login $email ('Mala' + $run + '!x')
Screenshot 'hu2-05-credenciales' | Out-Null
$found = Find-Message $Invalid
Assert-AppState 'HU2-CA05-PASSWORD'
Check 'HU2-CA05-PASSWORD' $found 'contrasena incorrecta: mensaje literal de alerta'
Accept-Dialog
Fill-Login "nadie.$run@example.com" $secret
$found = Find-Message $Invalid
Assert-AppState 'HU2-CA05-UNKNOWN'
Check 'HU2-CA05-UNKNOWN' $found 'identificador inexistente: el mismo mensaje literal'
Accept-Dialog

# HU2-CA01, CA07 y CA10 (cada exito reinicia el contador)
Login-Succeeds 'HU2-CA01-EMAIL' $email.ToUpper()
Login-Succeeds 'HU2-CA01-DOCUMENT' $doc
Login-Succeeds 'HU2-CA01-PHONE' "+57$phone"
Login-Succeeds 'HU2-CA07' $phone

# HU2-CA06: tres fallos bloquean 15 minutos, incluso con la contrasena correcta
for ($i = 1; $i -le 3; $i++) {
  Fill-Login $email ("Mala$i" + $run + '!x')
  if ($i -lt 3) { $null = Find-Message $Invalid; Accept-Dialog }
}
Screenshot 'hu2-06-tercer-fallo' | Out-Null
$found = Find-Both $Invalid $LockText
Assert-AppState 'HU2-CA06-THIRD'
Check 'HU2-CA06-THIRD' $found 'el tercer fallo muestra el mensaje literal y el bloqueo de 15 minutos'
Accept-Dialog
Fill-Login $email $secret
Screenshot 'hu2-07-bloqueado' | Out-Null
$lockedNow = (Find-Both 'Superaste los intentos permitidos.' 'bloqueado durante') -and -not (Find-Text (Get-Ui) (U 'Pantalla provisional: se implementa con HU5.'))
Assert-AppState 'HU2-CA06'
Check 'HU2-CA06' $lockedNow 'con la contrasena correcta el acceso sigue bloqueado'
Accept-Dialog
Restart-App
$null = Wait-Login 120
Fill-Login $email $secret
$found = Find-Both 'Superaste los intentos permitidos.' 'bloqueado durante'
Assert-AppState 'HU2-CA06-RESTART'
Check 'HU2-CA06-RESTART' $found 'el bloqueo se mantiene al reabrir la app'
Accept-Dialog

# HU2-CA03: sin la contrasena en claro en la base ni en logcat
& $Adb shell am force-stop $Pkg | Out-Null
$copy = Join-Path $script:Out 'db-scan.tmp'
cmd /c "$Adb exec-out run-as $Pkg cat databases/gfp.db > `"$copy`""
$latin = [Text.Encoding]::GetEncoding(28591).GetString([IO.File]::ReadAllBytes($copy))
Remove-Item -LiteralPath $copy
Check 'HU2-CA03-DB' ($latin.Length -gt 0 -and -not $latin.StartsWith('SQLite format 3') -and -not $latin.Contains($secret) -and -not $latin.Contains($email)) 'base cifrada sin la contrasena ni el correo en claro (copia analizada y eliminada)'
$log = Save-Logcat
$logText = Get-Content -LiteralPath $log -Raw
Check 'HU2-CA03-LOGCAT' (-not $logText.Contains($secret)) 'la contrasena de prueba no aparece en logcat'
Check 'LOGCAT' (-not ($logText -match 'FATAL EXCEPTION')) 'sin FATAL EXCEPTION'
Note 'INFO la app queda instalada con una cuenta sintetica y el acceso bloqueado 15 minutos'
Finish-Run
