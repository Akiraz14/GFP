# Etapa 07 (HU4): lectura de la salida de "aapt2 dump badging". Se carga con dot-sourcing desde
# Invoke-Hu4ApkCheck.ps1 y Test-ApkBadging.ps1; no se ejecuta sola.

# Valor de la linea "minSdkVersion:'29'" como entero, o $null si la salida no la contiene.
# Solo se lee una linea que empieza con minSdkVersion: no se confunde con targetSdkVersion ni
# con compileSdkVersion='..' de la linea "package:".
function Get-BadgingMinSdk([string]$Badging) {
  $match = [regex]::Match($Badging, "(?m)^minSdkVersion:'(\d+)'")
  if (-not $match.Success) { return $null }
  return [int]$match.Groups[1].Value
}

# Permisos declarados (mismo patron que la version anterior del script), sin repetir y ordenados.
function Get-BadgingPermissions([string]$Badging) {
  return @([regex]::Matches($Badging, "uses-permission: name='([^']+)'") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
}
