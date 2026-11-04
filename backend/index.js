require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Auto-create necessary directories
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('./config/db');

// Models
const User = require('./models/User');
const Task = require('./models/Task');
const Message = require('./models/Message');
const Attendance = require('./models/Attendance');
const Ticket = require('./models/Ticket');
const TicketComment = require('./models/TicketComment');
const TicketAttachment = require('./models/TicketAttachment');
const TicketHistory = require('./models/TicketHistory');
const LeaveRequest = require('./models/LeaveRequest');
const Notification = require('./models/Notification');
const TicketShare = require('./models/TicketShare');
const Group = require('./models/Group');
const GroupMember = require('./models/GroupMember');
const UndertakingAsset = require('./models/UndertakingAsset');
const Project = require('./models/Project');
const ProjectMember = require('./models/ProjectMember');
const ProjectFolder = require('./models/ProjectFolder');
const ProjectFile = require('./models/ProjectFile');
const ProjectFileVersion = require('./models/ProjectFileVersion');
const ProjectLicence = require('./models/ProjectLicence');
const ProjectTask = require('./models/ProjectTask');
const ProjectTaskComment = require('./models/ProjectTaskComment');
const ProjectDiscussion = require('./models/ProjectDiscussion');
const ProjectActivity = require('./models/ProjectActivity');
const TodoItem = require('./models/TodoItem');
const EmployeeDocument = require('./models/EmployeeDocument');
const Reminder = require('./models/Reminder');
const Holiday = require('./models/Holiday');

// Associations
Ticket.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
Ticket.belongsTo(User, { as: 'Assignee', foreignKey: 'currentAssigneeId' });
Ticket.hasMany(TicketComment, { foreignKey: 'ticketId' });
Ticket.hasMany(TicketAttachment, { foreignKey: 'ticketId' });
Ticket.hasMany(TicketHistory, { foreignKey: 'ticketId' });
TicketComment.belongsTo(User, { foreignKey: 'userId' });
TicketAttachment.belongsTo(User, { foreignKey: 'userId' });
TicketHistory.belongsTo(User, { foreignKey: 'userId' });
TicketHistory.belongsTo(Ticket, { foreignKey: 'ticketId' });

// Advanced Ticket Sharing
Ticket.hasMany(TicketShare, { foreignKey: 'ticketId' });
TicketShare.belongsTo(User, { foreignKey: 'userId' });
TicketShare.belongsTo(Ticket, { foreignKey: 'ticketId' });

// Todo Associations
TodoItem.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// Reminder Associations
Reminder.belongsTo(User, { foreignKey: 'userId', as: 'User' });

Project.hasMany(ProjectLicence, { foreignKey: 'projectId' });
ProjectLicence.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(ProjectTask, { foreignKey: 'projectId' });
ProjectTask.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(ProjectDiscussion, { foreignKey: 'projectId' });
ProjectDiscussion.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(ProjectActivity, { foreignKey: 'projectId' });
ProjectActivity.belongsTo(Project, { foreignKey: 'projectId' });
Project.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
Project.belongsTo(User, { as: 'ProjectManager', foreignKey: 'projectManagerId' });
ProjectDiscussion.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
ProjectTask.belongsTo(User, { as: 'Assignee', foreignKey: 'assignedTo' });
ProjectTask.hasMany(ProjectTaskComment, { foreignKey: 'taskId', as: 'Comments' });
ProjectTaskComment.belongsTo(ProjectTask, { foreignKey: 'taskId' });
ProjectTaskComment.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
ProjectFile.belongsTo(User, { as: 'Uploader', foreignKey: 'uploadedBy' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(ProjectFolder, { foreignKey: 'projectId' });
ProjectFolder.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(ProjectFile, { foreignKey: 'projectId' });
ProjectFile.belongsTo(Project, { foreignKey: 'projectId' });
ProjectFolder.hasMany(ProjectFile, { foreignKey: 'folderId' });
ProjectFile.hasMany(ProjectFileVersion, { foreignKey: 'fileId' });
// (Uploader association already defined above)

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'Members' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });
User.hasMany(ProjectMember, { foreignKey: 'userId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(GroupMember, { foreignKey: 'userId', sourceKey: 'employeeId' });
Group.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy', targetKey: 'employeeId' });

// Message Associations
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId', targetKey: 'employeeId' });

const { protect } = require('./middleware/authMiddleware');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // Enable proxy trust for Cloudways / Nginx

// ── Security & Performance Middleware ──
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })); // Security headers
app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit body size

// Rate limiting — 200 requests per minute per IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many requests. Please slow down.' }
});
app.use('/api/', apiLimiter);

// Health check endpoint (for PM2 / monitoring)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), memory: process.memoryUsage(), timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);
const io = new Server(server, { path: '/api/socket.io', cors: { origin: '*' } });

// Make io accessible in routes
app.set('io', io);

// Database Sync & Seed
(async () => {
    try {
        const dialect = sequelize.getDialect();
        if (dialect === 'sqlite') {
            await sequelize.query('PRAGMA foreign_keys = OFF;');
            await sequelize.sync();
            await sequelize.query('PRAGMA foreign_keys = ON;');
        } else if (dialect === 'mysql') {
            // MySQL: sync tables (DO NOT drop Messages — preserves chat history)
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
            await sequelize.sync({ alter: true });
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        } else {
            // PostgreSQL: sync tables (preserves all data)
            await sequelize.sync({ alter: true });
        }
        console.log('📦 Database Cleaned & Synced (Secure Mode) — Dialect:', dialect);

        const seedUsers = [
            { id: 'EXO-001', name: 'Chairman', email: 'chairman@exo.com', role: 'Chairman', phone: '+910000000001' },
            { id: 'EXO-002', name: 'CEO', email: 'ceo@exo.com', role: 'CEO', phone: '+910000000002' },
            { id: 'EXO-201', name: 'HR Manager', email: 'hr@exo.com', role: 'HR', phone: '+910000000003' },
            { id: 'EXO-101', name: 'IT Admin', email: 'admin@exo.com', role: 'IT Admin', phone: '+918320069638' },
            { id: 'EXO-1001', name: 'Employee', email: 'employee1001@exo.com', role: 'Employee', phone: '+910000000004' }
        ];

        for (const u of seedUsers) {
            const exists = await User.findOne({ where: { employeeId: u.id } });
            if (!exists) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await User.create({
                    employeeId: u.id,
                    fullName: u.name,
                    email: u.email,
                    password: hashedPassword,
                    role: u.role,
                    phone: u.phone,
                    department: u.role === 'IT Admin' ? 'IT' : 'Executive'
                });
                console.log(`👤 ${u.role} account created (${u.id} / admin123)`);
            }
        }
    } catch (err) {
        console.error('Database Sync Error:', err);
    }
})();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/employee-documents', require('./routes/employeeDocumentRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/projects/:projectId/access', require('./routes/projectAccessRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

// ── BI Analytics for Executive Dashboard ──
app.get('/api/stats', protect, async (req, res) => {
    try {
        const isExecutive = ['IT Admin', 'Chairman', 'CEO', 'HR', 'HR Manager'].includes(req.user.role);

        let totalEmployees = 0;
        let tasksDone = 0;
        let totalTasks = 0;
        let presentToday = 0;
        let attendancePct = 0;
        let productivity = 0;
        let totalTickets = 0;
        let completedTickets = 0;
        let raisedTickets = 0;
        let pendingTickets = 0; // Working
        let openTickets = 0; // Just Raised
        let overdueTickets = 0;
        let deletedTickets = 0;
        const meetingsToday = 0; // Not implemented yet

        let deptMap = {};
        let teamPerformance = [];
        let ticketsByPriority = { High: 0, Medium: 0, Low: 0 };
        let ticketsByStatus = { Working: 0, Completed: 0, Raised: 0, Assigned: 0 };
        let myRaisedTicketsPerf = { Raised: 0, Working: 0, Completed: 0, Pending: 0, Rejected: 0 };

        if (isExecutive) {
            // Company-wide stats — use COUNT queries (not findAll) for scalability
            totalEmployees = await User.count();
            tasksDone = await Task.count({ where: { status: 'Completed' } });
            totalTasks = await Task.count();

            const today = new Date().toISOString().split('T')[0];
            presentToday = await Attendance.count({ where: { date: today } });
            attendancePct = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
            productivity = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

            totalTickets = await Ticket.count({ where: { isDeleted: false } });
            completedTickets = await Ticket.count({ where: { status: 'Completed', isDeleted: false } });
            openTickets = await Ticket.count({ where: { status: { [Op.in]: ['Raised', 'Assigned'] }, isDeleted: false } });
            pendingTickets = await Ticket.count({ where: { status: 'Working', isDeleted: false } });
            deletedTickets = await Ticket.count({ where: { isDeleted: true } });

            // Group tickets by priority/status using DB aggregation instead of loading all rows
            const priorityCounts = await Ticket.findAll({
                where: { isDeleted: false },
                attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
                group: ['priority'],
                raw: true
            });
            priorityCounts.forEach(r => { if (ticketsByPriority[r.priority] !== undefined) ticketsByPriority[r.priority] = parseInt(r.cnt); });

            const statusCounts = await Ticket.findAll({
                where: { isDeleted: false },
                attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
                group: ['status'],
                raw: true
            });
            statusCounts.forEach(r => { ticketsByStatus[r.status] = parseInt(r.cnt); });

            // My raised tickets — count queries per status
            const myTicketBase = { isDeleted: false, creatorId: req.user.id };
            myRaisedTicketsPerf.Raised = await Ticket.count({ where: { ...myTicketBase, status: 'Raised' } });
            myRaisedTicketsPerf.Working = await Ticket.count({ where: { ...myTicketBase, status: 'Working' } });
            myRaisedTicketsPerf.Completed = await Ticket.count({ where: { ...myTicketBase, status: 'Completed' } });
            myRaisedTicketsPerf.Pending = await Ticket.count({ where: { ...myTicketBase, status: 'Assigned' } });
            myRaisedTicketsPerf.Rejected = await Ticket.count({ where: { ...myTicketBase, status: 'Rejected' } });

            // Team performance — use DB grouping instead of loading all users+tasks into memory
            const users = await User.findAll({ attributes: ['employeeId', 'fullName', 'role', 'department'] });

            // Build department map
            users.forEach(u => {
                const d = u.department || 'Other';
                deptMap[d] = (deptMap[d] || 0) + 1;
            });

            // Get task stats per user via DB aggregation
            const taskStats = await Task.findAll({
                attributes: [
                    'assignedTo',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalTasks'],
                    [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completedTasks']
                ],
                group: ['assignedTo'],
                raw: true
            });
            const taskStatsMap = {};
            taskStats.forEach(r => { taskStatsMap[String(r.assignedTo)] = { total: parseInt(r.totalTasks) || 0, done: parseInt(r.completedTasks) || 0 }; });

            teamPerformance = users.map(u => {
                const stats = taskStatsMap[String(u.employeeId)] || { total: 0, done: 0 };
                return {
                    id: u.employeeId,
                    name: u.fullName,
                    role: u.role,
                    department: u.department,
                    totalTasks: stats.total,
                    completedTasks: stats.done,
                    overdue: 0,
                    completionRate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
                };
            });
        } else {
            // Personal stats
            totalEmployees = 0;
            tasksDone = await Task.count({ where: { assignedTo: req.user.id, status: 'Completed' } });
            totalTasks = await Task.count({ where: { assignedTo: req.user.id } });

            const today = new Date().toISOString().split('T')[0];
            const myAtt = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
            presentToday = myAtt ? 1 : 0;
            attendancePct = presentToday * 100;
            productivity = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

            const myTicketWhere = {
                isDeleted: false,
                [Op.or]: [
                    { creatorId: req.user.id },
                    { currentAssigneeId: req.user.id },
                    { '$TicketShares.userId$': req.user.id }
                ]
            };

            const myTickets = await Ticket.findAll({
                where: myTicketWhere,
                include: [{ model: TicketShare, required: false }]
            });

            totalTickets = myTickets.length;
            myTickets.forEach(t => {
                if (t.status === 'Completed') completedTickets++;
                else if (t.status === 'Raised' || t.status === 'Assigned') openTickets++;
                else if (t.status === 'Working') pendingTickets++;

                if (ticketsByPriority[t.priority] !== undefined) ticketsByPriority[t.priority]++;
                if (ticketsByStatus[t.status] !== undefined) ticketsByStatus[t.status]++;
                else ticketsByStatus[t.status] = 1;

                if (t.creatorId === req.user.id) {
                    if (t.status === 'Raised') myRaisedTicketsPerf.Raised++;
                    else if (t.status === 'Working') myRaisedTicketsPerf.Working++;
                    else if (t.status === 'Completed') myRaisedTicketsPerf.Completed++;
                    else if (t.status === 'Assigned' || t.status === 'Pending') myRaisedTicketsPerf.Pending++;
                    else if (t.status === 'Rejected') myRaisedTicketsPerf.Rejected++;
                    else myRaisedTicketsPerf.Pending++;
                }
            });
        }

        res.json({
            summary: {
                totalEmployees,
                presentToday,
                totalTasks,
                tasksDone,
                attendancePct,
                productivity,
                totalTickets,
                completedTickets,
                openTickets,
                raisedTickets: openTickets,
                pendingTickets,
                overdueTickets,
                deletedTickets,
                meetingsToday,
                ticketsByPriority,
                ticketsByStatus,
                myRaisedTicketsPerf
            },
            departments: Object.entries(deptMap).map(([name, value]) => ({ name, value })),
            teamPerformance: teamPerformance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Stats retrieval failed' });
    }
});


// Socket.io for Real-time Chat


app.get('/api/backup/tickets', protect, async (req, res) => {
    // Only Executives
    if (!['IT Admin', 'Chairman', 'CEO'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to download backups' });
    }

    try {
        const tickets = await Ticket.findAll({
            include: [
                { model: TicketHistory },
                { model: TicketComment },
                { model: TicketAttachment },
                { model: TicketShare }
            ]
        });

        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const filename = `TICKET_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(tickets, null, 2));

        res.download(filepath, filename);
    } catch (err) {
        console.error('Backup Error:', err);
        res.status(500).json({ error: 'Backup failed', details: err.message });
    }
});

const onlineUsers = new Map();
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.userId = String(userId);
        socket.join(socket.userId); // Join a room for this ID
        onlineUsers.set(socket.userId, socket.id);
        console.log(`User ${userId} joined room ${socket.userId}`);
        // Broadcast that user is online
        io.emit('user_status', { userId: socket.userId, status: 'online' });
    });

    socket.on('send_message', async (data) => {
        try {
            const msg = await Message.create({
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                fileName: data.fileName
            });

            const msgData = msg.get({ plain: true });

            const isGroup = String(data.receiverId).includes('group') || String(data.receiverId).length > 20;
            if (isGroup) {
                io.emit('receive_message', msgData);
            } else {
                const receiverSocket = onlineUsers.get(String(data.receiverId));
                if (receiverSocket) io.to(receiverSocket).emit('receive_message', msgData);
                socket.emit('receive_message', msgData);
            }
        } catch (err) {
            console.error('Chat error:', err);
        }
    });

    socket.on('typing', (data) => {
        const receiverSocket = onlineUsers.get(String(data.receiverId));
        if (receiverSocket) {
            io.to(receiverSocket).emit('user_typing', { senderId: data.senderId, isGroup: data.isGroup });
        }
    });

    socket.on('stop_typing', (data) => {
        const receiverSocket = onlineUsers.get(String(data.receiverId));
        if (receiverSocket) {
            io.to(receiverSocket).emit('user_stop_typing', { senderId: data.senderId });
        }
    });

    socket.on('mark_read', async (data) => {
        try {
            await Message.update({ isRead: true }, {
                where: { senderId: data.otherId, receiverId: data.userId, isRead: false }
            });
            const otherSocket = onlineUsers.get(String(data.otherId));
            if (otherSocket) io.to(otherSocket).emit('messages_read', { userId: data.userId });
        } catch (err) { console.error(err); }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit('user_status', { userId: socket.userId, status: 'offline', lastSeen: new Date() });
        }
        if (socket.meetingRoom) {
            socket.to(socket.meetingRoom).emit('user_left_meeting', {
                socketId: socket.id,
                userId: socket.meetingUser?.id
            });
            socket.leave(socket.meetingRoom);
            socket.meetingRoom = null;
        }
    });

    // --- WebRTC Meeting Signaling (Google Meet Mesh Architecture) ---
    socket.on('join_meeting', (payload) => {
        const roomId = typeof payload === 'string' ? payload : (payload.roomId || 'default');
        const userInfo = typeof payload === 'object' && payload.user ? payload.user : {
            id: socket.userId || 'guest-' + socket.id.slice(0, 5),
            name: (socket.meetingUser && socket.meetingUser.name) || 'Colleague'
        };

        socket.join(roomId);
        socket.meetingRoom = roomId;
        socket.meetingUser = userInfo;

        // Get list of existing peers in this room
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        const existingUsers = [];
        if (roomSockets) {
            for (const sockId of roomSockets) {
                if (sockId !== socket.id) {
                    const peerSocket = io.sockets.sockets.get(sockId);
                    existingUsers.push({
                        socketId: sockId,
                        userId: peerSocket?.meetingUser?.id || peerSocket?.userId,
                        userName: peerSocket?.meetingUser?.name || 'Colleague'
                    });
                }
            }
        }

        // Return existing users to the newly joined peer so it can send offers
        socket.emit('meeting_existing_users', { existingUsers });

        // Notify other participants in the room
        socket.to(roomId).emit('user_joined_meeting', {
            socketId: socket.id,
            userId: userInfo.id,
            userName: userInfo.name
        });
    });

    socket.on('meeting_offer', (data) => {
        if (data.targetSocketId) {
            io.to(data.targetSocketId).emit('meeting_offer', {
                sdp: data.sdp,
                senderSocketId: socket.id,
                senderName: socket.meetingUser?.name || 'Participant'
            });
        } else if (data.roomId) {
            socket.to(data.roomId).emit('meeting_offer', {
                sdp: data.sdp,
                senderSocketId: socket.id,
                senderName: socket.meetingUser?.name || 'Participant'
            });
        }
    });

    socket.on('meeting_answer', (data) => {
        if (data.targetSocketId) {
            io.to(data.targetSocketId).emit('meeting_answer', {
                sdp: data.sdp,
                senderSocketId: socket.id
            });
        } else if (data.roomId) {
            socket.to(data.roomId).emit('meeting_answer', {
                sdp: data.sdp,
                senderSocketId: socket.id
            });
        }
    });

    socket.on('meeting_ice_candidate', (data) => {
        if (data.targetSocketId) {
            io.to(data.targetSocketId).emit('meeting_ice_candidate', {
                candidate: data.candidate,
                senderSocketId: socket.id
            });
        } else if (data.roomId) {
            socket.to(data.roomId).emit('meeting_ice_candidate', {
                candidate: data.candidate,
                senderSocketId: socket.id
            });
        }
    });

    socket.on('meeting_chat_message', (data) => {
        const roomId = data.roomId || socket.meetingRoom;
        if (roomId) {
            io.to(roomId).emit('meeting_chat_message', {
                senderId: socket.meetingUser?.id || socket.userId,
                senderName: socket.meetingUser?.name || 'Colleague',
                message: data.message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('leave_meeting', (roomId) => {
        const rId = roomId || socket.meetingRoom;
        if (rId) {
            socket.leave(rId);
            socket.to(rId).emit('user_left_meeting', {
                socketId: socket.id,
                userId: socket.meetingUser?.id
            });
            socket.meetingRoom = null;
        }
    });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 EXO ERP Server running on port ${PORT}`));

// ── Global Error Handlers (prevents server crashes) ──
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
    // Don't exit — let PM2 handle restarts if needed
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION at:', promise);
    console.error('Reason:', reason);
});

// ── Graceful Shutdown ──
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('✅ HTTP server closed.');
        sequelize.close().then(() => {
            console.log('✅ Database connection closed.');
            process.exit(0);
        });
    });
    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Forced exit after 10s timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
