const fs = require('fs');
const path = require('path');

const dashboards = [
    'dashboard.html',
    'dashboard-employee.html',
    'dashboard-ceo.html',
    'dashboard-chairman.html'
];

const htmlToInject = `
        <!-- COMPANY REMINDERS -->
        <div class="dashboard-grid" id="remindersRow">
            <div class="bento-card card-full" style="display:flex;flex-direction:column;gap:10px;overflow:hidden;">
                <div class="kpi-title" style="font-size:15px;font-weight:700;color:var(--primary);padding-bottom:8px;border-bottom:2px solid var(--border-soft);">
                    <i class="fa-solid fa-bell"></i> Upcoming Reminders (Today & Future)
                </div>
                <div id="dashRemindersList" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;max-height:240px;">
                    <div style="color:var(--text-light);text-align:center;padding:20px;font-size:13px;">Loading reminders...</div>
                </div>
            </div>
        </div>
`;

const jsToInject = `
async function loadDashReminders(){
    try {
        const res = await fetch('/api/reminders/my', { headers: { Authorization: "Bearer " + token } });
        const data = await res.json();
        const list = document.getElementById('dashRemindersList');
        if(!list) return;
        list.innerHTML = '';
        if(!data || data.length === 0) {
            list.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:20px;font-size:13px;">No upcoming reminders.</div>';
            return;
        }
        
        const todayStr = new Date().toISOString().slice(0, 10);
        
        data.forEach(r => {
            const isToday = r.reminderDateTime && r.reminderDateTime.slice(0, 10) === todayStr;
            const rDate = new Date(r.reminderDateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const div = document.createElement('div');
            div.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border-soft);border-radius:8px;background:" + (isToday ? 'var(--pink-light)' : '#fff') + ";border-left: 4px solid " + (isToday ? 'var(--primary)' : 'var(--border)') + ";";
            div.innerHTML = "<div>" +
                    "<div style='font-weight:700;color:var(--text-main);font-size:13px;display:flex;align-items:center;gap:6px;'>" +
                        r.message + (isToday ? " <span class='badge badge-pending' style='padding:2px 6px;font-size:9px;'>TODAY</span>" : "") +
                    "</div>" +
                    "<div style='font-size:11px;color:var(--text-light);margin-top:4px;'>" +
                        "<i class='fa-regular fa-clock'></i> " + rDate +
                    "</div>" +
                "</div>";
            list.appendChild(div);
        });
    } catch(e) { console.error('Error loading reminders:', e); }
}
`;

for (const dash of dashboards) {
    const file = path.join(__dirname, 'frontend', dash);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        if (!content.includes('loadDashReminders()')) {
            const leavesSectionIdx = content.indexOf('<section id="leavesSection"');
            const targetIdx = leavesSectionIdx !== -1 ? leavesSectionIdx : content.indexOf('</div>\\r\\n\\r\\n    <!--');
            
            if (targetIdx !== -1) {
                content = content.slice(0, targetIdx) + htmlToInject + content.slice(targetIdx);
            }

            const initDashIdx = content.indexOf('async function initDashboard');
            if (initDashIdx !== -1) {
                content = content.replace('async function initDashboard(){', 'async function initDashboard(){\\n    loadDashReminders();');
            }

            const scriptEndIdx = content.lastIndexOf('</script>');
            if (scriptEndIdx !== -1) {
                content = content.slice(0, scriptEndIdx) + jsToInject + content.slice(scriptEndIdx);
            }

            fs.writeFileSync(file, content);
            console.log("Patched " + dash);
        } else {
            console.log("Already patched " + dash);
        }
    } else {
        console.log("Not found " + dash);
    }
}
