const fs = require('fs');

const content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Dashboard | EXO GLOBAL</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root { --bg:#f0f2f5; --surface:#fff; --border:#edeef2; --text-main:#1e293b; --text-light:#64748b; --primary:#0a192f; --accent:#1d4ed8; --success:#107c41; --danger:#d13438; --warning:#f59e0b; }
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text-main);height:100vh;overflow:hidden;display:flex;font-size:13px}
        #sidebar{width:240px;background:#0a192f;display:flex;flex-direction:column;flex-shrink:0;color:#fff}
        .logo{height:70px;padding:0 24px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,0.05)}
        .logo-icon{width:32px;height:32px;background:#2563eb;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px}
        .logo-text{font-family:"Outfit",sans-serif;font-weight:800;font-size:18px;letter-spacing:.5px;color:#fff}
        nav{flex:1;padding:24px 16px;display:flex;flex-direction:column;gap:6px}
        .nav-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:4px;color:rgba(255,255,255,0.7);text-decoration:none;font-weight:500;transition:all .2s;font-size:14px}
        .nav-item i{width:18px;text-align:center;font-size:15px}
        .nav-item:hover{background:rgba(255,255,255,0.05);color:#fff}
        .nav-item.active{background:#eff6ff;color:#334155;box-shadow:inset 3px 0 0 #2563eb}
        main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;background:var(--bg)}
        .topbar{height:70px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 32px;flex-shrink:0}
        .top-right{display:flex;align-items:center;gap:24px}
        .icon-btn{position:relative;color:var(--text-light);cursor:pointer;font-size:18px;transition:color .2s}
        .profile{display:flex;align-items:center;gap:12px;cursor:pointer;padding-left:24px;border-left:1px solid var(--border)}
        .avatar{width:36px;height:36px;border-radius:50%;background:#2563eb;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
        .dashboard{flex:1;display:flex;flex-direction:column;padding:32px;gap:24px;min-height:0;overflow-y:auto}
        .kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;flex-shrink:0}
        .kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:24px;display:flex;flex-direction:column;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);transition:transform .2s;position:relative;overflow:hidden}
        .kpi-card:hover{transform:translateY(-2px)}
        .kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:var(--accent);opacity:0;transition:opacity .2s}
        .kpi-card:hover::before{opacity:1}
        .kpi-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .kpi-title{font-size:13px;font-weight:600;color:var(--text-light)}
        .kpi-val{font-family:'Outfit',sans-serif;font-size:32px;font-weight:700;color:var(--text-main);line-height:1;margin-bottom:8px}
        .bento-grid{flex:1;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;min-height:0}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:4px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);display:flex;flex-direction:column;overflow:hidden;min-height:350px}
        .card-header{padding:20px 24px;border-bottom:1px solid var(--border);font-weight:700;font-size:16px;display:flex;justify-content:space-between;align-items:center;font-family:'Outfit',sans-serif}
        .card-body{padding:24px;flex:1;overflow-y:auto}
        .c-progress{grid-column:span 4}
        .c-tasks{grid-column:span 8}
        .c-attendance{grid-column:span 6}
        .c-leaves{grid-column:span 6}
        .list-item{display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid var(--border);transition:background .2s;border-radius:6px}
        .list-item:hover{background:#f8fafc;padding-left:8px;margin:0 -8px}
        .list-item:last-child{border-bottom:none}
        .item-text{flex:1;min-width:0}
        .item-title{font-weight:600;font-size:14px;color:var(--text-main);margin-bottom:4px}
        .item-sub{font-size:12px;color:var(--text-light)}
        .att-pres{background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:600}
        .att-abs{background:#fee2e2;color:#b91c1c;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:600}
        .att-leave{background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:600}
        .sd-done{width:8px;height:8px;border-radius:50%;background:var(--success)}
        .sd-pending{width:8px;height:8px;border-radius:50%;background:var(--warning)}
        .sd-prog{width:8px;height:8px;border-radius:50%;background:var(--accent)}
        .btn-action{padding:10px 20px;border:none;border-radius:4px;font-weight:700;cursor:pointer;font-size:12px;transition:all .2s}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
        .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
        .modal-box{background:white;border-radius:16px;padding:32px;max-width:500px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,0.15)}
        .form-group{margin-bottom:16px}
        .form-label{display:block;font-size:11px;font-weight:700;color:var(--text-light);margin-bottom:6px;text-transform:uppercase}
        .form-input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:6px;outline:none;font-size:13px;font-family:'Inter',sans-serif}
        .form-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(29,78,216,0.1)}
        @media(max-width:768px){body{flex-direction:column}#sidebar{width:100%;height:auto;flex-direction:row;padding:10px}nav{flex-direction:row;padding:0;overflow-x:auto;gap:5px}.nav-item{padding:8px 12px;font-size:13px;white-space:nowrap}.dashboard{padding:15px}.bento-grid{grid-template-columns:1fr}.kpi-row{grid-template-columns:1fr 1fr}}
    </style>
</head>
<body>
<aside id="sidebar">
    <div class="logo"><div class="logo-icon"><i class="fa-solid fa-briefcase"></i></div><div class="logo-text">EXO PORTAL</div></div>
    <nav>
        <a href="dashboard-employee.html" class="nav-item active"><i class="fa-solid fa-house"></i> Dashboard</a>
        <a href="chat.html" class="nav-item"><i class="fa-solid fa-message"></i> Messages</a>
        <a href="tickets.html" class="nav-item"><i class="fa-solid fa-ticket"></i> Tickets</a>
        <div style="flex:1;"></div>
        <a href="profile.html" class="nav-item"><i class="fa-solid fa-id-badge"></i> My Profile</a>
        <a href="#" onclick="logout()" class="nav-item" style="color:#ef4444;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
    </nav>
</aside>
<main>
    <header class="topbar">
        <div style="font-size:20px;font-weight:700;color:var(--text-main);">Good <span id="greetPart">Day</span>, <span id="greetName">there</span>!</div>
        <div class="top-right">
            <div class="icon-btn"><i class="fa-regular fa-clock"></i> <span id="clock" style="font-size:12px;font-weight:600;margin-left:4px">00:00</span></div>
            <div class="profile" onclick="window.location.href='profile.html'">
                <div style="text-align:right"><div style="font-weight:600;font-size:13px" id="uName">Employee</div><div style="font-size:11px;color:var(--text-light)" id="uRole">Staff</div></div>
                <div class="avatar" id="uAv">E</div>
            </div>
        </div>
    </header>
    <div class="dashboard">
        <div style="font-size:11px;color:var(--text-light)" id="dateStr">Loading...</div>
        <div class="kpi-row">
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-title">Assigned Tasks</span><i class="fa-solid fa-layer-group" style="color:#3b82f6"></i></div><span class="kpi-val" id="kpiTot">0</span></div>
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-title">Completed</span><i class="fa-solid fa-check-double" style="color:var(--success)"></i></div><span class="kpi-val" style="color:var(--success)" id="kpiDone">0</span></div>
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-title">Pending</span><i class="fa-solid fa-hourglass-half" style="color:var(--warning)"></i></div><span class="kpi-val" style="color:var(--warning)" id="kpiPend">0</span></div>
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-title">Attendance</span><i class="fa-solid fa-calendar-check" style="color:var(--primary)"></i></div><span class="kpi-val" id="kpiAtt">100%</span></div>
        </div>
        <div style="display:flex;gap:12px;flex-shrink:0">
            <button onclick="clockIn()" class="btn-action" style="background:var(--success);color:white"><i class="fa-solid fa-arrow-right-to-bracket"></i> Clock In</button>
            <button onclick="clockOut()" class="btn-action" style="background:var(--danger);color:white"><i class="fa-solid fa-arrow-right-from-bracket"></i> Clock Out</button>
            <button onclick="showLeaveModal()" class="btn-action" style="background:var(--accent);color:white"><i class="fa-solid fa-calendar-minus"></i> Apply Leave</button>
        </div>
        <div class="bento-grid">
            <div class="card c-progress">
                <div class="card-header">Overall Progress</div>
                <div class="card-body" style="display:flex;align-items:center;justify-content:center">
                    <div style="position:relative;width:120px;height:120px">
                        <canvas id="progChart"></canvas>
                        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;flex-direction:column"><div id="progVal">0%</div><div style="font-size:9px;color:var(--text-light);text-transform:uppercase">Done</div></div>
                    </div>
                </div>
            </div>
            <div class="card c-tasks">
                <div class="card-header">My Tasks</div>
                <div class="card-body" id="taskList" style="padding-top:0"><div style="color:var(--text-light);text-align:center;padding:16px">Loading...</div></div>
            </div>
            <div class="card c-attendance">
                <div class="card-header">Recent Attendance</div>
                <div class="card-body" id="attList" style="padding-top:0"><div style="color:var(--text-light);text-align:center;padding:16px">Loading...</div></div>
            </div>
            <div class="card c-leaves">
                <div class="card-header">My Leave Requests</div>
                <div class="card-body" id="leaveList" style="padding-top:0"><div style="color:var(--text-light);text-align:center;padding:16px">Loading...</div></div>
            </div>
        </div>
    </div>
</main>

<!-- Leave Application Modal -->
<div class="modal-overlay" id="leaveModal">
    <div class="modal-box">
        <h2 style="font-family:'Outfit';font-size:20px;font-weight:800;margin-bottom:24px;color:var(--primary)"><i class="fa-solid fa-calendar-minus" style="color:var(--accent);margin-right:8px"></i>Apply for Leave</h2>
        <div class="form-group"><label class="form-label">Leave Type</label><select id="leaveType" class="form-input"><option>Casual Leave</option><option>Sick Leave</option><option>Annual Leave</option><option>Emergency Leave</option></select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="form-group"><label class="form-label">Start Date</label><input type="date" id="leaveStart" class="form-input"></div>
            <div class="form-group"><label class="form-label">End Date</label><input type="date" id="leaveEnd" class="form-input"></div>
        </div>
        <div class="form-group"><label class="form-label">Reason</label><textarea id="leaveReason" class="form-input" rows="3" placeholder="Briefly describe the reason for leave..."></textarea></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
            <button class="btn-action" style="background:none;color:var(--text-light);border:1px solid var(--border)" onclick="hideLeaveModal()">Cancel</button>
            <button class="btn-action" style="background:var(--accent);color:white" onclick="submitLeave()" id="leaveSubmitBtn">Submit Request</button>
        </div>
    </div>
</div>

<script>
const token = localStorage.getItem('token');
if (!token) window.location.href = '/';
const user = JSON.parse(localStorage.getItem('user') || '{}');

function setClock() {
    try {
        const d = new Date();
        const el = document.getElementById('clock');
        if (el) el.innerText = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
        const h = d.getHours();
        const gp = document.getElementById('greetPart');
        if (gp) gp.innerText = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
        const ds = document.getElementById('dateStr');
        if (ds) ds.innerText = d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    } catch(e) {}
}
setInterval(setClock, 1000); setClock();

const fName = (user.name || user.fullName || 'Employee').split(' ')[0];
if (document.getElementById('uName')) document.getElementById('uName').innerText = fName;
if (document.getElementById('greetName')) document.getElementById('greetName').innerText = fName;
if (document.getElementById('uRole')) document.getElementById('uRole').innerText = user.role || 'Staff';
if (document.getElementById('uAv')) document.getElementById('uAv').innerText = fName.charAt(0).toUpperCase();
// Set today as default leave dates
document.getElementById('leaveStart').value = new Date().toISOString().split('T')[0];
document.getElementById('leaveEnd').value = new Date().toISOString().split('T')[0];

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;

async function init() {
    // Tasks
    try {
        const res = await fetch('/api/tasks', { headers: { Authorization: \`Bearer \${token}\` } });
        const allTasks = await res.json();
        const ids = [user.name, user.fullName, user.employeeId, String(user.id)].filter(Boolean).map(s => s.toLowerCase());
        const myTasks = allTasks.filter(t => ids.some(id => (t.assignedTo || '').toLowerCase().includes(id)));
        const done = myTasks.filter(t => t.status === 'Completed').length;
        const pend = myTasks.filter(t => t.status === 'Pending').length;
        const prog = myTasks.filter(t => t.status === 'In Progress').length;
        document.getElementById('kpiTot').innerText = myTasks.length;
        document.getElementById('kpiDone').innerText = done;
        document.getElementById('kpiPend').innerText = pend + prog;
        const pct = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0;
        document.getElementById('progVal').innerText = pct + '%';
        new Chart(document.getElementById('progChart').getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['Done','Pending','In Progress'], datasets: [{ data: [done, pend, prog], backgroundColor: ['#10b981','#f59e0b','#3b82f6'], borderWidth: 0, cutout: '75%' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
        const tl = document.getElementById('taskList');
        tl.innerHTML = '';
        if (!myTasks.length) { tl.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:16px">No tasks assigned.</div>'; }
        else { myTasks.forEach(t => { tl.innerHTML += '<div class="list-item"><div class="sd-' + (t.status==='Completed'?'done':t.status==='Pending'?'pending':'prog') + '"></div><div class="item-text"><div class="item-title">' + t.title + '</div><div class="item-sub">' + (t.priority||'Normal') + ' Priority</div></div><div style="font-size:10px;color:var(--text-light);font-weight:500">' + t.status + '</div></div>'; }); }
    } catch(e) { console.error('Tasks error:', e); }

    // Attendance
    try {
        const res = await fetch('/api/attendance/mine', { headers: { Authorization: \`Bearer \${token}\` } });
        const records = await res.json();
        const al = document.getElementById('attList');
        al.innerHTML = '';
        if (records && records.length) {
            const pCount = records.filter(r => r.status === 'Present').length;
            document.getElementById('kpiAtt').innerText = Math.round((pCount / records.length) * 100) + '%';
            records.slice(0, 10).forEach(r => {
                const cls = r.status === 'Present' ? 'att-pres' : r.status === 'Absent' ? 'att-abs' : 'att-leave';
                al.innerHTML += '<div class="list-item"><i class="fa-regular fa-calendar" style="color:var(--text-light)"></i><div class="item-text"><div class="item-title">' + r.date + '</div></div><div class="' + cls + '">' + r.status + '</div></div>';
            });
        } else { document.getElementById('kpiAtt').innerText = 'N/A'; al.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:16px">No records.</div>'; }
    } catch(e) { console.error('Attendance error:', e); }

    // My Leaves
    loadMyLeaves();
}

async function loadMyLeaves() {
    try {
        const res = await fetch('/api/leaves/my-leaves', { headers: { Authorization: \`Bearer \${token}\` } });
        const leaves = await res.json();
        const ll = document.getElementById('leaveList');
        ll.innerHTML = '';
        if (!leaves || !leaves.length) { ll.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:16px">No leave requests yet.</div>'; return; }
        leaves.forEach(l => {
            const statusColor = l.status === 'Approved' ? 'var(--success)' : l.status === 'Rejected' ? 'var(--danger)' : l.status === 'Hold' ? '#8b5cf6' : 'var(--warning)';
            ll.innerHTML += '<div class="list-item"><i class="fa-solid fa-calendar-minus" style="color:' + statusColor + ';font-size:16px"></i><div class="item-text"><div class="item-title">' + l.startDate + ' to ' + l.endDate + '</div><div class="item-sub">' + (l.reason || 'No reason') + '</div></div><div style="text-align:right"><div style="font-size:11px;font-weight:700;color:' + statusColor + '">' + (l.status || 'Pending') + '</div><div style="font-size:9px;color:var(--text-light)">HR: ' + (l.hrStatus || 'Pending') + '</div></div></div>';
        });
    } catch(e) { console.error('Leaves error:', e); }
}

function showLeaveModal() { document.getElementById('leaveModal').style.display = 'flex'; }
function hideLeaveModal() { document.getElementById('leaveModal').style.display = 'none'; }

async function submitLeave() {
    const start = document.getElementById('leaveStart').value;
    const end = document.getElementById('leaveEnd').value;
    const reason = document.getElementById('leaveReason').value;
    const type = document.getElementById('leaveType').value;
    if (!start || !end || !reason) return alert('Please fill all fields');
    const btn = document.getElementById('leaveSubmitBtn');
    btn.disabled = true; btn.innerText = 'Submitting...';
    try {
        const res = await fetch('/api/leaves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
            body: JSON.stringify({ startDate: start, endDate: end, reason, type })
        });
        if (res.ok) { alert('Leave request submitted!'); hideLeaveModal(); document.getElementById('leaveReason').value = ''; loadMyLeaves(); }
        else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch(e) { alert('Connection error'); }
    finally { btn.disabled = false; btn.innerText = 'Submit Request'; }
}

async function clockIn() {
    try {
        const res = await fetch('/api/attendance/checkin', { method:'POST', headers:{ Authorization:\`Bearer \${token}\` } });
        const d = await res.json();
        if (res.ok) { alert('Clocked In!'); init(); } else { alert(d.error || 'Failed'); }
    } catch(e) { alert('Connection error'); }
}
async function clockOut() {
    try {
        const res = await fetch('/api/attendance/checkout', { method:'POST', headers:{ Authorization:\`Bearer \${token}\` } });
        const d = await res.json();
        if (res.ok) { alert('Clocked Out!'); init(); } else { alert(d.error || 'Failed'); }
    } catch(e) { alert('Connection error'); }
}

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
init();
<\/script>
<script src="/js/nav-sync.js"><\/script>
<script src="/js/notifications.js"><\/script>
</body>
</html>`;

fs.writeFileSync('frontend/dashboard-employee.html', content);
console.log('Employee dashboard rebuilt with proper UI + Leave Request modal!');
