# Consolidacion (D-06): crea la clave de firma release propia de GFP FUERA del repositorio.
# keytool pide las contrasenas y los datos del certificado de forma interactiva: el script no
# las recibe, no las muestra y no las guarda. No sobrescribe una clave existente.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\release\New-ReleaseKey.ps1 [-KeystorePath <ruta .jks fuera del repositorio>] [-Alias gfp-release] [-Jdk17Path <ruta del JDK 17>]
param(
  [string]$KeystorePath = (Join-Path $env:USERPROFILE '.gfp-release\gfp-release.jks'),
  [string]$Alias = 'gfp-release',
  [string]$Jdk17Path = ''
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\stage-04\lib\Common.ps1')
$repo = Resolve-RepoRoot
$full = [IO.Path]::GetFullPath($KeystorePath)
if ($full.StartsWith($repo.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
  Write-Host "BLOCKED la clave debe quedar fuera del repositorio; $full esta dentro de $repo"
  exit 2
}
if (Test-Path -LiteralPath $full) {
  Write-Host "BLOCKED ya existe $full; no se sobrescribe una clave existente"
  exit 2
}
$jdk = Find-Jdk17 $Jdk17Path
if (-not $jdk) { Write-Host 'BLOCKED no se encontro JDK 17; indique su ruta con -Jdk17Path'; exit 2 }
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $full) | Out-Null
$keytool = Join-Path $jdk 'bin\keytool.exe'
Write-Host "Se crea $full con el alias $Alias (RSA 4096, 10000 dias). keytool pedira las contrasenas."
& $keytool -genkeypair -v -storetype PKCS12 -keystore $full -alias $Alias -keyalg RSA -keysize 4096 -validity 10000
if ($LASTEXITCODE -ne 0) { Write-Host "FAIL keytool termino con $LASTEXITCODE"; exit 1 }
$sha = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash
Write-Host "PASS clave creada: $full (SHA-256 del archivo $sha)"
Write-Host 'Guarde una copia de seguridad de la clave y de sus contrasenas fuera del equipo. Sin ellas no se pueden publicar actualizaciones firmadas con la misma clave.'
exit 0
