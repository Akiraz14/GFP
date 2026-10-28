# Automatizacion de la interfaz con adb y uiautomator para los scripts de la Etapa 04.
# Procede de los scripts de validacion de la Etapa 03 (stage03-hu1-closure.ps1 y
# stage03-hu1-v13-keyboard.ps1). Requiere Common.ps1 y las variables $Adb, $Pkg y $Out.
Add-Type -AssemblyName System.Drawing
$script:Metro = $null
$script:ImeSettingChanged = $false
# ---------- Interfaz: uiautomator ----------
$script:ScreenHeight = 1920
$script:ScreenWidth = 1080
function Get-Ui {
  for ($i = 0; $i -lt 5; $i++) {
    $dump = & $Adb shell uiautomator dump /sdcard/gfp-ui.xml 2>&1 | Out-String
    if ($dump -match 'dumped to') {
      $local = Join-Path $Out 'ui-last.xml'
      & $Adb pull /sdcard/gfp-ui.xml $local 2>&1 | Out-Null
      try { return [xml](Get-Content -LiteralPath $local -Encoding UTF8 -Raw) } catch { }
    }
    Start-Sleep -Milliseconds 700
  }
  return $null
}
function Save-Ui([string]$Name) { Copy-Item -LiteralPath (Join-Path $Out 'ui-last.xml') -Destination (Join-Path $Out "$Name.xml") -ErrorAction SilentlyContinue }
function Get-Nodes($Ui) { if ($Ui) { $Ui.SelectNodes('//node') } else { @() } }
function Find-Text($Ui, [string]$Text) { Get-Nodes $Ui | Where-Object { $_.text -eq $Text } | Select-Object -First 1 }
function Find-Id($Ui, [string]$Id) { Get-Nodes $Ui | Where-Object { $_.'resource-id' -eq $Id } | Select-Object -First 1 }
function Find-Input($Ui, [string]$Label) {
  $nodes = @(Get-Nodes $Ui)
  $direct = $nodes | Where-Object { $_.class -eq 'android.widget.EditText' -and $_.'content-desc' -eq $Label } | Select-Object -First 1
  if ($direct) { return $direct }
  for ($i = 0; $i -lt $nodes.Count; $i++) {
    if ($nodes[$i].text -eq $Label) {
      for ($j = $i + 1; $j -lt $nodes.Count; $j++) { if ($nodes[$j].class -eq 'android.widget.EditText') { return $nodes[$j] } }
    }
  }
  return $null
}
function Find-Select($Ui, [string]$Label) { Get-Nodes $Ui | Where-Object { $_.'content-desc' -eq $Label -and $_.class -ne 'android.widget.EditText' -and $_.class -ne 'android.widget.TextView' } | Select-Object -First 1 }
function Get-Bounds($Node) {
  if ($Node -and $Node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    return @([int]$Matches[1], [int]$Matches[2], [int]$Matches[3], [int]$Matches[4])
  }
  return $null
}
function Get-Center($Node) {
  $b = Get-Bounds $Node
  if ($b) { return @([int](($b[0] + $b[2]) / 2), [int](($b[1] + $b[3]) / 2)) }
  return $null
}
function Test-Visible($Node) {
  $c = Get-Center $Node
  return ($c -and $c[1] -gt 80 -and $c[1] -lt ($script:ScreenHeight - 120))
}
function Test-Inside($Inner, $Outer) {
  return ($Inner -and $Outer -and $Inner[1] -ge $Outer[1] -and $Inner[3] -le $Outer[3])
}
function Swipe([string]$Direction) {
  $x = [int]($script:ScreenWidth / 2)
  $low = [int]($script:ScreenHeight * 0.75); $high = [int]($script:ScreenHeight * 0.35)
  if ($Direction -eq 'up') { & $Adb shell input swipe $x $low $x $high 350 | Out-Null } else { & $Adb shell input swipe $x $high $x $low 350 | Out-Null }
  Start-Sleep -Milliseconds 600
}
function U([string]$Text) { return [regex]::Unescape($Text) }
function Get-ImeWindowBlock {
  $windows = & $Adb shell dumpsys window windows 2>&1 | Out-String
  return ($windows -split 'Window #' | Where-Object { $_ -match 'Window\{[^}]*\sInputMethod\}' } | Select-Object -First 1)
}
# Estado real del teclado: la ventana InputMethod es visible (mViewVisibility=0x0 con superficie).
# Se registran ademas mInputShown de InputMethodManagerService y los volcados completos.
function Get-ImeState([string]$Name) {
  $block = Get-ImeWindowBlock
  $ims = & $Adb shell dumpsys input_method 2>&1 | Out-String
  if ($Name) {
    $dir = Join-Path $Out 'ime-dumps'
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $dir "$Name-window.txt") -Value $block -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $dir "$Name-input_method.txt") -Value $ims -Encoding UTF8
  }
  $visible = [bool]($block -and $block -match 'mViewVisibility=0x0\b' -and $block -match 'mHasSurface=true')
  return [pscustomobject]@{ Visible = $visible; InputShown = ($ims -match 'mInputShown=true') }
}
function Test-ImeShown { return (Get-ImeState '').Visible }
# Tipo de teclado que recibio el IME para el ultimo campo enfocado: linea 'onActivate' del
# teclado del emulador (Gboard) en logcat, filtrada por el paquete de la app.
function Get-ImeEditorType {
  $lines = & $Adb logcat -d -s AndroidIME 2>&1 | Out-String
  $matches2 = [regex]::Matches($lines, 'onActivate\(\) : EditorInfo = Package = co\.gfpsas\.gestionfinanciera : Type = (\w+)')
  if ($matches2.Count -eq 0) { return '' }
  return $matches2[$matches2.Count - 1].Groups[1].Value
}
# Borde superior del teclado en pixeles: marco de la ventana InputMethod mas su inset de contenido.
function Get-ImeTop {
  $block = Get-ImeWindowBlock
  if (-not $block) { return $null }
  if ($block -notmatch 'mFrame=\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]') { return $null }
  $top = [int]$Matches[2]
  if ($block -match 'mGivenContentInsets=\[(-?\d+),(-?\d+)\]') { $top += [int]$Matches[2] }
  return $top
}
function Hide-Keyboard {
  $state = Get-ImeState ''
  if ($state.Visible -or $state.InputShown) { & $Adb shell input keyevent 4 | Out-Null; Start-Sleep -Milliseconds 700 }
}
# uiautomator sustituye cada unidad sustituta UTF-16 por '.', asi que la bandera (dos simbolos
# indicadores regionales) llega como '....'; la bandera concreta se comprueba en Jest y en las capturas.
function Find-Country($Ui, [string]$Label) {
  Get-Nodes $Ui | Where-Object { $_.text -and $_.text.EndsWith(" $Label") -and $_.text.Length -eq ($Label.Length + 5) } | Select-Object -First 1
}
# Busca una opcion en una lista larga desplazando hacia abajo (lista de indicativos).
function Pick-Option([string]$Text) {
  for ($i = 0; $i -lt 40; $i++) {
    $node = Find-Country (Get-Ui) $Text
    if ($node -and (Test-Visible $node)) { Tap-Node $node; return $true }
    Swipe 'up'
  }
  return $false
}
function Locate([scriptblock]$Finder) {
  $moves = @('none', 'up', 'up', 'up', 'up', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'down')
  foreach ($m in $moves) {
    if ($m -ne 'none') { Swipe $m }
    $ui = Get-Ui
    $node = & $Finder $ui
    if ($node -and (Test-Visible $node)) { return $node }
  }
  return $null
}
function Tap-Node($Node) { $c = Get-Center $Node; & $Adb shell input tap $c[0] $c[1] | Out-Null; Start-Sleep -Milliseconds 900 }
function Tap-Text([string]$Text) {
  Hide-Keyboard
  $node = Locate { param($ui) Find-Text $ui $Text }
  if (-not $node) { Note "INFO no se encontro el texto '$Text'"; return $false }
  Tap-Node $node; return $true
}
function Choose([string]$SelectLabel, [string]$OptionText) {
  Hide-Keyboard
  $field = Locate { param($ui) Find-Select $ui $SelectLabel }
  if (-not $field) { Note "INFO no se encontro el selector '$SelectLabel'"; return $false }
  Tap-Node $field
  return (Tap-Text $OptionText)
}
function Send-Text([string]$Value) {
  $escaped = $Value.Replace(' ', '%s')
  & $Adb shell "input text '$escaped'" | Out-Null
  Start-Sleep -Milliseconds 500
}
function Clear-Focused {
  & $Adb shell input keyevent 123 | Out-Null
  & $Adb shell input keyevent (@(67) * 40) | Out-Null
}
function Type-Into([string]$Label, [string]$Value, [switch]$Clear) {
  Hide-Keyboard
  $field = Locate { param($ui) Find-Input $ui $Label }
  if (-not $field) { Note "INFO no se encontro el campo '$Label'"; return $false }
  Tap-Node $field
  if ($Clear) { Clear-Focused }
  Send-Text $Value
  Hide-Keyboard
  return $true
}
function Wait-Text([string]$Text, [int]$Seconds = 30) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  $attempt = 0
  while ((Get-Date) -lt $deadline) {
    $ui = Get-Ui
    if (Find-Text $ui $Text) { return $true }
    $attempt++
    if ($attempt % 3 -eq 0) { Swipe 'down' } else { Start-Sleep -Milliseconds 800 }
  }
  return $false
}
function Screenshot([string]$Name) {
  cmd /c "$Adb exec-out screencap -p > `"$(Join-Path $Out "$Name.png")`""
  return (Join-Path $Out "$Name.png")
}
function Restart-App {
  & $Adb shell am force-stop $Pkg | Out-Null
  & $Adb shell am start -n "$Pkg/.MainActivity" 2>&1 | Out-File (Join-Path $Out 'am-start.log') -Append -Encoding UTF8
}
function Get-FocusedId($Ui) {
  $node = Get-Nodes $Ui | Where-Object { $_.class -eq 'android.widget.EditText' -and $_.focused -eq 'true' } | Select-Object -First 1
  if ($node) { return $node.'resource-id' }
  return ''
}
# Cuenta filas oscuras que cruzan casi todo el interior del campo (una linea horizontal).
function Get-LineRows([string]$Png, $Bounds) {
  $bitmap = New-Object System.Drawing.Bitmap($Png)
  try {
    $rows = 0
    $left = $Bounds[0] + 12; $right = $Bounds[2] - 12
    for ($y = $Bounds[1] + 10; $y -le $Bounds[3] - 10; $y++) {
      $dark = 0
      for ($x = $left; $x -le $right; $x += 2) {
        $p = $bitmap.GetPixel($x, $y)
        if (($p.R + $p.G + $p.B) / 3 -lt 120) { $dark++ }
      }
      if ($dark / ((($right - $left) / 2) + 1) -gt 0.8) { $rows++ }
    }
    return $rows
  } finally { $bitmap.Dispose() }
}


$Rules     = Join-Path $Root 'hu1-document-rules.patch'
function Run-As([string]$Command) { return (& $Adb shell "run-as $Pkg sh -c '$Command'" 2>&1 | Out-String).Trim() }
function Db-State([string]$Name) {
  $listing = Run-As 'ls -l databases files/datastore shared_prefs 2>/dev/null'
  $hash = Run-As 'sha256sum databases/gfp.db 2>/dev/null'
  $text = "== $Name`n$listing`n-- sha256`n$hash"
  Add-Content -LiteralPath (Join-Path $Out 'database-states.txt') -Value $text -Encoding UTF8
  if ($hash -match '^([0-9a-f]{64})') { return $Matches[1] }
  return ''
}
function Keychain-Files { return @((Run-As 'ls files/datastore/*RN_KEYCHAIN* shared_prefs/*RN_KEYCHAIN* 2>/dev/null') -split "\s+" | Where-Object { $_ -match 'RN_KEYCHAIN' }) }
function Start-Fresh { Restart-App; Start-Sleep -Seconds 2 }
function Wait-Any([string[]]$Texts, [int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    $ui = Get-Ui
    foreach ($t in $Texts) { if (Find-Text $ui $t) { return $t } }
    Start-Sleep -Milliseconds 1000
  }
  return ''
}
function Get-EditorClass([string]$Log) {
  $hex = [regex]::Matches($Log, 'onStartInputView\(EditorInfo\{inputType=0x([0-9a-fA-F]+)')
  if ($hex.Count -gt 0) {
    $value = [Convert]::ToInt32($hex[$hex.Count - 1].Groups[1].Value, 16)
    $class = @{ 1 = 'Text'; 2 = 'Number'; 3 = 'Phone' }[$value -band 0xF]
    return @($class, ('0x{0:x}' -f $value))
  }
  $old = [regex]::Matches($Log, 'Package = co\.gfpsas\.gestionfinanciera : Type = (\w+)')
  if ($old.Count -gt 0) { return @($old[$old.Count - 1].Groups[1].Value, 'formato Android 10') }
  return @('', 'sin EditorInfo en logcat')
}

$script:LoginButton = 'Ingresar'
$script:DbError = U 'No fue posible abrir la base de datos. Reinicia la aplicaci\u00f3n.'

function Initialize-Device([string]$Serial) {
  if (-not $script:Adb) { Stop-Blocked 'ADB' 'no se encontro adb.exe; defina ANDROID_HOME con la ruta del Android SDK' }
  & $script:Adb start-server 2>&1 | Out-Null
  $online = @(& $script:Adb devices | Select-String -Pattern '^\S+\s+device$' | ForEach-Object { ($_.Line -split '\s+')[0] })
  if ($online -notcontains $Serial) { Stop-Blocked 'DEVICE' "$Serial no esta conectado (dispositivos: $($online -join ', '))" }
  $env:ANDROID_SERIAL = $Serial
  & {
    "serial=$Serial"
    'model=' + (& $script:Adb shell getprop ro.product.model | Out-String).Trim()
    'sdk=' + (& $script:Adb shell getprop ro.build.version.sdk | Out-String).Trim()
    'release=' + (& $script:Adb shell getprop ro.build.version.release | Out-String).Trim()
    'ime=' + (& $script:Adb shell settings get secure default_input_method | Out-String).Trim()
  } | Out-File (Join-Path $script:Out 'device.txt') -Encoding UTF8
  Note ('INFO dispositivo ' + ((Get-Content (Join-Path $script:Out 'device.txt')) -join ' | '))
  $size = (& $script:Adb shell wm size | Out-String)
  if ($size -match '(\d+)x(\d+)') { $script:ScreenWidth = [int]$Matches[1]; $script:ScreenHeight = [int]$Matches[2] }
  $script:Cleanup += { & $script:Adb reverse --remove tcp:8081 2>&1 | Out-Null }
}

function Start-Metro([string]$AppDir) {
  $busy = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
  if ($busy) { Stop-Blocked 'METRO' "puerto 8081 ocupado por el PID $($busy[0].OwningProcess)" }
  $script:Metro = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', "npx.cmd react-native start --port 8081 --reset-cache > `"$(Join-Path $script:Out 'metro.log')`" 2>&1") -WorkingDirectory $AppDir -WindowStyle Minimized -PassThru
  $script:Cleanup += { if ($script:Metro) { cmd /c "taskkill /PID $($script:Metro.Id) /T /F >nul 2>&1"; Note 'INFO Metro detenido'; $script:Metro = $null } }
  $deadline = (Get-Date).AddSeconds(120); $ready = $false
  while ((Get-Date) -lt $deadline -and -not $ready) {
    try { $ready = ((Get-HttpText 'http://localhost:8081/status' 3000) -match 'packager-status:running') } catch { }
    if (-not $ready) { Start-Sleep -Seconds 2 }
  }
  if (-not $ready) { Stop-Blocked 'METRO' 'Metro no respondio en 120 s (metro.log)' }
  & $script:Adb reverse tcp:8081 tcp:8081 2>&1 | Out-Null
  Note 'INFO Metro en ejecucion y puerto 8081 redirigido'
}

function Install-FreshApp([string]$Apk, [switch]$AllowAppReset) {
  $installed = ((& $script:Adb shell pm list packages $script:Pkg | Out-String) -match [regex]::Escape("package:$($script:Pkg)"))
  if ($installed) {
    if (-not $AllowAppReset) { Stop-Blocked 'APP-RESET' "la app ya esta instalada; vuelva a ejecutar con -AllowAppReset si el dispositivo es desechable" }
    & $script:Adb uninstall $script:Pkg 2>&1 | Out-File (Join-Path $script:Out 'uninstall.log') -Encoding UTF8
    Note 'INFO app desinstalada (-AllowAppReset)'
  }
  & $script:Adb install $Apk 2>&1 | Out-File (Join-Path $script:Out 'install.log') -Encoding UTF8
  $ok = (Get-Content (Join-Path $script:Out 'install.log') -Raw) -match 'Success'
  Check 'INSTALL' $ok "instalacion limpia del APK Debug ($((Get-FileHash -LiteralPath $Apk -Algorithm SHA256).Hash))"
  if (-not $ok) { Stop-Blocked 'INSTALL' 'no se pudo instalar el APK (install.log)' }
}

# Abre el registro desde el inicio de sesion (HU2-CA08) y espera el paso 1.
function Open-Registration {
  if (-not (Wait-Any @($script:LoginButton, 'Paso 1 de 3') 120)) { return $false }
  if (Find-Text (Get-Ui) 'Paso 1 de 3') { return $true }
  $null = Tap-Text 'Registrar'
  return (Wait-Text 'Paso 1 de 3' 30)
}

function Save-Logcat([string]$Name = 'logcat.txt') {
  $path = Join-Path $script:Out $Name
  cmd /c "$($script:Adb) logcat -d -v time > `"$path`" 2>&1"
  return $path
}
