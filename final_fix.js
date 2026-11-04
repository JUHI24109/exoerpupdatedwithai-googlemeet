const fs = require('fs');
const path = require('path');

const files = ['dashboard-chairman.html', 'dashboard-ceo.html', 'dashboard-employee.html', 'dashboard-hr.html'];

files.forEach(file => {
    const fp = path.join('C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend', file);
    if (!fs.existsSync(fp)) return;
    
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Fix CSS Grid Allocations
    if (!content.includes('.c-pay { grid-column: span 4;')) {
        content = content.replace(/.c-team { grid-column: span 8; grid-row: span 1; }/, 
            '.c-team { grid-column: span 8; grid-row: span 1; }\n        .c-pay { grid-column: span 4; grid-row: span 1; }');
    }

    // 2. Fix broken </div> in Reports Section for CEO
    if (file === 'dashboard-ceo.html') {
        content = content.replace(/<div class="icon-box" style="background:#fff7ed; color:#f59e0b;"><i class="fa-solid fa-coins"><\/i><\/div>[\s\S]*?<div class="item-text"><div class="item-title">Financial Audit<\/div><div class="item-sub">Payroll, taxes & company spend<\/div><\/div>[\s\S]*?<\/div>/, 
            `<div class="list-item" style="cursor:pointer; border-radius: 4px; padding:10px;">
                        <div class="icon-box" style="background:#fff7ed; color:#f59e0b;"><i class="fa-solid fa-coins"></i></div>
                        <div class="item-text"><div class="item-title">Financial Audit</div><div class="item-sub">Payroll, taxes & company spend</div></div>
                    </div>`);
    }

    // 3. Fix the massive JS corruption in CEO and Chairman
    // The corruption starts at `y: { grid: { color: '#e5e7eb', drawBorder: false, borderDash: [4, 4] }, ticks: { callback: v => '});`
    // And ends somewhere after ` + v + 'k', font: { weight: '600' } } }`
    
    if (content.includes("ticks: { callback: v => '});")) {
        const parts = content.split("ticks: { callback: v => '});");
        
        let tail = parts[1];
        
        // Find the exact line where the duplication ends.
        // It ends with:  + v + 'k', font: { weight: '600' } } }
        // followed by catch(e) { console.error('Ops Chart Error:', e); }
        // We need to cut out the duplicated Ops Chart Error catch block and everything up to it.
        const endOfGarbageStr = " catch(e) { console.error('Ops Chart Error:', e); }";
        const lastIndex = tail.lastIndexOf(endOfGarbageStr);
        
        if (lastIndex !== -1) {
            // Keep the real script that follows
            tail = tail.substring(lastIndex + endOfGarbageStr.length);
        } else {
            // If Chairman, it might be Fin Chart Error
            const finStr = " catch(e) { console.error('Fin Chart Error:', e); }";
            const lastFin = tail.lastIndexOf(finStr);
            if (lastFin !== -1) {
                tail = tail.substring(lastFin + finStr.length);
            }
        }
        
        content = parts[0] + `ticks: { callback: v => '$' + v + 'k', font: { weight: '600' } } }
                        }
                    }
                });
            }
        } catch(e) { console.error('Fin Chart Error:', e); }` + tail;
    }

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Final deep cleanup executed.');
