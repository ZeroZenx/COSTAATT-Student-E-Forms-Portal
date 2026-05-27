param(
  [string]$AppRoot = "C:\Apps\COSTAATT-Student-E-Forms-Portal",
  [string]$BackupRoot = "D:\Backups\COSTAATT-EForms",
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $BackupRoot $timestamp
$dbFile = Join-Path $backupDir "costaatt-eforms.sql"
$uploadsSource = Join-Path $AppRoot "uploads"
$uploadsTarget = Join-Path $backupDir "uploads"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if (-not $DatabaseUrl) {
  throw "DATABASE_URL is required. Set it in the service environment or pass -DatabaseUrl."
}

Write-Host "Backing up Postgres database..."
pg_dump $DatabaseUrl --file $dbFile --format p --no-owner --no-privileges

if (Test-Path $uploadsSource) {
  Write-Host "Backing up local uploads..."
  robocopy $uploadsSource $uploadsTarget /MIR /R:2 /W:5 | Out-Host
} else {
  Write-Host "No local uploads folder found at $uploadsSource"
}

Write-Host "Writing restore notes..."
@"
COSTAATT E-Forms backup
Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
AppRoot: $AppRoot
Database: $dbFile
Uploads: $uploadsTarget

Restore outline:
1. Stop the Node.js service.
2. Restore database: psql "<DATABASE_URL>" -f "$dbFile"
3. Restore uploads folder to: $uploadsSource
4. Start the Node.js service.
5. Run npm run smoke:windows against the production URL.
"@ | Set-Content -Path (Join-Path $backupDir "RESTORE-NOTES.txt")

Write-Host "Removing backups older than $RetentionDays days..."
Get-ChildItem $BackupRoot -Directory |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
  Remove-Item -Recurse -Force

Write-Host "Backup completed: $backupDir"
