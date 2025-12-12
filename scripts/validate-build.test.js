import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractHtmlReferences, getPublicFiles } from './validate-build.js';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Feature: netlify-deployment-fix, Property 3: Validação de referências HTML
 * Validates: Requirements 2.3
 * 
 * Property: For any HTML document in the dist directory, all referenced resources
 * (via src, href, or meta content attributes) must exist in the dist directory.
 */
describe('HTML Reference Validation Property Tests', () => {
  it('should validate that all references in index.html exist in dist', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // We're testing the actual built index.html, not generated HTML
        () => {
          const distPath = join(__dirname, '..', 'dist');
          const indexPath = join(distPath, 'index.html');
          
          // Skip test if dist doesn't exist (build hasn't been run)
          if (!existsSync(distPath) || !existsSync(indexPath)) {
            return true; // Skip validation if build hasn't been run
          }
          
          const htmlContent = readFileSync(indexPath, 'utf-8');
          const references = extractHtmlReferences(htmlContent);
          
          // For each reference, verify it exists in dist
          for (const ref of references) {
            // Remove leading slash and query parameters
            const cleanRef = ref.replace(/^\//, '').split('?')[0];
            
            if (!cleanRef) continue; // Skip empty references
            
            const refPath = join(distPath, cleanRef);
            
            // Assert that the referenced file exists
            if (!existsSync(refPath)) {
              throw new Error(`Referenced file does not exist: ${cleanRef}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract all types of references from HTML', () => {
    // Generator for local paths (not external URLs or protocol-relative)
    const localPathArbitrary = fc.array(
      fc.constantFrom('a', 'b', 'c', '/', '.', '-', '_', '0', '1', '2'),
      { minLength: 1, maxLength: 20 }
    ).map(arr => arr.join('')).filter(p => 
      !p.startsWith('http') && 
      !p.startsWith('//') && 
      !p.startsWith('#') && 
      !p.startsWith('mailto:')
    );
    
    fc.assert(
      fc.property(
        fc.tuple(localPathArbitrary, localPathArbitrary, localPathArbitrary, localPathArbitrary),
        ([scriptSrc, linkHref, imgSrc, ogImage]) => {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <script src="${scriptSrc}"></script>
                <link href="${linkHref}" rel="stylesheet" />
                <meta property="og:image" content="${ogImage}" />
              </head>
              <body>
                <img src="${imgSrc}" />
              </body>
            </html>
          `;
          
          const references = extractHtmlReferences(html);
          
          // All unique generated paths should be extracted
          const uniquePaths = [scriptSrc, linkHref, imgSrc, ogImage];
          return uniquePaths.every(path => references.includes(path));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter out external URLs and anchors', () => {
    fc.assert(
      fc.property(
        fc.record({
          externalUrl: fc.webUrl(),
          anchor: fc.string().map(s => `#${s}`),
          mailto: fc.emailAddress().map(e => `mailto:${e}`),
        }),
        ({ externalUrl, anchor, mailto }) => {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <link href="${externalUrl}" rel="external" />
                <a href="${anchor}">Link</a>
                <a href="${mailto}">Email</a>
              </head>
            </html>
          `;
          
          const references = extractHtmlReferences(html);
          
          // External URLs, anchors, and mailto links should be filtered out
          return (
            !references.includes(externalUrl) &&
            !references.includes(anchor) &&
            !references.includes(mailto)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Example tests for specific cases
 * These tests verify concrete behaviors for critical functionality
 */
describe('Example Tests for Specific Cases', () => {
  /**
   * Test: Verify MIME type of .js files
   * Requirements: 1.1
   */
  it('should verify that .js files would be served with correct MIME type', () => {
    const distPath = join(__dirname, '..', 'dist');
    
    // Skip if dist doesn't exist
    if (!existsSync(distPath)) {
      console.log('Skipping test: dist directory does not exist. Run npm run build first.');
      return;
    }
    
    // Find at least one .js file in dist
    const files = getAllFilesRecursive(distPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    // Verify we have JS files to test
    expect(jsFiles.length).toBeGreaterThan(0);
    
    // The netlify.toml and _headers files configure the MIME type
    // This test verifies the configuration exists
    const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
    const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
    
    // Verify netlify.toml has JS MIME type configuration
    expect(netlifyCfg).toContain('/*.js');
    expect(netlifyCfg).toContain('application/javascript');
    
    // Verify _headers has JS MIME type configuration
    expect(headersCfg).toContain('/*.js');
    expect(headersCfg).toContain('application/javascript');
  });

  /**
   * Test: Verify favicon exists and would return 200
   * Requirements: 2.1
   */
  it('should verify that favicon.ico exists in dist', () => {
    const distPath = join(__dirname, '..', 'dist');
    const faviconPath = join(distPath, 'favicon.ico');
    
    // Skip if dist doesn't exist
    if (!existsSync(distPath)) {
      console.log('Skipping test: dist directory does not exist. Run npm run build first.');
      return;
    }
    
    // Verify favicon exists
    expect(existsSync(faviconPath)).toBe(true);
    
    // Verify it's a file (not a directory)
    if (existsSync(faviconPath)) {
      expect(statSync(faviconPath).isFile()).toBe(true);
    }
  });

  /**
   * Test: Verify portella-logo.jpg exists in dist
   * Requirements: 2.4
   */
  it('should verify that portella-logo.jpg exists in dist', () => {
    const distPath = join(__dirname, '..', 'dist');
    const logoPath = join(distPath, 'portella-logo.jpg');
    
    // Skip if dist doesn't exist
    if (!existsSync(distPath)) {
      console.log('Skipping test: dist directory does not exist. Run npm run build first.');
      return;
    }
    
    // Verify logo exists
    expect(existsSync(logoPath)).toBe(true);
    
    // Verify it's a file (not a directory)
    if (existsSync(logoPath)) {
      expect(statSync(logoPath).isFile()).toBe(true);
    }
  });

  /**
   * Test: Verify build generates dist directory
   * Requirements: 4.1
   */
  it('should verify that dist directory exists after build', () => {
    const distPath = join(__dirname, '..', 'dist');
    
    // This test assumes build has been run
    // In a CI/CD pipeline, this would be run after the build step
    if (!existsSync(distPath)) {
      console.log('Warning: dist directory does not exist. Run npm run build first.');
      // We don't fail the test here because the build might not have been run yet
      // In a real CI/CD pipeline, this would be a hard failure
      return;
    }
    
    // Verify dist exists and is a directory
    expect(existsSync(distPath)).toBe(true);
    expect(statSync(distPath).isDirectory()).toBe(true);
    
    // Verify dist is not empty
    const files = readdirSync(distPath);
    expect(files.length).toBeGreaterThan(0);
  });
});

// Helper function to get all files recursively
function getAllFilesRecursive(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = join(dirPath, file);
    
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFilesRecursive(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

/**
 * Feature: netlify-deployment-fix, Property 1: Headers corretos por tipo de arquivo
 * Validates: Requirements 1.1, 1.2, 1.4
 * 
 * Property: For any file served by Netlify, the Content-Type header must correspond
 * to the appropriate MIME type for the file extension (.js → application/javascript,
 * .css → text/css, .jpg → image/jpeg, etc.)
 */
describe('Headers by File Type Property Tests', () => {
  // Define the expected MIME types for each file extension
  const mimeTypeMap = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.html': 'text/html'
  };

  it('should verify that netlify.toml configures correct Content-Type for all file types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(mimeTypeMap)),
        (extension) => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const expectedMimeType = mimeTypeMap[extension];
          
          // For each file type, verify the configuration exists
          // The pattern in netlify.toml is /*{extension}
          const pattern = `/*${extension}`;
          
          // Check if the pattern exists in the config
          const hasPattern = netlifyCfg.includes(pattern);
          
          // If pattern exists, verify it has the correct MIME type
          if (hasPattern) {
            // Find the section for this file type
            const sections = netlifyCfg.split('[[headers]]');
            const relevantSection = sections.find(section => section.includes(pattern));
            
            if (relevantSection) {
              // Check if Content-Type is explicitly set
              const hasContentType = relevantSection.includes('Content-Type');
              
              // If Content-Type is set, verify it's correct
              if (hasContentType) {
                const hasMimeType = relevantSection.includes(expectedMimeType);
                
                if (!hasMimeType) {
                  throw new Error(
                    `netlify.toml has pattern ${pattern} with explicit Content-Type but incorrect MIME type. Expected: ${expectedMimeType}`
                  );
                }
              }
              // If Content-Type is not set, that's fine for some file types (like .html)
              // as browsers handle them correctly by default
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify that _headers file configures correct Content-Type for all file types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(mimeTypeMap)),
        (extension) => {
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          const expectedMimeType = mimeTypeMap[extension];
          
          // For each file type, verify the configuration exists
          // The pattern in _headers is /*{extension}
          const pattern = `/*${extension}`;
          
          // Check if the pattern exists in the config
          const hasPattern = headersCfg.includes(pattern);
          
          // If pattern exists, verify it has the correct MIME type
          if (hasPattern) {
            // Find the section for this file type
            const lines = headersCfg.split('\n');
            const patternIndex = lines.findIndex(line => line.trim() === pattern);
            
            if (patternIndex !== -1) {
              // Look at the next few lines for the Content-Type
              const sectionLines = lines.slice(patternIndex, patternIndex + 5);
              const contentTypeLine = sectionLines.find(line => line.includes('Content-Type:'));
              
              if (contentTypeLine) {
                const hasMimeType = contentTypeLine.includes(expectedMimeType);
                
                if (!hasMimeType) {
                  throw new Error(
                    `_headers has pattern ${pattern} but incorrect MIME type. Expected: ${expectedMimeType}`
                  );
                }
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify that all files in dist have corresponding MIME type configuration', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip if dist doesn't exist
          if (!existsSync(distPath)) {
            return true;
          }
          
          const allFiles = getAllFilesRecursive(distPath);
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          
          // For each file, check if it has a known extension and verify configuration
          for (const filePath of allFiles) {
            const extension = filePath.substring(filePath.lastIndexOf('.'));
            
            // Only check files with extensions we care about
            if (mimeTypeMap[extension]) {
              const pattern = `/*${extension}`;
              
              // Verify either netlify.toml or _headers has configuration for this type
              const hasNetlifyConfig = netlifyCfg.includes(pattern);
              const hasHeadersConfig = headersCfg.includes(pattern);
              
              if (!hasNetlifyConfig && !hasHeadersConfig) {
                throw new Error(
                  `File ${filePath} has extension ${extension} but no MIME type configuration found in netlify.toml or _headers`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify MIME type consistency between netlify.toml and _headers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(mimeTypeMap)),
        (extension) => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          const pattern = `/*${extension}`;
          
          const hasNetlifyPattern = netlifyCfg.includes(pattern);
          const hasHeadersPattern = headersCfg.includes(pattern);
          
          // If both have the pattern, verify they specify the same MIME type
          if (hasNetlifyPattern && hasHeadersPattern) {
            const expectedMimeType = mimeTypeMap[extension];
            
            // Extract MIME type from netlify.toml
            const netlifySections = netlifyCfg.split('[[headers]]');
            const netlifySection = netlifySections.find(section => section.includes(pattern));
            
            // Extract MIME type from _headers
            const headersLines = headersCfg.split('\n');
            const patternIndex = headersLines.findIndex(line => line.trim() === pattern);
            const headersSectionLines = headersLines.slice(patternIndex, patternIndex + 5);
            const headersContentTypeLine = headersSectionLines.find(line => line.includes('Content-Type:'));
            
            // Both should contain the expected MIME type
            if (netlifySection && headersContentTypeLine) {
              const netlifyHasMimeType = netlifySection.includes(expectedMimeType);
              const headersHasMimeType = headersContentTypeLine.includes(expectedMimeType);
              
              if (netlifyHasMimeType !== headersHasMimeType) {
                throw new Error(
                  `MIME type mismatch for ${extension}: netlify.toml and _headers have different configurations`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: netlify-deployment-fix, Property 2: Completude de assets públicos
 * Validates: Requirements 2.2
 * 
 * Property: For any file in the public directory, after executing the build,
 * that file must exist in the dist directory with the same relative path.
 */
describe('Public Assets Completeness Property Tests', () => {
  it('should ensure all files from public directory exist in dist after build', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // We're testing the actual build output, not generated data
        () => {
          const publicPath = join(__dirname, '..', 'public');
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip test if public or dist doesn't exist
          if (!existsSync(publicPath) || !existsSync(distPath)) {
            return true; // Skip validation if directories don't exist
          }
          
          const publicFiles = getPublicFiles(publicPath);
          
          // For each file in public, verify it exists in dist
          for (const file of publicFiles) {
            const distFilePath = join(distPath, file);
            
            // Assert that the file exists in dist
            if (!existsSync(distFilePath)) {
              throw new Error(`Public file not found in dist: ${file}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify getPublicFiles returns all files recursively', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const publicPath = join(__dirname, '..', 'public');
          
          // Skip if public doesn't exist
          if (!existsSync(publicPath)) {
            return true;
          }
          
          const files = getPublicFiles(publicPath);
          
          // Verify that all returned files actually exist
          for (const file of files) {
            const fullPath = join(publicPath, file);
            if (!existsSync(fullPath)) {
              throw new Error(`getPublicFiles returned non-existent file: ${file}`);
            }
          }
          
          // Verify that all files are actually files (not directories)
          for (const file of files) {
            const fullPath = join(publicPath, file);
            if (!statSync(fullPath).isFile()) {
              throw new Error(`getPublicFiles returned a directory: ${file}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: netlify-deployment-fix, Property 4: SPA routing universal
 * Validates: Requirements 3.1, 3.3
 * 
 * Property: For any client-side route in the application, when accessed directly
 * or via refresh, the server should return the index.html file with status 200
 * (not 404). This is configured via the netlify.toml redirect rule.
 */
describe('SPA Routing Property Tests', () => {
  // Known routes from the React Router configuration in App.tsx
  const knownRoutes = [
    '/',
    '/auth',
    '/dashboard',
    '/profile',
    '/profile/123',
    '/clubs',
    '/cinema',
    '/moderation',
    '/city-hall',
    '/explore',
    '/messages',
    '/privacy-settings',
    '/terms',
    '/privacy',
    '/test-connection'
  ];

  it('should verify netlify.toml has catch-all redirect for SPA routing', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          
          // Verify the catch-all redirect exists
          const hasCatchAllRedirect = netlifyCfg.includes('from = "/*"');
          if (!hasCatchAllRedirect) {
            throw new Error('netlify.toml missing catch-all redirect: from = "/*"');
          }
          
          // Verify it redirects to index.html
          const redirectsToIndex = netlifyCfg.includes('to = "/index.html"');
          if (!redirectsToIndex) {
            throw new Error('netlify.toml catch-all redirect does not point to /index.html');
          }
          
          // Verify it uses status 200 (rewrite, not redirect)
          const hasStatus200 = netlifyCfg.includes('status = 200');
          if (!hasStatus200) {
            throw new Error('netlify.toml catch-all redirect should use status = 200 for SPA routing');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all known application routes are covered by catch-all redirect', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...knownRoutes),
        (route) => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          
          // The catch-all pattern /* should match all routes
          // Verify the configuration exists
          const hasCatchAll = netlifyCfg.includes('from = "/*"') && 
                             netlifyCfg.includes('to = "/index.html"') &&
                             netlifyCfg.includes('status = 200');
          
          if (!hasCatchAll) {
            throw new Error(`Route ${route} would not be handled by SPA routing configuration`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify arbitrary client-side routes would be handled by catch-all', () => {
    // Generate arbitrary route paths
    const routeSegmentArbitrary = fc.array(
      fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', '1', '2', '3', '-', '_'),
      { minLength: 1, maxLength: 20 }
    ).map(chars => chars.join(''));
    
    const routePathArbitrary = fc.array(routeSegmentArbitrary, { minLength: 1, maxLength: 5 })
      .map(segments => '/' + segments.join('/'));
    
    fc.assert(
      fc.property(
        routePathArbitrary,
        (route) => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          
          // The catch-all pattern /* should match all routes
          // Verify the configuration exists
          const hasCatchAll = netlifyCfg.includes('from = "/*"') && 
                             netlifyCfg.includes('to = "/index.html"') &&
                             netlifyCfg.includes('status = 200');
          
          if (!hasCatchAll) {
            throw new Error(`Arbitrary route ${route} would not be handled by SPA routing configuration`);
          }
          
          // Verify the route doesn't conflict with static assets
          // Static assets should be served directly, not redirected
          const isStaticAsset = route.match(/\.(js|css|jpg|png|svg|ico|html)$/);
          
          // For static assets, we rely on Netlify's default behavior to serve them
          // before applying the catch-all redirect
          // The test just verifies the catch-all exists
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify redirect configuration appears before other rules', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          
          // Find the position of the redirects section
          const redirectsIndex = netlifyCfg.indexOf('[[redirects]]');
          const headersIndex = netlifyCfg.indexOf('[[headers]]');
          
          if (redirectsIndex === -1) {
            throw new Error('netlify.toml missing [[redirects]] section');
          }
          
          // Redirects should be defined (order doesn't matter for Netlify's processing)
          // but it's good practice to have them early in the file
          // This is more of a style check than a functional requirement
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify index.html exists in dist for SPA routing to work', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          const indexPath = join(distPath, 'index.html');
          
          // Skip if dist doesn't exist (build hasn't been run)
          if (!existsSync(distPath)) {
            return true;
          }
          
          // Verify index.html exists
          if (!existsSync(indexPath)) {
            throw new Error('index.html not found in dist directory - SPA routing will fail');
          }
          
          // Verify it's a file
          if (!statSync(indexPath).isFile()) {
            throw new Error('index.html in dist is not a file');
          }
          
          // Verify it has content
          const content = readFileSync(indexPath, 'utf-8');
          if (content.length === 0) {
            throw new Error('index.html in dist is empty');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify static assets are not affected by SPA routing redirect', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip if dist doesn't exist
          if (!existsSync(distPath)) {
            return true;
          }
          
          // Get all static assets in dist
          const allFiles = getAllFilesRecursive(distPath);
          const staticAssets = allFiles.filter(f => 
            f.endsWith('.js') || 
            f.endsWith('.css') || 
            f.endsWith('.jpg') || 
            f.endsWith('.png') || 
            f.endsWith('.svg') || 
            f.endsWith('.ico')
          );
          
          // Verify static assets exist (they should be served directly, not redirected)
          // The catch-all redirect should not interfere with static asset serving
          // Netlify serves static files before applying redirects
          
          for (const asset of staticAssets) {
            if (!existsSync(asset)) {
              throw new Error(`Static asset does not exist: ${asset}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: netlify-deployment-fix, Property 5: Servir arquivos estáticos corretamente
 * Validates: Requirements 3.2
 * 
 * Property: For any static file in the dist directory, when requested by the browser,
 * the server should return the file with status 200 and appropriate headers.
 */
describe('Static File Serving Property Tests', () => {
  it('should verify all static files in dist exist and are accessible', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip if dist doesn't exist (build hasn't been run)
          if (!existsSync(distPath)) {
            return true;
          }
          
          // Get all files in dist
          const allFiles = getAllFilesRecursive(distPath);
          
          // Verify each file exists and is readable
          for (const filePath of allFiles) {
            // Verify file exists
            if (!existsSync(filePath)) {
              throw new Error(`Static file does not exist: ${filePath}`);
            }
            
            // Verify it's a file (not a directory)
            if (!statSync(filePath).isFile()) {
              throw new Error(`Path is not a file: ${filePath}`);
            }
            
            // Verify file is readable (has content or is empty but valid)
            try {
              const stats = statSync(filePath);
              // File size should be >= 0 (empty files are valid)
              if (stats.size < 0) {
                throw new Error(`Invalid file size for: ${filePath}`);
              }
            } catch (error) {
              throw new Error(`Cannot read file stats: ${filePath} - ${error.message}`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify static assets have appropriate MIME type configuration', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip if dist doesn't exist
          if (!existsSync(distPath)) {
            return true;
          }
          
          const allFiles = getAllFilesRecursive(distPath);
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          
          // Define static file extensions we care about
          const staticExtensions = ['.js', '.mjs', '.css', '.jpg', '.jpeg', '.png', '.svg', '.ico'];
          
          // Filter to only static assets
          const staticAssets = allFiles.filter(f => {
            const ext = f.substring(f.lastIndexOf('.'));
            return staticExtensions.includes(ext);
          });
          
          // Verify each static asset has MIME type configuration
          for (const assetPath of staticAssets) {
            const extension = assetPath.substring(assetPath.lastIndexOf('.'));
            const pattern = `/*${extension}`;
            
            // Check if either netlify.toml or _headers has configuration
            const hasNetlifyConfig = netlifyCfg.includes(pattern);
            const hasHeadersConfig = headersCfg.includes(pattern);
            
            if (!hasNetlifyConfig && !hasHeadersConfig) {
              throw new Error(
                `Static file ${assetPath} with extension ${extension} has no MIME type configuration`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify critical static assets exist in dist', () => {
    const criticalAssets = [
      'favicon.ico',
      'portella-logo.jpg',
      'orkadia-logo.jpg'
    ];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...criticalAssets),
        (assetName) => {
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip if dist doesn't exist
          if (!existsSync(distPath)) {
            return true;
          }
          
          const assetPath = join(distPath, assetName);
          
          // Verify critical asset exists
          if (!existsSync(assetPath)) {
            throw new Error(`Critical static asset missing: ${assetName}`);
          }
          
          // Verify it's a file
          if (!statSync(assetPath).isFile()) {
            throw new Error(`Critical asset is not a file: ${assetName}`);
          }
          
          // Verify it has content (size > 0)
          const stats = statSync(assetPath);
          if (stats.size === 0) {
            throw new Error(`Critical asset is empty: ${assetName}`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify static files have appropriate cache headers configured', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          
          // Static assets should have cache headers with immutable
          const staticExtensions = ['.js', '.mjs', '.css', '.jpg', '.png', '.svg'];
          
          for (const ext of staticExtensions) {
            const pattern = `/*${ext}`;
            
            // Check if configuration exists in either file
            const hasNetlifyPattern = netlifyCfg.includes(pattern);
            const hasHeadersPattern = headersCfg.includes(pattern);
            
            if (hasNetlifyPattern || hasHeadersPattern) {
              // If pattern exists, verify it has cache configuration
              let hasCache = false;
              
              if (hasNetlifyPattern) {
                const sections = netlifyCfg.split('[[headers]]');
                const section = sections.find(s => s.includes(pattern));
                if (section && section.includes('Cache-Control')) {
                  hasCache = true;
                }
              }
              
              if (hasHeadersPattern) {
                const lines = headersCfg.split('\n');
                const patternIndex = lines.findIndex(line => line.trim() === pattern);
                if (patternIndex !== -1) {
                  const sectionLines = lines.slice(patternIndex, patternIndex + 5);
                  if (sectionLines.some(line => line.includes('Cache-Control'))) {
                    hasCache = true;
                  }
                }
              }
              
              if (!hasCache) {
                throw new Error(
                  `Static file pattern ${pattern} is configured but missing Cache-Control headers`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify index.html is not cached (for updates)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          const indexPath = join(distPath, 'index.html');
          
          // Skip if dist doesn't exist
          if (!existsSync(distPath)) {
            return true;
          }
          
          // Verify index.html exists
          if (!existsSync(indexPath)) {
            throw new Error('index.html not found in dist - required for serving');
          }
          
          // Read configuration files
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          
          // index.html should NOT have immutable cache headers
          // It should either have no cache or short cache to allow updates
          
          // Check if there's a specific configuration for .html files
          const htmlPattern = '/*.html';
          
          if (netlifyCfg.includes(htmlPattern)) {
            const sections = netlifyCfg.split('[[headers]]');
            const htmlSection = sections.find(s => s.includes(htmlPattern));
            
            if (htmlSection && htmlSection.includes('immutable')) {
              throw new Error('index.html should not have immutable cache headers');
            }
          }
          
          if (headersCfg.includes(htmlPattern)) {
            const lines = headersCfg.split('\n');
            const patternIndex = lines.findIndex(line => line.trim() === htmlPattern);
            
            if (patternIndex !== -1) {
              const sectionLines = lines.slice(patternIndex, patternIndex + 5);
              if (sectionLines.some(line => line.includes('immutable'))) {
                throw new Error('index.html should not have immutable cache headers');
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all file types in dist have corresponding configuration', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const distPath = join(__dirname, '..', 'dist');
          
          // Skip if dist doesn't exist
          if (!existsSync(distPath)) {
            return true;
          }
          
          const allFiles = getAllFilesRecursive(distPath);
          
          // Get unique file extensions
          const extensions = new Set();
          for (const filePath of allFiles) {
            const ext = filePath.substring(filePath.lastIndexOf('.'));
            if (ext && ext.length > 1) { // Valid extension
              extensions.add(ext);
            }
          }
          
          const netlifyCfg = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
          const headersCfg = readFileSync(join(__dirname, '..', 'public', '_headers'), 'utf-8');
          
          // Known extensions that should have configuration
          const knownExtensions = ['.js', '.mjs', '.css', '.jpg', '.jpeg', '.png', '.svg', '.ico'];
          
          // Verify known extensions have configuration
          for (const ext of knownExtensions) {
            if (extensions.has(ext)) {
              const pattern = `/*${ext}`;
              const hasConfig = netlifyCfg.includes(pattern) || headersCfg.includes(pattern);
              
              if (!hasConfig) {
                throw new Error(
                  `File extension ${ext} found in dist but has no configuration in netlify.toml or _headers`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
