const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.startsWith('dashboard') && f.endsWith('.html'));

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // Replace exactly '});});' with '});'
    content = content.replace(/\}\);\}\);/g, '});');
    
    // Some lines have `});});` with spaces inside
    content = content.replace(/\}\);\s*\}\);/g, '});');

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Fixed additional syntax errors.');
