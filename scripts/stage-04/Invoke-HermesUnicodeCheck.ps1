# Etapa 04 (HU2): regresion de P-D2 (NFC, NFD, free-text-folded y \p{...} en Hermes) con la
# app ya instalada en el dispositivo indicado y Metro servido desde este clon o worktree.
# Procede de stage03-p-d2-hermes.ps1. No instala, no borra datos ni modifica repositorios.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-HermesUnicodeCheck.ps1 -Serial emulator-5554 [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [Parameter(Mandatory = $true)][string]$Serial,
  [string]$EvidenceRoot = ''
)
. (Join-Path $PSScriptRoot 'lib\Common.ps1')
try { $null = Initialize-Run 'p-d2' $EvidenceRoot $Serial } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }
$Pkg = 'co.gfpsas.gestionfinanciera'
$Adb = Get-AdbPath
. (Join-Path $PSScriptRoot 'lib\DeviceUi.ps1')
Initialize-Device $Serial
function Get-Root([Exception]$Exception) {
  $messages = @()
  $current = $Exception
  while ($current) { $messages += "$($current.GetType().Name): $($current.Message)"; $current = $current.InnerException }
  return ($messages -join ' <- ')
}
function Receive-Text($Socket, [int]$Seconds) {
  $buffer = New-Object byte[] 65536
  $builder = New-Object System.Text.StringBuilder
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(, $buffer)
    $task = $Socket.ReceiveAsync($segment, [Threading.CancellationToken]::None)
    if (-not $task.Wait(5000)) { continue }
    $null = $builder.Append([Text.Encoding]::UTF8.GetString($buffer, 0, $task.Result.Count))
    if ($task.Result.EndOfMessage) { return $builder.ToString() }
  }
  return $null
}

$installed = & $Adb shell pm list packages $Pkg 2>&1 | Out-String
if ($installed -notmatch "package:$Pkg") { Stop-Blocked 'P-D2' "$Pkg no esta instalada en $Serial" }
Note ("INFO dispositivo $Serial sdk=" + (& $Adb shell getprop ro.build.version.sdk | Out-String).Trim() + ' ' + ((& $Adb shell dumpsys package $Pkg | Select-String 'versionName|lastUpdateTime' | ForEach-Object { $_.Line.Trim() }) -join ' '))

Start-Metro (Join-Path $script:RepoRoot 'app')
& $Adb shell am force-stop $Pkg | Out-Null
& $Adb shell am start -n "$Pkg/.MainActivity" 2>&1 | Out-File (Join-Path $script:Out 'am-start.log') -Encoding UTF8

$target = $null
$deadline = (Get-Date).AddSeconds(180)
while ((Get-Date) -lt $deadline -and -not $target) {
  try {
    $targets = @(Get-HttpText 'http://localhost:8081/json/list' 5000 | ConvertFrom-Json)
    $target = $targets | Where-Object { $_.webSocketDebuggerUrl -and $_.appId -eq $Pkg } | Select-Object -First 1
  } catch { }
  if (-not $target) { Start-Sleep -Seconds 3 }
}
if (-not $target) { Stop-Blocked 'P-D2' 'la app no se registro en el inspector de Metro en 180 s' }
$targets | ConvertTo-Json -Depth 6 | Out-File (Join-Path $script:Out 'inspector-targets.json') -Encoding UTF8
Note "INFO destino del inspector: $($target.title) / $($target.description)"

$expression = @'
(function () {
  var cp = function (s) {
    return Array.from(s).map(function (c) {
      return 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    }).join(' ');
  };
  var fold = function (s) {
    return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim().normalize('NFC');
  };
  var NAME = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u;
  var cases = [
    ['NFD de U+00F1 (n con tilde precompuesta)', '\u00f1', function (s) { return cp(s.normalize('NFD')); }, 'U+006E U+0303'],
    ['NFD de U+00E9 (e con tilde precompuesta)', 'Jos\u00e9', function (s) { return cp(s.normalize('NFD')); }, 'U+004A U+006F U+0073 U+0065 U+0301'],
    ['NFC de n + U+0303 (forma NFD)', 'n\u0303', function (s) { return cp(s.normalize('NFC')); }, 'U+00F1'],
    ['NFC de e + U+0301 (forma NFD)', 'Jose\u0301', function (s) { return cp(s.normalize('NFC')); }, 'U+004A U+006F U+0073 U+00E9'],
    ['free-text-folded de entrada NFD', '  Pen\u0303a   Bogota\u0301 ', fold, 'pena bogota'],
    ['free-text-folded de entrada NFC', 'PE\u00d1A BOGOT\u00c1', fold, 'pena bogota'],
    ['free-text-folded conserva puntuacion', 'D.C.', fold, 'd.c.'],
    ['entradas NFD y NFC dan el mismo valor normalizado', 'Pen\u0303a|Pe\u00f1a', function (s) { var p = s.split('|'); return String(fold(p[0]) === fold(p[1]) && p[0].normalize('NFC') === p[1].normalize('NFC')); }, 'true'],
    ['\\p{L} reconoce la n con tilde', '\u00f1', function (s) { return String(/\p{L}/u.test(s)); }, 'true'],
    ['\\p{M} reconoce U+0303', '\u0303', function (s) { return String(/\p{M}/u.test(s)); }, 'true'],
    ['\\p{Nd} reconoce 7', '7', function (s) { return String(/\p{Nd}/u.test(s)); }, 'true'],
    ['regla de nombres E03-D7 acepta NFD', 'Jose\u0301 Mari\u0301a', function (s) { return String(NAME.test(s.normalize('NFC'))); }, 'true'],
    ['regla de nombres E03-D7 rechaza apostrofo', "O'Connor", function (s) { return String(NAME.test(s)); }, 'false'],
    ['conteo de puntos de codigo', '\ud83d\ude00ab', function (s) { return String(Array.from(s).length); }, '3']
  ];
  return JSON.stringify({
    hermes: typeof HermesInternal === 'object',
    results: cases.map(function (c) {
      var obtained;
      try { obtained = c[2](c[1]); } catch (e) { obtained = 'EXCEPTION ' + e; }
      return { name: c[0], input: cp(c[1]), expected: c[3], obtained: obtained, pass: obtained === c[3] };
    })
  });
})()
'@

$socket = New-Object System.Net.WebSockets.ClientWebSocket
$socket.Options.Proxy = $null
$socket.Options.SetRequestHeader('Origin', 'http://localhost:8081')
try {
  try { $null = $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait(15000) }
  catch { Stop-Blocked 'P-D2' ('conexion con el inspector rechazada: ' + (Get-Root $_.Exception)) }
  if ($socket.State -ne [System.Net.WebSockets.WebSocketState]::Open) { Stop-Blocked 'P-D2' "WebSocket en estado $($socket.State)" }
  Note 'PASS conexion WebSocket con el inspector (Origin http://localhost:8081)'
  foreach ($request in @(
      @{ id = 1; method = 'Runtime.enable' },
      @{ id = 2; method = 'Runtime.evaluate'; params = @{ expression = $expression; returnByValue = $true } })) {
    $bytes = [Text.Encoding]::UTF8.GetBytes(($request | ConvertTo-Json -Compress -Depth 5))
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(, $bytes)
    $null = $socket.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).Wait(5000)
  }
  $response = $null
  $deadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $deadline -and -not $response) {
    $message = Receive-Text $socket 10
    if ($message) {
      Add-Content -Path (Join-Path $script:Out 'inspector-messages.log') -Value $message -Encoding UTF8
      if ($message -match '"id"\s*:\s*2\b') { $response = $message }
    }
  }
} finally { $socket.Dispose() }
if (-not $response) { Stop-Blocked 'P-D2' 'sin respuesta de Runtime.evaluate (inspector-messages.log)' }
$response | Out-File (Join-Path $script:Out 'p-d2-hermes.json') -Encoding UTF8
$evaluation = $response | ConvertFrom-Json
if ($evaluation.result.exceptionDetails) { Stop-Blocked 'P-D2' ('excepcion en Hermes: ' + ($evaluation.result.exceptionDetails | ConvertTo-Json -Compress -Depth 6)) }
$value = $evaluation.result.result.value | ConvertFrom-Json
Check 'P-D2.hermes' ($value.hermes -eq $true) "motor Hermes=$($value.hermes)"
foreach ($r in $value.results) {
  Check "P-D2 [$($r.name)]" ($r.pass -eq $true) "entrada=$($r.input) | esperado=$($r.expected) | obtenido=$($r.obtained)"
}
$null = Save-Logcat
Finish-Run
