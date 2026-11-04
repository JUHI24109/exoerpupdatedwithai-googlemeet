const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    const lines = content.split('\n');
    const newLines = lines.filter(line => {
        if (line.includes('analytics.html')) return false;
        if (line.includes('payroll.html')) return false;
        if (line.includes('profile.html?edit=calendar')) return false;
        if (line.includes('Calendar Sync Email')) return false;
        if (line.includes('Calendar Provider')) return false;
        if (line.includes('name="calendarEmail"')) return false;
        if (line.includes('name="calendarProvider"')) return false;
        // Removing specific calendar dashboard fetches to prevent 404 errors in console
        if (line.includes('fetch(\'/api/calendar/my-events\'')) return false;
        return true;
    });
    
    fs.writeFileSync(path.join(dir, file), newLines.join('\n'), 'utf8');
});

console.log("Cleanup completed.");
