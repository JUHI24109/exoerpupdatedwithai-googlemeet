const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.css'));

const powerBITheme = {
    '--bg': '#f0f2f5',           // Standard Power BI canvas background
    '--surface': '#ffffff',      // Crisp white cards
    '--card-bg': '#ffffff',
    '--border': '#edeef2',       // Faint gray borders
    '--text': '#242526',         // Dark grey text
    '--text-main': '#242526',
    '--text-light': '#65676b',   // Muted grey text
    '--text-muted': '#65676b',
    '--primary': '#118dff',      // Power BI standard blue accent
    '--primary-light': '#e6f3ff', // Light blue background
    '--accent': '#005a9e',       // Darker blue
    '--success': '#107c41',      // Microsoft Excel/Success Green
    '--danger': '#d13438',       // Microsoft Red
    '--warning': '#fce100'       // Microsoft Yellow
};

// Reversing previous exact values from theme.js map
const oldThemeMap = {
    '#fdf8f5': '--bg',
    '#4e342e': '--text',
    '#795548': '--text-light',
    '#5d4037': '--primary',
    '#efebe9': '--primary-light',
    '#8d6e63': '--accent',
    '#eaddd7': '--border'
};

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    
    // First, let's aggressively replace the hex codes used in the previous script back to Power BI ones 
    // where they match the old map. This handles anywhere the color was hardcoded.
    for (const [oldHex, varName] of Object.entries(oldThemeMap)) {
        const regex = new RegExp(oldHex, 'gi');
        content = content.replace(regex, powerBITheme[varName]);
    }

    // Now correctly assign the root variables.
    for (const [key, val] of Object.entries(powerBITheme)) {
        const regex = new RegExp(`(${key}\\s*:\\s*)(#[0-9a-fA-F]{3,6}|rgba?\\(.*?\\)|[a-zA-Z]+)(.*?;)`, 'g');
        content = content.replace(regex, `$1${val}$3`);
    }

    // Replace the hardcoded sidebars/gradients from brown back to a clean corporate gradient
    // Power BI desktop usually has a solid crisp sidebar, let's use a deep navy gradient
    content = content.replace(/background:\s*linear-gradient\(135deg,\s*#5d4037,\s*#8d6e63\)/g, `background: linear-gradient(135deg, #005a9e, #118dff)`);
    content = content.replace(/background:\s*#3e2723;/g, `background: #f8f9fa;`);
    content = content.replace(/background:\s*linear-gradient\(135deg,\s*#4e342e\s*0%,\s*#3e2723\s*100%\)/g, `background: linear-gradient(135deg, #111827 0%, #1f2937 100%)`);
    
    // UI layout touches for Power BI desktop
    // Power BI Desktop has sharp corners or very slight radii
    content = content.replace(/border-radius:\s*12px/g, 'border-radius: 4px');
    content = content.replace(/border-radius:\s*10px/g, 'border-radius: 4px');
    content = content.replace(/border-radius:\s*8px/g, 'border-radius: 4px');
    content = content.replace(/border-radius:\s*20px/g, 'border-radius: 16px'); // for search bar pill

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Power BI Corporate Desktop Theme Applied.');
