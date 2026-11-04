const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.css'));

const themeMap = {
    '--bg': '#fdf8f5',
    '--surface': '#ffffff',
    '--card-bg': '#ffffff',
    '--border': '#eaddd7',
    '--text': '#4e342e',
    '--text-main': '#4e342e',
    '--text-light': '#795548',
    '--text-muted': '#795548',
    '--primary': '#5d4037',
    '--primary-light': '#efebe9',
    '--accent': '#8d6e63'
};

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    
    // Replace hex colors and rgb/rgba in variables
    for (const [key, val] of Object.entries(themeMap)) {
        const regex = new RegExp(`(${key}\\s*:\\s*)(#[0-9a-fA-F]{3,6}|rgba?\\(.*?\\)|[a-zA-Z]+)(.*?;)`, 'g');
        content = content.replace(regex, `$1${val}$3`);
    }

    // Special handling for hardcoded backgrounds if any that were primary/accent
    // specifically for the sidebar which uses a hardcoded background in some pages
    content = content.replace(/background:\s*linear-gradient\(135deg,\s*#3b82f6,\s*#8b5cf6\)/g, `background: linear-gradient(135deg, #5d4037, #8d6e63)`);
    content = content.replace(/background:\s*#0f172a;/g, `background: #3e2723;`);
    content = content.replace(/background:\s*linear-gradient\(135deg,\s*#1e293b\s*0%,\s*#0f172a\s*100%\)/g, `background: linear-gradient(135deg, #4e342e 0%, #3e2723 100%)`);

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Theme applied successfully.');
