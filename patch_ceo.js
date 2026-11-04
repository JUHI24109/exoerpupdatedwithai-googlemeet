const fs = require('fs');
const path = require('path');

const fp = path.join('C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend', 'dashboard-ceo.html');
let content = fs.readFileSync(fp, 'utf8');

const regex = /\} catch\(e\) \{ console\.error\('Fin Chart Error:', e\); \}\s*\/\/\s*Populate Ticket Activity Center/;

const replacementStr = `} catch(e) { console.error('Fin Chart Error:', e); }

        // 1. Stats & KPI
        try {
            const resStats = await fetch('/api/stats', { headers: { Authorization: \`Bearer \${token}\` } });
            const d = await resStats.json();
        } catch(e) { console.error('Stats Error:', e); }

        // 2. Tickets & Intelligence Feed
        let tickets = [];
        try {
            const resTickets = await fetch('/api/tickets/my-tickets', { headers: { Authorization: \`Bearer \${token}\` } });
            const ticketData = await resTickets.json();
            tickets = Array.isArray(ticketData) ? ticketData : [];
            
            // KPI Update
            const raised = tickets.filter(t => t.status === 'Raised').length;
            const working = tickets.filter(t => t.status === 'Working').length;
            const finished = tickets.filter(t => t.status === 'Completed' || t.status === 'Finished').length;
            const total = tickets.length;

            if (document.getElementById('kpi-raised')) document.getElementById('kpi-raised').innerText = raised;
            if (document.getElementById('kpi-finished')) document.getElementById('kpi-finished').innerText = finished;
            if (document.getElementById('tRaised')) document.getElementById('tRaised').innerText = raised;
            if (document.getElementById('tWorking')) document.getElementById('tWorking').innerText = working;
            if (document.getElementById('tFinished')) document.getElementById('tFinished').innerText = finished;
            
            const pct = total ? Math.round((finished / total) * 100) : 0;
            if (document.getElementById('opsPct')) document.getElementById('opsPct').innerText = pct + '%';
            
            try {
                if (opsChartInst) opsChartInst.destroy();
                if (typeof Chart !== 'undefined' && document.getElementById('opsChart')) {
                    opsChartInst = new Chart(document.getElementById('opsChart').getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            labels: ['Finished', 'Pending'],
                            datasets: [{ data: [pct, 100 - pct], backgroundColor: ['#0f766e', '#e2e8f0'], borderWidth: 0, cutout: '85%' }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false }, tooltip: { enabled:true, backgroundColor: '#111827', padding: 10 } } }
                    });
                }
            } catch (e) { console.error('Ops Chart Error:', e); }

            // Populate Ticket Activity Center`;

if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(fp, content, 'utf8');
    console.log('CEO Dashboard Successfully Patched with Regex!');
} else {
    console.log('Could not match regex in CEO Dashboard.');
}
