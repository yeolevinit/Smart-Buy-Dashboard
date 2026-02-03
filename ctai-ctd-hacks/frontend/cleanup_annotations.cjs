const fs = require('fs');
const path = require('path');

function removeAnnotations(content) {
    let newContent = content;

    // 1. Remove (e: React.FormEvent) -> (e)
    // Matches: (arg: Type) inside parens
    // We replace ": Type" with empty string
    // Type can contain dots, <>, [], |
    // e.g. React.FormEvent, React.KeyboardEvent<HTMLDivElement>, Omit<Project, ...>

    // Regex strategy: Look for argument definitions in functions
    // It's hard to parse perfectly with regex, but we can target specific patterns found.

    // Pattern: arg: React.Something
    newContent = newContent.replace(/:\s*React\.[a-zA-Z0-9_]+(<[^>]+>)?/g, '');

    // Pattern: arg: Omit<...> or other generic types
    // This is tricky because of nested <>.
    // But we found Omit<Project, 'id' | 'createdAt' | 'timeline' | 'isPredicted'>
    // We can try to remove matching balanced <> blocks starting with :

    // Simple approach for known issues:
    // Remove : Omit<...>
    // Greedy match until )? No, that consumes closing paren.
    // Match : Type up to , or ) or =
    // Type including <...>

    // Let's use the brace balancing approach for <...> if possible, 
    // or just target the specific ones found.

    // 1. Remove React.* types
    // Already covered above approximately.

    // 2. Remove Omit<...> and similar
    // We can try matching : \w+<...> 
    // But matching the closing > is hard if nested.
    // However, the specific error in Dashboard.jsx is : Omit<...>
    newContent = newContent.replace(/:\s*Omit<[^>]+>/g, '');
    // Note: This only handles 1 level of <>. The example had nested?
    // <Project, ...> - yes.

    // Let's try a more aggressive "remove type annotation" in function args
    // Identifier followed by colon, then stuff, then comma or closing paren.
    // CAREFUL: Object literals { key: value } also match ": value".
    // We must ensure we are in a function argument list.
    // This is hard.

    // Better: Target specific failures found by grep.

    // React types
    newContent = newContent.replace(/:\s*React\.[a-zA-Z0-9_\.]+(<[a-zA-Z0-9_\.]+>)?/g, '');

    // Omit pattern in Dashboard.jsx
    // : Omit<Project, 'id' | 'createdAt' | 'timeline' | 'isPredicted'>
    // We can blindly replace this specific string if we want, or use regex
    newContent = newContent.replace(/:\s*Omit<[^>]+>/g, '');

    // Also "updated from finalized vendors" comment might trigger? No.

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
            let content = fs.readFileSync(fullPath, 'utf8');

            // Apply specific fixes
            let fixed = content;

            // Fix React.FormEvent etc
            fixed = fixed.replace(/:\s*React\.[a-zA-Z0-9_\.]+(<[^>]+>)?/g, '');

            // Fix Omit<...> (simple)
            fixed = fixed.replace(/:\s*Omit<[^>]+>/g, '');

            // Fix single word types (e.g. : string) again just in case
            // CAREFUL with object literals.
            // Only do it inside ( ... ) ?

            if (content !== fixed) {
                fs.writeFileSync(fullPath, fixed);
                console.log(`Removed annotations in: ${file}`);
            }
        }
    }
}

console.log('Starting annotation cleanup...');
processDir(path.join(__dirname, 'src'));
console.log('Annotation cleanup complete.');
