#!/usr/bin/env node
/**
 * Upload built game version to Vercel Blob Storage
 * Creates permanent URLs for each version
 */

const { put, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const VERSION_FILE = path.join(__dirname, '..', 'src', 'version.ts');
const VERSIONS_FILE = path.join(__dirname, '..', 'public', 'versions.json');

// Get version number from version.ts
function getVersion() {
  const content = fs.readFileSync(VERSION_FILE, 'utf-8');
  const match = content.match(/GAME_VERSION\s*=\s*(\d+)/);
  if (!match) {
    throw new Error('Could not find GAME_VERSION in version.ts');
  }
  return parseInt(match[1], 10);
}

// Get all files in dist directory recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function uploadVersion() {
  const version = getVersion();
  const timestamp = new Date().toISOString();

  console.log(`📦 Uploading version ${version} to Vercel Blob...`);

  // Check if BLOB_READ_WRITE_TOKEN is set
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is not set');
    process.exit(1);
  }

  // Get all files to upload
  const files = getAllFiles(DIST_DIR);
  console.log(`Found ${files.length} files to upload`);

  const uploadedFiles = {};

  // Upload each file
  for (const filePath of files) {
    const relativePath = path.relative(DIST_DIR, filePath);
    const blobPath = `v${version}/${relativePath}`;

    console.log(`  Uploading ${relativePath}...`);

    const fileContent = fs.readFileSync(filePath);

    try {
      const blob = await put(blobPath, fileContent, {
        access: 'public',
        addRandomSuffix: false,
      });

      uploadedFiles[relativePath] = blob.url;
      console.log(`  ✓ ${relativePath} -> ${blob.url}`);
    } catch (error) {
      console.error(`  ✗ Failed to upload ${relativePath}:`, error.message);
      process.exit(1);
    }
  }

  // The main entry point URL
  const indexUrl = uploadedFiles['index.html'];
  if (!indexUrl) {
    console.error('❌ index.html was not uploaded');
    process.exit(1);
  }

  console.log(`\n✅ Version ${version} uploaded successfully!`);
  console.log(`   URL: ${indexUrl}`);

  // Update versions.json in platform repo
  let versions = [];
  if (fs.existsSync(VERSIONS_FILE)) {
    const content = fs.readFileSync(VERSIONS_FILE, 'utf-8');
    versions = JSON.parse(content).versions || [];
  } else {
    // Create public directory if it doesn't exist
    const publicDir = path.dirname(VERSIONS_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
  }

  // Check if this version already exists
  const existingIndex = versions.findIndex(v => v.version === version);
  const versionEntry = {
    version,
    url: indexUrl,
    timestamp,
    files: uploadedFiles
  };

  if (existingIndex >= 0) {
    // Update existing version
    versions[existingIndex] = versionEntry;
    console.log(`\n📝 Updated version ${version} in versions.json`);
  } else {
    // Add new version
    versions.push(versionEntry);
    console.log(`\n📝 Added version ${version} to versions.json`);
  }

  // Sort versions by version number
  versions.sort((a, b) => a.version - b.version);

  // Write updated versions.json
  fs.writeFileSync(
    VERSIONS_FILE,
    JSON.stringify({ versions }, null, 2),
    'utf-8'
  );

  console.log(`✅ versions.json updated at ${VERSIONS_FILE}`);
  console.log(`\n🎉 Version ${version} is now available at: ${indexUrl}`);
}

// Run upload
uploadVersion().catch(error => {
  console.error('❌ Upload failed:', error);
  process.exit(1);
});
