const fs = require('fs');
const files = fs.readdirSync('frontend').filter(f => f.endsWith('.html'));

for(const f of files) {
    let p = 'frontend/' + f;
    let c = fs.readFileSync(p, 'utf8');
    
    // Remove the bad script tags
    c = c.replace(/<script src="js\/logo-fix\.js"><\/script>\s*/g, '');
    c = c.replace(/<script src="\/js\/logo-fix\.js"><\/script>\s*/g, '');
    
    // Also, attendance.html and documents.html had their logos broken, let's fix them:
    if(f === 'attendance.html' || f === 'documents.html') {
        c = c.replace(
            /<div class="logo">[\s\S]*?<\/div>/,
            '<div class="logo"><img src="exologo.png" class="sidebar-logo" style="width:80px;height:80px;border-radius:8px;object-fit:contain;"/></div>'
        );
    }
    
    fs.writeFileSync(p, c);
}
console.log('Done!');
