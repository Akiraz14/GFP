<#
.SYNOPSIS
  Validación Android de una etapa del proyecto GFP en Windows.

.DESCRIPTION
  Ejecuta, en este orden, y registra la salida de cada paso en
  evidencias/ETAPA-<Etapa>/<fecha-hora>/:
    1. JDK 17 solo para este proceso (no modifica JAVA_HOME global).
    2. Datos del entorno (Node, npm, Java, Gradle, SDK).
    3. npm ci (se puede omitir con -OmitirNpmCi).
    4. Chequeo de tipos, lint, formato y pruebas Jest.
    5. Compilación del APK de depuración (assembleDebug) y SHA-256.
    6. Emulador o dispositivo: arranque, datos de Android y ABI.
    7. Comprobación del puerto 8081, Metro (con progreso y límite de 120 s),
       instalación, apertura de la app y comprobación de la interfaz. Metro se
       cierra siempre al terminar el paso, también con Ctrl+C.
    8. Opcional (-IncluirRelease): APK release, instalación y apertura sin Metro.
  En cada variante se guardan el PID (pid-<variante>.txt) y los datos del
  dispositivo (dispositivo-<variante>.txt).
  Al final genera resumen.md con el resultado de cada paso.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\validar-etapa.ps1 -Etapa 01
#>
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^\d{2}$')][string]$Etapa,
  [string]$Avd = 'Pixel_4_Android_10',
  [string]$Serial = '',
  [string]$Jdk17Path = '',
  [switch]$OmitirNpmCi,
  [switch]$IncluirRelease
)

$ErrorActionPreference = 'Continue'
$PaqueteApp = 'co.gfpsas.gestionfinanciera'
$ActividadApp = "$PaqueteApp/.MainActivity"
$TextoEsperado = 'GFP'

$Raiz = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Raiz 'app'
$Android = Join-Path $App 'android'
$Marca = Get-Date -Format 'yyyyMMdd-HHmmss'
$Salida = Join-Path $Raiz "evidencias\ETAPA-$Etapa\$Marca"
New-Item -ItemType Directory -Path $Salida -Force | Out-Null

$Resumen = New-Object System.Collections.ArrayList

function Registrar-Paso([string]$Paso, [string]$Resultado, [string]$Detalle) {
  [void]$Resumen.Add([pscustomobject]@{ Paso = $Paso; Resultado = $Resultado; Detalle = $Detalle })
  $color = switch ($Resultado) { 'OK' { 'Green' } 'FALLO' { 'Red' } default { 'Yellow' } }
  Write-Host ("[{0}] {1} - {2}" -f $Resultado, $Paso, $Detalle) -ForegroundColor $color
}

function Ejecutar([string]$Archivo, [string[]]$Argumentos, [string]$Log, [string]$Directorio = $Raiz) {
  Add-Content -LiteralPath $Log -Value ("> {0} {1}" -f $Archivo, ($Argumentos -join ' ')) -Encoding UTF8
  Push-Location -LiteralPath $Directorio
  try {
    & $Archivo @Argumentos 2>&1 | ForEach-Object {
      $linea = "$_"
      Write-Host $linea
      Add-Content -LiteralPath $Log -Value $linea -Encoding UTF8
    }
    $codigo = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }
  Add-Content -LiteralPath $Log -Value ("< codigo de salida: {0}" -f $codigo) -Encoding UTF8
  return $codigo
}

function Paso-Comando([string]$Paso, [string]$Archivo, [string[]]$Argumentos, [string]$NombreLog, [string]$Directorio = $Raiz) {
  $log = Join-Path $Salida $NombreLog
  $codigo = Ejecutar $Archivo $Argumentos $log $Directorio
  if ($codigo -eq 0) { Registrar-Paso $Paso 'OK' "ver $NombreLog" } else { Registrar-Paso $Paso 'FALLO' "codigo $codigo, ver $NombreLog" }
  return ($codigo -eq 0)
}

function Esperar-TextoEnPantalla([string]$Adb, [string]$Dispositivo, [string]$ArchivoXml, [int]$Segundos) {
  $limite = (Get-Date).AddSeconds($Segundos)
  while ((Get-Date) -lt $limite) {
    & $Adb -s $Dispositivo shell uiautomator dump /sdcard/gfp-ui.xml 2>&1 | Out-Null
    & $Adb -s $Dispositivo pull /sdcard/gfp-ui.xml $ArchivoXml 2>&1 | Out-Null
    if ((Test-Path -LiteralPath $ArchivoXml) -and (Select-String -LiteralPath $ArchivoXml -SimpleMatch "text=`"$TextoEsperado`"" -Quiet)) {
      return $true
    }
    Start-Sleep -Seconds 5
  }
  return $false
}

function Verificar-Ejecucion([string]$Adb, [string]$Dispositivo, [string]$Variante) {
  $logcat = Join-Path $Salida "logcat-$Variante.txt"
  & $Adb -s $Dispositivo logcat -c 2>&1 | Out-Null
  Ejecutar $Adb @('-s', $Dispositivo, 'shell', 'am', 'start', '-n', $ActividadApp) (Join-Path $Salida "abrir-$Variante.log") | Out-Null

  $xml = Join-Path $Salida "ui-$Variante.xml"
  $visible = Esperar-TextoEnPantalla $Adb $Dispositivo $xml 120
  $proceso = (& $Adb -s $Dispositivo shell pidof $PaqueteApp 2>&1 | Out-String).Trim()
  "PID: $proceso" | Set-Content -LiteralPath (Join-Path $Salida "pid-$Variante.txt") -Encoding UTF8

  & $Adb -s $Dispositivo shell screencap -p /sdcard/gfp-captura.png 2>&1 | Out-Null
  & $Adb -s $Dispositivo pull /sdcard/gfp-captura.png (Join-Path $Salida "captura-$Variante.png") 2>&1 | Out-Null
  Ejecutar $Adb @('-s', $Dispositivo, 'logcat', '-d', '-v', 'time') $logcat | Out-Null

  $fatal = Select-String -LiteralPath $logcat -Pattern 'FATAL EXCEPTION' -Quiet
  $errorJs = Select-String -LiteralPath $logcat -Pattern 'E/ReactNativeJS' -Quiet

  if ($proceso -match '^\d+') { Registrar-Paso "App en ejecucion ($Variante)" 'OK' "PID $proceso" }
  else { Registrar-Paso "App en ejecucion ($Variante)" 'FALLO' 'pidof no devolvio proceso' }

  if ($visible) { Registrar-Paso "Interfaz muestra '$TextoEsperado' ($Variante)" 'OK' "ver ui-$Variante.xml y captura-$Variante.png" }
  else { Registrar-Paso "Interfaz muestra '$TextoEsperado' ($Variante)" 'FALLO' "texto no encontrado en ui-$Variante.xml" }

  if ($fatal -or $errorJs) { Registrar-Paso "Logcat sin errores fatales ni de JS ($Variante)" 'FALLO' "ver logcat-$Variante.txt" }
  else { Registrar-Paso "Logcat sin errores fatales ni de JS ($Variante)" 'OK' "ver logcat-$Variante.txt" }
}

function Probar-Metro([int]$TimeoutMs = 3000) {
  try {
    $solicitud = [System.Net.HttpWebRequest]::Create('http://localhost:8081/status')
    $solicitud.Timeout = $TimeoutMs
    $solicitud.ReadWriteTimeout = $TimeoutMs
    $solicitud.Proxy = $null
    $respuesta = $solicitud.GetResponse()
    try {
      $lector = New-Object System.IO.StreamReader($respuesta.GetResponseStream(), [System.Text.Encoding]::UTF8)
      $texto = $lector.ReadToEnd()
    }
    finally {
      $respuesta.Close()
    }
    return ($texto -match 'packager-status:running')
  }
  catch {
    return $false
  }
}

function Obtener-PidPuerto([int]$Puerto) {
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $conexion = Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conexion) { return [int]$conexion.OwningProcess }
    return $null
  }
  foreach ($linea in ((netstat.exe -ano -p TCP | Out-String) -split "`r?`n")) {
    if ($linea -match "^\s*TCP\s+\S+:$Puerto\s+\S+\s+LISTENING\s+(\d+)") { return [int]$Matches[1] }
  }
  return $null
}

function Describir-Proceso([int]$Id) {
  $p = Get-Process -Id $Id -ErrorAction SilentlyContinue
  if ($p) { return "PID $Id ($($p.ProcessName))" }
  return "PID $Id"
}

function Mostrar-FinalMetro {
  $log = Join-Path $Salida 'metro.log'
  if (Test-Path -LiteralPath $log) {
    Write-Host '--- ultimas lineas de metro.log ---' -ForegroundColor Yellow
    Get-Content -LiteralPath $log -Tail 15 | ForEach-Object { Write-Host $_ }
  }
}

function Detener-Metro($Proceso) {
  if ($Proceso -and -not $Proceso.HasExited) {
    & taskkill.exe /PID $Proceso.Id /T /F 2>&1 | Out-Null
  }
  Start-Sleep -Seconds 2
  $cierre = Join-Path $Salida 'metro-cierre.txt'
  $residual = Obtener-PidPuerto 8081
  if (-not $residual) {
    "$(Get-Date -Format o) Puerto 8081 libre tras cerrar Metro" | Set-Content -LiteralPath $cierre -Encoding UTF8
    Registrar-Paso 'Cierre de Metro' 'OK' 'puerto 8081 libre (metro-cierre.txt)'
    return
  }
  $info = Get-CimInstance Win32_Process -Filter "ProcessId=$residual" -ErrorAction SilentlyContinue
  $comando = ''
  if ($info) { $comando = [string]$info.CommandLine }
  if ($comando -like "*$App*" -and $comando -match 'react-native' -and $comando -match '\bstart\b') {
    Stop-Process -Id $residual -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    "$(Get-Date -Format o) Metro residual de este proyecto cerrado: PID $residual" | Set-Content -LiteralPath $cierre -Encoding UTF8
    Registrar-Paso 'Cierre de Metro' 'OK' "Metro residual de este proyecto cerrado (PID $residual)"
  }
  else {
    "$(Get-Date -Format o) Puerto 8081 ocupado por $(Describir-Proceso $residual); no se cerro: no es el Metro de este proyecto" | Set-Content -LiteralPath $cierre -Encoding UTF8
    Registrar-Paso 'Cierre de Metro' 'FALLO' "8081 sigue ocupado por $(Describir-Proceso $residual); no se cerro por no ser el Metro de este proyecto"
  }
}

function Guardar-DatosDispositivo([string]$Disp, [string]$Variante) {
  $archivo = Join-Path $Salida "dispositivo-$Variante.txt"
  $props = @('ro.product.model', 'ro.build.version.release', 'ro.build.version.sdk', 'ro.product.cpu.abi')
  $lineas = New-Object System.Collections.ArrayList
  [void]$lineas.Add("Fecha: $(Get-Date -Format o)")
  [void]$lineas.Add("Dispositivo: $Disp")
  foreach ($prop in $props) {
    $valor = (& $Adb -s $Disp shell getprop $prop 2>&1 | Out-String).Trim()
    [void]$lineas.Add("${prop}: $valor")
  }
  [void]$lineas.Add('adb devices -l:')
  [void]$lineas.Add((& $Adb devices -l 2>&1 | Out-String).Trim())
  $lineas | Set-Content -LiteralPath $archivo -Encoding UTF8
}

function Confirmar-Dispositivo([string]$Disp, [int]$Segundos = 120) {
  $limite = (Get-Date).AddSeconds($Segundos)
  $aviso = Get-Date
  while ((Get-Date) -lt $limite) {
    $lista = & $Adb devices 2>&1 | Out-String
    if ($lista -match ("(?m)^" + [regex]::Escape($Disp) + "\s+device\s*$")) {
      $arranque = (& $Adb -s $Disp shell getprop sys.boot_completed 2>&1 | Out-String).Trim()
      if ($arranque -eq '1') { return $true }
    }
    if ((Get-Date) -ge $aviso) {
      Write-Host "Esperando a que $Disp este disponible (inicie el emulador si se cerro)..." -ForegroundColor Yellow
      $aviso = (Get-Date).AddSeconds(15)
    }
    Start-Sleep -Seconds 5
  }
  return $false
}

Write-Host "Evidencias en: $Salida" -ForegroundColor Cyan

# 1. JDK 17 solo para este proceso
if (-not $Jdk17Path) {
  $candidato = Get-ChildItem -LiteralPath 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
  if ($candidato) { $Jdk17Path = $candidato.FullName }
}
if ($Jdk17Path -and (Test-Path -LiteralPath (Join-Path $Jdk17Path 'bin\java.exe'))) {
  $env:JAVA_HOME = $Jdk17Path
  $env:Path = "$(Join-Path $Jdk17Path 'bin');$env:Path"
  Registrar-Paso 'JDK 17 para este proceso' 'OK' $Jdk17Path
}
else {
  Registrar-Paso 'JDK 17 para este proceso' 'FALLO' 'no se encontro JDK 17; use -Jdk17Path'
}

# 2. Entorno
$entorno = Join-Path $Salida 'entorno.txt'
@(
  "Fecha: $(Get-Date -Format o)",
  "Windows: $([System.Environment]::OSVersion.VersionString)",
  "PowerShell: $($PSVersionTable.PSVersion)",
  "JAVA_HOME (proceso): $env:JAVA_HOME",
  "ANDROID_HOME: $env:ANDROID_HOME"
) | Set-Content -LiteralPath $entorno -Encoding UTF8
Ejecutar 'node' @('-v') $entorno | Out-Null
Ejecutar 'npm.cmd' @('-v') $entorno | Out-Null
Ejecutar 'java' @('-version') $entorno | Out-Null
if (Get-Command git -ErrorAction SilentlyContinue) { Ejecutar 'git' @('-C', $Raiz, 'log', '-1', '--format=commit %H (%s)') $entorno | Out-Null }

if (-not $env:ANDROID_HOME -or -not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
  Registrar-Paso 'ANDROID_HOME' 'FALLO' 'variable no definida o ruta inexistente'
}
else {
  Registrar-Paso 'ANDROID_HOME' 'OK' $env:ANDROID_HOME
}
$Adb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
$Emulador = Join-Path $env:ANDROID_HOME 'emulator\emulator.exe'
$Gradlew = Join-Path $Android 'gradlew.bat'

$gradleOk = Paso-Comando 'Gradle -version (debe indicar Launcher JVM 17)' $Gradlew @('-version') 'gradle-version.log' $Android
if ($gradleOk) {
  if (Select-String -LiteralPath (Join-Path $Salida 'gradle-version.log') -Pattern 'Launcher JVM:\s+17\.' -Quiet) {
    Registrar-Paso 'Gradle se ejecuta con JDK 17' 'OK' 'Launcher JVM 17'
  }
  else {
    Registrar-Paso 'Gradle se ejecuta con JDK 17' 'FALLO' 'ver gradle-version.log'
  }
}

# 3. Dependencias
if ($OmitirNpmCi) { Registrar-Paso 'npm ci' 'OMITIDO' 'parametro -OmitirNpmCi' }
else { Paso-Comando 'npm ci' 'npm.cmd' @('ci', '--no-audit', '--no-fund') 'npm-ci.log' $App | Out-Null }

# 4. Calidad y pruebas
Paso-Comando 'Chequeo de tipos (tsc)' 'npm.cmd' @('run', 'typecheck') 'typecheck.log' $App | Out-Null
Paso-Comando 'Lint (ESLint)' 'npm.cmd' @('run', 'lint') 'lint.log' $App | Out-Null
Paso-Comando 'Formato (Prettier)' 'npm.cmd' @('run', 'format:check') 'format.log' $App | Out-Null
Paso-Comando 'Pruebas (Jest)' 'npm.cmd' @('test', '--', '--ci') 'jest.log' $App | Out-Null

# 5. APK de depuracion
$apkDebug = Join-Path $Android 'app\build\outputs\apk\debug\app-debug.apk'
$debugOk = Paso-Comando 'Compilacion assembleDebug' $Gradlew @('assembleDebug') 'gradle-assembleDebug.log' $Android
if ($debugOk -and (Test-Path -LiteralPath $apkDebug)) {
  $hash = (Get-FileHash -LiteralPath $apkDebug -Algorithm SHA256).Hash
  $tam = [math]::Round((Get-Item -LiteralPath $apkDebug).Length / 1MB, 2)
  "app-debug.apk SHA256 $hash ($tam MB)" | Set-Content -LiteralPath (Join-Path $Salida 'apk-debug.sha256.txt') -Encoding UTF8
  Registrar-Paso 'APK de depuracion generado' 'OK' "SHA256 $hash ($tam MB)"
}
else {
  $debugOk = $false
  Registrar-Paso 'APK de depuracion generado' 'FALLO' 'no existe app-debug.apk'
}

# 6. Emulador o dispositivo
function Obtener-Dispositivo {
  $lineas = & $Adb devices 2>&1 | Out-String
  foreach ($l in ($lineas -split "`r?`n")) {
    if ($l -match '^(\S+)\s+device$') {
      if (-not $Serial -or $Matches[1] -eq $Serial) { return $Matches[1] }
    }
  }
  return $null
}

$Dispositivo = $null
if (Test-Path -LiteralPath $Adb) {
  & $Adb start-server 2>&1 | Out-Null
  $Dispositivo = Obtener-Dispositivo
  if (-not $Dispositivo -and -not $Serial) {
    Write-Host "Iniciando emulador $Avd ..." -ForegroundColor Cyan
    Start-Process -FilePath $Emulador -ArgumentList @('-avd', $Avd, '-no-snapshot-load') | Out-Null
    $limite = (Get-Date).AddSeconds(300)
    while (-not $Dispositivo -and (Get-Date) -lt $limite) { Start-Sleep -Seconds 5; $Dispositivo = Obtener-Dispositivo }
  }
  if ($Dispositivo) {
    $limite = (Get-Date).AddSeconds(300)
    do {
      $boot = (& $Adb -s $Dispositivo shell getprop sys.boot_completed 2>&1 | Out-String).Trim()
      if ($boot -ne '1') { Start-Sleep -Seconds 5 }
    } while ($boot -ne '1' -and (Get-Date) -lt $limite)
  }
}

if ($Dispositivo -and $boot -eq '1') {
  $sdk = (& $Adb -s $Dispositivo shell getprop ro.build.version.sdk 2>&1 | Out-String).Trim()
  $version = (& $Adb -s $Dispositivo shell getprop ro.build.version.release 2>&1 | Out-String).Trim()
  $abi = (& $Adb -s $Dispositivo shell getprop ro.product.cpu.abi 2>&1 | Out-String).Trim()
  $modelo = (& $Adb -s $Dispositivo shell getprop ro.product.model 2>&1 | Out-String).Trim()
  "Dispositivo: $Dispositivo`r`nModelo: $modelo`r`nAndroid: $version`r`nAPI: $sdk`r`nABI: $abi" |
    Set-Content -LiteralPath (Join-Path $Salida 'dispositivo.txt') -Encoding UTF8
  if ([int]$sdk -ge 29) { Registrar-Paso 'Dispositivo Android 10 (API 29) o superior' 'OK' "$Dispositivo, API $sdk, $abi" }
  else { Registrar-Paso 'Dispositivo Android 10 (API 29) o superior' 'FALLO' "$Dispositivo, API $sdk" }
}
else {
  $Dispositivo = $null
  Registrar-Paso 'Dispositivo Android disponible' 'FALLO' 'sin emulador ni dispositivo listo'
}

# 7. Instalacion y ejecucion (debug, con Metro)
if ($debugOk -and $Dispositivo) {
  $ocupante = Obtener-PidPuerto 8081
  if ($ocupante) {
    Registrar-Paso 'Puerto 8081 libre antes de Metro' 'FALLO' "ocupado por $(Describir-Proceso $ocupante); cierrelo y repita"
    Registrar-Paso 'Instalacion y ejecucion (debug)' 'OMITIDO' 'puerto 8081 ocupado'
  }
  else {
    Registrar-Paso 'Puerto 8081 libre antes de Metro' 'OK' 'sin proceso en escucha'
    $metro = $null
    try {
      Write-Host 'Iniciando Metro en el puerto 8081 ...' -ForegroundColor Cyan
      $metro = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', "npx.cmd react-native start --port 8081 > `"$(Join-Path $Salida 'metro.log')`" 2>&1") -WorkingDirectory $App -WindowStyle Minimized -PassThru
      $metroListo = $false
      $inicio = Get-Date
      $limite = $inicio.AddSeconds(120)
      $aviso = $inicio.AddSeconds(10)
      while (-not $metroListo -and (Get-Date) -lt $limite -and -not $metro.HasExited) {
        $metroListo = Probar-Metro
        if (-not $metroListo) {
          if ((Get-Date) -ge $aviso) {
            Write-Host ("Esperando a Metro... {0:N0} s de 120" -f ((Get-Date) - $inicio).TotalSeconds)
            $aviso = (Get-Date).AddSeconds(10)
          }
          Start-Sleep -Seconds 2
        }
      }
      if ($metroListo) {
        Registrar-Paso 'Metro en ejecucion' 'OK' ("listo en {0:N0} s (http://localhost:8081/status)" -f ((Get-Date) - $inicio).TotalSeconds)
      }
      elseif ($metro.HasExited) {
        Registrar-Paso 'Metro en ejecucion' 'FALLO' 'el proceso de Metro termino antes de estar listo; ver metro.log'
        Mostrar-FinalMetro
      }
      else {
        Registrar-Paso 'Metro en ejecucion' 'FALLO' 'sin respuesta en 120 s; ver metro.log'
        Mostrar-FinalMetro
      }

      Guardar-DatosDispositivo $Dispositivo 'debug'
      Ejecutar $Adb @('-s', $Dispositivo, 'reverse', 'tcp:8081', 'tcp:8081') (Join-Path $Salida 'adb-reverse.log') | Out-Null
      $instalado = Paso-Comando 'Instalacion APK de depuracion' $Adb @('-s', $Dispositivo, 'install', '-r', $apkDebug) 'instalar-debug.log'
      if ($instalado -and $metroListo) { Verificar-Ejecucion $Adb $Dispositivo 'debug' }
    }
    finally {
      Write-Host 'Cerrando Metro ...' -ForegroundColor Cyan
      Detener-Metro $metro
    }
  }
}
else {
  Registrar-Paso 'Instalacion y ejecucion (debug)' 'OMITIDO' 'falta APK o dispositivo'
}

# 8. Opcional: release sin Metro
if ($IncluirRelease) {
  $apkRelease = Join-Path $Android 'app\build\outputs\apk\release\app-release.apk'
  $releaseOk = Paso-Comando 'Compilacion assembleRelease' $Gradlew @('assembleRelease') 'gradle-assembleRelease.log' $Android
  if ($releaseOk -and (Test-Path -LiteralPath $apkRelease) -and $Dispositivo) {
    $hash = (Get-FileHash -LiteralPath $apkRelease -Algorithm SHA256).Hash
    "app-release.apk SHA256 $hash" | Set-Content -LiteralPath (Join-Path $Salida 'apk-release.sha256.txt') -Encoding UTF8
    Registrar-Paso 'APK release generado' 'OK' "SHA256 $hash"
    if (Confirmar-Dispositivo $Dispositivo) {
      Registrar-Paso 'Dispositivo disponible para release' 'OK' $Dispositivo
      Guardar-DatosDispositivo $Dispositivo 'release'
      & $Adb -s $Dispositivo reverse --remove tcp:8081 2>&1 | Out-Null
      Ejecutar $Adb @('-s', $Dispositivo, 'reverse', '--list') (Join-Path $Salida 'reverse-release.txt') | Out-Null
      $instalado = Paso-Comando 'Instalacion APK release' $Adb @('-s', $Dispositivo, 'install', '-r', $apkRelease) 'instalar-release.log'
      if ($instalado) { Verificar-Ejecucion $Adb $Dispositivo 'release' }
    }
    else {
      Registrar-Paso 'Dispositivo disponible para release' 'FALLO' "$Dispositivo no disponible en 120 s"
    }
  }
  else {
    Registrar-Paso 'APK release' 'FALLO' 'compilacion fallida, APK inexistente o sin dispositivo'
  }
}

# Resumen
$fallos = @($Resumen | Where-Object { $_.Resultado -eq 'FALLO' }).Count
$md = New-Object System.Collections.ArrayList
[void]$md.Add("# Resumen de validacion - Etapa $Etapa")
[void]$md.Add('')
[void]$md.Add("- Ejecucion: $Marca")
[void]$md.Add("- Ejecutado por: $env:USERNAME en $env:COMPUTERNAME")
[void]$md.Add("- Pasos con fallo: $fallos")
[void]$md.Add('')
[void]$md.Add('| Paso | Resultado | Detalle |')
[void]$md.Add('|---|---|---|')
foreach ($p in $Resumen) { [void]$md.Add("| $($p.Paso) | $($p.Resultado) | $($p.Detalle) |") }
$md | Set-Content -LiteralPath (Join-Path $Salida 'resumen.md') -Encoding UTF8

Write-Host ''
$Resumen | Format-Table -AutoSize | Out-String | Write-Host
Write-Host "Resumen: $(Join-Path $Salida 'resumen.md')" -ForegroundColor Cyan
if ($fallos -gt 0) { exit 1 } else { exit 0 }
