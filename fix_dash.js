const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.startsWith('dashboard') && f.endsWith('.html'));

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Fix the finChartInst catastrophe caused by `$'`
    if (content.includes('ticks: { callback: v => \'});')) {
        // We need to cut out the duplicated massive chunk that was injected.
        // The original replace looked for: /(?=}\s*\);\s*}\s*} catch)/
        // The injected part starts at: v => ' 
        // We will just replace everything from `ticks: { callback: v => '` down to `catch(e) { console.error('Fin Chart Error'`
        
        const fixRegex = /ticks:\s*\{\s*callback:\s*v\s*=>\s*'\}\);[\s\S]*?(?=catch\(e\)\s*\{\s*console\.error\('Fin Chart Error')/;
        
        content = content.replace(fixRegex, `ticks: { callback: v => '$' + v + 'k', font: { weight: '600' } } }
                        }
                    }
                });
            }
        } `);
    }

    // 2. Fix opsChartInst `});});` syntax error
    content = content.replace(/opsChartInst\s*=\s*new\s*Chart\([^;]+;\}\);\s*\}\);/g, (match) => {
        return match.replace('});});', '});');
    });
    
    content = content.replace(/\}\);\s*\}\);\s*\}\s*catch\s*\(\s*e\s*\)\s*\{\s*console\.error\('Ops Chart Error'/g, 
        `}); } } catch (e) { console.error('Ops Chart Error'`);

    // Ensure the Light Theme per user request
    content = content.replace(/--bg: #f3f4f6;/g, '--bg: #f8fafc;'); // Clean light gray
    content = content.replace(/--surface: #ffffff;/g, '--surface: #ffffff;');
    content = content.replace(/background: #111827;/g, 'background: #ffffff;'); // Sidebar Light
    content = content.replace(/color: #ffffff;/g, 'color: #334155;'); // Sidebar Text Dark
    content = content.replace(/background: #1e293b;/g, 'background: #eff6ff;'); // Sidebar Active Light
    content = content.replace(/color: #9ca3af;/g, 'color: #64748b;'); // Sidebar inactive link
    content = content.replace(/\.logo-text\s*\{\s*font-family:\s*'Outfit',\s*sans-serif;\s*font-weight:\s*800;\s*font-size:\s*18px;\s*letter-spacing:\s*0\.5px;\s*\}/g,
        '.logo-text { font-family: "Outfit", sans-serif; font-weight: 800; font-size: 18px; letter-spacing: 0.5px; color: #1e293b; }');

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Fixed broken JS and applied Light Professional Theme.');
