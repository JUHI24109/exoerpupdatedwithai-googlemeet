const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.css'));

const slateTheme = {
    '--bg': '#f3f2f1',           // Microsoft Fluent UI canvas gray
    '--surface': '#ffffff',      // Pure white cards
    '--card-bg': '#ffffff',
    '--border': '#e1dfdd',       // Fluent UI faint border
    '--text': '#201f1e',         // Fluent almost black text
    '--text-main': '#201f1e',
    '--text-light': '#605e5c',   // Fluent muted text
    '--text-muted': '#605e5c',
    '--primary': '#0f172a',      // Dark Slate/Black for high-contrast enterprise look
    '--primary-light': '#e2e8f0', // Light slate background for active items
    '--accent': '#334155',       // Deep Charcoal Accent
    '--success': '#107c41',      // Keep success green
    '--danger': '#d13438',       // Keep danger red
    '--warning': '#fce100'       // Keep warning yellow
};

// Colors to replace from previous themes
const previousColors = [
    '#f0f2f5', '#242526', '#65676b', '#118dff', '#e6f3ff', '#005a9e', '#edeef2', // PowerBI Blue Theme
    '#fdf8f5', '#4e342e', '#795548', '#5d4037', '#efebe9', '#8d6e63', '#eaddd7'  // Beige/Brown Theme
];

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // Replace :root variables with exact new slate theme values
    for (const [key, val] of Object.entries(slateTheme)) {
        const regex = new RegExp(`(${key}\\s*:\\s*)(#[0-9a-fA-F]{3,6}|rgba?\\(.*?\\)|[a-zA-Z]+)(.*?;)`, 'g');
        content = content.replace(regex, `$1${val}$3`);
    }

    // Completely restyle the Sidebar for the ultimate executive Power BI look (Dark Sidebar)
    // Find sidebar CSS rule and make it dark slate
    content = content.replace(/#sidebar\s*\{[^}]+\}/g, 
        '#sidebar { width: 220px; background: #111827; border-right: none; display: flex; flex-direction: column; flex-shrink: 0; color: #ffffff; }');
    
    // Sidebar items and logo colors
    content = content.replace(/\.logo\s*\{[^}]+\}/g, 
        '.logo { height: 60px; padding: 0 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #1f2937; }');
    content = content.replace(/\.logo-icon\s*\{[^}]+\}/g, 
        '.logo-icon { width: 30px; height: 30px; background: #374151; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; }');
    content = content.replace(/\.logo-text\s*\{[^}]+\}/g, 
        '.logo-text { font-weight: 700; font-size: 15px; color: #ffffff; }');
    
    // Nav items in dark sidebar
    content = content.replace(/\.nav-item\s*\{[^}]+\}/g, 
        '.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 4px; color: #9ca3af; text-decoration: none; font-weight: 500; transition: 0.2s; }');
    content = content.replace(/\.nav-item:hover\s*\{[^}]+\}/g, 
        '.nav-item:hover { background: #1f2937; color: #ffffff; }');
    content = content.replace(/\.nav-item\.active\s*\{[^}]+\}/g, 
        '.nav-item.active { background: #374151; color: #ffffff; border-left: 3px solid #e2e8f0; }');

    // Make Top Navbar crisp
    content = content.replace(/\.topbar\s*\{[^}]+\}/g, 
        '.topbar { height: 60px; background: #ffffff; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }');
    content = content.replace(/\.search\s*\{[^}]+\}/g, 
        '.search { display: flex; align-items: center; background: #f3f2f1; padding: 6px 14px; border-radius: 4px; width: 250px; border: 1px solid #e1dfdd; }');

    // Cards and KPI Blocks
    content = content.replace(/\.card\s*\{[^}]+\}/g, 
        '.card { background: var(--surface); border: 1px solid var(--border); border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; min-height: 0; }');
    
    // KPI exact styling
    content = content.replace(/\.kpi-card\s*\{[^}]+\}/g, 
        '.kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 2px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-top: 3px solid var(--primary); }');

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Ultra Professional Slate Theme Applied.');
