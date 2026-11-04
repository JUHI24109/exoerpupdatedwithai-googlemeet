const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.startsWith('dashboard') && f.endsWith('.html'));

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // 1. UI Upgrades (Power BI style)
    // Update card styles
    content = content.replace(/\.card\s*\{\s*background:\s*var\(--surface\);\s*border:\s*1px\s*solid\s*var\(--border\);\s*border-radius:\s*12px;/g, 
        '.card { background: var(--surface); border: none; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);');
    
    // Update card header
    content = content.replace(/\.card-header\s*\{\s*padding:\s*12px\s*14px;\s*border-bottom:\s*1px\s*solid\s*var\(--border\);\s*font-weight:\s*600;\s*font-size:\s*13px;\s*display:\s*flex;\s*justify-content:\s*space-between;\s*align-items:\s*center;\s*flex-shrink:\s*0;\s*background:\s*#fafafa;\s*\}/g,
        '.card-header { padding: 12px 14px; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 14px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; background: var(--surface); color: var(--text-main); }');

    // Update table th
    content = content.replace(/th\s*\{\s*text-align:\s*left;\s*padding:\s*8px;\s*font-weight:\s*600;\s*color:\s*var\(--text-light\);\s*position:\s*sticky;\s*top:\s*0;\s*background:\s*var\(--surface\);\s*border-bottom:\s*1px\s*solid\s*var\(--border\);\s*\}/g,
        'th { text-align: left; padding: 10px 8px; font-weight: 700; color: var(--text-main); position: sticky; top: 0; background: var(--surface); border-bottom: 2px solid var(--border); text-transform: uppercase; font-size: 10px; }');

    // Update KPI cards
    content = content.replace(/\.kpi-card\s*\{\s*background:\s*var\(--surface\);\s*border:\s*1px\s*solid\s*var\(--border\);\s*border-radius:\s*12px;\s*padding:\s*14px\s*16px;\s*display:\s*flex;\s*flex-direction:\s*column;\s*justify-content:\s*space-between;\s*box-shadow:\s*0\s*2px\s*4px\s*rgba\(0,0,0,0\.02\);\s*\}/g,
        '.kpi-card { background: var(--surface); border: none; border-radius: 4px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid var(--accent); }');

    content = content.replace(/\.kpi-header\s*\{\s*display:\s*flex;\s*justify-content:\s*space-between;\s*align-items:\s*center;\s*\}/g,
        '.kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }');

    content = content.replace(/\.kpi-title\s*\{\s*font-size:\s*12px;\s*font-weight:\s*600;\s*color:\s*var\(--text-light\);\s*\}/g,
        '.kpi-title { font-size: 11px; font-weight: 600; color: var(--text-light); text-transform: uppercase; }');

    content = content.replace(/\.kpi-val\s*\{\s*font-size:\s*20px;\s*font-weight:\s*700;\s*color:\s*var\(--text\);\s*display:\s*flex;\s*align-items:\s*center;\s*gap:\s*8px;\s*\}/g,
        '.kpi-val { font-size: 24px; font-weight: 700; color: var(--text-main); display: flex; align-items: baseline; gap: 8px; }');


    // 2. Logic Upgrades (Accuracy)
    // Replace random math in Team Section
    if (content.includes('const totalU = Math.floor(Math.random() * 15) + 3;')) {
        const accurateTeamLogic = `
        try {
            const resStats = await fetch('/api/stats', { headers: { Authorization: \`Bearer \${token}\` } });
            const d = await resStats.json();
            const team = d.teamPerformance || [];
            
            const tb = document.getElementById('teamTable');
            tb.innerHTML = '';
            if (team.length) {
                team.slice(0, 6).forEach(u => {
                    const totalU = u.totalTasks || 0;
                    const doneU = u.completedTasks || 0;
                    const overdue = u.overdue || 0;
                    const cpct = u.completionRate || 0;
                    tb.innerHTML += \`
                        <tr>
                            <td style="padding-left:16px;">
                                <div style="font-weight:600; color:var(--text-main);">\${u.name || 'User'}</div>
                                <div style="font-size:10px; color:var(--text-light);">\${u.role || 'Staff'}</div>
                            </td>
                            <td style="font-weight:600;">\${totalU}</td>
                            <td style="color:\${overdue > 0 ? 'var(--danger)' : 'var(--text-light)'}; font-weight:600;">\${overdue}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <div class="prog-bg" style="width:60px;"><div class="prog-fill" style="width:\${cpct}%; background:\${cpct<50?'#ef4444':cpct<80?'#f59e0b':'#10b981'};"></div></div>
                                    <span style="font-size:11px; font-weight:600;">\${cpct}%</span>
                                </div>
                            </td>
                        </tr>\`;
                });
            } else {
                tb.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No staff found</td></tr>';
            }
        } catch(e) { console.error('Team Error:', e); }`;
        
        // Target the existing block between "4. Team" and "5. Calendar"
        content = content.replace(/\/\/\s*4\.\s*Team[\s\S]*?(?=\/\/\s*5\.\s*Calendar)/, '// 4. Team\n' + accurateTeamLogic + '\n\n        ');
    }

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Dashboards upgraded to accurate Power BI style.');
