# TypeScript to JavaScript Conversion Script
# This script converts .ts and .tsx files to .js and .jsx

$frontendPath = "d:\Smart Buy Dashboard\ctai-ctd-hacks\frontend"

Write-Host "Starting TypeScript to JavaScript conversion..." -ForegroundColor Green

# Get all TypeScript files (excluding node_modules)
$tsFiles = Get-ChildItem -Path "$frontendPath\src" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notmatch "node_modules" }

Write-Host "Found $($tsFiles.Count) TypeScript files to convert" -ForegroundColor Cyan

foreach ($file in $tsFiles) {
    $content = Get-Content $file.FullName -Raw
    $newExtension = if ($file.Extension -eq ".tsx") { ".jsx" } else { ".js" }
    $newPath = $file.FullName -replace "\.(tsx?)", $newExtension
    
    # Remove TypeScript-specific syntax
    # 1. Remove interface declarations
    $content = $content -replace "(?ms)^interface\s+\w+\s*\{[^}]*\}\s*$", ""
    
    # 2. Remove type annotations from function parameters and return types
    $content = $content -replace ":\s*\w+(\[\])?(\s*\|\s*\w+)*(?=\s*[,\)\{=])", ""
    
    # 3. Remove generic type parameters
    $content = $content -replace "<[^>]+>(?=\()", ""
    
    # 4. Remove 'as const' assertions
    $content = $content -replace "\s+as\s+const", ""
    
    # 5. Remove non-null assertions (!)
    $content = $content -replace "!\.","."
    $content = $content -replace "!\)",")"
    
    # 6. Update imports to use .jsx instead of .tsx
    $content = $content -replace "from\s+['""](.*)\.tsx['""]", "from '$1.jsx'"
    $content = $content -replace "from\s+['""](.*)\.ts['""]", "from '$1.js'"
    
    # Write to new file
    Set-Content -Path $newPath -Value $content
    
    Write-Host "Converted: $($file.Name) -> $(Split-Path $newPath -Leaf)" -ForegroundColor Yellow
}

Write-Host "`nConversion complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Delete original .ts and .tsx files" -ForegroundColor White
Write-Host "2. Update package.json to remove TypeScript dependencies" -ForegroundColor White
Write-Host "3. Convert vite.config.ts to vite.config.js" -ForegroundColor White
Write-Host "4. Run 'npm install' to update dependencies" -ForegroundColor White
