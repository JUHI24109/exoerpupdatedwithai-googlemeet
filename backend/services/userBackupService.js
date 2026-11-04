const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { Op } = require('sequelize');

async function createUserBackup(employeeId, sequelizeModels) {
    const { User, Task, Ticket, Attendance } = sequelizeModels;
    
    // 1. Fetch User Data
    const user = await User.findOne({ where: { employeeId }, attributes: { exclude: ['password'] } });
    if (!user) {
        throw new Error(`User with ID ${employeeId} not found`);
    }

    const userId = user.id;

    // Fetch related records
    const tasks = await Task.findAll({ where: { assignedTo: userId } });
    const tickets = await Ticket.findAll({ 
        where: { 
            isDeleted: false,
            [Op.or]: [{ creatorId: userId }, { currentAssigneeId: userId }]
        }
    });
    const attendance = await Attendance.findAll({ where: { userId } });

    const backupData = {
        profile: user,
        tasks: tasks,
        tickets: tickets,
        attendance: attendance,
        timestamp: new Date().toISOString()
    };

    // 2. Prepare paths
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const zipFileName = `backup_${employeeId}_${Date.now()}.zip`;
    const zipPath = path.join(backupDir, zipFileName);

    // 3. Create ZIP archive
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            resolve(zipPath);
        });

        archive.on('warning', (err) => {
            if (err.code !== 'ENOENT') {
                reject(err);
            }
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // Append Data JSON
        archive.append(JSON.stringify(backupData, null, 2), { name: `data_${employeeId}.json` });

        // Append Documents Folder
        const sanitizedEmp = String(employeeId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const docsFolder = path.join(__dirname, '..', 'uploads', 'employee-documents', sanitizedEmp);
        
        if (fs.existsSync(docsFolder)) {
            archive.directory(docsFolder, `documents_${sanitizedEmp}`);
        } else {
            archive.append('No uploaded documents found.', { name: 'documents_info.txt' });
        }

        archive.finalize();
    });
}

module.exports = {
    createUserBackup
};
