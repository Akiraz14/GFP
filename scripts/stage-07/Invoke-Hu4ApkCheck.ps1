# Etapa 07 (HU4): comprobacion del APK Debug ya compilado con Invoke-AndroidBuild.ps1. No instala
# nada ni abre la app: lee el APK con aapt2 del Android SDK y comprueba que incluye el modulo
# nativo del calendario (D-03), que el minimo sigue en Android 10 (API 29) y que el calendario
# no anade permisos. No usa cuentas ni contrasenas.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\Invoke-Hu4ApkCheck.ps1 [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot '..\stage-04\lib\Common.ps1')
try { $null = Initialize-Run 'hu4-apk' $EvidenceRoot } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }

# Permisos del APK Debug registrados en E02-D7 (decisiones.md). El calendario no declara
# ninguno en su manifiesto, asi que la lista no debe cambiar.
$KnownPermissions = @(
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.ACCESS_LOCAL_NETWORK',
  'co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
)

$apk = Get-DebugApk
if (-not (Test-Path -LiteralPath $apk)) { Stop-Blocked 'APK' 'no existe el APK Debug; ejecute antes Invoke-AndroidBuild.ps1' }
$sha = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash
Note "INFO APK $apk sha256=$sha"

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$aapt2 = Get-ChildItem -LiteralPath (Join-Path $sdk 'build-tools') -Filter 'aapt2.exe' -Recurse -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | Select-Object -First 1
if (-not $aapt2) { Stop-Blocked 'AAPT2' "no se encontro aapt2.exe en $sdk\build-tools" }
Note "INFO aapt2=$($aapt2.FullName)"

$badging = & $aapt2.FullName dump badging $apk 2>&1 | Out-String
$badging | Out-File (Join-Path $script:Out 'aapt2-badging.txt') -Encoding UTF8
Check 'MIN-SDK' ($badging -match "(?m)^sdkVersion:'29'") 'minSdkVersion 29 (Android 10)'

$permissions = @([regex]::Matches($badging, "uses-permission: name='([^']+)'") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
Note "INFO permisos: $($permissions -join ', ')"
$unexpected = @($permissions | Where-Object { $KnownPermissions -notcontains $_ })
Check 'PERMISSIONS' ($unexpected.Count -eq 0) "sin permisos fuera de E02-D7 (inesperados: $($unexpected -join ', '))"

# El modulo nativo del calendario debe estar en el codigo del APK (clases de
# com.reactcommunity.rndatetimepicker en algun classes*.dex).
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($apk)
try {
  $found = $false
  foreach ($entry in $zip.Entries | Where-Object { $_.FullName -match '^classes\d*\.dex$' }) {
    $stream = $entry.Open()
    try {
      $memory = New-Object IO.MemoryStream
      $stream.CopyTo($memory)
      $text = [Text.Encoding]::ASCII.GetString($memory.ToArray())
      if ($text.Contains('Lcom/reactcommunity/rndatetimepicker/')) { $found = $true; Note "INFO calendario en $($entry.FullName)"; break }
    } finally { $stream.Dispose() }
  }
} finally { $zip.Dispose() }
Check 'DATE-PICKER-NATIVE' $found 'el APK incluye el modulo nativo com.reactcommunity.rndatetimepicker (D-03)'
Finish-Run
