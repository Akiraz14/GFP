# Etapa 04 (HU2): analisis sintactico de los scripts de scripts\stage-04 sin ejecutarlos.
# Codigo de salida 0 si todos se analizan sin errores; 1 en otro caso.
$errorsFound = 0
$files = Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1' -Recurse
foreach ($file in $files) {
  $tokens = $null
  $parseErrors = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$parseErrors)
  $nonAscii = [IO.File]::ReadAllBytes($file.FullName) | Where-Object { $_ -gt 127 } | Select-Object -First 1
  if ($parseErrors.Count -gt 0 -or $null -ne $nonAscii) {
    $errorsFound++
    Write-Host "FAIL $($file.Name)"
    $parseErrors | ForEach-Object { Write-Host "  linea $($_.Extent.StartLineNumber): $($_.Message)" }
    if ($null -ne $nonAscii) { Write-Host '  contiene caracteres no ASCII' }
  } else {
    Write-Host "PASS $($file.Name)"
  }
}
Write-Host "RESULTADO archivos=$($files.Count) con errores=$errorsFound"
exit ([int]($errorsFound -gt 0))
