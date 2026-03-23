const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDirs = [
    path.join(__dirname, 'app', 'dashboard'),
    path.join(__dirname, 'components')
];

let filesModified = 0;

targetDirs.forEach(targetDir => {
    walkDir(targetDir, function (filePath) {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            // Replacing specific static color classes with dynamic primary
            content = content.replace(/blue-([0-9]{2,3})/g, 'primary-$1');
            content = content.replace(/indigo-([0-9]{2,3})/g, 'primary-$1');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated: ${filePath}`);
                filesModified++;
            }
        }
    });
});
console.log(`Done. ${filesModified} files modified.`);
