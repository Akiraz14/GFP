<#
.SYNOPSIS
  Stage 02 spike validation on Android (experimental branch, synthetic data only).

.DESCRIPTION
  Runs from a detached worktree of the spike commit. Raw evidence is written outside
  every repository: <EvidenceRoot>\<timestamp>-<commit>\.

  Levels:
    -CheckOnly  preconditions, tool detection, PBKDF2 vectors and synthetic image
                manifest. No build, no install, no device changes.
    (default)   full flow: quality checks, Debug and Release builds, APK inspection,
                non-destructive installation scenarios, SQLCipher wrong-key protocol,
                at-rest inspection, Release diagnostics, manual P3/P4 steps, privacy scan.

  Never automated: uninstall, adb uninstall -k, pm clear, deleting app data or device
  files, logcat -c / -G, overwriting APKs, images or evidence.

  Result vocabulary: PASS, FAIL, BLOCKED, NOT RUN, INFO.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\poc-stage02.ps1 -ExpectedCommit <hash> -CheckOnly
#>
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedCommit,
  [string]$MainRepository = '',
  [string]$EvidenceRoot = '',
  [string]$OcrImageFolder = '',
  [string]$Avd = 'Pixel_4_Android_10',
  [string]$Serial = '',
  [string]$Jdk17Path = '',
  [switch]$CheckOnly,
  [switch]$SkipNpmCi
)

$ErrorActionPreference = 'Continue'
$Package = 'co.gfpsas.gestionfinanciera'
$Activity = "$Package/.MainActivity"
$Stage01Commit = 'e10cebf31b29fffcc783b0817724ed34308a39c8'
$Stage01Apks = @(
  [pscustomobject]@{ Name = 'Debug Etapa 01'; Path = 'app\android\app\build\outputs\apk\debug\app-debug.apk'; Sha256 = '8EB6D5A0D3317A852ACA7A0A560459E579F25BBD1238B90388CED32BF39B395E' },
  [pscustomobject]@{ Name = 'Release Etapa 01'; Path = 'app\android\app\build\outputs\apk\release\app-release.apk'; Sha256 = 'D39154D3AE285AE089BFBF7AC53E7997B7CB1C905D27ED53982B721801E4FA05' }
)
$FixedVectors = @{
  V3  = '1b91267173e194ddf291adf386f7e7c773ea05482c57e218be3c193a90b43eed'
  V7  = '4cff0013b242c0afbee327b6bfc8a603e3171e9073794380051563880abb066f'
  V7D = '4174819fd6e3923b2980f788f4dcc757c8a74c65f5aef94cc2e742930d92eb15'
}
$WrongKeyDatabases = @('poc-p1-wrong-key-v2.db', 'poc-p1b-wrong-key-v2.db')
$CanaryDatabase = 'poc-canary-v2.db'
$LogPattern = 'GFP-POC\|v2\|(r[0-9a-z]+)\|(\d+)\|([A-Z0-9_]+)\|([^|]*)\|([^|]*)\|(OK|FAIL|INFO|BLOCKED)\|(.*)$'
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$RequiredExtendedVectors = @('V2', 'V3', 'V7', 'V7D')

$ProtocolLibrary = Join-Path $PSScriptRoot 'poc-stage02.lib.ps1'
if (-not (Test-Path -LiteralPath $ProtocolLibrary)) { Write-Host "No se encontro $ProtocolLibrary" -ForegroundColor Red; exit 2 }
. $ProtocolLibrary

$Root = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Root 'app'
$Android = Join-Path $App 'android'
if (-not $MainRepository) { $MainRepository = Join-Path (Split-Path -Parent $Root) 'GFP' }
if (-not $EvidenceRoot) { $EvidenceRoot = Join-Path (Split-Path -Parent $Root) 'GFP-spike02-evidencias' }

$Checks = New-Object System.Collections.ArrayList
$Store = @{}
$RunLabels = [ordered]@{}
$WrittenBlocks = @{}
$LateChecks = New-Object System.Collections.ArrayList
$script:Adb = ''
$script:Device = $null
$script:DeviceKind = ''
$script:Evidence = ''

function Set-Check([string]$Id, [string]$Status, [string]$Detail, [string]$Evidence = '') {
  $existing = $Checks | Where-Object { $_.Id -eq $Id } | Select-Object -First 1
  if ($existing) { [void]$Checks.Remove($existing) }
  [void]$Checks.Add([pscustomobject]@{ Id = $Id; Status = $Status; Detail = $Detail; Evidence = $Evidence })
  $color = switch ($Status) { 'PASS' { 'Green' } 'FAIL' { 'Red' } 'BLOCKED' { 'Magenta' } 'NOT RUN' { 'Yellow' } default { 'Gray' } }
  Write-Host ("[{0}] {1} - {2}" -f $Status, $Id, $Detail) -ForegroundColor $color
}

function Write-NewFile([string]$Path, [string[]]$Lines) {
  if (Test-Path -LiteralPath $Path) { throw "evidence file already exists: $Path" }
  [System.IO.File]::WriteAllLines($Path, [string[]]$Lines, $Utf8)
}

function Add-Line([string]$Path, [string]$Line) {
  [System.IO.File]::AppendAllText($Path, $Line + [Environment]::NewLine, $Utf8)
}

function Write-Summary {
  if (-not $script:Evidence) { return }
  $lines = New-Object System.Collections.ArrayList
  [void]$lines.Add('# Spike Etapa 02 - resumen de ejecucion')
  [void]$lines.Add('')
  [void]$lines.Add("- Fecha: $(Get-Date -Format o)")
  [void]$lines.Add("- Commit: $ExpectedCommit")
  [void]$lines.Add("- Worktree: $Root")
  [void]$lines.Add("- Dispositivo: $($script:Device) ($($script:DeviceKind))")
  [void]$lines.Add("- Modo: $(if ($CheckOnly) { 'CheckOnly' } else { 'completo' })")
  [void]$lines.Add('- Acciones destructivas automatizadas: ninguna')
  [void]$lines.Add('')
  [void]$lines.Add('| Comprobacion | Resultado | Detalle | Evidencia |')
  [void]$lines.Add('|---|---|---|---|')
  foreach ($c in $Checks) {
    [void]$lines.Add(("| {0} | {1} | {2} | {3} |" -f $c.Id, $c.Status, ($c.Detail -replace '\|', '/'), $c.Evidence))
  }
  $summary = Join-Path $script:Evidence 'summary.md'
  [System.IO.File]::WriteAllLines($summary, [string[]]$lines, $Utf8)
  $json = Join-Path $script:Evidence 'results.json'
  [System.IO.File]::WriteAllText($json, ($Checks | ConvertTo-Json -Depth 3), $Utf8)
}

function Stop-Script([string]$Reason) {
  Set-Check 'SCRIPT' 'BLOCKED' $Reason
  Write-Summary
  if ($script:Evidence) { Write-Host "Evidencias: $($script:Evidence)" -ForegroundColor Cyan }
  exit 2
}

function Confirm-Action([string]$Question) {
  $answer = Read-Host "$Question [s/N]"
  return ($answer -match '^(s|si)$')
}

function Wait-User([string]$Instruction) {
  Write-Host ''
  Write-Host $Instruction -ForegroundColor Cyan
  [void](Read-Host 'Pulse Enter cuando haya terminado')
}

function Invoke-Logged([string]$File, [string[]]$Arguments, [string]$LogName, [string]$Directory = $Root) {
  $log = Join-Path $script:Evidence $LogName
  Add-Line $log ("> {0} {1}" -f $File, ($Arguments -join ' '))
  Push-Location -LiteralPath $Directory
  try {
    & $File @Arguments 2>&1 | ForEach-Object { Add-Line $log "$_" }
    $code = $LASTEXITCODE
  }
  finally { Pop-Location }
  Add-Line $log "< exit code: $code"
  return $code
}

function Get-AdbText([string[]]$Arguments) {
  return (& $script:Adb -s $script:Device @Arguments 2>&1 | Out-String).Trim()
}

function Test-Inside([string]$Path, [string]$Parent) {
  $p = [System.IO.Path]::GetFullPath($Path).TrimEnd('\') + '\'
  $q = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\') + '\'
  return $p.StartsWith($q, [System.StringComparison]::OrdinalIgnoreCase)
}

function Get-GitState([string]$Repository) {
  $head = (& git -C $Repository --no-optional-locks rev-parse HEAD 2>&1 | Out-String).Trim()
  $status = (& git -C $Repository --no-optional-locks status --porcelain --untracked-files=all 2>&1 | Out-String).Trim()
  $refs = (& git -C $Repository --no-optional-locks for-each-ref --format='%(refname) %(objectname)' refs/heads refs/tags 2>&1 | Out-String).Trim()
  return "HEAD $head`nSTATUS`n$status`nREFS`n$refs"
}

function Test-Stage01Apks([string]$Moment) {
  $ok = $true
  $details = @()
  foreach ($apk in $Stage01Apks) {
    $path = Join-Path $MainRepository $apk.Path
    if (-not (Test-Path -LiteralPath $path)) { $details += "$($apk.Name): no existe"; continue }
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    Add-Line (Join-Path $script:Evidence 'stage01-apk-sha256.txt') "$Moment $($apk.Name) $hash"
    if ($hash -ne $apk.Sha256) { $ok = $false; $details += "$($apk.Name): $hash distinto" } else { $details += "$($apk.Name): intacto" }
  }
  Set-Check "INTEGRITY-STAGE01-$Moment" $(if ($ok) { 'PASS' } else { 'FAIL' }) ($details -join '; ') 'stage01-apk-sha256.txt'
}

function Get-Pbkdf2Vectors {
  $source = Join-Path $App 'src\poc\pbkdf2Vectors.ts'
  $text = Get-Content -LiteralPath $source -Raw -Encoding UTF8
  $pattern = "(?s)\{\s*id:\s*'(V\d+D?)'.*?password:\s*'([^']*)'.*?salt:\s*'([^']*)'.*?iterations:\s*(\d+).*?keyLength:\s*(\d+).*?expected:\s*'([0-9a-f]+)'"
  return @([regex]::Matches($text, $pattern) | ForEach-Object {
      [pscustomobject]@{
        Id = $_.Groups[1].Value
        Password = [regex]::Unescape($_.Groups[2].Value)
        Salt = [regex]::Unescape($_.Groups[3].Value)
        Iterations = [int]$_.Groups[4].Value
        KeyLength = [int]$_.Groups[5].Value
        Expected = $_.Groups[6].Value
      }
    })
}

function ConvertTo-HexString([byte[]]$Bytes) {
  return (($Bytes | ForEach-Object { $_.ToString('x2') }) -join '')
}

function Invoke-DotNetPbkdf2([byte[]]$Password, [byte[]]$Salt, [int]$Iterations, [int]$Length) {
  $kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($Password, $Salt, $Iterations, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
  try { return (ConvertTo-HexString $kdf.GetBytes($Length)) } finally { $kdf.Dispose() }
}

function Test-Pbkdf2Vectors {
  $vectors = Get-Pbkdf2Vectors
  $report = Join-Path $script:Evidence 'pbkdf2-vectors.txt'
  Add-Line $report "vectors read: $($vectors.Count)"
  $nodeScript = Join-Path $script:Evidence 'pbkdf2-node.js'
  Write-NewFile $nodeScript @(
    "const crypto = require('crypto');",
    "const [, , passwordHex, saltHex, iterations, length] = process.argv;",
    "process.stdout.write(crypto.pbkdf2Sync(Buffer.from(passwordHex, 'hex'), Buffer.from(saltHex, 'hex'), Number(iterations), Number(length), 'sha256').toString('hex'));"
  )
  $allMatch = $true
  foreach ($id in $FixedVectors.Keys) {
    $vector = $vectors | Where-Object { $_.Id -eq $id } | Select-Object -First 1
    if (-not $vector -or $vector.Expected -ne $FixedVectors[$id]) {
      Stop-Script "PBKDF2: el vector $id no coincide con el valor fijado antes de las pruebas"
    }
  }
  foreach ($vector in $vectors) {
    $passwordBytes = $Utf8.GetBytes($vector.Password)
    $saltBytes = $Utf8.GetBytes($vector.Salt)
    $nodeResult = (& node $nodeScript (ConvertTo-HexString $passwordBytes) (ConvertTo-HexString $saltBytes) "$($vector.Iterations)" "$($vector.KeyLength)" 2>&1 | Out-String).Trim()
    try { $dotnetResult = Invoke-DotNetPbkdf2 $passwordBytes $saltBytes $vector.Iterations $vector.KeyLength }
    catch { $dotnetResult = 'NOT RUN (.NET rejected the input, e.g. salt shorter than 8 bytes)' }
    $nodeOk = $nodeResult -ceq $vector.Expected
    $dotnetOk = $dotnetResult -ceq $vector.Expected
    Add-Line $report ("{0}: passwordUtf8={1} node={2} ({3}) .NET={4} ({5})" -f $vector.Id, (ConvertTo-HexString $passwordBytes), $nodeResult, $nodeOk, $dotnetResult, $dotnetOk)
    if (-not $nodeOk) { $allMatch = $false }
    if ($FixedVectors.ContainsKey($vector.Id) -and -not ($nodeOk -and $dotnetOk)) { $allMatch = $false }
  }
  if ($allMatch) { Set-Check 'PRE-PBKDF2-VECTORS' 'PASS' 'Node y .NET reproducen V3, V7 y V7D; Node reproduce todos' 'pbkdf2-vectors.txt' }
  else { Stop-Script 'PBKDF2: algun vector no se reproduce antes de las pruebas (ver pbkdf2-vectors.txt)' }
}

function Get-FixtureTokens {
  $text = Get-Content -LiteralPath (Join-Path $App 'src\poc\ocrFixtures.ts') -Raw -Encoding UTF8
  $tokens = New-Object System.Collections.ArrayList
  foreach ($m in [regex]::Matches($text, "buildFixture\(\s*(\d+),\s*'([A-Z2-7]{6})'")) {
    [void]$tokens.Add(('SINTOCR-{0:D2}-{1}' -f [int]$m.Groups[1].Value, $m.Groups[2].Value))
  }
  foreach ($m in [regex]::Matches($text, "(merchant|documentNumber):\s*'([^']+)'")) { [void]$tokens.Add($m.Groups[2].Value) }
  return @($tokens)
}

function Test-OcrImageFolder {
  if (-not $OcrImageFolder) { Set-Check 'PRE-OCR-IMAGES' 'NOT RUN' 'sin -OcrImageFolder'; return $null }
  if (-not (Test-Path -LiteralPath $OcrImageFolder)) { Set-Check 'PRE-OCR-IMAGES' 'BLOCKED' "no existe $OcrImageFolder"; return $null }
  $folder = (Resolve-Path -LiteralPath $OcrImageFolder).Path
  foreach ($repository in @($Root, $MainRepository)) {
    if (Test-Inside $folder $repository) { Set-Check 'PRE-OCR-IMAGES' 'BLOCKED' 'la carpeta de imagenes esta dentro de un repositorio'; return $null }
  }
  $manifestPath = Join-Path $folder 'manifest.json'
  if (-not (Test-Path -LiteralPath $manifestPath)) { Set-Check 'PRE-OCR-IMAGES' 'BLOCKED' 'falta manifest.json'; return $null }
  $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $images = @()
  foreach ($entry in $manifest.images) {
    $image = Join-Path $folder "$($entry.id).jpg"
    $expected = Join-Path $folder "$($entry.id).expected.json"
    if (-not (Test-Path -LiteralPath $image) -or -not (Test-Path -LiteralPath $expected)) { Set-Check 'PRE-OCR-IMAGES' 'BLOCKED' "falta $($entry.id)"; return $null }
    $hash = (Get-FileHash -LiteralPath $image -Algorithm SHA256).Hash.ToLower()
    $data = Get-Content -LiteralPath $expected -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($hash -ne $entry.imageSha256 -or $data.synthetic -ne $true) { Set-Check 'PRE-OCR-IMAGES' 'BLOCKED' "$($entry.id): hash o marca sintetica no valida"; return $null }
    $images += [pscustomobject]@{ Id = $entry.id; Path = $image; Sha256 = $hash }
  }
  Set-Check 'PRE-OCR-IMAGES' 'PASS' "$($images.Count) imagenes sinteticas con hash verificado"
  return $images
}

function Find-Tool([string]$Name, [string]$Pattern) {
  $buildTools = Join-Path $env:ANDROID_HOME 'build-tools'
  return (Get-ChildItem -LiteralPath $buildTools -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName $Pattern } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
}

function Get-CertificateDigest([string]$Apk) {
  $output = (& $script:ApkSigner verify --print-certs $Apk 2>&1 | Out-String)
  if ($output -match 'certificate SHA-256 digest:\s*([0-9a-fA-F]{64})') { return $Matches[1].ToLower() }
  return ''
}

function Get-ApkVersionCode([string]$Apk) {
  $output = (& $script:Aapt2 dump badging $Apk 2>&1 | Out-String)
  if ($output -match "versionCode='(\d+)'") { return [int]$Matches[1] }
  return -1
}

# ---------- logcat collection ----------

function Update-Store {
  $temp = Join-Path $script:Evidence ("tmp-logcat-{0}.txt" -f [guid]::NewGuid().ToString('N'))
  & $script:Adb -s $script:Device logcat -d -v threadtime 2>&1 | Out-File -LiteralPath $temp -Encoding utf8
  foreach ($line in (Get-Content -LiteralPath $temp -Encoding UTF8)) {
    $m = [regex]::Match("$line", $LogPattern)
    if ($m.Success) {
      $key = "$($m.Groups[1].Value)|$($m.Groups[2].Value)"
      if (-not $Store.ContainsKey($key)) {
        $Store[$key] = [pscustomobject]@{ RunId = $m.Groups[1].Value; Seq = [int]$m.Groups[2].Value; Step = $m.Groups[3].Value; Test = $m.Groups[4].Value; Code = $m.Groups[5].Value; Status = $m.Groups[6].Value; Detail = $m.Groups[7].Value.TrimEnd("'", '"', ' ') }
      }
    }
    elseif ("$line" -match 'FATAL EXCEPTION' -or ("$line" -match 'AndroidRuntime' -and "$line" -match [regex]::Escape($Package))) {
      Add-Line (Join-Path $script:Evidence 'crashes.txt') "$line"
    }
  }
  Remove-Item -LiteralPath $temp -Force
}

function Get-RunEntries([string]$RunId) {
  return @($Store.Values | Where-Object { $_.RunId -eq $RunId } | Sort-Object Seq)
}

function Format-Entry($e) { return "GFP-POC|v2|$($e.RunId)|$($e.Seq)|$($e.Step)|$($e.Test)|$($e.Code)|$($e.Status)|$($e.Detail)" }

function Test-SequenceGaps([string]$RunId) {
  $entries = Get-RunEntries $RunId
  if ($entries.Count -eq 0) { return 'no entries' }
  $missing = @()
  for ($i = 1; $i -le $entries[-1].Seq; $i++) { if (-not $Store.ContainsKey("$RunId|$i")) { $missing += $i } }
  if ($missing.Count -gt 0) { return "missing seq: $(($missing | Select-Object -First 20) -join ',')" }
  return ''
}

function Save-CompletedSteps([string]$RunId) {
  $entries = Get-RunEntries $RunId
  $occurrence = @{}
  $block = $null
  foreach ($e in $entries) {
    if ($e.Code -eq 'step_begin') { $block = New-Object System.Collections.ArrayList; if (-not $occurrence.ContainsKey($e.Step)) { $occurrence[$e.Step] = 0 }; $occurrence[$e.Step]++ }
    if ($null -ne $block) { [void]$block.Add((Format-Entry $e)) }
    if ($e.Code -eq 'step_end' -and $null -ne $block) {
      $name = "{0}-{1}-{2}.txt" -f $RunId, $e.Step, $occurrence[$e.Step]
      if (-not $WrittenBlocks.ContainsKey($name)) {
        Write-NewFile (Join-Path $script:Evidence "steps\$name") ([string[]]$block)
        $WrittenBlocks[$name] = $true
      }
      $block = $null
    }
  }
}

function Get-DeviceEpochMs {
  $seconds = Get-AdbText @('shell', 'date', '+%s')
  if ($seconds -match '^\d+$') { return [int64]$seconds * 1000 }
  return [int64]0
}

function Wait-NewRun([int64]$SinceMs, [int]$Seconds) {
  $limit = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $limit) {
    Update-Store
    $starts = @($Store.Values | Where-Object { $_.Code -eq 'run_start' -and $_.Detail -match 'startedAtMs=(\d+)' -and [int64]$Matches[1] -ge ($SinceMs - 2000) -and -not $RunLabels.Contains($_.RunId) } | Sort-Object RunId)
    if ($starts.Count -gt 0) { return $starts[0].RunId }
    Start-Sleep -Seconds 3
  }
  return $null
}

function Wait-StepEnd([string]$RunId, [string]$Step, [int]$Occurrence, [int]$Seconds) {
  $limit = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $limit) {
    Update-Store
    $ends = @(Get-RunEntries $RunId | Where-Object { $_.Step -eq $Step -and $_.Code -eq 'step_end' })
    if ($ends.Count -ge $Occurrence) { Save-CompletedSteps $RunId; return $true }
    Start-Sleep -Seconds 3
  }
  return $false
}

function Wait-StepState([string]$RunId, [string]$Step, [int]$StartSeconds, [int]$EndSeconds) {
  Update-Store
  $baseline = 0
  foreach ($e in @(Get-RunEntries $RunId)) { if ($e.Seq -gt $baseline) { $baseline = $e.Seq } }
  $started = Get-Date
  $limit = $started.AddSeconds($StartSeconds)
  $beginSeen = $false
  while ($true) {
    Update-Store
    $state = Get-StepWaitState $RunId $Step @($Store.Values) $baseline
    if (@('complete', 'other_run', 'interrupted', 'incomplete_block') -contains $state.Phase) { break }
    if (-not $beginSeen -and $state.Phase -eq 'running') { $beginSeen = $true; $limit = (Get-Date).AddSeconds($EndSeconds) }
    if ((Get-Date) -ge $limit) { break }
    Start-Sleep -Seconds 3
  }
  if ($state.Phase -eq 'complete') { Save-CompletedSteps $RunId }
  $alive = (Get-AdbText @('shell', 'pidof', $Package)) -match '^\d+'
  return [pscustomobject]@{ State = $state; Baseline = $baseline; ElapsedSeconds = [int]((Get-Date) - $started).TotalSeconds; ProcessAlive = [bool]$alive }
}

function Wait-AppIdle([string]$RunId, [int]$Seconds) {
  $limit = (Get-Date).AddSeconds($Seconds)
  while ($true) {
    Update-Store
    $open = Get-OpenStep $RunId @($Store.Values)
    if (-not $open -or (Get-Date) -ge $limit) { return $open }
    Write-Host "La app sigue ejecutando $open; esperando a que termine antes del siguiente paso." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 10
  }
}

function Register-LateCheck([string]$Id, [string]$RunId, $Wait, [string]$Kind) {
  if ($Wait.State.Phase -ne 'complete') {
    [void]$LateChecks.Add([pscustomobject]@{ Id = $Id; RunId = $RunId; Step = $Wait.State.Step; Baseline = $Wait.Baseline; Kind = $Kind })
  }
}

function Start-AppRun([string]$Label, [string]$Launch = 'start') {
  $since = Get-DeviceEpochMs
  if ($Launch -eq 'back') {
    [void](Get-AdbText @('shell', 'input', 'keyevent', 'KEYCODE_BACK'))
    Start-Sleep -Seconds 3
  }
  elseif ($Launch -eq 'force-stop') {
    [void](Get-AdbText @('shell', 'am', 'force-stop', $Package))
    Start-Sleep -Seconds 2
  }
  $pidBefore = Get-AdbText @('shell', 'pidof', $Package)
  [void](Get-AdbText @('shell', 'am', 'start', '-n', $Activity))
  $runId = Wait-NewRun $since 240
  if (-not $runId) {
    $pidNow = Get-AdbText @('shell', 'pidof', $Package)
    if ($pidNow -match '^\d+$') { Set-Check "RUN-$Label" 'BLOCKED' 'el proceso esta vivo pero no hay run_start en 240 s (diagnostico no disponible)' 'crashes.txt' }
    else { Set-Check "RUN-$Label" 'FAIL' 'la app no arranco o se cerro (ver crashes.txt)' 'crashes.txt' }
    return $null
  }
  $RunLabels[$runId] = $Label
  if (-not (Wait-StepEnd $runId 'AUTO' 1 300)) {
    Set-Check "RUN-$Label" 'BLOCKED' "sin step_end AUTO en 300 s ($runId)"
    return $runId
  }
  $pidAfter = Get-AdbText @('shell', 'pidof', $Package)
  $gaps = Test-SequenceGaps $runId
  $problems = @(Get-RunEntries $runId | Where-Object { $_.Step -eq 'AUTO' -and ($_.Status -eq 'FAIL' -or $_.Status -eq 'BLOCKED') })
  Add-Line (Join-Path $script:Evidence 'runs.txt') "$Label $runId pidBefore=$pidBefore pidAfter=$pidAfter gaps=$gaps"
  if ($gaps) { Set-Check "RUN-$Label" 'BLOCKED' "$runId log_gap: $gaps" }
  elseif ($problems.Count -gt 0) { Set-Check "RUN-$Label" 'FAIL' "$runId con $($problems.Count) FAIL/BLOCKED: $(($problems | ForEach-Object { "$($_.Test)|$($_.Code)|$($_.Status)" }) -join ', ')" "steps\$runId-AUTO-1.txt" }
  else { Set-Check "RUN-$Label" 'PASS' "$runId sin FAIL ni BLOCKED (pid $pidBefore -> $pidAfter)" "steps\$runId-AUTO-1.txt" }
  return $runId
}

function Find-Entry([string]$RunId, [string]$Test, [string]$Code) {
  return (Get-RunEntries $RunId | Where-Object { $_.Test -eq $Test -and $_.Code -eq $Code } | Select-Object -First 1)
}

# ---------- private storage inspection (Debug only) ----------

function Get-DeviceFileState([string]$Relative) {
  $sha = Get-AdbText @('shell', 'run-as', $Package, 'sha256sum', $Relative)
  $stat = Get-AdbText @('shell', 'run-as', $Package, 'stat', '-c', '%s:%Y', $Relative)
  $hash = ''
  if ($sha -match '^([0-9a-fA-F]{64})\s') { $hash = $Matches[1].ToLower() }
  return [pscustomobject]@{ Sha = $hash; Stat = $stat }
}

function Save-WrongKeyHashes([string]$Moment) {
  $listing = Get-AdbText @('shell', 'run-as', $Package, 'ls', '-la', 'databases')
  Add-Line (Join-Path $script:Evidence 'wrong-key-hashes.txt') "== $Moment`n$listing"
  $result = @{}
  foreach ($db in $WrongKeyDatabases) {
    $aux = @("$db-journal", "$db-wal") | Where-Object { $listing -match [regex]::Escape($_) }
    $state = Get-DeviceFileState "databases/$db"
    Add-Line (Join-Path $script:Evidence 'wrong-key-hashes.txt') "$Moment $db sha=$($state.Sha) stat=$($state.Stat) aux=$($aux -join ',')"
    $result[$db] = [pscustomobject]@{ Sha = $state.Sha; Aux = @($aux) }
  }
  return $result
}

function Copy-DeviceFile([string]$Relative, [string]$Destination) {
  $info = New-Object System.Diagnostics.ProcessStartInfo
  $info.FileName = $script:Adb
  $info.Arguments = "-s $($script:Device) exec-out run-as $Package cat $Relative"
  $info.UseShellExecute = $false
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $process = [System.Diagnostics.Process]::Start($info)
  $stream = [System.IO.File]::Open($Destination, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
  try { $process.StandardOutput.BaseStream.CopyTo($stream) } finally { $stream.Close() }
  [void]$process.StandardError.ReadToEnd()
  $process.WaitForExit()
  return $process.ExitCode
}

function Test-AtRest([string[]]$Markers, [string]$CanaryMarker) {
  $folder = Join-Path $script:Evidence 'db-copies'
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
  $report = Join-Path $script:Evidence 'at-rest.txt'
  $listing = Get-AdbText @('shell', 'run-as', $Package, 'ls', '-la', 'databases')
  Add-Line $report "ls -la databases`n$listing"
  $names = @(($listing -split "`r?`n") | ForEach-Object { if ($_ -match '\s(poc-[\w.-]+)\s*$') { $Matches[1] } })
  if ($names.Count -eq 0) { Set-Check 'AT-REST' 'BLOCKED' 'run-as no listo bases poc-*' 'at-rest.txt'; return }
  $failures = @(); $blocked = @(); $passes = 0
  foreach ($name in $names) {
    $before = Get-DeviceFileState "databases/$name"
    $hashes = @()
    foreach ($copy in @('A', 'B', 'C')) {
      $target = Join-Path $folder "$name.$copy"
      [void](Copy-DeviceFile "databases/$name" $target)
      $hashes += (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower()
    }
    $after = Get-DeviceFileState "databases/$name"
    Add-Line $report "$name before=$($before.Sha)/$($before.Stat) after=$($after.Sha)/$($after.Stat) copies=$($hashes -join ',')"
    $verified = $before.Sha -and ($before.Sha -eq $after.Sha) -and ($before.Stat -eq $after.Stat) -and ($hashes[0] -eq $before.Sha) -and ($hashes[1] -eq $hashes[0]) -and ($hashes[2] -eq $hashes[0])
    if (-not $verified) { $blocked += "$name (integridad de copias no verificable)"; continue }
    $bytes = [System.IO.File]::ReadAllBytes((Join-Path $folder "$name.A"))
    $latin1 = [System.Text.Encoding]::GetEncoding(28591).GetString($bytes)
    $plainHeader = $latin1.StartsWith("SQLite format 3`0")
    if ($name -like "$CanaryDatabase*") {
      if ($name -eq $CanaryDatabase -and -not ($plainHeader -and $latin1.Contains($CanaryMarker))) { $blocked += "$name control positivo sin cabecera o marcador en claro" } else { $passes++ }
      continue
    }
    if ($name -match '\.db$' -and $plainHeader) { $failures += "$name cabecera SQLite en claro" }
    foreach ($marker in $Markers) { if ($marker -and $latin1.Contains($marker)) { $failures += "$name contiene $marker" } }
    $passes++
  }
  if ($failures.Count -gt 0) { Set-Check 'AT-REST' 'FAIL' ($failures -join '; ') 'at-rest.txt' }
  elseif ($blocked.Count -gt 0) { Set-Check 'AT-REST' 'BLOCKED' ($blocked -join '; ') 'at-rest.txt' }
  else { Set-Check 'AT-REST' 'PASS' "$passes archivos: copias A=B=C=original, sin cabecera ni marcadores en claro; control positivo legible" 'at-rest.txt' }
}

function Test-MarkerSearch([string]$CanaryMarker, [string[]]$SecretMarkers, [string]$InspectionRunId) {
  $report = Join-Path $script:Evidence 'marker-search.txt'
  $canary = (& $script:Adb -s $script:Device shell run-as $Package grep -rlF $CanaryMarker . 2>&1 | Out-String).Trim()
  $canaryCode = $LASTEXITCODE
  Add-Line $report "canary $CanaryMarker exit=$canaryCode`n$canary"
  $canaryFiles = @(($canary -split "`r?`n") | Where-Object { $_ })
  if ($canaryCode -ne 0 -or $canaryFiles.Count -eq 0) {
    $prefixed = (& $script:Adb -s $script:Device shell run-as $Package grep -rlF 'GFP-POC-CANARY-' . 2>&1 | Out-String).Trim()
    $prefixedCode = $LASTEXITCODE
    Add-Line $report "diagnostic prefix GFP-POC-CANARY- exit=$prefixedCode`n$prefixed"
    Set-Check 'MARKER-SEARCH' 'BLOCKED' "canary_missing: el control positivo de $InspectionRunId no se encontro (grep exit=$canaryCode); archivos con prefijo GFP-POC-CANARY-: [$(($prefixed -split "`r?`n") -join ', ')]" 'marker-search.txt'
    return
  }
  if ($canaryFiles.Count -ne 1 -or $canaryFiles[0] -notmatch "databases/$([regex]::Escape($CanaryDatabase))$") { Set-Check 'MARKER-SEARCH' 'FAIL' "el marcador canario aparece en: $($canaryFiles -join ', ')" 'marker-search.txt'; return }
  $exposed = @()
  foreach ($marker in $SecretMarkers) {
    if (-not $marker) { continue }
    $found = (& $script:Adb -s $script:Device shell run-as $Package grep -rlF $marker . 2>&1 | Out-String).Trim()
    $code = $LASTEXITCODE
    $external = (& $script:Adb -s $script:Device shell grep -rlF $marker "/sdcard/Android/data/$Package" 2>&1 | Out-String).Trim()
    Add-Line $report "$marker private exit=$code [$found] external [$external]"
    if ($code -eq 0 -and $found) { $exposed += "$marker en $found" }
    elseif ($code -ne 1) { Set-Check 'MARKER-SEARCH' 'BLOCKED' "grep devolvio $code para $marker" 'marker-search.txt'; return }
    if (@(($external -split "`r?`n") | Where-Object { $_ -like '/sdcard/*' }).Count -gt 0) { $exposed += "$marker en almacenamiento externo" }
  }
  if ($exposed.Count -gt 0) { Set-Check 'MARKER-SEARCH' 'FAIL' ($exposed -join '; ') 'marker-search.txt' }
  else { Set-Check 'MARKER-SEARCH' 'PASS' "control positivo solo en $CanaryDatabase; $($SecretMarkers.Count) marcadores protegidos sin coincidencias" 'marker-search.txt' }
}

function Test-StandardSqlite([string]$DatabaseName) {
  $copies = Join-Path $script:Evidence 'db-copies'
  $target = Join-Path $copies "$DatabaseName.D"
  $canaryCopy = Join-Path $copies "$CanaryDatabase.D"
  $sqlite = Get-Command sqlite3 -ErrorAction SilentlyContinue
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $sqlite -and -not $python) { Set-Check 'P1-SQLITE-STANDARD' 'NOT RUN' 'no hay sqlite3.exe ni python en PATH; procedimiento manual en SPIKE-NO-INTEGRAR.md'; return }
  [void](Copy-DeviceFile "databases/$DatabaseName" $target)
  [void](Copy-DeviceFile "databases/$CanaryDatabase" $canaryCopy)
  $report = Join-Path $script:Evidence 'sqlite-standard.txt'
  $results = @{}
  foreach ($file in @($target, $canaryCopy)) {
    if ($sqlite) { $output = (& sqlite3 -readonly $file 'SELECT count(*) FROM sqlite_master;' 2>&1 | Out-String).Trim() }
    else {
      $uri = 'file:///' + ($file -replace '\\', '/') + '?mode=ro&immutable=1'
      $output = (& python -I -c "import sqlite3,sys; c=sqlite3.connect(sys.argv[1], uri=True); print(c.execute('SELECT count(*) FROM sqlite_master').fetchone()[0])" $uri 2>&1 | Out-String).Trim()
    }
    Add-Line $report "$file => $output"
    $results[$file] = $output
  }
  $canaryOk = $results[$canaryCopy] -match '^\d+$'
  $encryptedRejected = $results[$target] -match 'not a database'
  if (-not $canaryOk) { Set-Check 'P1-SQLITE-STANDARD' 'BLOCKED' 'la herramienta no abre ni el control positivo en claro' 'sqlite-standard.txt' }
  elseif ($encryptedRejected) { Set-Check 'P1-SQLITE-STANDARD' 'PASS' 'SQLite estandar abre el control y rechaza la copia cifrada (file is not a database)' 'sqlite-standard.txt' }
  elseif ($results[$target] -match '^\d+$') { Set-Check 'P1-SQLITE-STANDARD' 'FAIL' 'SQLite estandar leyo la copia cifrada' 'sqlite-standard.txt' }
  else { Set-Check 'P1-SQLITE-STANDARD' 'BLOCKED' 'resultado no concluyente' 'sqlite-standard.txt' }
}

# ---------- privacy scan ----------

$DetailSchemas = @{
  'ocr_result'         = '^source=(gallery|camera|batch)(;index=\d{2})?;durationMs=\d+;chars=\d+;blocks=\d+;lines=\d+$'
  'ocr_error'          = '^source=(gallery|camera|batch)(;index=\d{2})?;durationMs=\d+;errorName=[A-Za-z]+$'
  'ocr_quality'        = '^index=\d{2};fieldMerchant=[01];fieldDate=[01];fieldTotal=[01];fieldCurrency=[01];fieldDocument=[01];tokenRecall=[\d.]+;similarity=-?[\d.]+$'
  'picker_result'      = '^source=(gallery|camera);mime=([a-z]+/[a-z0-9.+-]+|unknown);width=\d+;height=\d+;bytes=\d+$'
  'picker_error'       = '^source=(gallery|camera);(errorCode|errorName)=[a-z_A-Z]+$'
  'picker_cancelled'   = '^source=(gallery|camera)$'
  'batch_start'        = '^batchSize=\d+$'
  'batch_summary'      = '^images=\d+;failures=\d+;p50Ms=\d+;p95Ms=\d+$'
  'batch_size_invalid' = '^batchSize=.{0,12}$'
  'fixture_missing'    = '^index=\d{2}$'
}

function Invoke-PrivacyScan {
  $report = Join-Path $script:Evidence 'sensitive-scan.md'
  $files = @(Get-ChildItem -LiteralPath (Join-Path $script:Evidence 'steps') -File -ErrorAction SilentlyContinue) + @(Get-ChildItem -LiteralPath (Join-Path $script:Evidence 'runs') -File -ErrorAction SilentlyContinue)
  if ($files.Count -eq 0) { Set-Check 'PRIVACY-SCAN' 'NOT RUN' 'no hay evidencias de dispositivo que analizar'; return }
  $tokens = Get-FixtureTokens
  $exposure = @('file://', 'content://', 'http://', 'https://', '/storage/', '/sdcard/', '/data/', '/Android/data/')
  $findings = New-Object System.Collections.ArrayList
  foreach ($file in $files) {
    $number = 0
    foreach ($line in (Get-Content -LiteralPath $file.FullName -Encoding UTF8)) {
      $number++
      $m = [regex]::Match($line, $LogPattern)
      if (-not $m.Success) { [void]$findings.Add([pscustomobject]@{ Kind = 'AMBIGUOUS'; File = $file.Name; Line = $number; Rule = 'unparsed_line'; Excerpt = '' }); continue }
      $test = $m.Groups[4].Value; $code = $m.Groups[5].Value; $detail = $m.Groups[7].Value
      foreach ($pattern in $exposure) { if ($line.Contains($pattern)) { [void]$findings.Add([pscustomobject]@{ Kind = 'EXPOSURE'; File = $file.Name; Line = $number; Rule = "pattern $pattern"; Excerpt = $code }) } }
      foreach ($token in $tokens) { if ($line.Contains($token)) { [void]$findings.Add([pscustomobject]@{ Kind = 'EXPOSURE'; File = $file.Name; Line = $number; Rule = 'synthetic_token'; Excerpt = ($token.Substring(0, [Math]::Min(6, $token.Length)) + '...') }) } }
      if ($line -match "x'[0-9a-fA-F]{16,}'") { [void]$findings.Add([pscustomobject]@{ Kind = 'EXPOSURE'; File = $file.Name; Line = $number; Rule = 'sqlcipher_key_literal'; Excerpt = $code }) }
      if ($code -like 'text*') { [void]$findings.Add([pscustomobject]@{ Kind = 'EXPOSURE'; File = $file.Name; Line = $number; Rule = 'text_code'; Excerpt = $code }) }
      if ($test -eq 'P4' -and $code -ne 'step_begin') {
        if (-not $DetailSchemas.ContainsKey($code) -or $detail -notmatch $DetailSchemas[$code]) { [void]$findings.Add([pscustomobject]@{ Kind = 'EXPOSURE'; File = $file.Name; Line = $number; Rule = "schema $code"; Excerpt = $code }) }
      }
      $withoutFingerprints = $detail -replace 'fingerprint=[0-9a-f]{64}', ''
      if ($withoutFingerprints -match '[0-9a-fA-F]{64}') { [void]$findings.Add([pscustomobject]@{ Kind = 'AMBIGUOUS'; File = $file.Name; Line = $number; Rule = 'hex64_outside_fingerprint'; Excerpt = $code }) }
      if ($test -ne 'P4' -and $detail -match '([A-Za-z\u00C0-\u00FF]{2,}\s+){8,}') { [void]$findings.Add([pscustomobject]@{ Kind = 'AMBIGUOUS'; File = $file.Name; Line = $number; Rule = 'long_free_text'; Excerpt = $code }) }
      if ($detail -match '[A-Za-z]:\\') { [void]$findings.Add([pscustomobject]@{ Kind = 'AMBIGUOUS'; File = $file.Name; Line = $number; Rule = 'windows_path'; Excerpt = $code }) }
    }
  }
  $lines = @('# Analisis de privacidad', '', "Archivos analizados: $($files.Count)", '', '| Tipo | Archivo | Linea | Regla | Extracto |', '|---|---|---|---|---|')
  foreach ($f in $findings) { $lines += "| $($f.Kind) | $($f.File) | $($f.Line) | $($f.Rule) | $($f.Excerpt) |" }
  $lines += ''
  $lines += 'Los casos AMBIGUOUS requieren revision manual y quedan BLOCKED hasta que el responsable los clasifique.'
  Write-NewFile $report $lines
  $exposures = @($findings | Where-Object { $_.Kind -eq 'EXPOSURE' })
  $ambiguous = @($findings | Where-Object { $_.Kind -eq 'AMBIGUOUS' })
  if ($exposures.Count -gt 0) { Set-Check 'PRIVACY-SCAN' 'FAIL' "$($exposures.Count) exposiciones" 'sensitive-scan.md' }
  elseif ($ambiguous.Count -gt 0) { Set-Check 'PRIVACY-SCAN' 'BLOCKED' "$($ambiguous.Count) casos ambiguos pendientes de revision manual" 'sensitive-scan.md' }
  else { Set-Check 'PRIVACY-SCAN' 'PASS' "$($files.Count) archivos sin exposiciones ni casos ambiguos" 'sensitive-scan.md' }
}

# ---------- Metro ----------

function Test-Metro {
  try {
    $request = [System.Net.HttpWebRequest]::Create('http://localhost:8081/status')
    $request.Timeout = 3000; $request.ReadWriteTimeout = 3000; $request.Proxy = $null
    $response = $request.GetResponse()
    try { $text = (New-Object System.IO.StreamReader($response.GetResponseStream())).ReadToEnd() } finally { $response.Close() }
    return ($text -match 'packager-status:running')
  }
  catch { return $false }
}

function Get-PortOwner([int]$Port) {
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c) { return [int]$c.OwningProcess }
    return $null
  }
  foreach ($line in ((netstat.exe -ano -p TCP | Out-String) -split "`r?`n")) { if ($line -match "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)") { return [int]$Matches[1] } }
  return $null
}

function Start-Metro {
  if (Get-PortOwner 8081) { Set-Check 'METRO' 'BLOCKED' 'el puerto 8081 esta ocupado'; return $null }
  $metro = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', "npx.cmd react-native start --port 8081 > `"$(Join-Path $script:Evidence 'metro.log')`" 2>&1") -WorkingDirectory $App -WindowStyle Minimized -PassThru
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt 120 -and -not $metro.HasExited) {
    if (Test-Metro) { Set-Check 'METRO' 'PASS' 'Metro listo'; return $metro }
    Start-Sleep -Seconds 2
  }
  Set-Check 'METRO' 'BLOCKED' 'Metro no respondio en 120 s (ver metro.log)'
  return $metro
}

function Stop-Metro($Process) {
  if ($Process -and -not $Process.HasExited) { & taskkill.exe /PID $Process.Id /T /F 2>&1 | Out-Null }
  Start-Sleep -Seconds 2
  $owner = Get-PortOwner 8081
  if ($owner) {
    $info = Get-CimInstance Win32_Process -Filter "ProcessId=$owner" -ErrorAction SilentlyContinue
    if ($info -and ([string]$info.CommandLine) -like "*$App*") { Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue }
  }
}

# ======================= main =======================

if ((Test-Inside $Root $MainRepository) -or (Test-Inside $MainRepository $Root)) { Write-Host 'Ejecute el script desde el worktree aislado, no desde el repositorio principal.' -ForegroundColor Red; exit 2 }
if (-not (Test-Path -LiteralPath (Join-Path $MainRepository '.git'))) { Write-Host "No se encontro el repositorio principal en $MainRepository" -ForegroundColor Red; exit 2 }
if ((Test-Inside $EvidenceRoot $MainRepository) -or (Test-Inside $EvidenceRoot $Root)) { Write-Host 'La carpeta de evidencias debe estar fuera de los repositorios.' -ForegroundColor Red; exit 2 }
$script:Evidence = Join-Path $EvidenceRoot ("{0}-{1}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $ExpectedCommit.Substring(0, 7))
if (Test-Path -LiteralPath $script:Evidence) { Write-Host "Ya existe $($script:Evidence)" -ForegroundColor Red; exit 2 }
New-Item -ItemType Directory -Path $script:Evidence -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $script:Evidence 'steps') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $script:Evidence 'runs') -Force | Out-Null
Write-Host "Evidencias: $($script:Evidence)" -ForegroundColor Cyan

$head = (& git -C $Root --no-optional-locks rev-parse HEAD 2>&1 | Out-String).Trim()
$dirty = (& git -C $Root --no-optional-locks status --porcelain 2>&1 | Out-String).Trim()
& git -C $Root symbolic-ref -q HEAD 2>&1 | Out-Null
$detached = ($LASTEXITCODE -ne 0)
if ($head -ne $ExpectedCommit) { Stop-Script "HEAD del worktree es $head, se esperaba $ExpectedCommit" }
if ($dirty) { Stop-Script "el worktree tiene cambios: $dirty" }
Set-Check 'PRE-WORKTREE' 'PASS' "HEAD=$head limpio; detached=$detached"
$mainStart = Get-GitState $MainRepository
Write-NewFile (Join-Path $script:Evidence 'main-repository-start.txt') @($mainStart)
if ($mainStart -notmatch "HEAD $Stage01Commit") { Set-Check 'PRE-MAIN-REPOSITORY' 'INFO' "HEAD del repositorio principal distinto de $Stage01Commit (solo se registra)" 'main-repository-start.txt' }
else { Set-Check 'PRE-MAIN-REPOSITORY' 'PASS' "repositorio principal en $Stage01Commit (solo lectura)" 'main-repository-start.txt' }
Test-Stage01Apks 'START'

$tools = @{}
foreach ($t in @('git', 'node', 'npm.cmd', 'sqlite3', 'python')) { $tools[$t] = [bool](Get-Command $t -ErrorAction SilentlyContinue) }
if (-not $env:ANDROID_HOME -or -not (Test-Path -LiteralPath $env:ANDROID_HOME)) { Stop-Script 'ANDROID_HOME no definida' }
$script:Adb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
$script:Aapt2 = Find-Tool 'aapt2' 'aapt2.exe'
$script:ApkSigner = Find-Tool 'apksigner' 'apksigner.bat'
$tools['adb'] = Test-Path -LiteralPath $script:Adb
$tools['aapt2'] = [bool]$script:Aapt2
$tools['apksigner'] = [bool]$script:ApkSigner
Write-NewFile (Join-Path $script:Evidence 'tools.txt') @($tools.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Value)" })
$missing = @($tools.GetEnumerator() | Where-Object { -not $_.Value -and $_.Name -notin @('sqlite3', 'python') } | ForEach-Object { $_.Name })
if ($missing.Count -gt 0) { Set-Check 'PRE-TOOLS' 'BLOCKED' "faltan: $($missing -join ', ')" 'tools.txt' } else { Set-Check 'PRE-TOOLS' 'PASS' "sqlite3=$($tools['sqlite3']) python=$($tools['python'])" 'tools.txt' }

Test-Pbkdf2Vectors
$ocrImages = Test-OcrImageFolder

if ($CheckOnly) {
  Set-Check 'MODE' 'INFO' 'CheckOnly: sin compilar, instalar ni tocar el dispositivo'
  Write-Summary
  Write-Host "Evidencias: $($script:Evidence)" -ForegroundColor Cyan
  exit 0
}
if ($missing.Count -gt 0) { Stop-Script "faltan herramientas: $($missing -join ', ')" }

# 1. JDK 17 and quality checks
if (-not $Jdk17Path) {
  $candidate = Get-ChildItem -LiteralPath 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
  if ($candidate) { $Jdk17Path = $candidate.FullName }
}
if (-not ($Jdk17Path -and (Test-Path -LiteralPath (Join-Path $Jdk17Path 'bin\java.exe')))) { Stop-Script 'no se encontro JDK 17; use -Jdk17Path' }
$env:JAVA_HOME = $Jdk17Path
$env:Path = "$(Join-Path $Jdk17Path 'bin');$env:Path"
Set-Check 'ENV-JDK17' 'PASS' $Jdk17Path
$Gradlew = Join-Path $Android 'gradlew.bat'
if ($SkipNpmCi) { Set-Check 'NPM-CI' 'NOT RUN' 'parametro -SkipNpmCi' }
else { $c = Invoke-Logged 'npm.cmd' @('ci', '--no-audit', '--no-fund') 'npm-ci.log' $App; Set-Check 'NPM-CI' $(if ($c -eq 0) { 'PASS' } else { 'FAIL' }) "exit $c" 'npm-ci.log' }
foreach ($q in @(@('QUALITY-TSC', @('run', 'typecheck'), 'typecheck.log'), @('QUALITY-ESLINT', @('run', 'lint'), 'lint.log'), @('QUALITY-PRETTIER', @('run', 'format:check'), 'format.log'), @('JEST-LOGIC', @('test', '--', '--ci'), 'jest.log'))) {
  $c = Invoke-Logged 'npm.cmd' $q[1] $q[2] $App
  Set-Check $q[0] $(if ($c -eq 0) { 'PASS' } else { 'FAIL' }) "exit $c (Jest valida logica con simulaciones, no comportamiento nativo)" $q[2]
}

# 2. Builds and APK inspection
$Apks = @{ debug = Join-Path $Android 'app\build\outputs\apk\debug\app-debug.apk'; release = Join-Path $Android 'app\build\outputs\apk\release\app-release.apk' }
foreach ($variant in @('debug', 'release')) {
  $task = if ($variant -eq 'debug') { 'assembleDebug' } else { 'assembleRelease' }
  $c = Invoke-Logged $Gradlew @($task) "gradle-$task.log" $Android
  if ($c -ne 0 -or -not (Test-Path -LiteralPath $Apks[$variant])) { Set-Check "BUILD-$($variant.ToUpper())" 'FAIL' "exit $c" "gradle-$task.log"; continue }
  $hash = (Get-FileHash -LiteralPath $Apks[$variant] -Algorithm SHA256).Hash
  $size = (Get-Item -LiteralPath $Apks[$variant]).Length
  Add-Line (Join-Path $script:Evidence 'apk-spike.txt') "$variant sha256=$hash bytes=$size versionCode=$(Get-ApkVersionCode $Apks[$variant]) cert=$(Get-CertificateDigest $Apks[$variant])"
  Set-Check "BUILD-$($variant.ToUpper())" 'PASS' "SHA256 $hash; $size bytes" 'apk-spike.txt'
  [void](Invoke-Logged $script:Aapt2 @('dump', 'permissions', $Apks[$variant]) "permissions-$variant.txt")
  [void](Invoke-Logged $script:Aapt2 @('dump', 'xmltree', '--file', 'AndroidManifest.xml', $Apks[$variant]) "manifest-$variant.txt")
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($Apks[$variant])
  try {
    $entries = @($zip.Entries)
    $lines = @($entries | Where-Object { $_.FullName -like 'lib/*' -or $_.FullName -match 'mlkit|tflite' } | ForEach-Object { "{0}`t{1}`t{2}" -f $_.FullName, $_.Length, $_.CompressedLength })
    Write-NewFile (Join-Path $script:Evidence "apk-entries-$variant.txt") $lines
    $mlkit = ($entries | Where-Object { $_.FullName -match 'mlkit|tflite|text_recognition|ocr' } | Measure-Object -Property CompressedLength -Sum).Sum
    $abis = @($entries | Where-Object { $_.FullName -like 'lib/*' } | ForEach-Object { ($_.FullName -split '/')[1] } | Sort-Object -Unique) -join ','
  }
  finally { $zip.Dispose() }
  $perms = @((Get-Content -LiteralPath (Join-Path $script:Evidence "permissions-$variant.txt") -Encoding UTF8) | Where-Object { $_ -match "uses-permission: name='([^']+)'" } | ForEach-Object { ([regex]::Match($_, "name='([^']+)'")).Groups[1].Value })
  Set-Check "APK-$($variant.ToUpper())-INFO" 'INFO' "ABI=$abis; ML Kit/OCR comprimido=$mlkit bytes; permisos=$($perms -join ',')" "permissions-$variant.txt"
}
Test-Stage01Apks 'AFTER-BUILD'
if (-not (Test-Path -LiteralPath $Apks.debug) -or -not (Test-Path -LiteralPath $Apks.release)) { Stop-Script 'falta algun APK del spike; no se instala nada' }
$certDebug = Get-CertificateDigest $Apks.debug
$certRelease = Get-CertificateDigest $Apks.release
if ($certDebug -and $certDebug -eq $certRelease) { Set-Check 'APK-CERT-MATCH' 'PASS' "Debug y Release firmados con $certDebug" 'apk-spike.txt' }
else { Set-Check 'APK-CERT-MATCH' 'BLOCKED' "certificados distintos o ilegibles: $certDebug / $certRelease" 'apk-spike.txt' }

# 3. Device
& $script:Adb start-server 2>&1 | Out-Null
function Find-Device {
  foreach ($l in ((& $script:Adb devices 2>&1 | Out-String) -split "`r?`n")) { if ($l -match '^(\S+)\s+device$' -and (-not $Serial -or $Matches[1] -eq $Serial)) { return $Matches[1] } }
  return $null
}
$script:Device = Find-Device
if (-not $script:Device -and -not $Serial) {
  Start-Process -FilePath (Join-Path $env:ANDROID_HOME 'emulator\emulator.exe') -ArgumentList @('-avd', $Avd, '-no-snapshot-load') | Out-Null
  $limit = (Get-Date).AddSeconds(300)
  while (-not $script:Device -and (Get-Date) -lt $limit) { Start-Sleep -Seconds 5; $script:Device = Find-Device }
}
function Wait-Boot([int]$Seconds) {
  $limit = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $limit) { if ((Get-AdbText @('shell', 'getprop', 'sys.boot_completed')) -eq '1') { return $true }; Start-Sleep -Seconds 5 }
  return $false
}
if (-not $script:Device -or -not (Wait-Boot 300)) { Stop-Script 'sin emulador ni dispositivo listo' }
$sdk = Get-AdbText @('shell', 'getprop', 'ro.build.version.sdk')
$qemu = Get-AdbText @('shell', 'getprop', 'ro.kernel.qemu')
$script:DeviceKind = if ($qemu -eq '1') { 'emulador' } else { 'dispositivo fisico' }
$logcatHelp = Get-AdbText @('logcat', '--help')
Write-NewFile (Join-Path $script:Evidence 'device.txt') @(
  "serial=$($script:Device)", "kind=$($script:DeviceKind)", "model=$(Get-AdbText @('shell', 'getprop', 'ro.product.model'))",
  "android=$(Get-AdbText @('shell', 'getprop', 'ro.build.version.release'))", "sdk=$sdk", "abi=$(Get-AdbText @('shell', 'getprop', 'ro.product.cpu.abi'))",
  "airplane_mode_on=$(Get-AdbText @('shell', 'settings', 'get', 'global', 'airplane_mode_on'))",
  "logcat_buffers=$(Get-AdbText @('logcat', '-g'))", "logcat_pid_option=$($logcatHelp -match '--pid')")
if ([int]$sdk -lt 29) { Stop-Script "API $sdk inferior a 29" }
Set-Check 'DEVICE' 'INFO' "$($script:Device) $($script:DeviceKind) API $sdk" 'device.txt'

$installedPath = Get-AdbText @('shell', 'pm', 'path', $Package)
if ($installedPath -match 'package:(\S+)') {
  $pulled = Join-Path $script:Evidence 'tmp-installed-base.apk'
  & $script:Adb -s $script:Device pull $Matches[1] $pulled 2>&1 | Out-Null
  $certInstalled = Get-CertificateDigest $pulled
  $versionInstalled = Get-ApkVersionCode $pulled
  Remove-Item -LiteralPath $pulled -Force -ErrorAction SilentlyContinue
  Add-Line (Join-Path $script:Evidence 'apk-spike.txt') "installed cert=$certInstalled versionCode=$versionInstalled"
  if ($certInstalled -ne $certDebug) { Stop-Script "la app instalada tiene otro certificado ($certInstalled); actualizarla exigiria desinstalar (no autorizado)" }
  if ($versionInstalled -gt (Get-ApkVersionCode $Apks.debug)) { Stop-Script 'la app instalada tiene un versionCode mayor; no se instala' }
  Set-Check 'PRE-INSTALLED-APP' 'PASS' "misma firma y versionCode compatible ($versionInstalled)" 'apk-spike.txt'
}
else { Set-Check 'PRE-INSTALLED-APP' 'INFO' 'el paquete no esta instalado' }

# 4. Debug phase
$debugRuns = @()
$metro = $null
try {
  if (Confirm-Action "Instalar el APK Debug del spike con 'adb install -r' (conserva datos) en $($script:Device)?") {
    $metro = Start-Metro
    if ($metro -and (Test-Metro)) {
      $c = Invoke-Logged $script:Adb @('-s', $script:Device, 'install', '-r', $Apks.debug) 'install-debug.log'
      [void](Get-AdbText @('reverse', 'tcp:8081', 'tcp:8081'))
      if ($c -eq 0) {
        $preHashes = Save-WrongKeyHashes 'before-D1'
        $d1 = Start-AppRun 'D1-start' 'force-stop'
        [void](Get-AdbText @('shell', 'am', 'force-stop', $Package)); Start-Sleep -Seconds 2
        $h1 = Save-WrongKeyHashes 'after-D1'
        $d2 = Start-AppRun 'D2-force-stop' 'force-stop'
        [void](Get-AdbText @('shell', 'am', 'force-stop', $Package)); Start-Sleep -Seconds 2
        $h2 = Save-WrongKeyHashes 'after-D2'
        $d3 = Start-AppRun 'D3-back' 'back'
        [void](Get-AdbText @('shell', 'am', 'force-stop', $Package)); Start-Sleep -Seconds 2
        $h3 = Save-WrongKeyHashes 'after-D3'
        $debugRuns = @($d1, $d2, $d3) | Where-Object { $_ }
        $hashSets = @(@($preHashes, $h1, $d1), @($h1, $h2, $d2), @($h2, $h3, $d3))
        foreach ($db in $WrongKeyDatabases) {
          $test = if ($db -like 'poc-p1b*') { 'P1B' } else { 'P1' }
          $verdicts = @()
          foreach ($set in $hashSets) {
            $runId = $set[2]
            if (-not $runId) { continue }
            $control = Find-Entry $runId $test 'wrong_key_control'
            $rejected = Find-Entry $runId $test 'wrong_key_rejected'
            $accepted = Find-Entry $runId $test 'wrong_key_accepted'
            $unexpected = Find-Entry $runId $test 'wrong_key_unexpected_error'
            if (-not $control -and -not $accepted -and -not $unexpected) { continue }
            $before = $set[0][$db]; $after = $set[1][$db]
            if ($accepted) { $verdicts += 'FAIL:wrong_key_accepted' }
            elseif ($unexpected -or -not $control -or $control.Status -ne 'OK') { $verdicts += 'BLOCKED:control_or_unexpected' }
            elseif (-not $before -or -not $before.Sha -or -not $after -or -not $after.Sha -or $before.Aux.Count -gt 0 -or $after.Aux.Count -gt 0) { $verdicts += 'BLOCKED:hash_or_aux_files' }
            elseif ($before.Sha -ne $after.Sha) { $verdicts += 'FAIL:original_modified' }
            elseif ($rejected -and $rejected.Status -eq 'OK') { $verdicts += 'PASS' }
            else { $verdicts += 'BLOCKED:no_rejection_entry' }
          }
          $id = "$test-WRONG-KEY"
          if ($verdicts.Count -eq 0) { Set-Check $id 'BLOCKED' 'no hubo ejecucion de verificacion' 'wrong-key-hashes.txt' }
          elseif ($verdicts | Where-Object { $_ -like 'FAIL*' }) { Set-Check $id 'FAIL' ($verdicts -join ', ') 'wrong-key-hashes.txt' }
          elseif ($verdicts | Where-Object { $_ -like 'BLOCKED*' }) { Set-Check $id 'BLOCKED' ($verdicts -join ', ') 'wrong-key-hashes.txt' }
          else { Set-Check $id 'PASS' "$($verdicts.Count) verificaciones: control OK, clave incorrecta rechazada (NOTADB), hash identico" 'wrong-key-hashes.txt' }
        }
        if ($debugRuns.Count -gt 0) {
          $inspectionRuns = @(
            [pscustomobject]@{ Label = 'D1'; RunId = $d1; Entries = @(Get-RunEntries $d1) },
            [pscustomobject]@{ Label = 'D2'; RunId = $d2; Entries = @(Get-RunEntries $d2) },
            [pscustomobject]@{ Label = 'D3'; RunId = $d3; Entries = @(Get-RunEntries $d3) }
          )
          $inspection = Select-InspectionRun $inspectionRuns
          $inspectionNote = "inspection run=$($inspection.Label) $($inspection.RunId) status=$($inspection.Status) canary=$($inspection.Canary) protected=$($inspection.Protected.Count) reasons=$($inspection.Reasons -join ',')"
          Add-Line (Join-Path $script:Evidence 'at-rest.txt') $inspectionNote
          Add-Line (Join-Path $script:Evidence 'marker-search.txt') $inspectionNote
          if ($inspection.Status -eq 'READY') {
            Test-AtRest $inspection.Protected $inspection.Canary
            Test-MarkerSearch $inspection.Canary $inspection.Protected $inspection.RunId
          }
          else {
            $inspectionReason = "$($inspection.Reasons -join '; ') (ejecucion $($inspection.Label) $($inspection.RunId))"
            Set-Check 'AT-REST' 'BLOCKED' $inspectionReason 'at-rest.txt'
            Set-Check 'MARKER-SEARCH' 'BLOCKED' $inspectionReason 'marker-search.txt'
          }
          Test-StandardSqlite 'poc-p1-v2.db'
        }
      }
      else { Set-Check 'INSTALL-DEBUG' 'FAIL' "exit $c" 'install-debug.log' }
    }
  }
  else { Set-Check 'INSTALL-DEBUG' 'NOT RUN' 'no confirmado' }
}
finally { Stop-Metro $metro }

# 5. Release phase
$releaseRuns = @()
if ((Get-CertificateDigest $Apks.release) -eq $certDebug -and (Confirm-Action "Instalar el APK Release del spike sobre la instalacion existente ('adb install -r', conserva datos)?")) {
  [void](Get-AdbText @('reverse', '--remove', 'tcp:8081'))
  $c = Invoke-Logged $script:Adb @('-s', $script:Device, 'install', '-r', $Apks.release) 'install-release.log'
  if ($c -eq 0) {
    $r1 = Start-AppRun 'R1-variant-switch' 'force-stop'
    $runCheck = $Checks | Where-Object { $_.Id -eq 'RUN-R1-variant-switch' } | Select-Object -First 1
    if ($r1) { Set-Check 'RELEASE-LOGS' 'PASS' "diagnostico disponible en Release ($r1)" }
    elseif ($runCheck -and $runCheck.Status -eq 'BLOCKED') { Set-Check 'RELEASE-LOGS' 'BLOCKED' 'release_logs_unavailable: proceso vivo sin lineas GFP-POC' }
    else { Set-Check 'RELEASE-LOGS' 'FAIL' 'app_crash o launch_failed (ver crashes.txt)' 'crashes.txt' }
    if ($r1) {
      $c2 = Invoke-Logged $script:Adb @('-s', $script:Device, 'install', '-r', $Apks.release) 'install-release-update.log'
      $r2 = if ($c2 -eq 0) { Start-AppRun 'R2-update' 'force-stop' } else { $null }
      $r3 = $null
      if (Confirm-Action 'Reiniciar el dispositivo con adb reboot para la prueba de persistencia?') {
        [void](Get-AdbText @('reboot')); Start-Sleep -Seconds 15
        if (Wait-Boot 300) { Wait-User 'Desbloquee la pantalla del dispositivo si es necesario.'; $r3 = Start-AppRun 'R3-reboot' 'start' }
        else { Set-Check 'SCN-REBOOT' 'FAIL' 'el dispositivo no arranco en 300 s' }
      }
      else { Set-Check 'SCN-REBOOT' 'NOT RUN' 'no confirmado' }
      $releaseRuns = @($r1, $r2, $r3) | Where-Object { $_ }
    }
  }
  else { Set-Check 'INSTALL-RELEASE' 'FAIL' "exit $c" 'install-release.log' }
}
else { Set-Check 'INSTALL-RELEASE' 'NOT RUN' 'firma distinta o no confirmado' }

# 6. Scenario and persistence evaluation
$allRuns = @($debugRuns + $releaseRuns)
$scenarioMap = [ordered]@{ 'SCN-FORCE-STOP' = 'D2-force-stop'; 'SCN-CLOSE-REOPEN' = 'D3-back'; 'SCN-VARIANT-SWITCH' = 'R1-variant-switch'; 'SCN-UPDATE' = 'R2-update'; 'SCN-REBOOT' = 'R3-reboot' }
$firstFingerprint = ''
foreach ($runId in $allRuns) {
  $fp = Get-DetailValue (Find-Entry $runId 'P2' 'persistence') 'fingerprint'
  if (-not $fp) { $fp = Get-DetailValue (Find-Entry $runId 'P2' 'secret_recovered') 'fingerprint' }
  if ($fp -and -not $firstFingerprint) { $firstFingerprint = $fp }
}
foreach ($scenario in $scenarioMap.Keys) {
  $label = $scenarioMap[$scenario]
  $runId = ($RunLabels.GetEnumerator() | Where-Object { $_.Value -eq $label } | Select-Object -First 1).Key
  if (-not $runId) { if (-not ($Checks | Where-Object { $_.Id -eq $scenario })) { Set-Check $scenario 'NOT RUN' "sin ejecucion $label" }; continue }
  $problems = @()
  foreach ($t in @('P1', 'P1B', 'P2')) {
    $p = Find-Entry $runId $t 'persistence'
    if (-not $p -or $p.Status -ne 'OK') { $problems += "$t persistence=$(if ($p) { $p.Status } else { 'ausente' })" }
  }
  $fp = Get-DetailValue (Find-Entry $runId 'P2' 'persistence') 'fingerprint'
  if ($fp -ne $firstFingerprint) { $problems += 'huella P2 distinta' }
  if ($problems.Count -eq 0) { Set-Check $scenario 'PASS' "${runId}: P1, P1B y P2 persisten; misma huella" "steps\$runId-AUTO-1.txt" }
  else { Set-Check $scenario 'FAIL' "${runId}: $($problems -join '; ')" "steps\$runId-AUTO-1.txt" }
}
Set-Check 'SCN-UNINSTALL-REINSTALL' 'NOT RUN' 'destructivo: no autorizado en esta etapa'
Set-Check 'SCN-UNINSTALL-KEEP-DATA' 'NOT RUN' 'adb uninstall -k excluido por decision'
foreach ($pair in @(@('P1-CIPHER', 'P1', 'cipher_version'), @('P1-READ-WRITE', 'P1', 'read_write'), @('P1B-CIPHER', 'P1B', 'cipher_version'), @('P1B-READ-WRITE', 'P1B', 'read_write'), @('P3-BASIC-SALT', 'P3', 'salt_uniqueness'))) {
  $statuses = @($allRuns | ForEach-Object { $e = Find-Entry $_ $pair[1] $pair[2]; if ($e) { $e.Status } else { 'MISSING' } })
  if ($statuses.Count -eq 0) { Set-Check $pair[0] 'BLOCKED' 'sin ejecuciones' }
  elseif ($statuses -contains 'FAIL') { Set-Check $pair[0] 'FAIL' ($statuses -join ',') }
  elseif (($statuses | Where-Object { $_ -ne 'OK' }).Count -gt 0) { Set-Check $pair[0] 'BLOCKED' ($statuses -join ',') }
  else { Set-Check $pair[0] 'PASS' "OK en $($statuses.Count) ejecuciones (Debug y Release)" }
}
$capability = @($allRuns | ForEach-Object { Get-DetailValue (Find-Entry $_ 'P2' 'keystore_capability') 'maxSupportedLevel' } | Where-Object { $_ } | Sort-Object -Unique)
Set-Check 'P2-KEYSTORE-CAPABILITY' 'INFO' "nivel maximo soportado declarado por react-native-keychain: $($capability -join ','); no demuestra el respaldo por hardware de la clave usada"
$vectorStatuses = @($allRuns | ForEach-Object { Get-RunEntries $_ | Where-Object { $_.Step -eq 'AUTO' -and $_.Code -like 'vector_*' } } | ForEach-Object { $_.Status })
if ($vectorStatuses.Count -eq 0) { Set-Check 'P3-BASIC-VECTORS' 'BLOCKED' 'sin ejecuciones' }
elseif (($vectorStatuses | Where-Object { $_ -ne 'OK' }).Count -gt 0) { Set-Check 'P3-BASIC-VECTORS' 'FAIL' ($vectorStatuses -join ',') }
else { Set-Check 'P3-BASIC-VECTORS' 'PASS' "$($vectorStatuses.Count) calculos de V1, V4, V5 y V6 correctos en Hermes" }
$rng = @($allRuns | ForEach-Object { Find-Entry $_ 'P2' 'rng_source'; Find-Entry $_ 'P2' 'rng_unavailable' } | Where-Object { $_ })
if ($rng | Where-Object { $_.Code -eq 'rng_unavailable' }) { Set-Check 'RNG-NATIVE' 'BLOCKED' 'el modulo nativo RNGetRandomValues no estuvo disponible' }
elseif ($rng.Count -gt 0) { Set-Check 'RNG-NATIVE' 'PASS' 'secreto generado con RNGetRandomValues (SecureRandom); la seguridad se basa en la revision del codigo' }
elseif ($allRuns.Count -gt 0) { Set-Check 'RNG-NATIVE' 'INFO' 'el secreto ya existia; la generacion no se observo en estas ejecuciones' }

# 7. Manual Release steps
$current = if ($releaseRuns.Count -gt 0) { $releaseRuns[-1] } else { $null }
if ($current) {
  if (Confirm-Action 'P3: pulsar "P3 · V2, V3, V7 y V7D" en la app (vectores de conformidad; puede tardar varios minutos). Continuar?') {
    Write-Host 'Pulse el boton P3 · V2, V3, V7 y V7D ahora.' -ForegroundColor Cyan
    $wait = Wait-StepState $current 'P3_EXTENDED' 600 1800
    $verdict = Get-StepWaitVerdict $wait.State $wait.ElapsedSeconds $wait.ProcessAlive $RequiredExtendedVectors
    Add-Line (Join-Path $script:Evidence 'p3-extended.txt') "phase=$($wait.State.Phase) status=$($verdict.Status) reason=$($verdict.Reason) $($verdict.Detail)"
    foreach ($entry in @($wait.State.Block)) { Add-Line (Join-Path $script:Evidence 'p3-extended.txt') (Format-Entry $entry) }
    Set-Check 'P3-EXTENDED-VECTORS' $verdict.Status "$($verdict.Detail) ($($script:DeviceKind))" 'p3-extended.txt'
    Register-LateCheck 'P3-EXTENDED-VECTORS' $current $wait 'conformance'
  }
  else { Set-Check 'P3-EXTENDED-VECTORS' 'NOT RUN' 'no confirmado' }

  if (Confirm-Action 'P3: pulsar "P3 · Tiempos PBKDF2" (benchmark con presupuesto de 900 s). Continuar?') {
    $busyStep = Wait-AppIdle $current 1800
    if ($busyStep) { Set-Check 'P3-BENCHMARK' 'BLOCKED' "previous_step_running: $busyStep sigue sin step_end tras 1800 s; runId=$current" }
    else {
      Write-Host 'Pulse el boton P3 · Tiempos PBKDF2 ahora.' -ForegroundColor Cyan
      $wait = Wait-StepState $current 'P3_BENCHMARK' 600 1200
      $verdict = Get-BenchmarkVerdict $wait.State $wait.ElapsedSeconds $wait.ProcessAlive
      Add-Line (Join-Path $script:Evidence 'p3-benchmark.txt') "phase=$($wait.State.Phase) status=$($verdict.Status) reason=$($verdict.Reason) $($verdict.Detail)"
      foreach ($entry in @($wait.State.Block)) { Add-Line (Join-Path $script:Evidence 'p3-benchmark.txt') (Format-Entry $entry) }
      Set-Check 'P3-BENCHMARK' $verdict.Status "$($verdict.Detail) | $((@($wait.State.Block) | Where-Object { $_.Code -eq 'benchmark' } | ForEach-Object { $_.Detail }) -join ' | ') ($($script:DeviceKind))" 'p3-benchmark.txt'
      Register-LateCheck 'P3-BENCHMARK' $current $wait 'benchmark'
    }
  }
  else { Set-Check 'P3-BENCHMARK' 'NOT RUN' 'no confirmado' }

  if ($ocrImages -and (Confirm-Action "P4 lote: copiar $($ocrImages.Count) imagenes sinteticas a la carpeta externa de la app sin sobrescribir. Continuar?")) {
    $destination = "/sdcard/Android/data/$Package/files/ocr-dataset"
    [void](Get-AdbText @('shell', 'mkdir', '-p', $destination))
    $stale = @()
    foreach ($image in $ocrImages) {
      $remote = "$destination/$($image.Id).jpg"
      $existing = Get-AdbText @('shell', 'sha256sum', $remote)
      if ($existing -match '^([0-9a-f]{64})\s') { if ($Matches[1] -ne $image.Sha256) { $stale += $image.Id } ; continue }
      [void](Get-AdbText @('push', $image.Path, $remote))
    }
    $busyStep = ''
    if ($stale.Count -eq 0) { $busyStep = Wait-AppIdle $current 1800 }
    if ($stale.Count -gt 0) { Set-Check 'P4-BATCH' 'BLOCKED' "ya existen imagenes distintas en el dispositivo: $($stale -join ',')" }
    elseif ($busyStep) { Set-Check 'P4-BATCH' 'BLOCKED' "previous_step_running: $busyStep sigue sin step_end tras 1800 s; runId=$current" }
    else {
      Write-Host "Escriba $($ocrImages.Count) en el campo de cantidad y pulse 'P4 · OCR por lotes'." -ForegroundColor Cyan
      $wait = Wait-StepState $current 'P4_BATCH' 600 900
      $verdict = Get-BatchVerdict $wait.State $wait.ElapsedSeconds $wait.ProcessAlive
      Add-Line (Join-Path $script:Evidence 'p4-batch.txt') "phase=$($wait.State.Phase) status=$($verdict.Status) reason=$($verdict.Reason) $($verdict.Detail)"
      foreach ($entry in @($wait.State.Block)) { Add-Line (Join-Path $script:Evidence 'p4-batch.txt') (Format-Entry $entry) }
      Set-Check 'P4-BATCH' $verdict.Status "$($verdict.Detail); calidad sin umbral aprobado (INFO)" 'p4-batch.txt'
      if ($wait.State.Phase -eq 'complete') {
        Set-Check 'P4-QUALITY' 'INFO' ((@($wait.State.Block) | Where-Object { $_.Code -eq 'ocr_quality' } | ForEach-Object { $_.Detail }) -join ' | ') 'p4-batch.txt'
      }
      Register-LateCheck 'P4-BATCH' $current $wait 'batch'
    }
  }
  else { Set-Check 'P4-BATCH' 'NOT RUN' 'sin imagenes sinteticas validadas o no confirmado' }

  foreach ($manual in @(@('P4_GALLERY', 'P4-GALLERY', 'Pulse "P4 · Galeria + OCR" y elija una imagen sintetica.'), @('P4_CAMERA', 'P4-CAMERA', 'Pulse "P4 · Camara + OCR" y fotografie una imagen sintetica.'))) {
    if (Confirm-Action "$($manual[1]): ejecutar el paso manual?") {
      $busyStep = Wait-AppIdle $current 1800
      if ($busyStep) { Set-Check $manual[1] 'BLOCKED' "previous_step_running: $busyStep sigue sin step_end tras 1800 s; runId=$current"; continue }
      if ($manual[0] -eq 'P4_GALLERY' -and $ocrImages) {
        $galleryPath = "/sdcard/Pictures/GFP-POC-SINTETICAS/$($ocrImages[0].Id).jpg"
        $exists = Get-AdbText @('shell', 'ls', $galleryPath)
        if ($exists -notmatch [regex]::Escape($galleryPath) -and (Confirm-Action "Copiar $($ocrImages[0].Id).jpg a $galleryPath (almacenamiento compartido; quedara pendiente de limpieza autorizada)?")) {
          [void](Get-AdbText @('push', $ocrImages[0].Path, $galleryPath))
          [void](Get-AdbText @('shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', "file://$galleryPath"))
          Add-Line (Join-Path $script:Evidence 'cleanup-pending.txt') "device: $galleryPath"
        }
      }
      Write-Host $manual[2] -ForegroundColor Cyan
      if (Wait-StepEnd $current $manual[0] 1 600) {
        $block = @(Get-RunEntries $current | Where-Object { $_.Step -eq $manual[0] })
        $result = $block | Where-Object { $_.Code -in @('ocr_result', 'ocr_error', 'picker_error', 'picker_cancelled') } | Select-Object -First 1
        $status = if ($result -and $result.Code -eq 'ocr_result') { 'PASS' } elseif ($result -and $result.Code -eq 'picker_cancelled') { 'NOT RUN' } else { 'FAIL' }
        Set-Check $manual[1] $status "$(if ($result) { $result.Code }) (reconocimiento, no extraccion de campos)" "steps\$current-$($manual[0])-1.txt"
      }
      else { Set-Check $manual[1] 'BLOCKED' "sin step_end $($manual[0]) en 600 s" }
    }
    else { Set-Check $manual[1] 'NOT RUN' 'no confirmado' }
  }
}

# 8. Final evidence, privacy and integrity
Update-Store
foreach ($late in @($LateChecks)) {
  $finalState = Get-StepWaitState $late.RunId $late.Step @($Store.Values) $late.Baseline
  if ($finalState.Phase -ne 'complete') { continue }
  $finalVerdict = switch ($late.Kind) {
    'conformance' { Get-StepWaitVerdict $finalState 0 $true $RequiredExtendedVectors }
    'benchmark' { Get-BenchmarkVerdict $finalState 0 $true }
    default { Get-BatchVerdict $finalState 0 $true }
  }
  Add-Line (Join-Path $script:Evidence 'late-completions.txt') "$($late.Id) $($late.Step) runId=$($late.RunId) final=$($finalVerdict.Status) $($finalVerdict.Detail)"
  foreach ($entry in @($finalState.Block)) { Add-Line (Join-Path $script:Evidence 'late-completions.txt') (Format-Entry $entry) }
  Set-Check "$($late.Id)-LATE" 'INFO' "completado despues de la ventana de espera; el resultado en vivo se conserva; evidencia final: $($finalVerdict.Status) $($finalVerdict.Detail)" 'late-completions.txt'
}
foreach ($runId in @($RunLabels.Keys)) {
  Save-CompletedSteps $runId
  $gaps = Test-SequenceGaps $runId
  $lines = @(Get-RunEntries $runId | ForEach-Object { Format-Entry $_ })
  Write-NewFile (Join-Path $script:Evidence "runs\$($RunLabels[$runId])-$runId.txt") $lines
  if ($gaps) { Set-Check "LOG-SEQUENCE-$($RunLabels[$runId])" 'BLOCKED' "log_gap: $gaps" }
}
Invoke-PrivacyScan
Test-Stage01Apks 'END'
$mainEnd = Get-GitState $MainRepository
Write-NewFile (Join-Path $script:Evidence 'main-repository-end.txt') @($mainEnd)
Set-Check 'MAIN-REPOSITORY-UNCHANGED' $(if ($mainEnd -eq $mainStart) { 'PASS' } else { 'FAIL' }) 'HEAD, estado y referencias identicos al inicio' 'main-repository-end.txt'
$dirtyEnd = (& git -C $Root --no-optional-locks status --porcelain 2>&1 | Out-String).Trim()
Set-Check 'WORKTREE-UNCHANGED' $(if (-not $dirtyEnd) { 'PASS' } else { 'FAIL' }) $(if ($dirtyEnd) { $dirtyEnd } else { 'sin cambios' })
Set-Check 'DESTRUCTIVE-ACTIONS' 'INFO' 'ninguna automatizada; limpieza pendiente de autorizacion (ver cleanup-pending.txt si existe)'
Write-Summary
Write-Host "Evidencias: $($script:Evidence)" -ForegroundColor Cyan
