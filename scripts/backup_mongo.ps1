# Backup MongoDB (PowerShell)
# Save as scripts/backup_mongo.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupDir = "C:/backups/mongo"
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir }
# Use Docker exec to run mongodump inside the container
docker exec exo_erp_mongo mongodump --username mongoAdmin --password MongoStrong!23 --out "C:/backups/mongo/mongo_$timestamp"
Write-Host "MongoDB backup saved to $backupDir"
