import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Critical files that must exist in the build
const CRITICAL_FILES = [
  'favicon.ico',
  'portella-logo.jpg',
  'orkadia-logo.jpg'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkDistExists() {
  const distPath = join(__dirname, '..', 'dist');
  
  if (!existsSync(distPath)) {
    log('❌ ERROR: dist directory does not exist', colors.red);
    log('   Run "npm run build" first', colors.yellow);
    return false;
  }
  
  log('✓ dist directory exists', colors.green);
  return true;
}

function checkCriticalFiles() {
  const distPath = join(__dirname, '..', 'dist');
  let allFilesExist = true;
  
  log('\nChecking critical files:', colors.blue);
  
  for (const file of CRITICAL_FILES) {
    const filePath = join(distPath, file);
    
    if (existsSync(filePath)) {
      log(`  ✓ ${file} exists`, colors.green);
    } else {
      log(`  ❌ ${file} is missing`, colors.red);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = join(dirPath, file);
    
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

function checkDistNotEmpty() {
  const distPath = join(__dirname, '..', 'dist');
  const files = getAllFiles(distPath);
  
  if (files.length === 0) {
    log('❌ ERROR: dist directory is empty', colors.red);
    return false;
  }
  
  log(`✓ dist directory contains ${files.length} files`, colors.green);
  return true;
}

export function extractHtmlReferences(htmlContent) {
  const references = [];
  
  // Extract src attributes
  const srcRegex = /\bsrc=["']([^"']+)["']/g;
  let match;
  while ((match = srcRegex.exec(htmlContent)) !== null) {
    references.push(match[1]);
  }
  
  // Extract href attributes
  const hrefRegex = /\bhref=["']([^"']+)["']/g;
  while ((match = hrefRegex.exec(htmlContent)) !== null) {
    const href = match[1];
    // Skip external URLs and anchors
    if (!href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      references.push(href);
    }
  }
  
  // Extract content attributes from meta tags (for og:image, twitter:image, etc.)
  const contentRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/g;
  while ((match = contentRegex.exec(htmlContent)) !== null) {
    references.push(match[1]);
  }
  
  const twitterImageRegex = /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/g;
  while ((match = twitterImageRegex.exec(htmlContent)) !== null) {
    references.push(match[1]);
  }
  
  return references;
}

function checkHtmlReferences() {
  const distPath = join(__dirname, '..', 'dist');
  const indexPath = join(distPath, 'index.html');
  
  log('\nChecking HTML references:', colors.blue);
  
  if (!existsSync(indexPath)) {
    log('  ❌ index.html not found in dist', colors.red);
    return false;
  }
  
  const htmlContent = readFileSync(indexPath, 'utf-8');
  const references = extractHtmlReferences(htmlContent);
  
  if (references.length === 0) {
    log('  ⚠ No references found in index.html', colors.yellow);
    return true;
  }
  
  let allReferencesExist = true;
  
  for (const ref of references) {
    // Remove leading slash and query parameters
    const cleanRef = ref.replace(/^\//, '').split('?')[0];
    
    if (!cleanRef) continue; // Skip empty references
    
    const refPath = join(distPath, cleanRef);
    
    if (existsSync(refPath)) {
      log(`  ✓ ${cleanRef}`, colors.green);
    } else {
      log(`  ❌ ${cleanRef} is missing`, colors.red);
      allReferencesExist = false;
    }
  }
  
  return allReferencesExist;
}

export function getPublicFiles(publicPath) {
  if (!existsSync(publicPath)) {
    return [];
  }
  
  const files = [];
  
  function traverse(dirPath, relativePath = '') {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const relPath = relativePath ? join(relativePath, entry) : entry;
      
      if (statSync(fullPath).isDirectory()) {
        traverse(fullPath, relPath);
      } else {
        files.push(relPath);
      }
    }
  }
  
  traverse(publicPath);
  return files;
}

function checkPublicAssetsCompleteness() {
  const publicPath = join(__dirname, '..', 'public');
  const distPath = join(__dirname, '..', 'dist');
  
  log('\nChecking public assets completeness:', colors.blue);
  
  if (!existsSync(publicPath)) {
    log('  ⚠ public directory does not exist', colors.yellow);
    return true;
  }
  
  const publicFiles = getPublicFiles(publicPath);
  
  if (publicFiles.length === 0) {
    log('  ⚠ No files found in public directory', colors.yellow);
    return true;
  }
  
  let hasWarnings = false;
  
  for (const file of publicFiles) {
    const distFilePath = join(distPath, file);
    
    if (existsSync(distFilePath)) {
      log(`  ✓ ${file}`, colors.green);
    } else {
      log(`  ⚠ ${file} is missing from dist`, colors.yellow);
      hasWarnings = true;
    }
  }
  
  // Return true even with warnings - this is not a critical failure
  return true;
}

function validateBuild() {
  log('='.repeat(50), colors.blue);
  log('Build Validation', colors.blue);
  log('='.repeat(50), colors.blue);
  
  // Check if dist exists first - if not, skip other checks
  const distExists = checkDistExists();
  if (!distExists) {
    log('\n' + '='.repeat(50), colors.blue);
    log('❌ Validation failed - dist directory missing', colors.red);
    log('='.repeat(50), colors.blue);
    process.exit(1);
  }
  
  const checks = [
    checkDistNotEmpty(),
    checkCriticalFiles(),
    checkHtmlReferences(),
    checkPublicAssetsCompleteness()
  ];
  
  const allPassed = checks.every(check => check);
  
  log('\n' + '='.repeat(50), colors.blue);
  
  if (allPassed) {
    log('✓ All validation checks passed!', colors.green);
    log('='.repeat(50), colors.blue);
    process.exit(0);
  } else {
    log('❌ Some validation checks failed', colors.red);
    log('='.repeat(50), colors.blue);
    process.exit(1);
  }
}

// Run validation only if this is the main module
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  validateBuild();
}
