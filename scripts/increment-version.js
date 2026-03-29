#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../public/VERSION.json');

// Lê o arquivo VERSION.json
const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
const [major, minor, patch] = versionData.version.split('.').map(Number);

// Determina qual tipo de incremento fazer
const type = process.argv[2] || 'patch';

let newVersion;

if (type === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (type === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else if (type === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else {
  console.error('Tipo invalido. Use: major, minor ou patch');
  process.exit(1);
}

// Atualiza o arquivo
versionData.version = newVersion;
versionData.lastUpdated = new Date().toISOString();

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');

console.log(`✓ Versão atualizada: ${versionData.version}`);
console.log(`✓ Data: ${versionData.lastUpdated}`);
