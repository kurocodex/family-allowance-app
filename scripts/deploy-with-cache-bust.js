#!/usr/bin/env node

/**
 * Deployment script with automatic cache invalidation
 * This script handles cache busting by updating version numbers and timestamps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_BUST_FILE = path.join(__dirname, '..', 'vercel-cache-bust.txt');
const SERVICE_WORKER_FILE = path.join(__dirname, '..', 'public', 'sw.js');
const MANIFEST_FILE = path.join(__dirname, '..', 'public', 'manifest.json');

/**
 * Generate a unique deployment ID
 */
function generateDeploymentId() {
  const timestamp = new Date().toISOString();
  const shortHash = Math.random().toString(36).substring(2, 8);
  return `${timestamp.replace(/[:.]/g, '-')}-${shortHash}`;
}

/**
 * Update cache busting file
 */
function updateCacheBustFile() {
  const deploymentId = generateDeploymentId();
  const content = `Force cache clear - deployment: ${deploymentId}\nTimestamp: ${new Date().toISOString()}\nThis file forces Vercel to invalidate all caches and redeploy completely.`;
  
  fs.writeFileSync(CACHE_BUST_FILE, content, 'utf8');
  console.log(`[Deploy] Updated cache bust file with deployment ID: ${deploymentId}`);
  return deploymentId;
}

/**
 * Update service worker version
 */
function updateServiceWorkerVersion(deploymentId) {
  if (!fs.existsSync(SERVICE_WORKER_FILE)) {
    console.warn('[Deploy] Service worker file not found, skipping version update');
    return;
  }

  let swContent = fs.readFileSync(SERVICE_WORKER_FILE, 'utf8');
  
  // Update the APP_VERSION or add it if it doesn't exist
  const versionRegex = /const APP_VERSION = [^;]+;/;
  const newVersionLine = `const APP_VERSION = '${deploymentId}';`;
  
  if (versionRegex.test(swContent)) {
    swContent = swContent.replace(versionRegex, newVersionLine);
  } else {
    // Add version at the top if it doesn't exist
    swContent = `${newVersionLine}\n${swContent}`;
  }
  
  fs.writeFileSync(SERVICE_WORKER_FILE, swContent, 'utf8');
  console.log(`[Deploy] Updated service worker version to: ${deploymentId}`);
}

/**
 * Update PWA manifest version
 */
function updateManifestVersion(deploymentId) {
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.warn('[Deploy] Manifest file not found, skipping version update');
    return;
  }

  try {
    const manifestContent = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    manifestContent.version = deploymentId;
    manifestContent.last_updated = new Date().toISOString();
    
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifestContent, null, 2), 'utf8');
    console.log(`[Deploy] Updated manifest version to: ${deploymentId}`);
  } catch (error) {
    console.error('[Deploy] Failed to update manifest version:', error.message);
  }
}

/**
 * Generate build hash file for runtime cache busting
 */
function generateBuildHashFile() {
  const buildHash = Math.random().toString(36).substring(2, 15);
  const hashFile = path.join(__dirname, '..', 'public', 'build-hash.json');
  
  const hashData = {
    hash: buildHash,
    timestamp: Date.now(),
    deploymentDate: new Date().toISOString()
  };
  
  fs.writeFileSync(hashFile, JSON.stringify(hashData, null, 2), 'utf8');
  console.log(`[Deploy] Generated build hash: ${buildHash}`);
  return buildHash;
}

/**
 * Update HTML meta tags for cache busting
 */
function updateHTMLCacheTags() {
  const indexPath = path.join(__dirname, '..', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.warn('[Deploy] index.html not found, skipping meta tag updates');
    return;
  }

  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  const timestamp = Date.now();
  
  // Add or update cache-busting meta tag
  const metaRegex = /<meta name="cache-bust" content="[^"]*">/;
  const newMetaTag = `<meta name="cache-bust" content="${timestamp}">`;
  
  if (metaRegex.test(htmlContent)) {
    htmlContent = htmlContent.replace(metaRegex, newMetaTag);
  } else {
    // Add meta tag in head section
    htmlContent = htmlContent.replace(
      /<\/head>/,
      `  ${newMetaTag}\n  </head>`
    );
  }
  
  fs.writeFileSync(indexPath, htmlContent, 'utf8');
  console.log(`[Deploy] Updated HTML cache-busting meta tag: ${timestamp}`);
}

/**
 * Run build with environment variables
 */
function runBuild(deploymentId) {
  console.log('[Deploy] Running production build...');
  
  const env = {
    ...process.env,
    VITE_DEPLOYMENT_ID: deploymentId,
    VITE_BUILD_TIMESTAMP: Date.now().toString(),
    NODE_ENV: 'production'
  };
  
  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      env: env
    });
    console.log('[Deploy] Build completed successfully');
  } catch (error) {
    console.error('[Deploy] Build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Post-build optimizations
 */
function postBuildOptimizations() {
  console.log('[Deploy] Running post-build optimizations...');
  
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.warn('[Deploy] Dist directory not found, skipping optimizations');
    return;
  }
  
  // Update built service worker with query parameter for cache busting
  const builtSwPath = path.join(distPath, 'sw.js');
  if (fs.existsSync(builtSwPath)) {
    let swContent = fs.readFileSync(builtSwPath, 'utf8');
    const timestamp = Date.now();
    
    // Add cache-busting parameter to service worker registration
    swContent = swContent.replace(
      /navigator\.serviceWorker\.register\(['"`]([^'"`]+)['"`]\)/g,
      `navigator.serviceWorker.register('$1?v=${timestamp}')`
    );
    
    fs.writeFileSync(builtSwPath, swContent, 'utf8');
    console.log('[Deploy] Updated built service worker with cache busting');
  }
  
  // Generate a deployment info file
  const deploymentInfo = {
    deploymentId: process.env.DEPLOYMENT_ID || 'local',
    buildTime: new Date().toISOString(),
    gitCommit: getGitCommit(),
    environment: process.env.NODE_ENV || 'production'
  };
  
  fs.writeFileSync(
    path.join(distPath, 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2),
    'utf8'
  );
  
  console.log('[Deploy] Generated deployment info file');
}

/**
 * Get current git commit hash
 */
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Main deployment function
 */
function main() {
  console.log('[Deploy] Starting deployment with cache invalidation...');
  
  try {
    // Step 1: Update cache busting files
    const deploymentId = updateCacheBustFile();
    
    // Step 2: Update service worker version
    updateServiceWorkerVersion(deploymentId);
    
    // Step 3: Update manifest version
    updateManifestVersion(deploymentId);
    
    // Step 4: Generate build hash
    generateBuildHashFile();
    
    // Step 5: Update HTML cache tags
    updateHTMLCacheTags();
    
    // Step 6: Run build
    runBuild(deploymentId);
    
    // Step 7: Post-build optimizations
    postBuildOptimizations();
    
    console.log('\n[Deploy] ✅ Deployment preparation completed successfully!');
    console.log(`[Deploy] 🆔 Deployment ID: ${deploymentId}`);
    console.log('[Deploy] 🚀 Ready for deployment to Vercel');
    
  } catch (error) {
    console.error('\n[Deploy] ❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateDeploymentId,
  updateCacheBustFile,
  updateServiceWorkerVersion,
  updateManifestVersion,
  generateBuildHashFile,
  main
};