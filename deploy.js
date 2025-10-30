const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing: ${command}`);
    return false;
  }
}

function deploy() {
  console.log('🚀 Iniciando deploy...');
  
  // 1. Build del proyecto
  console.log('📦 Construyendo proyecto...');
  if (!runCommand('npm run build')) {
    console.error('❌ Error en el build');
    process.exit(1);
  }
  
  const distPath = path.join(__dirname, 'dist');
  
  // 2. Verificar que existe la carpeta dist
  if (!fs.existsSync(distPath)) {
    console.error('❌ No se encontró la carpeta dist');
    process.exit(1);
  }
  
  console.log('🔄 Preparando deploy a GitHub Pages...');
  
  // 3. Configurar git en dist
  process.chdir(distPath);
  
  // Limpiar repositorio existente si existe
  if (fs.existsSync('.git')) {
    if (process.platform === 'win32') {
      runCommand('rmdir /s /q .git');
    } else {
      runCommand('rm -rf .git');
    }
  }
  
  // Inicializar nuevo repo
  runCommand('git init');
  runCommand('git add .');
  
  // Hacer commit solo si hay cambios
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
    console.log('ℹ️  No hay cambios para hacer commit');
  } catch (error) {
    // Hay cambios, hacer commit
    runCommand('git commit -m "Deploy FITI project to GitHub Pages"');
  }
  
  runCommand('git branch -M main');
  
  // Verificar si ya existe el remote
  try {
    execSync('git remote get-url origin', { stdio: 'pipe' });
    runCommand('git remote set-url origin https://github.com/Danielbddc-15/fiti-clon.git');
  } catch (error) {
    runCommand('git remote add origin https://github.com/Danielbddc-15/fiti-clon.git');
  }
  
  // 4. Push a gh-pages
  console.log('📤 Subiendo a GitHub Pages...');
  if (runCommand('git push -f origin main:gh-pages')) {
    console.log('✅ Deploy completado exitosamente!');
    console.log('🌐 Tu sitio estará disponible en: https://danielbddc-15.github.io/fiti-clon');
  } else {
    console.error('❌ Error en el push a GitHub');
    process.exit(1);
  }
  
  // 5. Volver a la carpeta principal
  process.chdir('..');
}

deploy();