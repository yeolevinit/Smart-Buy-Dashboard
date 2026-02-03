const fs = require('fs');
const path = require('path');

function fixOpacity(content) {
    // initial={{ opacity, ... }} -> initial={{ opacity: 0, ... }}
    // animate={{ opacity, ... }} -> animate={{ opacity: 1, ... }}
    // exit={{ opacity, ... }} -> exit={{ opacity: 0, ... }}

    let newContent = content;

    // Replace opacity shorthand in initial/exit props (usually 0)
    newContent = newContent.replace(/(initial|exit)=\{\{\s*opacity,/g, '$1={{ opacity: 0,');

    // Replace opacity shorthand in animate props (usually 1)
    newContent = newContent.replace(/animate=\{\{\s*opacity,/g, 'animate={{ opacity: 1,');

    // Handle cases without comma (end of object)
    // initial={{ opacity }} -> initial={{ opacity: 0 }}
    newContent = newContent.replace(/(initial|exit)=\{\{\s*opacity\s*\}\}/g, '$1={{ opacity: 0 }}');
    newContent = newContent.replace(/animate=\{\{\s*opacity\s*\}\}/g, 'animate={{ opacity: 1 }}');

    return newContent;
}

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules') processDir(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const fixed = fixOpacity(content);
            if (content !== fixed) {
                fs.writeFileSync(fullPath, fixed);
                console.log(`Fixed opacity in: ${file}`);
            }
        }
    }
}

console.log('Starting opacity fix...');
processDir(path.join(__dirname, 'src'));
console.log('Opacity fix complete.');
