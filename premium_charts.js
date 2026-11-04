const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.startsWith('dashboard') && f.endsWith('.html'));

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Inject Secure Backup Button into Top Navbar (for IT Admin, Chairman, CEO)
    if (file === 'dashboard-chairman.html' || file === 'dashboard-ceo.html' || file === 'dashboard.html') {
        if (!content.includes('downloadBackup()')) {
            content = content.replace(
                /<div class="top-right">/,
                `<div class="top-right">
            <button onclick="downloadBackup()" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor:pointer; font-weight: 600; font-size: 11px; display:flex; align-items:center; gap:6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"><i class="fa-solid fa-cloud-arrow-down"></i> Secure DB Backup</button>`
            );
            
            // Add the download function
            if (!content.includes('function downloadBackup()')) {
                content = content.replace('</script>', `
    async function downloadBackup() {
        try {
            const res = await fetch('/api/backup/tickets', { headers: { Authorization: \`Bearer \${token}\` } });
            if (!res.ok) return alert('Backup failed or unauthorized');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'EXO_TICKETS_BACKUP_' + new Date().getTime() + '.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            alert('✅ Secure Database Backup Downloaded Successfully!');
        } catch(e) { console.error('Backup error:', e); alert('Failed to download backup.'); }
    }
</script>`);
            }
        }
    }

    // 2. Refactor Chart.js to High-End Power BI Styling
    if (content.includes('finChartInst = new Chart(ctxF')) {
        const professionalChart = `
                const gradRev = ctxF.createLinearGradient(0, 0, 0, 300);
                gradRev.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                gradRev.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

                const gradSpd = ctxF.createLinearGradient(0, 0, 0, 300);
                gradSpd.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
                gradSpd.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

                finChartInst = new Chart(ctxF, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                        datasets: [
                            { label: 'Revenue', data: [65, 80, 85, 110, 140, 130, 160, 180, 170, 200], borderColor: '#10b981', backgroundColor: gradRev, fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6 },
                            { label: 'Spend', data: [50, 60, 80, 95, 85, 100, 115, 130, 120, 140], borderColor: '#ef4444', backgroundColor: gradSpd, fill: true, tension: 0.4, borderWidth: 3, borderDash: [4, 4], pointRadius: 0, pointHoverRadius: 6 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: { legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10, weight: 'bold' } } }, tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.9)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4 } },
                        scales: {
                            x: { grid: { display: false, drawBorder: false } },
                            y: { grid: { color: '#e5e7eb', drawBorder: false, borderDash: [4, 4] }, ticks: { callback: v => '$' + v + 'k', font: { weight: '600' } } }
                        }
                    }
                });`;
        
        content = content.replace(/finChartInst\s*=\s*new\s*Chart\(ctxF,\s*\{[\s\S]*?(?=\}\s*\);\s*\}\s*\} catch)/, professionalChart);
    }

    // Improve Ops Chart (Doughnut)
    if (content.includes('opsChartInst = new Chart(document.getElementById(\'opsChart\')')) {
        const proOpsChart = `
                    opsChartInst = new Chart(document.getElementById('opsChart').getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            labels: ['Finished', 'Pending'],
                            datasets: [{ data: [pct, 100 - pct], backgroundColor: ['#0f766e', '#e2e8f0'], borderWidth: 0, cutout: '85%' }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false }, tooltip: { enabled:true, backgroundColor: '#111827', padding: 10 } } }
                    });`;
        
        content = content.replace(/opsChartInst\s*=\s*new\s*Chart\(document\.getElementById\('opsChart'\)[\s\S]*?(?=\}\s*\);\s*\}\s*\} catch)/, proOpsChart);
    }

    // 3. Grid Padding & Aesthetics
    // Adding slightly more padding to the bento grid for the unorganized feel
    content = content.replace(/\.bento-grid\s*\{\s*flex:\s*1;\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(12,\s*1fr\);\s*grid-template-rows:\s*1fr\s*1fr;\s*gap:\s*16px;/g, 
        '.bento-grid { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: 1fr 1fr; gap: 24px;');
    
    // Add margin to KPI cards
    content = content.replace(/\.kpi-row\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(5,\s*1fr\);\s*gap:\s*16px;/g, 
        '.kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 24px;');

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Premium Charts, Spacing, and Backup button added.');
