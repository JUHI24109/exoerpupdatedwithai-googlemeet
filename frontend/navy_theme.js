const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');

// Define our navy theme colors
const theme = {
    '--bg': '#ffffff',
    '--surface': '#f3f4f6',
    '--card-bg': '#f3f4f6',
    '--primary': '#011638',      // Extremely dark navy blue
    '--primary-dark': '#000c20', // Almost black navy blue
    '--primary-light': '#e2e8f0',
    '--accent': '#2563eb',       // Blue accent
    '--text': '#111827',
    '--text-main': '#111827',
    '--text-light': '#6b7280',
    '--text-muted': '#6b7280'
};

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Remove Tasks from Nav
    // We can just find the Tasks line and delete it
    content = content.replace(/<a href="tasks\.html"[^>]*>[\s\S]*?<\/a>\s*/g, '');

    // 2. Update CSS Root Variables
    for (const [key, val] of Object.entries(theme)) {
        const regex = new RegExp(`(${key}\\s*:\\s*)(#[0-9a-fA-F]{3,6}|rgba?\\(.*?\\)|[a-zA-Z]+)(.*?;)`, 'g');
        content = content.replace(regex, `$1${val}$3`);
    }

    // 3. Update the Sidebar Background
    // Sidebars typically use either #ffffff, #111827, #f8f9fa
    // We want var(--primary) and white text
    content = content.replace(/#(sidebar|sidebarContainer)\s*\{([^}]*?)background:\s*(var\(--primary\)|#[0-9a-fA-F]{3,6}|rgba?[^;]+)([^}]*?)\}/gi, (match, p1, p2, p3, p4) => {
        let inside = p2 + 'background: var(--primary)' + p4;
        // Make sure text is white
        if (inside.includes('color:')) {
            inside = inside.replace(/color:\s*(#[0-9a-fA-F]{3,6}|rgba?[^;]+)/i, 'color: #ffffff');
        } else {
            inside += ' color: #ffffff;';
        }
        return `#${p1} {${inside}}`;
    });

    // 4. Update `.sb-header` or `.logo` borders if any
    content = content.replace(/border-bottom:\s*1px solid\s*#[0-9a-fA-F]{3,6}/g, 'border-bottom: 1px solid rgba(255,255,255,0.1)');

    // 5. Update nav-link/nav-item colors
    content = content.replace(/\.nav-link\s*\{([^}]*?)color:\s*[^;]+([^}]*?)\}/g, '.nav-link {$1color: rgba(255,255,255,0.7)$2}');
    content = content.replace(/\.nav-item\s*\{([^}]*?)color:\s*[^;]+([^}]*?)\}/g, '.nav-item {$1color: rgba(255,255,255,0.7)$2}');

    // 6. Update hover states
    content = content.replace(/\.nav-link:hover,\s*\.nav-link\.active\s*\{([^}]*?)\}/g, '.nav-link:hover, .nav-link.active { background: rgba(255,255,255,0.1); color: #ffffff; }');
    content = content.replace(/\.nav-item:hover,\s*\.nav-item\.active\s*\{([^}]*?)\}/g, '.nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: #ffffff; }');
    
    // In employees.html there's a specific nav-link.active rule
    content = content.replace(/\.nav-link\.active\s*\{\s*background:[^}]+box-shadow:[^}]+\}/g, '.nav-link.active { background: rgba(255,255,255,0.1); color: #ffffff; box-shadow: inset 3px 0 0 #3b82f6; }');

    // Make logo text white inside sidebar
    content = content.replace(/\.logo-text\s*\{([^}]*?)color:\s*[^;]+([^}]*?)\}/g, '.logo-text {$1color: #ffffff$2}');

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Navy Blue & White Theme Applied! Tasks removed.');
