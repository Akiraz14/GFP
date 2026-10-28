# Etapa 04 (HU2): controles automatizados en Windows sobre el clon o worktree que contiene
# este script: prerequisitos, estado de Git, npm ci (con el package-lock.json sin cambios),
# typecheck, lint, format:check y Jest. No modifica archivos versionados ni hace commit.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 [-ExpectedBranch e04/hu2-login] [-ExpectedTests 264] [-EvidenceRoot <carpeta fuera del repositorio>]
param(
  [string]$ExpectedBranch = 'e04/hu2-login',
  [int]$ExpectedTests = 264,
  [string]$EvidenceRoot = '',
  [switch]$SkipNpmCi
)
. (Join-Path $PSScriptRoot 'lib\Common.ps1')
try { $null = Initialize-Run 'static' $EvidenceRoot } catch { Write-Host "BLOCKED INIT $($_.Exception.Message)"; exit 2 }
$App = Join-Path $script:RepoRoot 'app'

$node = (& node --version 2>&1 | Out-String).Trim()
$npm = (& npm.cmd --version 2>&1 | Out-String).Trim()
"node=$node npm=$npm git=$((git --version | Out-String).Trim())" | Out-File (Join-Path $script:Out 'environment.txt') -Encoding UTF8
if ($node -notmatch '^v(\d+)\.(\d+)') { Stop-Blocked 'NODE' "Node.js no disponible ($node)" }
$nodeOk = ([int]$Matches[1] -gt 22) -or ([int]$Matches[1] -eq 22 -and [int]$Matches[2] -ge 11)
if (-not $nodeOk) { Stop-Blocked 'NODE' "se requiere Node.js >= 22.11 (package.json, engines); hay $node" }
Record 'PASS' 'NODE' "$node, npm $npm"

$branch = (git -C $script:RepoRoot rev-parse --abbrev-ref HEAD | Out-String).Trim()
if ($ExpectedBranch -and $branch -ne $ExpectedBranch) { Stop-Blocked 'BRANCH' "rama $branch; se esperaba $ExpectedBranch" }
$dirty = @(git -C $script:RepoRoot status --porcelain -uall)
if ($dirty.Count -gt 0) { Stop-Blocked 'CLEAN-TREE' "el arbol tiene $($dirty.Count) cambios sin commit (worktree-status-start.txt)" }
Record 'PASS' 'GIT' "rama $branch, arbol limpio"

if ($SkipNpmCi) { Skip 'npm-ci' 'omitido con -SkipNpmCi' } elseif (-not (Invoke-Logged 'npm-ci' $App 'npm.cmd ci')) { Finish-Run }
$null = Invoke-Logged 'typecheck' $App 'npm.cmd run typecheck'
$null = Invoke-Logged 'lint' $App 'npm.cmd run lint'
$null = Invoke-Logged 'format-check' $App 'npm.cmd run format:check'
$null = Invoke-Logged 'jest' $App 'npx.cmd jest --ci'
$jest = @(Select-String -LiteralPath (Join-Path $script:Out 'jest.log') -Pattern '^(Tests|Test Suites):' | ForEach-Object { $_.Line.Trim() })
Note ('INFO Jest: ' + ($jest -join ' | '))
Check 'JEST-COUNT' ((($jest -join ' ') -match "Tests:\s+$ExpectedTests passed, $ExpectedTests total")) "se esperaban $ExpectedTests pruebas aprobadas"
Finish-Run
