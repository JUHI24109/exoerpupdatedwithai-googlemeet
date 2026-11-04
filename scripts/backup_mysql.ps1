# Backup MySQL (PowerShell)
# Save as scripts/backup_mysql.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupDir = "C:/backups/mysql"
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir }
# Use Docker exec to run mysqldump inside the container
docker exec exo_erp_mysql mysqldump -u exoadmin -pVeryStrongUserPass!23 --databases exoerp > "$backupDir/exoerp_$timestamp.sql"
Write-Host "MySQL backup saved to $backupDir"
