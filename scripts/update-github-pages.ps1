param(
  [string]$Message = ("Atualiza GitHub Pages " + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
)

$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-Location).Path
  )

  Write-Host ""
  Write-Host ("> " + $FilePath + " " + ($Arguments -join ' ')) -ForegroundColor Cyan

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
  }
  finally {
    Pop-Location
  }
}

function Sync-Directory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Source,
    [Parameter(Mandatory = $true)]
    [string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source directory not found: $Source"
  }

  if (-not (Test-Path -LiteralPath $Destination)) {
    New-Item -ItemType Directory -Path $Destination | Out-Null
  }

  $arguments = @(
    $Source,
    $Destination,
    '/MIR',
    '/FFT',
    '/R:2',
    '/W:1',
    '/NFL',
    '/NDL',
    '/NJH',
    '/NJS',
    '/NP'
  )

  Push-Location $Destination
  try {
    & 'robocopy.exe' @arguments | Out-Null
    $robocopyExitCode = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }

  if ($robocopyExitCode -ge 8) {
    throw "robocopy failed while syncing $Source to $Destination"
  }
}

function Test-CommandAvailable {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName
  )

  return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Ensure-GitHubAuth {
  param(
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory
  )

  if (-not (Test-CommandAvailable -CommandName 'gh.exe')) {
    Write-Host ""
    Write-Host "GitHub CLI nao encontrada. O push dependera das credenciais ja configuradas no Git." -ForegroundColor Yellow
    return
  }

  Push-Location $WorkingDirectory
  try {
    & 'gh.exe' auth status | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Host ""
      Write-Host "GitHub CLI autenticada." -ForegroundColor Green
      & 'gh.exe' auth setup-git | Out-Null
      return
    }
  }
  finally {
    Pop-Location
  }

  Write-Host ""
  $loginAnswer = Read-Host "GitHub CLI sem login. Executar 'gh auth login' agora? [S/n]"
  if ($loginAnswer -match '^(n|nao|não)$') {
    Write-Host "Seguindo sem login automatico. O push pode falhar se o Git nao estiver autenticado." -ForegroundColor Yellow
    return
  }

  Invoke-Step -FilePath 'gh.exe' -Arguments @('auth', 'login') -WorkingDirectory $WorkingDirectory
  Invoke-Step -FilePath 'gh.exe' -Arguments @('auth', 'setup-git') -WorkingDirectory $WorkingDirectory
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$publishRoot = Join-Path $repoRoot '.publish-temp'

if (-not (Test-Path -LiteralPath $publishRoot)) {
  throw "Publish clone not found: $publishRoot"
}

$gitDir = Join-Path $publishRoot '.git'
if (-not (Test-Path -LiteralPath $gitDir)) {
  throw "Publish clone is missing .git: $publishRoot"
}

Ensure-GitHubAuth -WorkingDirectory $repoRoot

Write-Host "Building site in workspace root..." -ForegroundColor Yellow
Invoke-Step -FilePath 'npm.cmd' -Arguments @('run', 'build') -WorkingDirectory $repoRoot

Write-Host ""
Write-Host "Syncing files to .publish-temp..." -ForegroundColor Yellow

$directoriesToMirror = @(
  '.github',
  'public',
  'scripts',
  'src'
)

foreach ($relativeDir in $directoriesToMirror) {
  $sourceDir = Join-Path $repoRoot $relativeDir
  $destinationDir = Join-Path $publishRoot $relativeDir
  Sync-Directory -Source $sourceDir -Destination $destinationDir
}

$filesToCopy = @(
  '.gitignore',
  'ATUALIZAR_GITHUB_PAGES.md',
  'FLOWCHARTS.md',
  'index.html',
  'package-lock.json',
  'package.json',
  'postcss.config.js',
  'README.md',
  'tailwind.config.js',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'WRITING_GUIDE.md'
)

foreach ($relativeFile in $filesToCopy) {
  $sourceFile = Join-Path $repoRoot $relativeFile
  $destinationFile = Join-Path $publishRoot $relativeFile

  if (-not (Test-Path -LiteralPath $sourceFile)) {
    throw "Source file not found: $sourceFile"
  }

  Copy-Item -LiteralPath $sourceFile -Destination $destinationFile -Force
}

Write-Host ""
Write-Host "Preparing git safe.directory..." -ForegroundColor Yellow
Invoke-Step -FilePath 'git.exe' -Arguments @('config', '--global', '--add', 'safe.directory', $publishRoot) -WorkingDirectory $repoRoot

Write-Host ""
Write-Host "Checking pending changes..." -ForegroundColor Yellow
Invoke-Step -FilePath 'git.exe' -Arguments @('status', '--short') -WorkingDirectory $publishRoot

Invoke-Step -FilePath 'git.exe' -Arguments @('add', '-A') -WorkingDirectory $publishRoot

$statusOutput = git -C $publishRoot status --short
if (-not $statusOutput) {
  Write-Host ""
  Write-Host "No changes to publish." -ForegroundColor Green
  exit 0
}

Invoke-Step -FilePath 'git.exe' -Arguments @('commit', '-m', $Message) -WorkingDirectory $publishRoot
Invoke-Step -FilePath 'git.exe' -Arguments @('push', 'origin', 'main') -WorkingDirectory $publishRoot

Write-Host ""
Write-Host "GitHub Pages update sent. The workflow will publish the new version from main." -ForegroundColor Green
