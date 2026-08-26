[CmdletBinding()]
param(
  [string]$AppRoot = "C:\Student E-Forms\COSTAATT-Student-E-Forms-Portal",
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$BackupRoot,
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$PostgresBin = "C:\Student E-Forms\PostgreSQL-17.9-full\pgsql\bin",
  [ValidateRange(1, 36500)]
  [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = $null
$backupDirCreated = $false

function Get-RequiredExecutable {
  param(
    [Parameter(Mandatory = $true)][string]$Directory,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $path = Join-Path $Directory $Name
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Required PostgreSQL utility was not found at '$path'. Supply the installed PostgreSQL bin directory with -PostgresBin."
  }

  return (Get-Item -LiteralPath $path).FullName
}

function Test-ArchiveTable {
  param(
    [Parameter(Mandatory = $true)][string]$Manifest,
    [Parameter(Mandatory = $true)][string]$TableName
  )

  $escapedName = [regex]::Escape($TableName)
  return [regex]::IsMatch(
    $Manifest,
    "(?m)\sTABLE(?:\s+DATA)?\s+public\s+$escapedName(?:\s|$)"
  )
}

try {
  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw "DATABASE_URL is required. Set it in the protected service environment or pass -DatabaseUrl."
  }

  if (-not (Test-Path -LiteralPath $BackupRoot)) {
    throw "BackupRoot '$BackupRoot' does not exist. No backup directory was created; provide an approved existing destination."
  }

  $backupRootItem = Get-Item -LiteralPath $BackupRoot -ErrorAction Stop
  if (-not $backupRootItem.PSIsContainer) {
    throw "BackupRoot '$BackupRoot' is not a directory. No backup was created."
  }
  $backupRootFull = $backupRootItem.FullName

  $pgDump = Get-RequiredExecutable -Directory $PostgresBin -Name "pg_dump.exe"
  $pgRestore = Get-RequiredExecutable -Directory $PostgresBin -Name "pg_restore.exe"
  $psql = Get-RequiredExecutable -Directory $PostgresBin -Name "psql.exe"

  $backupDir = Join-Path $backupRootFull $timestamp
  New-Item -ItemType Directory -Path $backupDir -ErrorAction Stop | Out-Null
  $backupDirCreated = $true

  $dbFile = Join-Path $backupDir "costaatt-eforms.dump"
  $manifestFile = Join-Path $backupDir "costaatt-eforms.pg_restore-list.txt"
  $metadataFile = Join-Path $backupDir "BACKUP-METADATA.json"
  $uploadsSource = Join-Path $AppRoot "uploads"
  $uploadsTarget = Join-Path $backupDir "uploads"

  Write-Host "Backing up the E-Forms PostgreSQL database to the approved destination..."
  & $pgDump $DatabaseUrl --file=$dbFile --format=custom --no-owner --no-privileges --compress=6
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE. No valid backup was produced."
  }

  if (-not (Test-Path -LiteralPath $dbFile -PathType Leaf)) {
    throw "Backup validation failed: the dump file was not created."
  }

  $dbFileInfo = Get-Item -LiteralPath $dbFile
  if ($dbFileInfo.Length -le 0) {
    throw "Backup validation failed: the dump file is empty."
  }

  Write-Host "Inspecting the PostgreSQL archive manifest..."
  $manifestOutput = @(& $pgRestore --list $dbFile 2>&1)
  $manifestExitCode = $LASTEXITCODE
  if ($manifestExitCode -ne 0) {
    throw "Backup validation failed: pg_restore could not inspect the archive (exit code $manifestExitCode)."
  }
  $manifestText = $manifestOutput -join [Environment]::NewLine
  Set-Content -LiteralPath $manifestFile -Value $manifestText -Encoding UTF8

  # Read the live public table inventory without exposing connection details.
  # The full pg_dump archive is then checked against every table present at dump time.
  $tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
  $currentTableOutput = @(& $psql $DatabaseUrl --no-psqlrc --tuples-only --no-align --command $tableQuery 2>&1)
  $currentTableExitCode = $LASTEXITCODE
  if ($currentTableExitCode -ne 0) {
    throw "Backup validation failed: the live application table inventory could not be read (psql exit code $currentTableExitCode)."
  }
  $currentTables = @($currentTableOutput | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ })
  if ($currentTables.Count -eq 0) {
    throw "Backup validation failed: the live database returned no public application tables."
  }

  $requiredTables = @(
    "reference_records",
    "submissions",
    "reference_imports",
    "reference_import_rows",
    "custom_audit_logs",
    "reference_delete_operations",
    "reference_delete_rows"
  )
  $tablesToVerify = @($currentTables + $requiredTables | Sort-Object -Unique)
  $missingTables = @($tablesToVerify | Where-Object { -not (Test-ArchiveTable -Manifest $manifestText -TableName $_) })
  if ($missingTables.Count -gt 0) {
    throw "Backup validation failed: the archive is missing required/current table definitions: $($missingTables -join ', ')."
  }

  $hash = (Get-FileHash -LiteralPath $dbFile -Algorithm SHA256).Hash
  $metadata = [ordered]@{
    CreatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    BackupFile = $dbFileInfo.Name
    BackupSizeBytes = $dbFileInfo.Length
    Sha256 = $hash
    ArchiveFormat = "custom"
    PublicTableCountAtBackup = $currentTables.Count
    RequiredTablesVerified = $requiredTables
    RestoreManifest = (Split-Path -Leaf $manifestFile)
  }
  $metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $metadataFile -Encoding UTF8

  if (Test-Path -LiteralPath $uploadsSource -PathType Container) {
    Write-Host "Backing up local uploads..."
    & robocopy $uploadsSource $uploadsTarget /MIR /R:2 /W:5 | Out-Host
    if ($LASTEXITCODE -gt 7) {
      throw "Local uploads backup failed with robocopy exit code $LASTEXITCODE."
    }
  } else {
    Write-Host "No local uploads folder found at $uploadsSource"
  }

  Write-Host "Writing restore notes..."
  @"
COSTAATT E-Forms backup
Created UTC: $($metadata.CreatedAtUtc)
Database archive: $($dbFileInfo.Name)
SHA-256: $hash
Public tables verified: $($currentTables.Count)
Restore manifest: $([IO.Path]::GetFileName($manifestFile))
Uploads: $([IO.Path]::GetFileName($uploadsTarget))

Restore outline:
1. Restore only to a separately named non-production PostgreSQL database.
2. Use pg_restore against the custom archive; never target costaatt_eforms.
3. Verify table presence, reference_records, submissions, and sample records.
4. Restore uploads separately, if required by the test.
5. Remove the temporary restore-test database after validation unless policy requires retention.
6. For a single deleted CRN or Lecturer, prefer the operator-only snapshot restore procedure in docs/REFERENCE-DATA-RESTORE.md.
"@ | Set-Content -Path (Join-Path $backupDir "RESTORE-NOTES.txt") -Encoding UTF8

  Write-Host "Removing timestamped backups older than $RetentionDays days..."
  Get-ChildItem -LiteralPath $backupRootFull -Directory |
    Where-Object {
      $_.Name -match '^\d{8}-\d{6}$' -and
      $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)
    } |
    Remove-Item -Recurse -Force

  Write-Host "Backup completed and validated: $backupDir"
  Write-Host "Backup file: $($dbFileInfo.Name)"
  Write-Host "Backup size: $($dbFileInfo.Length) bytes"
  Write-Host "SHA-256: $hash"
} catch {
  if ($backupDirCreated -and $backupDir -and (Test-Path -LiteralPath $backupDir)) {
    try {
      Remove-Item -LiteralPath $backupDir -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Warning "The failed backup directory could not be removed automatically. An operator should inspect it before retrying."
    }
  }
  throw
}
