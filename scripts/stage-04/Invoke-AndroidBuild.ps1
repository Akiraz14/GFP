# Etapa 04 (HU2): compilacion del APK Debug con JDK 17 solo en este proceso. Registra el
# SHA-256 del APK; no copia el APK a las evidencias. Requiere haber ejecutado npm ci
# (Invoke-StaticChecks.ps1) en el mismo clon o worktree.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 [-Jdk17Path <ruta del JDK 17>] [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [string]$Jdk17Path = '',
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot 'lib\Common.ps1')
try { $null = Initialize-Run 'build' $EvidenceRoot } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }
$App = Join-Path $script:RepoRoot 'app'
if (-not (Test-Path -LiteralPath (Join-Path $App 'node_modules'))) { Stop-Blocked 'NODE-MODULES' 'falta app\node_modules; ejecute antes Invoke-StaticChecks.ps1' }
$jdk = Find-Jdk17 $Jdk17Path
if (-not $jdk) { Stop-Blocked 'JDK17' 'no se encontro JDK 17; indique su ruta con -Jdk17Path' }
$env:JAVA_HOME = $jdk
$env:Path = "$(Join-Path $jdk 'bin');$env:Path"
Record 'PASS' 'JDK17' "JDK 17 solo en este proceso: $jdk"
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path -LiteralPath $sdk)) { Stop-Blocked 'ANDROID-SDK' 'no se encontro el Android SDK; defina ANDROID_HOME' }
Record 'PASS' 'ANDROID-SDK' $sdk
if ($script:RepoRoot.Length -gt 60) { Note "INFO la ruta del repositorio tiene $($script:RepoRoot.Length) caracteres; si Ninja falla por rutas largas, use un worktree en una ruta corta" }
if (Invoke-Logged 'gradle-assembleDebug' (Join-Path $App 'android') 'gradlew.bat assembleDebug --console=plain') {
  $apk = Get-DebugApk
  if (Test-Path -LiteralPath $apk) {
    $sha = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash
    "sha256=$sha bytes=$((Get-Item -LiteralPath $apk).Length) commit=$((git -C $script:RepoRoot rev-parse HEAD | Out-String).Trim())" | Out-File (Join-Path $script:Out 'apk-debug.txt') -Encoding UTF8
    Record 'PASS' 'APK' "APK Debug $sha"
  } else { Record 'FAIL' 'APK' 'Gradle termino sin generar app-debug.apk' }
}
Finish-Run
