import os
import re

dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the duplicate myRaisedChart logic inside initDashboard
# It looks like:
# // New "My Raised Tickets Status" Chart (doughnut) - only for executives
# const execRoles = ['IT Admin', 'CEO', 'Chairman'];
# if (execRoles.includes(user.role)) { ... }
dup_chart_pattern = re.compile(r'// New "My Raised Tickets Status" Chart \(doughnut\) - only for executives\s*const execRoles = \[\'IT Admin\', \'CEO\', \'Chairman\'\];\s*if \(execRoles\.includes\(user\.role\)\) \{.*?\.catch\(e => console\.error\(\'Personal chart error\', e\)\);\s*\}', re.DOTALL)
content = dup_chart_pattern.sub('', content)

# 2. Change <input type="date" id="dashRemDate"...> to type="datetime-local"
content = content.replace('<input type="date" id="dashRemDate"', '<input type="datetime-local" id="dashRemDate"')

# 3. Rewrite initCharts entirely to be clean and accurate to the user's requests
init_charts_pattern = re.compile(r'function initCharts\(data\) \{.*?\n\}\n</script>', re.DOTALL)

new_init_charts = """function initCharts(data) {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
    Chart.defaults.scale.grid.color = 'rgba(0,0,0,0.04)';

    // 1. Line Chart: Ticket Status Distribution
    const lineCtx = document.getElementById('ticketLineChart').getContext('2d');
    const g1 = lineCtx.createLinearGradient(0, 0, 0, 400); g1.addColorStop(0, '#3b82f6'); g1.addColorStop(1, '#2563eb');
    new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Raised', 'Assigned', 'Working', 'Completed'],
            datasets: [{
                label: 'Tickets',
                data: [
                    data.summary?.ticketsByStatus?.Raised || 0,
                    data.summary?.ticketsByStatus?.Assigned || 0,
                    data.summary?.ticketsByStatus?.Working || 0,
                    data.summary?.ticketsByStatus?.Completed || 0
                ],
                backgroundColor: g1,
                borderColor: g1,
                fill: false,
                tension: 0.3,
                pointRadius: 5
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'right', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
                tooltip: { backgroundColor: '#1e293b', titleFont: { size: 13, family: 'Outfit' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8 }
            },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Inter' } } },
                x: { ticks: { font: { family: 'Inter', weight: '600' } } }
            }
        }
    });

    // 2. Donut Chart: Ticket Priorities
    const pieCtx = document.getElementById('priorityPieChart').getContext('2d');
    const p1 = pieCtx.createLinearGradient(0, 0, 0, 400); p1.addColorStop(0, '#ef4444'); p1.addColorStop(1, '#b91c1c');
    const p2 = pieCtx.createLinearGradient(0, 0, 0, 400); p2.addColorStop(0, '#f59e0b'); p2.addColorStop(1, '#d97706');
    const p3 = pieCtx.createLinearGradient(0, 0, 0, 400); p3.addColorStop(0, '#3b82f6'); p3.addColorStop(1, '#2563eb');
    new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tickets',
                data: [
                    data.summary?.ticketsByPriority?.High || 0,
                    data.summary?.ticketsByPriority?.Medium || 0,
                    data.summary?.ticketsByPriority?.Low || 0
                ],
                backgroundColor: [p1, p2, p3],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'right', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
                tooltip: { backgroundColor: '#1e293b', titleFont: { size: 13, family: 'Outfit' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8 }
            }
        }
    });

    // 3. Waterfall (Bar) Chart: My Raised Tickets Status
    const execRoles2 = ['IT Admin', 'CEO', 'Chairman'];
    if (execRoles2.includes(user.role)) {
        fetch('/api/tickets/analytics/personal', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(pData => {
                const myCtx = document.getElementById('myRaisedChart').getContext('2d');
                new Chart(myCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Total Raised', 'Working', 'Pending', 'Completed', 'Rejected', 'Overdue'],
                        datasets: [
                            { label: 'Total Raised', data: [pData.raised.total, 0, 0, 0, 0, 0], backgroundColor: '#1e3a8a' },
                            { label: 'Working', data: [0, pData.raised.Working, 0, 0, 0, 0], backgroundColor: '#10b981' },
                            { label: 'Pending', data: [0, 0, pData.raised.Pending, 0, 0, 0], backgroundColor: '#f59e0b' },
                            { label: 'Completed', data: [0, 0, 0, pData.raised.Completed, 0, 0], backgroundColor: '#2563eb' },
                            { label: 'Rejected', data: [0, 0, 0, 0, pData.raised.Rejected, 0], backgroundColor: '#dc2626' },
                            { label: 'Overdue', data: [0, 0, 0, 0, 0, pData.raised.Overdue], backgroundColor: '#d97706' }
                        ]
                    },
                    options: {
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'right', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
                            tooltip: { backgroundColor: '#1e293b', titleFont: { size: 13, family: 'Outfit' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8 }
                        },
                        scales: {
                            x: { stacked: true, ticks: { font: { family: 'Inter', weight: '600' } } },
                            y: { stacked: true, beginAtZero: true, ticks: { precision: 0, font: { family: 'Inter' } } }
                        }
                    }
                });
            })
            .catch(e => console.error('Personal chart error', e));
    }
}
</script>"""

content = init_charts_pattern.sub(new_init_charts, content)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("dashboard.html fully fixed")
