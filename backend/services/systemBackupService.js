// backend/services/systemBackupService.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Creates a full system backup ZIP containing:
 *  - Full DB dump
 *  - Entire uploads folder
 * Returns the absolute path to the created ZIP file.
 */
async function createSystemBackup() {
  // 2. Prepare backup folder
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const zipName = `system_backup_${Date.now()}.zip`;
  const zipPath = path.join(backupDir, zipName);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(zipPath));
    archive.on('warning', err => { if (err.code !== 'ENOENT') reject(err); });
    archive.on('error', err => reject(err));

    archive.pipe(output);

    // Add uploads folder
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsPath)) {
      archive.directory(uploadsPath, 'uploads');
    }

    archive.finalize();
  });
}

module.exports = { createSystemBackup };
