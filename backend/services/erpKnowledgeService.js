const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const EmployeeDocument = require('../models/EmployeeDocument');
const UndertakingAsset = require('../models/UndertakingAsset');
const TodoItem = require('../models/TodoItem');

const MEMORY_FILE = path.join(__dirname, '../data/ai_memory.json');

// Ensure data directory exists
const dataDir = path.dirname(MEMORY_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load persisted memory
function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
        }
    } catch (e) {
        console.warn('Could not read AI memory file:', e.message);
    }
    return {
        customFacts: [],
        lastTrainedAt: null,
        trainedStats: {}
    };
}

// Save memory
function saveMemory(mem) {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem, null, 2), 'utf8');
    } catch (e) {
        console.warn('Could not save AI memory file:', e.message);
    }
}

/**
 * Live ERP Knowledge & Training Engine
 */
class ERPKnowledgeService {
    constructor() {
        this.memory = loadMemory();
        this.liveCache = null;
        this.lastCacheTime = 0;
        this.cacheTTL = 5000; // 5 seconds cache for fast response
    }

    /**
     * Gather live data snapshot from all database models
     */
    async getLiveSnapshot() {
        const now = Date.now();
        if (this.liveCache && (now - this.lastCacheTime < this.cacheTTL)) {
            return this.liveCache;
        }

        const today = new Date().toISOString().split('T')[0];

        // 1. Employees / Users
        const users = await User.findAll({
            attributes: ['id', 'employeeId', 'fullName', 'email', 'role', 'department', 'designation', 'phone', 'joiningDate']
        }).catch(() => []);

        const departmentCounts = {};
        const roleCounts = {};
        users.forEach(u => {
            const dept = u.department || 'General';
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
            const role = u.role || 'Employee';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });

        // 2. Tickets
        const tickets = await Ticket.findAll({
            where: { isDeleted: false },
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'Creator', attributes: ['fullName', 'employeeId'] },
                { model: User, as: 'Assignee', attributes: ['fullName', 'employeeId'] }
            ]
        }).catch(() => []);

        const ticketStats = {
            total: tickets.length,
            raised: tickets.filter(t => t.status === 'Raised').length,
            working: tickets.filter(t => t.status === 'Working').length,
            assigned: tickets.filter(t => t.status === 'Assigned').length,
            completed: tickets.filter(t => t.status === 'Completed').length,
            critical: tickets.filter(t => t.priority === 'Critical').length,
            high: tickets.filter(t => t.priority === 'High').length,
            medium: tickets.filter(t => t.priority === 'Medium').length,
            low: tickets.filter(t => t.priority === 'Low').length
        };

        // 3. Tasks
        const tasks = await Task.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'Assignee', attributes: ['fullName', 'employeeId'] }]
        }).catch(() => []);

        const taskStats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'Pending').length,
            inProgress: tasks.filter(t => t.status === 'In Progress').length,
            completed: tasks.filter(t => t.status === 'Completed').length
        };

        // 4. Attendance Today
        const attendances = await Attendance.findAll({
            where: { date: today },
            include: [{ model: User, as: 'Employee', attributes: ['fullName', 'employeeId', 'department'] }]
        }).catch(() => []);

        const presentUsers = attendances.filter(a => a.status === 'Present');
        const attendanceStats = {
            today,
            totalEmployees: users.length,
            presentToday: presentUsers.length,
            absentToday: Math.max(0, users.length - presentUsers.length),
            presentPercentage: users.length > 0 ? Math.round((presentUsers.length / users.length) * 100) : 0
        };

        // 5. Leave Requests
        const leaves = await LeaveRequest.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'Employee', attributes: ['fullName', 'employeeId'] }]
        }).catch(() => []);

        const leaveStats = {
            total: leaves.length,
            pending: leaves.filter(l => l.status === 'Pending').length,
            approved: leaves.filter(l => l.status === 'Approved').length,
            rejected: leaves.filter(l => l.status === 'Rejected').length
        };

        // 6. Holidays
        const holidays = await Holiday.findAll({
            order: [['date', 'ASC']]
        }).catch(() => []);

        // 7. Assets & Documents
        const assetCount = await UndertakingAsset.count().catch(() => 0);
        const docCount = await EmployeeDocument.count().catch(() => 0);

        const snapshot = {
            timestamp: new Date().toISOString(),
            users: {
                total: users.length,
                list: users.map(u => ({
                    id: u.employeeId,
                    name: u.fullName,
                    role: u.role,
                    department: u.department,
                    email: u.email
                })),
                departmentCounts,
                roleCounts
            },
            tickets: {
                stats: ticketStats,
                recent: tickets.slice(0, 10).map(t => ({
                    id: t.ticketId || `#${t.id}`,
                    title: t.title,
                    priority: t.priority,
                    status: t.status,
                    creator: t.Creator?.fullName || 'N/A',
                    assignee: t.Assignee?.fullName || 'Unassigned',
                    created: t.createdAt
                }))
            },
            tasks: {
                stats: taskStats,
                recent: tasks.slice(0, 5).map(t => ({
                    id: t.taskId || `#${t.id}`,
                    title: t.title,
                    status: t.status,
                    assignee: t.Assignee?.fullName || 'Unassigned'
                }))
            },
            attendance: {
                stats: attendanceStats,
                presentList: attendances.map(a => ({
                    name: a.Employee?.fullName || 'Employee',
                    time: a.loginTime ? new Date(a.loginTime).toLocaleTimeString() : 'Logged'
                }))
            },
            leaves: {
                stats: leaveStats,
                pendingList: leaves.filter(l => l.status === 'Pending').map(l => ({
                    employee: l.Employee?.fullName || 'Employee',
                    type: l.type,
                    dates: `${l.startDate} to ${l.endDate}`,
                    reason: l.reason
                }))
            },
            holidays: holidays.slice(0, 5).map(h => ({ name: h.name, date: h.date })),
            assetsCount: assetCount,
            documentsCount: docCount
        };

        this.liveCache = snapshot;
        this.lastCacheTime = now;
        return snapshot;
    }

    /**
     * Train / Sync knowledge from live database and update persisted memory
     */
    async syncAndTrain() {
        const snapshot = await this.getLiveSnapshot();
        const trainedAt = new Date().toISOString();

        const stats = {
            totalEmployees: snapshot.users.total,
            totalTickets: snapshot.tickets.stats.total,
            openTickets: snapshot.tickets.stats.raised + snapshot.tickets.stats.working + snapshot.tickets.stats.assigned,
            totalTasks: snapshot.tasks.stats.total,
            pendingLeaves: snapshot.leaves.stats.pending,
            todayPresent: snapshot.attendance.stats.presentToday,
            todayAttendancePct: snapshot.attendance.stats.presentPercentage,
            customFactsCount: this.memory.customFacts.length
        };

        this.memory.lastTrainedAt = trainedAt;
        this.memory.trainedStats = stats;
        saveMemory(this.memory);

        return {
            success: true,
            trainedAt,
            stats,
            message: `AI model successfully synced and trained on live ERP database: ${stats.totalEmployees} employees, ${stats.totalTickets} tickets, ${stats.totalTasks} tasks, ${stats.pendingLeaves} pending leaves.`
        };
    }

    /**
     * Remember a custom fact or user instruction
     */
    addLearnedFact(fact, learnedFrom = 'User') {
        if (!fact || !fact.trim()) return;
        this.memory.customFacts.push({
            id: 'fact_' + Date.now(),
            content: fact.trim(),
            learnedFrom,
            learnedAt: new Date().toISOString()
        });
        saveMemory(this.memory);
    }

    /**
     * Build comprehensive system context prompt with live ERP database data
     */
    async buildSystemContext(currentUser = {}) {
        const snap = await this.getLiveSnapshot();
        const mem = this.memory;

        const employeesListStr = snap.users.list.map(u => `- **${u.name}** (ID: ${u.id}, Role: ${u.role}, Dept: ${u.department})`).join('\n');
        
        let ticketsListStr = 'No open tickets currently.';
        if (snap.tickets.recent.length > 0) {
            ticketsListStr = snap.tickets.recent.map(t => `- [${t.id}] **${t.title}** | Priority: ${t.priority} | Status: ${t.status} | Assignee: ${t.assignee}`).join('\n');
        }

        let pendingLeavesStr = 'No pending leave requests.';
        if (snap.leaves.pendingList.length > 0) {
            pendingLeavesStr = snap.leaves.pendingList.map(l => `- **${l.employee}**: ${l.type} (${l.dates}) — Reason: "${l.reason}"`).join('\n');
        }

        let learnedFactsStr = '';
        if (mem.customFacts && mem.customFacts.length > 0) {
            learnedFactsStr = '\n\n### Self-Trained / Learned Company Knowledge:\n' + mem.customFacts.map(f => `- ${f.content}`).join('\n');
        }

        return `You are the AI Copilot & ChatGPT Intelligence Assistant embedded inside the EXO GLOBAL Enterprise ERP system.
You have two core capabilities:
1. Complete, 100% accurate, live access to ALL real data in the EXO ERP database.
2. Broad general intelligence just like ChatGPT (deep world knowledge, coding, writing, business analysis, mathematical reasoning, languages, advice).

Current User: ${currentUser.name || currentUser.fullName || 'User'} (Role: ${currentUser.role || 'Employee'}, ID: ${currentUser.employeeId || 'N/A'})
Last Live Data Sync: ${snap.timestamp}

=== LIVE REAL-TIME ERP DATABASE SNAPSHOT ===
- Total Employees: ${snap.users.total}
- Department Breakdown: ${JSON.stringify(snap.users.departmentCounts)}
- Registered Employees:
${employeesListStr}

- Tickets Summary:
  * Total: ${snap.tickets.stats.total} (Raised: ${snap.tickets.stats.raised}, Working: ${snap.tickets.stats.working}, Assigned: ${snap.tickets.stats.assigned}, Completed: ${snap.tickets.stats.completed})
  * Critical: ${snap.tickets.stats.critical}, High: ${snap.tickets.stats.high}, Medium: ${snap.tickets.stats.medium}, Low: ${snap.tickets.stats.low}
  * Recent Tickets:
${ticketsListStr}

- Attendance Today (${snap.attendance.stats.today}):
  * Present: ${snap.attendance.stats.presentToday} / ${snap.attendance.stats.totalEmployees} (${snap.attendance.stats.presentPercentage}%)
  * Absent: ${snap.attendance.stats.absentToday}

- Leave Requests:
  * Pending Approvals: ${snap.leaves.stats.pending}
  * Approved: ${snap.leaves.stats.approved}
${pendingLeavesStr}

- Tasks:
  * Total: ${snap.tasks.stats.total} (Pending: ${snap.tasks.stats.pending}, In Progress: ${snap.tasks.stats.inProgress}, Completed: ${snap.tasks.stats.completed})
- Documents in System: ${snap.documentsCount}
- Assets in System: ${snap.assetsCount}
${learnedFactsStr}
=== END OF LIVE ERP DATABASE SNAPSHOT ===

Instructions:
1. When asked about ERP data (employees, tickets, tasks, attendance, leaves, status), ALWAYS answer using the EXACT, REAL numbers and names from the live snapshot above. Format with Markdown tables, bold text, and bullet points.
2. When asked general questions (coding, science, business, languages, writing, math, or anything outside ERP), answer comprehensively, intelligently, and helpfully like ChatGPT.
3. Understand Hindi, Hinglish, and English seamlessly. If the user asks in Hindi or Hinglish, respond warmly in the same language or bilingual English/Hindi.
4. If the user tells you to remember something or provides a new rule, acknowledge it and confirm you have saved it into your trained memory.
`;
    }
}

module.exports = new ERPKnowledgeService();
