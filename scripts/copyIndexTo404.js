const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexFile = path.join(distDir, 'index.html');
const notFoundFile = path.join(distDir, '404.html');

if (!fs.existsSync(distDir)) {
  console.error('dist directory not found. Run the build first.');
  process.exit(1);
}

if (!fs.existsSync(indexFile)) {
  console.error('index.html not found in dist. Build may have failed.');
  process.exit(1);
}

fs.copyFileSync(indexFile, notFoundFile);
console.log('Copied index.html to 404.html');
