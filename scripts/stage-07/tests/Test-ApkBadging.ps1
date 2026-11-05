# Etapa 07 (HU4): pruebas de lib\ApkBadging.ps1 con salidas sinteticas de "aapt2 dump badging"
# en el formato real (linea minSdkVersion:'NN'). No requiere Android SDK ni APK.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\tests\Test-ApkBadging.ps1
# Codigo de salida 0 si todas pasan; 1 en otro caso.
. (Join-Path $PSScriptRoot '..\lib\ApkBadging.ps1')
$script:Failures = 0
$script:Total = 0
function Assert-Equal([string]$Name, $Expected, $Actual) {
  $script:Total++
  $same = if ($Expected -is [array] -or $Actual -is [array]) { (@($Expected) -join '|') -eq (@($Actual) -join '|') } else { $Expected -eq $Actual }
  if ($same) { Write-Host "PASS $Name" } else { $script:Failures++; Write-Host "FAIL $Name esperado=[$(@($Expected) -join ', ')] obtenido=[$(@($Actual) -join ', ')]" }
}

$lines = @(
  "package: name='co.gfpsas.gestionfinanciera' versionCode='1' versionName='1.0' platformBuildVersionName='16' platformBuildVersionCode='36' compileSdkVersion='37' compileSdkVersionCodename='17'",
  "minSdkVersion:'29'",
  "targetSdkVersion:'36'",
  "uses-permission: name='android.permission.INTERNET'",
  "uses-permission: name='android.permission.ACCESS_NETWORK_STATE'",
  "uses-permission: name='co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'",
  "uses-permission: name='android.permission.INTERNET'",
  "application-label:'GFP'",
  "uses-implied-permission: name='android.permission.READ_EXTERNAL_STORAGE' reason='test'"
)
$lf = $lines -join "`n"
$crlf = $lines -join "`r`n"

Assert-Equal 'MIN-SDK formato real de aapt2 (LF)' 29 (Get-BadgingMinSdk $lf)
Assert-Equal 'MIN-SDK formato real de aapt2 (CRLF de Out-String)' 29 (Get-BadgingMinSdk $crlf)
Assert-Equal 'MIN-SDK es entero' $true ((Get-BadgingMinSdk $lf) -is [int])
Assert-Equal 'MIN-SDK no toma targetSdkVersion ni compileSdkVersion' $null (Get-BadgingMinSdk (($lines | Where-Object { $_ -notlike 'minSdkVersion*' }) -join "`n"))
Assert-Equal 'MIN-SDK ausente devuelve null' $null (Get-BadgingMinSdk '')
Assert-Equal 'MIN-SDK otro valor (28)' 28 (Get-BadgingMinSdk ($lf -replace "minSdkVersion:'29'", "minSdkVersion:'28'"))
Assert-Equal 'MIN-SDK de tres cifras no se trunca' 290 (Get-BadgingMinSdk "minSdkVersion:'290'")
Assert-Equal 'regresion: el patron anterior sdkVersion no coincide con la salida real' $false ($lf -match "(?m)^sdkVersion:'29'")
Assert-Equal 'PERMISOS sin repetir, ordenados y sin uses-implied-permission' @(
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.INTERNET',
  'co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
) (Get-BadgingPermissions $crlf)
Assert-Equal 'PERMISOS vacio' 0 (@(Get-BadgingPermissions '')).Count

Write-Host "RESULTADO pruebas=$($script:Total) fallos=$($script:Failures)"
exit ([int]($script:Failures -gt 0))
