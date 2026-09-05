/**
 * @file run-prisma.js
 * @description Dynamic database switcher script for Prisma CLI commands.
 * Reads DB_TARGET ("local" | "supabase") from .env files and seamlessly injects
 * either local Docker PostgreSQL or Supabase Cloud connection strings.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Zero-dependency .env parser for robust multi-file environment loading
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// Search for .env files in priority order: packages/database/.env -> apps/api/.env -> root/.env
const dbEnvPath = path.resolve(__dirname, '..', '.env');
const apiEnvPath = path.resolve(__dirname, '..', '..', 'apps', 'api', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');

const mergedEnv = {
  ...loadEnvFile(rootEnvPath),
  ...loadEnvFile(apiEnvPath),
  ...loadEnvFile(dbEnvPath),
  ...process.env,
};

const target = (mergedEnv.DB_TARGET || 'local').toLowerCase();
const isLocal = target === 'local';

let databaseUrl = process.env.DATABASE_URL || (isLocal
  ? mergedEnv.LOCAL_DATABASE_URL || mergedEnv.DATABASE_URL
  : mergedEnv.SUPABASE_DATABASE_URL || mergedEnv.DATABASE_URL);

let directUrl = process.env.DIRECT_URL || (isLocal
  ? mergedEnv.LOCAL_DIRECT_URL || mergedEnv.LOCAL_DATABASE_URL || mergedEnv.DIRECT_URL
  : mergedEnv.SUPABASE_DIRECT_URL || mergedEnv.DIRECT_URL);

if (!databaseUrl) {
  console.warn(`⚠️ [Prisma Switcher] No database URL found for target: "${target}". Falling back to default.`);
}

console.log(`\n======================================================`);
console.log(`⚡ [Prisma Switcher] Active Target: ${isLocal ? 'LOCAL POSTGRES' : 'SUPABASE CLOUD'}`);
console.log(`📦 [URL]: ${databaseUrl ? databaseUrl.replace(/:([^@]+)@/, ':***@') : 'N/A'}`);
console.log(`======================================================\n`);

const env = {
  ...process.env,
  ...mergedEnv,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
};

const args = process.argv.slice(2);
const prismaBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(prismaBin, ['prisma', ...args], {
  stdio: 'inherit',
  env,
  shell: true,
  cwd: path.resolve(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
