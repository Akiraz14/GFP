# Consolidacion (D-06): compila el APK release firmado con la clave propia y lo verifica.
# Pide las contrasenas con Read-Host -AsSecureString y las pasa a Gradle solo como variables de
# entorno de este proceso; al terminar las borra. No escribe contrasenas en los registros.
# Comprueba: firma (apksigner), package co.gfpsas.gestionfinanciera, minSdkVersion 29, permisos,
# no depurable y bundle JavaScript incluido (assets/index.android.bundle). Registra el SHA-256.
# Las evidencias quedan fuera del repositorio, en una carpeta nueva por ejecucion.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\release\Invoke-ReleaseBuild.ps1 [-KeystorePath <ruta .jks>] [-Alias gfp-release] [-Jdk17Path <ruta del JDK 17>] [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [string]$KeystorePath = (Join-Path $env:USERPROFILE '.gfp-release\gfp-release.jks'),
  [string]$Alias = 'gfp-release',
  [string]$Jdk17Path = '',
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot '..\stage-04\lib\Common.ps1')
. (Join-Path $PSScriptRoot '..\stage-07\lib\ApkBadging.ps1')
try { $null = Initialize-Run 'release' $EvidenceRoot } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }

$KnownPermissions = @(
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
)
$App = Join-Path $script:RepoRoot 'app'
if (-not (Test-Path -LiteralPath (Join-Path $App 'node_modules'))) { Stop-Blocked 'NODE-MODULES' 'falta app\node_modules; ejecute antes Invoke-StaticChecks.ps1' }
$full = [IO.Path]::GetFullPath($KeystorePath)
if (-not (Test-Path -LiteralPath $full)) { Stop-Blocked 'KEYSTORE' "no existe $full; cree la clave con New-ReleaseKey.ps1" }
if ($full.StartsWith($script:RepoRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { Stop-Blocked 'KEYSTORE' 'la clave esta dentro del repositorio (D-06)' }
Record 'PASS' 'KEYSTORE' "clave fuera del repositorio: $full"
$jdk = Find-Jdk17 $Jdk17Path
if (-not $jdk) { Stop-Blocked 'JDK17' 'no se encontro JDK 17; indique su ruta con -Jdk17Path' }
$env:JAVA_HOME = $jdk
$env:Path = "$(Join-Path $jdk 'bin');$env:Path"
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$tools = Get-ChildItem -LiteralPath (Join-Path $sdk 'build-tools') -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
if (-not $tools) { Stop-Blocked 'BUILD-TOOLS' "no se encontraron build-tools en $sdk" }

function Get-Plain([Security.SecureString]$Secure) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
$storeSecure = Read-Host 'Contrasena del almacen de claves' -AsSecureString
$keySecure = Read-Host 'Contrasena de la clave (Enter si es la misma)' -AsSecureString
$script:Cleanup += {
  foreach ($name in 'GFP_RELEASE_STORE_FILE', 'GFP_RELEASE_STORE_PASSWORD', 'GFP_RELEASE_KEY_ALIAS', 'GFP_RELEASE_KEY_PASSWORD') {
    Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
  }
}
$env:GFP_RELEASE_STORE_FILE = $full
$env:GFP_RELEASE_KEY_ALIAS = $Alias
$env:GFP_RELEASE_STORE_PASSWORD = Get-Plain $storeSecure
$env:GFP_RELEASE_KEY_PASSWORD = if ($keySecure.Length -gt 0) { Get-Plain $keySecure } else { $env:GFP_RELEASE_STORE_PASSWORD }

if (-not (Invoke-Logged 'gradle-assembleRelease' (Join-Path $App 'android') 'gradlew.bat assembleRelease --console=plain')) { Finish-Run }
$apk = Join-Path $App 'android\app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path -LiteralPath $apk)) { Record 'FAIL' 'APK' 'Gradle termino sin generar app-release.apk (sin firmar si falta la clave)'; Finish-Run }
$sha = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash
"sha256=$sha bytes=$((Get-Item -LiteralPath $apk).Length) commit=$((git -C $script:RepoRoot rev-parse HEAD | Out-String).Trim())" | Out-File (Join-Path $script:Out 'apk-release.txt') -Encoding UTF8
Record 'PASS' 'APK' "APK Release $sha"

$apksigner = Join-Path $tools.FullName 'apksigner.bat'
$signature = & $apksigner verify --verbose --print-certs $apk 2>&1 | Out-String
$signature | Out-File (Join-Path $script:Out 'apksigner.txt') -Encoding UTF8
Check 'SIGNATURE' ($LASTEXITCODE -eq 0 -and $signature -match 'Verifies') 'apksigner verify (apksigner.txt)'
Check 'NOT-DEBUG-KEY' (-not ($signature -match 'CN=Android Debug')) 'el certificado no es la clave de depuracion'

$aapt2 = Join-Path $tools.FullName 'aapt2.exe'
$badging = & $aapt2 dump badging $apk 2>&1 | Out-String
$badging | Out-File (Join-Path $script:Out 'aapt2-badging.txt') -Encoding UTF8
Check 'PACKAGE' ($badging -match "package: name='co\.gfpsas\.gestionfinanciera'") 'applicationId co.gfpsas.gestionfinanciera'
$minSdk = Get-BadgingMinSdk $badging
Check 'MIN-SDK' ($minSdk -eq 29) "minSdkVersion=$minSdk; se esperaba 29"
Check 'NOT-DEBUGGABLE' (-not ($badging -match "application-debuggable")) 'el APK release no es depurable'
$permissions = Get-BadgingPermissions $badging
Note "INFO permisos: $($permissions -join ', ')"
$unexpected = @($permissions | Where-Object { $KnownPermissions -notcontains $_ })
Check 'PERMISSIONS' ($unexpected.Count -eq 0) "solo los permisos release de E02-D7 (inesperados: $($unexpected -join ', '))"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($apk)
try {
  $bundle = $zip.Entries | Where-Object { $_.FullName -eq 'assets/index.android.bundle' } | Select-Object -First 1
  Check 'JS-BUNDLE' ($null -ne $bundle -and $bundle.Length -gt 0) "assets/index.android.bundle incluido ($(if ($bundle) { $bundle.Length } else { 0 }) bytes)"
  $natives = @($zip.Entries | Where-Object { $_.FullName -match '^lib/[^/]+/[^/]+\.so$' } | ForEach-Object { $_.FullName } | Sort-Object)
  $natives | Out-File (Join-Path $script:Out 'native-libraries.txt') -Encoding UTF8
  Note "INFO bibliotecas nativas: $($natives.Count) (native-libraries.txt)"
} finally { $zip.Dispose() }
Finish-Run
