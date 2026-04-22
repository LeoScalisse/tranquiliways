param(
  [ValidateSet("status", "now")]
  [string]$Command = "status"
)

$ErrorActionPreference = "Stop"

$ExpectedBranch = "main"
$ExpectedRemote = "https://github.com/LeoScalisse/tranquiliways.git"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Set-Location $RepoRoot

function Invoke-Git {
  param(
    [string[]]$GitArgs,
    [switch]$AllowFailure
  )

  $output = & git @GitArgs 2>&1
  $exitCode = $LASTEXITCODE
  $text = ($output | Out-String).Trim()

  if ($exitCode -ne 0 -and -not $AllowFailure) {
    if ([string]::IsNullOrWhiteSpace($text)) {
      $text = "git $($GitArgs -join ' ') failed"
    }

    throw $text
  }

  return [PSCustomObject]@{
    Ok = ($exitCode -eq 0)
    Output = $text
  }
}

function Write-Check {
  param(
    [string]$Label,
    [bool]$Ok,
    [string]$Value
  )

  $prefix = if ($Ok) { "[ok]" } else { "[warn]" }
  Write-Output "$prefix $Label`: $Value"
}

function Get-Branch {
  return (Invoke-Git -GitArgs @("rev-parse", "--abbrev-ref", "HEAD")).Output
}

function Get-RemoteUrl {
  return (Invoke-Git -GitArgs @("remote", "get-url", "origin")).Output
}

function Get-HeadSha {
  param([string]$Ref = "HEAD")

  $result = Invoke-Git -GitArgs @("rev-parse", "--short", $Ref) -AllowFailure
  if ($result.Ok) {
    return $result.Output
  }

  return "missing"
}

function Get-AheadBehind {
  param(
    [string]$BaseRef,
    [string]$CompareRef
  )

  $result = Invoke-Git -GitArgs @("rev-list", "--left-right", "--count", "$BaseRef...$CompareRef") -AllowFailure
  if (-not $result.Ok -or [string]::IsNullOrWhiteSpace($result.Output)) {
    return $null
  }

  $parts = $result.Output -split "\s+"
  if ($parts.Length -lt 2) {
    return $null
  }

  return [PSCustomObject]@{
    Ahead = [int]$parts[0]
    Behind = [int]$parts[1]
  }
}

function Get-DirtyFiles {
  $result = Invoke-Git -GitArgs @("status", "--porcelain")

  if ([string]::IsNullOrWhiteSpace($result.Output)) {
    return @()
  }

  return $result.Output -split "`r?`n"
}

function Print-Status {
  $branch = Get-Branch
  $remoteUrl = Get-RemoteUrl
  $dirtyFiles = Get-DirtyFiles
  $localSha = Get-HeadSha
  $remoteSha = Get-HeadSha -Ref "origin/$ExpectedBranch"
  $aheadBehind = Get-AheadBehind -BaseRef $ExpectedBranch -CompareRef "origin/$ExpectedBranch"

  Write-Output "Lovable sync status"
  Write-Output "- repo: $RepoRoot"
  Write-Check -Label "origin" -Ok ($remoteUrl -eq $ExpectedRemote) -Value $remoteUrl
  Write-Check -Label "branch" -Ok ($branch -eq $ExpectedBranch) -Value $branch

  if ($dirtyFiles.Count -eq 0) {
    Write-Check -Label "worktree" -Ok $true -Value "clean"
  } else {
    Write-Check -Label "worktree" -Ok $false -Value "$($dirtyFiles.Count) changed file(s)"
  }

  Write-Output "- local HEAD: $localSha"
  Write-Output "- origin/${ExpectedBranch}: $remoteSha"

  if ($null -ne $aheadBehind) {
    Write-Output "- ahead of origin/${ExpectedBranch}: $($aheadBehind.Ahead)"
    Write-Output "- behind origin/${ExpectedBranch}: $($aheadBehind.Behind)"
  } else {
    Write-Output "- ahead/behind: unavailable until origin/${ExpectedBranch} exists locally"
  }

  if ($dirtyFiles.Count -gt 0) {
    Write-Output "- changed files:"
    foreach ($file in $dirtyFiles) {
      Write-Output "  $file"
    }
  }

  Write-Output "- next:"
  Write-Output "  Compare origin/main with the commit visible inside Lovable."
  Write-Output "  Confirm the Lovable project is connected to LeoScalisse/tranquiliways on default branch main."
}

function Sync-Now {
  $branch = Get-Branch
  $dirtyFiles = Get-DirtyFiles

  if ($branch -ne $ExpectedBranch) {
    throw "Refusing to sync because the current branch is `"$branch`". Switch to `"$ExpectedBranch`" first."
  }

  if ($dirtyFiles.Count -gt 0) {
    Write-Output "Refusing to sync because there are local changes. Commit, stash, or discard them first."
    foreach ($file in $dirtyFiles) {
      Write-Output "  $file"
    }
    exit 1
  }

  Write-Output "Fetching origin..."
  Invoke-Git -GitArgs @("fetch", "origin", "--prune") | Out-Null

  Write-Output "Rebasing $ExpectedBranch onto origin/$ExpectedBranch..."
  Invoke-Git -GitArgs @("pull", "--rebase", "origin", $ExpectedBranch) | Out-Null

  Print-Status

  $aheadBehind = Get-AheadBehind -BaseRef $ExpectedBranch -CompareRef "origin/$ExpectedBranch"
  if ($null -ne $aheadBehind -and $aheadBehind.Ahead -gt 0) {
    Write-Output "- publish:"
    Write-Output "  Local main still has $($aheadBehind.Ahead) commit(s) not pushed. Run: git push origin $ExpectedBranch"
  }
}

if ($Command -eq "status") {
  Print-Status
} else {
  Sync-Now
}
