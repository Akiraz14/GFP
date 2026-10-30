# Funciones comunes de los scripts de validacion de la Etapa 04 (HU2). Se cargan con
# dot-sourcing desde cada script; no se ejecutan solas.
# Resultados: PASS, FAIL, BLOCKED (precondicion no cumplida) y NOT RUN (no ejecutado).
# Codigo de salida: 0 sin FAIL ni BLOCKED; 1 con algun FAIL; 2 con algun BLOCKED sin FAIL.

$ErrorActionPreference = 'Continue'
$script:Counts = [ordered]@{ PASS = 0; FAIL = 0; BLOCKED = 0; 'NOT RUN' = 0 }
$script:Out = $null
$script:Summary = $null

function Resolve-RepoRoot {
  $root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..') -ErrorAction Stop).Path
  if (-not (Test-Path -LiteralPath (Join-Path $root 'app\package.json'))) {
    throw "no se encontro app\package.json bajo $root; ejecute el script desde scripts\stage-04 de un clon de GFP"
  }
  $git = Join-Path $root '.git'
  if (-not (Test-Path -LiteralPath $git)) { throw "$root no es la raiz de un repositorio o worktree de Git" }
  if ($root.TrimEnd('\') -match '\\Study\\GFP$') {
    throw "$root es la ubicacion obsoleta del repositorio; use el clon canonico o un worktree suyo"
  }
  return $root
}

function Initialize-Run([string]$Group, [string]$EvidenceRoot, [string]$Device = 'windows') {
  $script:RepoRoot = Resolve-RepoRoot
  if (-not $EvidenceRoot) { $EvidenceRoot = Join-Path (Split-Path -Parent $script:RepoRoot) 'GFP-e04-evidencias' }
  $full = [IO.Path]::GetFullPath($EvidenceRoot)
  if ($full.StartsWith($script:RepoRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw "las evidencias deben quedar fuera del repositorio; $full esta dentro de $($script:RepoRoot)"
  }
  New-Item -ItemType Directory -Path $full -Force | Out-Null
  $name = "hu2-$Group-$Device-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
  $script:Out = Join-Path $full $name
  if (Test-Path -LiteralPath $script:Out) { throw "ya existe $($script:Out); no se sobrescribe una ejecucion anterior" }
  New-Item -ItemType Directory -Path $script:Out | Out-Null
  $script:Summary = Join-Path $script:Out 'summary.txt'
  Note "INICIO $(Get-Date -Format o) grupo=$Group dispositivo=$Device"
  Note "INFO repositorio=$($script:RepoRoot)"
  Note "INFO rama=$((git -C $script:RepoRoot rev-parse --abbrev-ref HEAD | Out-String).Trim()) commit=$((git -C $script:RepoRoot rev-parse HEAD | Out-String).Trim())"
  git -C $script:RepoRoot status --porcelain -uall | Out-File (Join-Path $script:Out 'worktree-status-start.txt') -Encoding UTF8
  return $script:Out
}

function Note([string]$Text) { Add-Content -LiteralPath $script:Summary -Value $Text -Encoding UTF8; Write-Host $Text }
function Record([string]$Status, [string]$Id, [string]$Detail) { $script:Counts[$Status]++; Note "$Status $Id $Detail" }
function Check([string]$Id, [bool]$Ok, [string]$Detail) { if ($Ok) { Record 'PASS' $Id $Detail } else { Record 'FAIL' $Id $Detail } }
function Skip([string]$Id, [string]$Reason) { Record 'NOT RUN' $Id $Reason }

$script:Cleanup = @()
function Finish-Run {
  foreach ($step in $script:Cleanup) { try { & $step } catch { Note "INFO limpieza: $($_.Exception.Message)" } }
  $script:Cleanup = @()
  if ($script:RepoRoot) {
    git -C $script:RepoRoot status --porcelain -uall | Out-File (Join-Path $script:Out 'worktree-status-end.txt') -Encoding UTF8
    $same = ((Get-Content (Join-Path $script:Out 'worktree-status-start.txt')) -join '|') -eq ((Get-Content (Join-Path $script:Out 'worktree-status-end.txt')) -join '|')
    if (-not $same) { Record 'FAIL' 'WORKTREE-UNCHANGED' 'el estado de Git del repositorio cambio durante la ejecucion (ver worktree-status-*.txt)' }
  }
  Note ("RESULTADO " + (($script:Counts.Keys | ForEach-Object { "$_=$($script:Counts[$_])" }) -join ' '))
  Note "FIN $(Get-Date -Format o): evidencias en $($script:Out)"
  if ($script:Counts['FAIL'] -gt 0) { exit 1 }
  if ($script:Counts['BLOCKED'] -gt 0) { exit 2 }
  exit 0
}
function Stop-Blocked([string]$Id, [string]$Reason) { Record 'BLOCKED' $Id $Reason; Finish-Run }

# El comando se ejecuta en un proceso propio y solo se espera a ese proceso: si se ejecutara
# dentro de una funcion cuya salida se captura, PowerShell esperaria tambien a los procesos
# que heredan la salida y siguen vivos (el demonio de Gradle), y no volveria nunca.
function Invoke-Logged([string]$Name, [string]$Dir, [string]$Command, [int]$TimeoutMinutes = 60) {
  $log = Join-Path $script:Out "$Name.log"
  Set-Content -LiteralPath $log -Value "> [$Dir] $Command" -Encoding UTF8
  $start = Get-Date
  $process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', "$Command >> `"$log`" 2>&1") -WorkingDirectory $Dir -NoNewWindow -PassThru
  $null = $process.Handle
  if (-not $process.WaitForExit($TimeoutMinutes * 60000)) {
    cmd /c "taskkill /PID $($process.Id) /T /F >nul 2>&1"
    Check $Name $false "(sin terminar tras $TimeoutMinutes min; proceso detenido; $Name.log)"
    return $false
  }
  $process.WaitForExit()
  $code = $process.ExitCode
  $secs = [int]((Get-Date) - $start).TotalSeconds
  Check $Name ($code -eq 0) "(exit $code, ${secs}s, $Name.log)"
  return ($code -eq 0)
}

function Get-HttpText([string]$Url, [int]$TimeoutMs = 3000) {
  $request = [System.Net.HttpWebRequest]::Create($Url)
  $request.Timeout = $TimeoutMs
  $request.ReadWriteTimeout = $TimeoutMs
  $request.Proxy = $null
  $response = $request.GetResponse()
  try {
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream(), [System.Text.Encoding]::UTF8)
    return $reader.ReadToEnd()
  } finally { $response.Close() }
}

function Get-AdbPath {
  $sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
  $adb = Join-Path $sdk 'platform-tools\adb.exe'
  if (Test-Path -LiteralPath $adb) { return $adb }
  return $null
}

function Find-Jdk17([string]$Jdk17Path) {
  if (-not $Jdk17Path) {
    $candidate = Get-ChildItem -LiteralPath 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    if ($candidate) { $Jdk17Path = $candidate.FullName }
  }
  if ($Jdk17Path -and (Test-Path -LiteralPath (Join-Path $Jdk17Path 'bin\java.exe'))) { return $Jdk17Path }
  return $null
}

function Get-DebugApk { return (Join-Path $script:RepoRoot 'app\android\app\build\outputs\apk\debug\app-debug.apk') }
