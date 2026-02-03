const fs = require('fs');
const path = require('path');

function removeTypeScript(content) {
    let newContent = content;

    // Helper to remove balanced blocks (like interfaces)
    function removeBalancedBlock(text, startRegex) {
        let result = text;
        let maxIterations = 100; // Safety break

        while (maxIterations-- > 0) {
            const match = result.match(startRegex);
            if (!match) break;

            const startIndex = match.index;
            // Find the opening brace after the match
            const openBraceIndex = result.indexOf('{', startIndex);

            if (openBraceIndex === -1) {
                // No opening brace found after match, assume it's not a block we can handle or Malformed
                // Replace the keyword to avoid infinite matching
                // Only replace the first char of the match to invalidate it
                result = result.substring(0, startIndex) + "BROKEN_MACRO_" + result.substring(startIndex + "interface".length);
                continue;
            }

            // Count braces
            let depth = 1;
            let currentIndex = openBraceIndex + 1;
            let endFound = false;

            while (currentIndex < result.length) {
                const char = result[currentIndex];
                if (char === '{') depth++;
                else if (char === '}') depth--;

                if (depth === 0) {
                    endFound = true;
                    // Remove from startIndex to currentIndex + 1
                    // Also check if there's a trailing semicolon or newline to clean up
                    let endIndex = currentIndex + 1;
                    if (result[endIndex] === ';') endIndex++;

                    result = result.substring(0, startIndex) + result.substring(endIndex);
                    break;
                }
                currentIndex++;
            }

            if (!endFound) break; // Unbalanced
        }
        return result;
    }

    // 1. Remove interfaces: interface X { ... }
    newContent = removeBalancedBlock(newContent, /(export\s+)?interface\s+\w+(\s+extends\s+[^{]+)?\s*\{/);

    // 2. Remove types with object definitions: type X = { ... }
    newContent = removeBalancedBlock(newContent, /(export\s+)?type\s+\w+(\s*<[^>]+>)?\s*=\s*\{/);

    // 3. Remove types with intersection/union that end with semicolon: type X = A & B;
    // This is simple regex for single line or multi-line until semicolon
    // But be careful not to match code inside functions.
    // Assuming top-level types usually.
    newContent = newContent.replace(/(export\s+)?type\s+\w+(\s*<[^>]+>)?\s*=\s*[^;{]+;/g, '');

    // 4. Remove generic type arguments in function calls/definitions: <T>
    // Be careful with JSX element tags <div>.
    // Only remove <T> if it looks like a type param.
    // e.g. function<T>() or const x = <T>() =>
    // This is hard with regex. 

    // 5. Cleanup "extends React.Component..." in lines if leftover

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
            const cleaned = removeTypeScript(content);
            if (content !== cleaned) {
                fs.writeFileSync(fullPath, cleaned);
                console.log(`Cleaned: ${file}`);
            }
        }
    }
}

console.log('Starting advanced TypeScript cleanup...');
processDir(path.join(__dirname, 'src'));
console.log('Cleanup complete.');
