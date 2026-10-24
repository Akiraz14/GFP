<#
.SYNOPSIS
  Pure decision helpers for scripts\poc-stage02.ps1.

.DESCRIPTION
  No device, file system or global state access: every function receives log entries
  ([pscustomobject] with RunId, Seq, Step, Test, Code, Status, Detail) and returns a
  result object. Covered by scripts\tests\poc-stage02.lib.Tests.ps1.
  Compatible with Windows PowerShell 5.1 and PowerShell 7.
#>

$InspectionMarkerSources = @(
  [pscustomobject]@{ Test = 'P1'; Code = 'persistence'; Statuses = @('OK', 'INFO') },
  [pscustomobject]@{ Test = 'P1B'; Code = 'persistence'; Statuses = @('OK', 'INFO') },
  [pscustomobject]@{ Test = 'P1'; Code = 'wrong_key_control'; Statuses = @('OK') },
  [pscustomobject]@{ Test = 'P1B'; Code = 'wrong_key_control'; Statuses = @('OK') },
  [pscustomobject]@{ Test = 'P2'; Code = 'public_marker_stored'; Statuses = @('OK') }
)

function Get-DetailValue($Entry, [string]$Key) {
  if ($Entry -and $Entry.Detail -match "(^|;)$Key=([^;]*)") { return $Matches[2] }
  return ''
}

function Format-LogEvent($Entry) {
  if (-not $Entry) { return 'none' }
  return "$($Entry.RunId)#$($Entry.Seq) $($Entry.Step)/$($Entry.Test)/$($Entry.Code)/$($Entry.Status)"
}

function Get-EntryMarker([object[]]$Entries, [string]$Test, [string]$Code, [string[]]$Statuses) {
  $entry = @($Entries | Where-Object { $_.Test -eq $Test -and $_.Code -eq $Code } | Sort-Object Seq) | Select-Object -First 1
  if (-not $entry -or ($Statuses -notcontains $entry.Status)) { return '' }
  $marker = Get-DetailValue $entry 'marker'
  if ($marker -like 'GFP-POC-*') { return $marker }
  return ''
}

function Select-InspectionRun([object[]]$Runs) {
  # $Runs: Debug runs in execution order, each [pscustomobject]@{ Label; RunId; Entries }.
  # Only the last executed run is valid: every run rewrites the canary row and the P2 public
  # marker, so markers from an earlier run may no longer exist on the device.
  $executed = @($Runs | Where-Object { $_ -and $_.RunId })
  if ($executed.Count -eq 0) {
    return [pscustomobject]@{ Status = 'BLOCKED'; Label = ''; RunId = ''; Canary = ''; Protected = @(); Reasons = @('no_debug_run') }
  }
  $last = $executed[-1]
  $entries = @($last.Entries)
  $reasons = @()
  $canary = Get-EntryMarker $entries 'CANARY' 'canary_written' @('OK')
  if (-not $canary) { $reasons += 'canary_marker_unavailable' }
  $protected = @()
  $missing = @()
  foreach ($source in $InspectionMarkerSources) {
    $marker = Get-EntryMarker $entries $source.Test $source.Code $source.Statuses
    if ($marker) { $protected += $marker } else { $missing += "$($source.Test).$($source.Code)" }
  }
  if ($missing.Count -gt 0) { $reasons += "protected_marker_missing:$($missing -join ',')" }
  $status = 'READY'
  if ($reasons.Count -gt 0) { $status = 'BLOCKED' }
  return [pscustomobject]@{ Status = $status; Label = $last.Label; RunId = $last.RunId; Canary = $canary; Protected = $protected; Reasons = $reasons }
}

function Get-RunStartMs([object[]]$Entries, [string]$RunId) {
  $start = @($Entries | Where-Object { $_.RunId -eq $RunId -and $_.Code -eq 'run_start' }) | Select-Object -First 1
  $value = Get-DetailValue $start 'startedAtMs'
  if ($value -match '^\d+$') { return [int64]$value }
  return [int64]-1
}

function Get-UniqueEntries([object[]]$Entries) {
  $seen = @{}
  $unique = @()
  foreach ($entry in @($Entries | Where-Object { $_ } | Sort-Object RunId, Seq)) {
    $key = "$($entry.RunId)|$($entry.Seq)"
    if (-not $seen.ContainsKey($key)) { $seen[$key] = $true; $unique += $entry }
  }
  return $unique
}

function Get-OpenStep([string]$RunId, [object[]]$Entries) {
  # Last step of the run with step_begin and no later step_end; '' when the app is idle.
  $open = ''
  foreach ($entry in @(Get-UniqueEntries @($Entries | Where-Object { $_.RunId -eq $RunId }) | Sort-Object Seq)) {
    if ($entry.Code -eq 'step_begin') { $open = $entry.Step }
    elseif ($entry.Code -eq 'step_end' -and $entry.Step -eq $open) { $open = '' }
  }
  return $open
}

function Get-StepWaitState([string]$ExpectedRunId, [string]$Step, [object[]]$Entries, [int]$BaselineSeq) {
  # Phases: complete, running, interrupted, other_run, incomplete_block, not_started.
  $Entries = @(Get-UniqueEntries $Entries)
  $runEntries = @($Entries | Where-Object { $_.RunId -eq $ExpectedRunId } | Sort-Object Seq)
  $stepEntries = @($runEntries | Where-Object { $_.Step -eq $Step -and $_.Seq -gt $BaselineSeq })
  $begin = @($stepEntries | Where-Object { $_.Code -eq 'step_begin' }) | Select-Object -First 1
  $end = $null
  if ($begin) { $end = @($stepEntries | Where-Object { $_.Code -eq 'step_end' -and $_.Seq -gt $begin.Seq }) | Select-Object -First 1 }
  $orphanEnd = @($stepEntries | Where-Object { $_.Code -eq 'step_end' }) | Select-Object -First 1

  $expectedStart = Get-RunStartMs $Entries $ExpectedRunId
  $newerRuns = @()
  foreach ($runId in @($Entries | ForEach-Object { $_.RunId } | Sort-Object -Unique)) {
    if ($runId -eq $ExpectedRunId) { continue }
    $startMs = Get-RunStartMs $Entries $runId
    if ($expectedStart -ge 0 -and $startMs -gt $expectedStart) { $newerRuns += $runId }
  }
  $otherWithStep = @($newerRuns | Where-Object { $id = $_; @($Entries | Where-Object { $_.RunId -eq $id -and $_.Step -eq $Step }).Count -gt 0 })

  $phase = 'not_started'
  if ($begin -and $end) { $phase = 'complete' }
  elseif ($begin -and $newerRuns.Count -gt 0) { $phase = 'interrupted' }
  elseif ($begin) { $phase = 'running' }
  elseif ($orphanEnd) { $phase = 'incomplete_block' }
  elseif ($otherWithStep.Count -gt 0) { $phase = 'other_run' }

  $block = @()
  if ($begin) {
    $lastSeq = [int]::MaxValue
    if ($end) { $lastSeq = $end.Seq }
    $block = @($stepEntries | Where-Object { $_.Seq -ge $begin.Seq -and $_.Seq -le $lastSeq })
  }
  $lastEvent = $null
  if ($runEntries.Count -gt 0) { $lastEvent = $runEntries[-1] }
  return [pscustomobject]@{
    Phase = $phase; ExpectedRunId = $ExpectedRunId; Step = $Step; Block = $block
    NewerRunIds = $newerRuns; OtherRunIds = $otherWithStep; LastEvent = $lastEvent
  }
}

function New-Verdict([string]$Status, [string]$Reason, [string]$Detail) {
  return [pscustomobject]@{ Status = $Status; Reason = $Reason; Detail = $Detail }
}

function Get-WaitContext($State, [int]$ElapsedSeconds) {
  return "runId=$($State.ExpectedRunId); elapsedS=$ElapsedSeconds; last=$(Format-LogEvent $State.LastEvent)"
}

function Get-UnfinishedStepVerdict($State, [int]$ElapsedSeconds, [bool]$ProcessAlive) {
  $context = Get-WaitContext $State $ElapsedSeconds
  switch ($State.Phase) {
    'other_run' { return New-Verdict 'BLOCKED' 'runid_mismatch' "runid_mismatch: expected=$($State.ExpectedRunId); observed=$($State.OtherRunIds -join ','); $context" }
    'interrupted' { return New-Verdict 'BLOCKED' 'interrupted' "interrupted: step_begin sin step_end; newerRuns=$($State.NewerRunIds -join ','); $context" }
    'running' {
      if ($ProcessAlive) { return New-Verdict 'BLOCKED' 'timeout' "timeout: step_begin sin step_end, proceso vivo; $context" }
      return New-Verdict 'BLOCKED' 'step_end_missing' "step_end_missing: step_begin sin step_end, proceso terminado; $context"
    }
    'incomplete_block' { return New-Verdict 'BLOCKED' 'incomplete_block' "incomplete_block: step_end sin step_begin (posible perdida de log); $context" }
    default { return New-Verdict 'BLOCKED' 'not_started' "not_started: sin step_begin $($State.Step) en la ejecucion esperada; $context" }
  }
}

function Get-StepErrorVerdict($State, [string]$Context) {
  $stepError = @($State.Block | Where-Object { $_.Code -eq 'step_error' }) | Select-Object -First 1
  if ($stepError) { return New-Verdict 'BLOCKED' 'step_error' "step_error: $($stepError.Detail); $Context" }
  return $null
}

function Get-StepWaitVerdict($State, [int]$ElapsedSeconds, [bool]$ProcessAlive, [string[]]$RequiredVectors) {
  if ($State.Phase -ne 'complete') { return Get-UnfinishedStepVerdict $State $ElapsedSeconds $ProcessAlive }
  $context = Get-WaitContext $State $ElapsedSeconds
  $stepError = Get-StepErrorVerdict $State $context
  if ($stepError) { return $stepError }
  $vectors = @($State.Block | Where-Object { $_.Code -like 'vector_*' -and $_.Code -ne 'vector_start' })
  $missing = @($RequiredVectors | Where-Object { $code = "vector_$_"; @($vectors | Where-Object { $_.Code -eq $code }).Count -eq 0 })
  if ($missing.Count -gt 0) { return New-Verdict 'BLOCKED' 'missing_vectors' "missing_vectors: $($missing -join ','); $context" }
  $bad = @($vectors | Where-Object { $_.Status -ne 'OK' } | ForEach-Object { "$($_.Code)=$($_.Status)" })
  if ($bad.Count -gt 0) { return New-Verdict 'FAIL' 'vector_mismatch' "vector_mismatch: $($bad -join ','); $context" }
  $result = @($State.Block | Where-Object { $_.Code -eq 'conformance_result' }) | Select-Object -First 1
  if (-not $result) { return New-Verdict 'BLOCKED' 'missing_result' "missing_result: sin conformance_result; $context" }
  if ($result.Status -ne 'OK') { return New-Verdict 'FAIL' 'result_mismatch' "result_mismatch: conformance_result=$($result.Status) $($result.Detail); $context" }
  return New-Verdict 'PASS' 'complete' "complete: $($vectors.Count) vectores OK; $($result.Detail); $context"
}

function Get-BenchmarkVerdict($State, [int]$ElapsedSeconds, [bool]$ProcessAlive) {
  if ($State.Phase -ne 'complete') { return Get-UnfinishedStepVerdict $State $ElapsedSeconds $ProcessAlive }
  $context = Get-WaitContext $State $ElapsedSeconds
  $stepError = Get-StepErrorVerdict $State $context
  if ($stepError) { return $stepError }
  $result = @($State.Block | Where-Object { $_.Code -eq 'benchmark_result' }) | Select-Object -First 1
  if (-not $result) { return New-Verdict 'BLOCKED' 'missing_result' "missing_result: sin benchmark_result; $context" }
  $outcome = Get-DetailValue $result 'outcome'
  if ($result.Status -eq 'OK' -and $outcome -eq 'complete') { return New-Verdict 'PASS' 'complete' "complete: $($result.Detail); $context" }
  if ($outcome -eq 'incomplete') { return New-Verdict 'BLOCKED' 'benchmark_incomplete' "benchmark_incomplete: $($result.Detail); $context" }
  return New-Verdict 'BLOCKED' 'benchmark_error' "benchmark_error: $($result.Status) $($result.Detail); $context"
}

function Get-BatchVerdict($State, [int]$ElapsedSeconds, [bool]$ProcessAlive) {
  if ($State.Phase -ne 'complete') { return Get-UnfinishedStepVerdict $State $ElapsedSeconds $ProcessAlive }
  $context = Get-WaitContext $State $ElapsedSeconds
  $stepError = Get-StepErrorVerdict $State $context
  if ($stepError) { return $stepError }
  $block = @($State.Block)
  $results = @($block | Where-Object { $_.Code -eq 'ocr_result' -and $_.Status -eq 'OK' })
  $failed = @($block | Where-Object { $_.Status -eq 'FAIL' })
  $blocked = @($block | Where-Object { $_.Status -eq 'BLOCKED' })
  $summary = @($block | Where-Object { $_.Code -eq 'batch_summary' })
  if ($failed.Count -gt 0) { return New-Verdict 'FAIL' 'batch_errors' "batch_errors: $(($failed | ForEach-Object { $_.Code }) -join ','); ocrResults=$($results.Count); $context" }
  if ($blocked.Count -gt 0) { return New-Verdict 'BLOCKED' 'batch_blocked' "batch_blocked: $(($blocked | ForEach-Object { $_.Code }) -join ','); ocrResults=$($results.Count); $context" }
  if ($summary.Count -ne 1) { return New-Verdict 'BLOCKED' 'missing_summary' "missing_summary: batch_summary=$($summary.Count); ocrResults=$($results.Count); $context" }
  $images = Get-DetailValue $summary[0] 'images'
  $failures = Get-DetailValue $summary[0] 'failures'
  if ($images -notmatch '^\d+$' -or $failures -notmatch '^\d+$' -or [int]$failures -ne 0 -or [int]$images -ne $results.Count) {
    return New-Verdict 'BLOCKED' 'summary_mismatch' "summary_mismatch: images=$images; failures=$failures; ocrResults=$($results.Count); $context"
  }
  return New-Verdict 'PASS' 'complete' "complete: ocrResults=$($results.Count); $($summary[0].Detail); $context"
}
