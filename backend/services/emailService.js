const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'your-email@outlook.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

async function sendBackupEmail(toEmail, employeeId, zipPath) {
    const mailOptions = {
        from: process.env.SMTP_USER || 'your-email@gmail.com',
        to: toEmail,
        subject: `EXO ERP Backup Request - User: ${employeeId}`,
        text: `Hello,\n\nPlease find the requested backup for Employee ID: ${employeeId} attached to this email.\nThis contains their profile data, tasks, tickets, attendance, and uploaded documents.\n\nSecurely,\nEXO Global System`,
        attachments: [
            {
                filename: `backup_${employeeId}.zip`,
                path: zipPath
            }
        ]
    };

    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@outlook.com' || process.env.SMTP_USER === 'your-email@gmail.com') {
        console.log(`[Mock Email] Simulated sending backup zip to ${toEmail}`);
        return { messageId: 'simulated-id', accepted: [toEmail] };
    }

    return await transporter.sendMail(mailOptions);
}

module.exports = {
    sendBackupEmail
};
