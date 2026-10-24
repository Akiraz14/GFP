<#
.SYNOPSIS
  Dependency-free tests for scripts\poc-stage02.lib.ps1 (synthetic log entries only).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\tests\poc-stage02.lib.Tests.ps1
  pwsh -NoProfile -File scripts/tests/poc-stage02.lib.Tests.ps1
#>
$ErrorActionPreference = 'Stop'
. (Join-Path (Split-Path -Parent $PSScriptRoot) 'poc-stage02.lib.ps1')

$script:Passed = 0
$script:Failed = 0

function Assert-Equal($Expected, $Actual, [string]$Message) {
  if ("$Expected" -ne "$Actual") { throw "$Message (expected '$Expected', actual '$Actual')" }
}

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Invoke-TestCase([string]$Name, [scriptblock]$Body) {
  try {
    & $Body
    $script:Passed++
    Write-Host "PASS $Name"
  }
  catch {
    $script:Failed++
    Write-Host "FAIL $Name :: $($_.Exception.Message)"
  }
}

function New-Entry([string]$RunId, [int]$Seq, [string]$Step, [string]$Test, [string]$Code, [string]$Status, [string]$Detail = '') {
  return [pscustomobject]@{ RunId = $RunId; Seq = $Seq; Step = $Step; Test = $Test; Code = $Code; Status = $Status; Detail = $Detail }
}

function New-DebugRun([string]$Label, [string]$RunId, [string[]]$Skip = @(), [string]$CanaryStatus = 'OK') {
  $entries = @(New-Entry $RunId 1 'RUN' 'RUN' 'run_start' 'INFO' 'startedAtMs=1000')
  $items = @(
    @('CANARY', 'canary_written', $CanaryStatus, "database=poc-canary-v2.db;encrypted=false;marker=GFP-POC-CANARY-$RunId"),
    @('P1', 'persistence', 'OK', 'firstRun=false;database=poc-p1-v2.db;marker=GFP-POC-SQL-P1-rfirst'),
    @('P1', 'wrong_key_control', 'OK', 'database=poc-p1-wrong-key-v2.db;marker=GFP-POC-SQL-P1-WK-rfirst'),
    @('P2', 'public_marker_stored', 'OK', "marker=GFP-POC-PUBLIC-$RunId"),
    @('P1B', 'persistence', 'OK', 'firstRun=false;database=poc-p1b-v2.db;marker=GFP-POC-SQL-P1B-rfirst'),
    @('P1B', 'wrong_key_control', 'OK', 'database=poc-p1b-wrong-key-v2.db;marker=GFP-POC-SQL-P1B-WK-rfirst')
  )
  $seq = 2
  foreach ($item in $items) {
    if ($Skip -notcontains "$($item[0]).$($item[1])") { $entries += New-Entry $RunId $seq 'AUTO' $item[0] $item[1] $item[2] $item[3] }
    $seq++
  }
  return [pscustomobject]@{ Label = $Label; RunId = $RunId; Entries = $entries }
}

# ---------- inspection marker selection ----------

Invoke-TestCase 'inspection uses D3 markers when D1, D2 and D3 ran' {
  $result = Select-InspectionRun @((New-DebugRun 'D1' 'rd1'), (New-DebugRun 'D2' 'rd2'), (New-DebugRun 'D3' 'rd3'))
  Assert-Equal 'READY' $result.Status 'status'
  Assert-Equal 'rd3' $result.RunId 'runId'
  Assert-Equal 'GFP-POC-CANARY-rd3' $result.Canary 'canary marker'
  Assert-True ($result.Protected -contains 'GFP-POC-PUBLIC-rd3') 'P2 public marker comes from D3'
  Assert-True (-not ($result.Protected -contains 'GFP-POC-PUBLIC-rd2')) 'no D2 public marker'
  Assert-Equal 5 $result.Protected.Count 'protected marker count'
}

Invoke-TestCase 'inspection uses D2 when D3 produced no run' {
  $d3 = [pscustomobject]@{ Label = 'D3'; RunId = $null; Entries = @() }
  $result = Select-InspectionRun @((New-DebugRun 'D1' 'rd1'), (New-DebugRun 'D2' 'rd2'), $d3)
  Assert-Equal 'READY' $result.Status 'status'
  Assert-Equal 'rd2' $result.RunId 'runId'
  Assert-Equal 'GFP-POC-CANARY-rd2' $result.Canary 'canary marker'
}

Invoke-TestCase 'inspection does not fall back to D2 when the D3 canary failed' {
  $result = Select-InspectionRun @((New-DebugRun 'D2' 'rd2'), (New-DebugRun 'D3' 'rd3' @() 'BLOCKED'))
  Assert-Equal 'BLOCKED' $result.Status 'status'
  Assert-Equal 'rd3' $result.RunId 'runId'
  Assert-Equal '' $result.Canary 'no canary marker'
  Assert-True ($result.Reasons -contains 'canary_marker_unavailable') 'reason'
}

Invoke-TestCase 'missing protected marker blocks the inspection' {
  $result = Select-InspectionRun @((New-DebugRun 'D3' 'rd3' @('P2.public_marker_stored', 'P1B.wrong_key_control')))
  Assert-Equal 'BLOCKED' $result.Status 'status'
  Assert-Equal 'protected_marker_missing:P1B.wrong_key_control,P2.public_marker_stored' (($result.Reasons | Where-Object { $_ -like 'protected_marker_missing*' }) -join '') 'reason'
}

Invoke-TestCase 'invalid control marker is not accepted' {
  $run = New-DebugRun 'D3' 'rd3' @('P1.wrong_key_control')
  $run.Entries += New-Entry 'rd3' 99 'AUTO' 'P1' 'wrong_key_control' 'BLOCKED' 'reason=control_failed;marker=invalid'
  $result = Select-InspectionRun @($run)
  Assert-Equal 'BLOCKED' $result.Status 'status'
  Assert-True (($result.Reasons -join ' ') -match 'P1\.wrong_key_control') 'reason names P1.wrong_key_control'
}

Invoke-TestCase 'no debug run blocks the inspection' {
  $result = Select-InspectionRun @()
  Assert-Equal 'BLOCKED' $result.Status 'status'
  Assert-Equal 'no_debug_run' ($result.Reasons -join '') 'reason'
}

# ---------- P3_EXTENDED wait verdicts ----------

$Required = @('V2', 'V3', 'V7', 'V7D')

function New-ReleaseRun([string]$RunId, [int64]$StartedAtMs) {
  return @(
    (New-Entry $RunId 1 'RUN' 'RUN' 'run_start' 'INFO' "startedAtMs=$StartedAtMs"),
    (New-Entry $RunId 2 'AUTO' 'STEP' 'step_begin' 'INFO'),
    (New-Entry $RunId 3 'AUTO' 'STEP' 'step_end' 'INFO')
  )
}

function New-P3Block([string]$RunId, [int]$FirstSeq, [string[]]$Vectors, [bool]$WithEnd, [string]$BadVector = '') {
  $seq = $FirstSeq
  $entries = @(New-Entry $RunId $seq 'P3_EXTENDED' 'STEP' 'step_begin' 'INFO')
  foreach ($vector in $Vectors) {
    $seq++
    $status = 'OK'
    if ($vector -eq $BadVector) { $status = 'FAIL' }
    $entries += New-Entry $RunId $seq 'P3_EXTENDED' 'P3' "vector_$vector" $status 'durationMs=1;iterations=600000'
  }
  if ($WithEnd) {
    $seq++
    $resultStatus = 'OK'
    if ($BadVector) { $resultStatus = 'FAIL' }
    $entries += New-Entry $RunId $seq 'P3_EXTENDED' 'P3' 'conformance_result' $resultStatus "vectors=$($Vectors.Count);failed=0"
    $seq++
    $entries += New-Entry $RunId $seq 'P3_EXTENDED' 'STEP' 'step_end' 'INFO'
  }
  return $entries
}

Invoke-TestCase 'P3 success requires step_end in the expected run' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $true)
  $state = Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3
  Assert-Equal 'complete' $state.Phase 'phase'
  $verdict = Get-StepWaitVerdict $state 120 $true $Required
  Assert-Equal 'PASS' $verdict.Status 'status'
}

Invoke-TestCase 'P3 timeout: step_begin without step_end and process alive' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 @('V2', 'V3') $false)
  $state = Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3
  Assert-Equal 'running' $state.Phase 'phase'
  $verdict = Get-StepWaitVerdict $state 1800 $true $Required
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'timeout' $verdict.Reason 'reason'
  Assert-True ($verdict.Detail -match 'runId=rr3') 'detail reports runId'
  Assert-True ($verdict.Detail -match 'last=rr3#6 P3_EXTENDED/P3/vector_V3/OK') 'detail reports last event'
  Assert-True ($verdict.Detail -match 'elapsedS=1800') 'detail reports elapsed time'
}

Invoke-TestCase 'P3 step_end missing when the process is gone' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 @('V2') $false)
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 40 $false $Required
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'step_end_missing' $verdict.Reason 'reason'
}

Invoke-TestCase 'P3 runid mismatch: the step ran in a newer run' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-ReleaseRun 'rr4' 6000) + @(New-P3Block 'rr4' 4 $Required $true)
  $state = Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3
  Assert-Equal 'other_run' $state.Phase 'phase'
  $verdict = Get-StepWaitVerdict $state 300 $true $Required
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'runid_mismatch' $verdict.Reason 'reason'
  Assert-True ($verdict.Detail -match 'expected=rr3; observed=rr4') 'detail reports both runIds'
}

Invoke-TestCase 'P3 in an older run is not counted as a mismatch' {
  $entries = @(New-ReleaseRun 'rr0' 1000) + @(New-P3Block 'rr0' 4 $Required $true) + @(New-ReleaseRun 'rr3' 5000)
  $state = Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3
  Assert-Equal 'not_started' $state.Phase 'phase'
  Assert-Equal 'not_started' (Get-StepWaitVerdict $state 600 $true $Required).Reason 'reason'
}

Invoke-TestCase 'P3 occurrence before the wait baseline is ignored' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $true)
  $lastSeq = ($entries | Measure-Object -Property Seq -Maximum).Maximum
  $state = Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries $lastSeq
  Assert-Equal 'not_started' $state.Phase 'phase'
}

Invoke-TestCase 'P3 interrupted: newer run appears after step_begin' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 @('V2') $false) + @(New-ReleaseRun 'rr4' 6000)
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 200 $true $Required
  Assert-Equal 'interrupted' $verdict.Reason 'reason'
  Assert-True ($verdict.Detail -match 'newerRuns=rr4') 'detail reports newer run'
}

Invoke-TestCase 'P3 step_end without step_begin is an incomplete block' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-Entry 'rr3' 9 'P3_EXTENDED' 'STEP' 'step_end' 'INFO')
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 10 $true $Required
  Assert-Equal 'incomplete_block' $verdict.Reason 'reason'
}

Invoke-TestCase 'P3 complete with a missing vector is blocked, not passed' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 @('V2', 'V3', 'V7') $true)
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 100 $true $Required
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'missing_vectors' $verdict.Reason 'reason'
}

Invoke-TestCase 'P3 complete with a wrong vector fails' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $true 'V7D')
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 100 $true $Required
  Assert-Equal 'FAIL' $verdict.Status 'status'
  Assert-True ($verdict.Detail -match 'vector_V7D=FAIL') 'detail names the vector'
}

Invoke-TestCase 'P3 step_error inside the block is blocked' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 @() $false)
  $entries += New-Entry 'rr3' 5 'P3_EXTENDED' 'STEP' 'step_error' 'BLOCKED' 'RangeError'
  $entries += New-Entry 'rr3' 6 'P3_EXTENDED' 'STEP' 'step_end' 'INFO'
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 5 $true $Required
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'step_error' $verdict.Reason 'reason'
}

Invoke-TestCase 'P3 complete without conformance_result is blocked' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $true)
  $entries = @($entries | Where-Object { $_.Code -ne 'conformance_result' })
  $verdict = Get-StepWaitVerdict (Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3) 100 $true $Required
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'missing_result' $verdict.Reason 'reason'
}

Invoke-TestCase 'P3 vector_start entries are not counted as vectors' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $true)
  $entries += New-Entry 'rr3' 50 'P3_EXTENDED' 'P3' 'vector_start' 'INFO' 'id=V3;iterations=600000'
  $entries = @($entries | Sort-Object Seq)
  $state = Get-StepWaitState 'rr3' 'P3_EXTENDED' $entries 3
  Assert-Equal 'complete' $state.Phase 'phase'
}

# ---------- P3_BENCHMARK verdicts ----------

function New-BenchmarkBlock([string]$RunId, [string]$ResultStatus, [string]$Outcome, [bool]$WithEnd = $true) {
  $entries = @(
    (New-Entry $RunId 4 'P3_BENCHMARK' 'STEP' 'step_begin' 'INFO'),
    (New-Entry $RunId 5 'P3_BENCHMARK' 'P3' 'benchmark_sample' 'INFO' 'iterations=100000;sample=1;durationMs=38000;elapsedMs=38000')
  )
  if ($ResultStatus) { $entries += New-Entry $RunId 6 'P3_BENCHMARK' 'P3' 'benchmark_result' $ResultStatus "outcome=$Outcome;reason=x;samples=1/12" }
  if ($WithEnd) { $entries += New-Entry $RunId 7 'P3_BENCHMARK' 'STEP' 'step_end' 'INFO' }
  return @(New-ReleaseRun $RunId 5000) + $entries
}

Invoke-TestCase 'benchmark complete passes' {
  $verdict = Get-BenchmarkVerdict (Get-StepWaitState 'rr3' 'P3_BENCHMARK' (New-BenchmarkBlock 'rr3' 'OK' 'complete') 3) 300 $true
  Assert-Equal 'PASS' $verdict.Status 'status'
}

Invoke-TestCase 'benchmark incomplete is blocked, not passed' {
  $verdict = Get-BenchmarkVerdict (Get-StepWaitState 'rr3' 'P3_BENCHMARK' (New-BenchmarkBlock 'rr3' 'INFO' 'incomplete') 3) 900 $true
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'benchmark_incomplete' $verdict.Reason 'reason'
}

Invoke-TestCase 'benchmark error is blocked with its own reason' {
  $verdict = Get-BenchmarkVerdict (Get-StepWaitState 'rr3' 'P3_BENCHMARK' (New-BenchmarkBlock 'rr3' 'BLOCKED' 'error') 3) 10 $true
  Assert-Equal 'benchmark_error' $verdict.Reason 'reason'
}

Invoke-TestCase 'benchmark without result is blocked' {
  $verdict = Get-BenchmarkVerdict (Get-StepWaitState 'rr3' 'P3_BENCHMARK' (New-BenchmarkBlock 'rr3' '' '') 3) 10 $true
  Assert-Equal 'missing_result' $verdict.Reason 'reason'
}

Invoke-TestCase 'benchmark timeout is distinct from incomplete' {
  $verdict = Get-BenchmarkVerdict (Get-StepWaitState 'rr3' 'P3_BENCHMARK' (New-BenchmarkBlock 'rr3' '' '' $false) 3) 1200 $true
  Assert-Equal 'timeout' $verdict.Reason 'reason'
}

# ---------- P4_BATCH ----------

function New-BatchBlock([string]$RunId, [int]$FirstSeq, [int]$Images = 6, [string]$Override = '') {
  $seq = $FirstSeq
  $entries = @(
    (New-Entry $RunId $seq 'P4_BATCH' 'STEP' 'step_begin' 'INFO'),
    (New-Entry $RunId ($seq + 1) 'P4_BATCH' 'P4' 'batch_start' 'INFO' "batchSize=$Images")
  )
  $seq += 2
  for ($i = 1; $i -le $Images; $i++) {
    $index = '{0:D2}' -f $i
    if ($Override -eq "error$i") { $entries += New-Entry $RunId $seq 'P4_BATCH' 'P4' 'ocr_error' 'FAIL' "source=batch;index=$index;durationMs=5;errorName=Error" }
    elseif ($Override -eq "missing$i") { $entries += New-Entry $RunId $seq 'P4_BATCH' 'P4' 'fixture_missing' 'BLOCKED' "index=$index" }
    else {
      $entries += New-Entry $RunId $seq 'P4_BATCH' 'P4' 'ocr_result' 'OK' "source=batch;index=$index;durationMs=900;chars=200;blocks=9;lines=9"
      $seq++
      $entries += New-Entry $RunId $seq 'P4_BATCH' 'P4' 'ocr_quality' 'INFO' "index=$index;similarity=1"
    }
    $seq++
  }
  $failures = 0
  if ($Override) { $failures = 1 }
  $summaryImages = $Images
  if ($Override -eq 'summary') { $summaryImages = $Images + 1 }
  $entries += New-Entry $RunId $seq 'P4_BATCH' 'P4' 'batch_summary' 'INFO' "images=$summaryImages;failures=$failures;p50Ms=917;p95Ms=1747"
  $seq++
  $entries += New-Entry $RunId $seq 'P4_BATCH' 'STEP' 'step_end' 'INFO'
  return $entries
}

function Get-Shuffled([object[]]$Items) {
  $random = New-Object System.Random 20261023
  return @($Items | Sort-Object { $random.Next() })
}

Invoke-TestCase 'P4 batch: begin, six ocr_result, summary and end in the same run are complete' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40)
  $state = Get-StepWaitState 'rr3' 'P4_BATCH' $entries 3
  Assert-Equal 'complete' $state.Phase 'phase'
  $verdict = Get-BatchVerdict $state 30 $true
  Assert-Equal 'PASS' $verdict.Status 'status'
  Assert-True ($verdict.Detail -match 'ocrResults=6; images=6;failures=0;p50Ms=917;p95Ms=1747') 'summary consistent with results'
}

Invoke-TestCase 'P4 batch: arrival order does not change the verdict' {
  $entries = Get-Shuffled (@(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40))
  $verdict = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' $entries 3) 30 $true
  Assert-Equal 'PASS' $verdict.Status 'status'
}

Invoke-TestCase 'P4 batch: entries from another run cannot complete the current one' {
  $entries = @(New-ReleaseRun 'rr0' 1000) + @(New-BatchBlock 'rr0' 40) + @(New-ReleaseRun 'rr3' 5000)
  $verdict = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' $entries 3) 900 $true
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'not_started' $verdict.Reason 'reason'
  $mixed = @(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40 | Where-Object { $_.Code -ne 'step_end' }) + @(New-Entry 'rr9' 99 'P4_BATCH' 'STEP' 'step_end' 'INFO')
  Assert-Equal 'running' (Get-StepWaitState 'rr3' 'P4_BATCH' $mixed 3).Phase 'foreign step_end ignored'
}

Invoke-TestCase 'P4 batch: missing step_end after the timeout is not successful' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40 | Where-Object { $_.Code -ne 'step_end' })
  $verdict = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' $entries 3) 900 $true
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'timeout' $verdict.Reason 'reason'
}

Invoke-TestCase 'P4 batch: an OCR error fails the batch' {
  $verdict = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' (@(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40 6 'error3')) 3) 30 $true
  Assert-Equal 'FAIL' $verdict.Status 'status'
  Assert-Equal 'batch_errors' $verdict.Reason 'reason'
}

Invoke-TestCase 'P4 batch: a BLOCKED entry is not a PASS' {
  $verdict = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' (@(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40 6 'missing2')) 3) 30 $true
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'batch_blocked' $verdict.Reason 'reason'
}

Invoke-TestCase 'P4 batch: summary inconsistent with the OCR results is blocked' {
  $verdict = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' (@(New-ReleaseRun 'rr3' 5000) + @(New-BatchBlock 'rr3' 40 6 'summary')) 3) 30 $true
  Assert-Equal 'BLOCKED' $verdict.Status 'status'
  Assert-Equal 'summary_mismatch' $verdict.Reason 'reason'
}

Invoke-TestCase 'P4 batch: duplicated log lines are counted once' {
  $block = @(New-BatchBlock 'rr3' 40)
  $entries = @(New-ReleaseRun 'rr3' 5000) + $block + $block
  $state = Get-StepWaitState 'rr3' 'P4_BATCH' $entries 3
  Assert-Equal $block.Count $state.Block.Count 'block size'
  $seqs = @($state.Block | ForEach-Object { $_.Seq })
  Assert-Equal (($seqs | Sort-Object -Unique) -join ',') ($seqs -join ',') 'ordered and unique'
  Assert-Equal 'PASS' (Get-BatchVerdict $state 30 $true).Status 'status'
}

# ---------- app idle detection and the V3 P4 regression ----------

Invoke-TestCase 'open step detection' {
  $entries = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 @('V2') $false)
  Assert-Equal 'P3_EXTENDED' (Get-OpenStep 'rr3' $entries) 'open step'
  $closed = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $true)
  Assert-Equal '' (Get-OpenStep 'rr3' $closed) 'idle'
  Assert-Equal '' (Get-OpenStep 'rr9' $entries) 'other run is idle'
}

Invoke-TestCase 'V3 regression: P4 window expired while P3 still held the app' {
  $atP4Timeout = @(New-ReleaseRun 'rr3' 5000) + @(New-P3Block 'rr3' 4 $Required $false)
  $p4Baseline = 9
  Assert-Equal 'P3_EXTENDED' (Get-OpenStep 'rr3' $atP4Timeout) 'P3 still running when P4 is requested'
  $live = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' $atP4Timeout $p4Baseline) 900 $true
  Assert-Equal 'not_started' $live.Reason 'live verdict says the batch never started'
  $final = @($atP4Timeout) + @(New-Entry 'rr3' 10 'P3_EXTENDED' 'STEP' 'step_end' 'INFO') + @(New-BatchBlock 'rr3' 11)
  $late = Get-BatchVerdict (Get-StepWaitState 'rr3' 'P4_BATCH' $final $p4Baseline) 2000 $true
  Assert-Equal 'PASS' $late.Status 'final evidence shows the completed batch'
}

Write-Host "Total: $($script:Passed + $script:Failed); passed: $($script:Passed); failed: $($script:Failed)"
if ($script:Failed -gt 0) { exit 1 }
exit 0
