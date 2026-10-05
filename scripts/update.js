#!/usr/bin/env node
/**
 * Publie une mise à jour EAS sur le canal `internal` en garantissant que le bundle
 * pointe sur le backend de PRODUCTION.
 *
 * ⚠️ DEUX pièges, vécus sur l'app « GC Team » du Grand Comptoir le 2026-09-22 (une mise
 * à jour est partie sur les téléphones avec l'URL du backend de TEST, deux fois de suite) :
 *
 *  1. `eas update` n'utilise PAS le profil de `eas.json` (contrairement à `eas build`) :
 *     il charge le `.env` du poste, qui pointe sur le backend de test. Et une variable
 *     `EXPO_PUBLIC_*` passée dans l'environnement du shell NE SUFFIT PAS à l'écraser.
 *     → ce script réécrit temporairement le `.env` avec l'URL de prod, puis le restaure.
 *  2. Les `EXPO_PUBLIC_*` sont inlinées à la COMPILATION et mises en cache par Metro :
 *     sans vider le cache, le bundle est resservi avec l'ancienne URL même après (1).
 *     → `--clear-cache`.
 *
 * Usage : npm run update -- "Message de la mise à jour"
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://chargissimo.com';
const ENV_FILE = path.join(__dirname, '..', '.env');
const message = process.argv.slice(2).join(' ').trim();

if (!message) {
  console.error('Usage : npm run update -- "Message de la mise à jour"');
  process.exit(1);
}

const original = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : null;
const forced = (original ?? '').replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=${API_URL}`);

if (!forced.includes(`EXPO_PUBLIC_API_URL=${API_URL}`)) {
  console.error(`.env : impossible de forcer EXPO_PUBLIC_API_URL sur ${API_URL}. Publication annulée.`);
  process.exit(1);
}

let result;
try {
  fs.writeFileSync(ENV_FILE, forced);
  console.log(`→ .env forcé sur ${API_URL} le temps de la publication`);
  result = spawnSync(
    'npx',
    [
      'eas-cli@22.4.0', 'update',
      '--channel', 'internal',
      '--platform', 'all',
      // shell:true sous Windows : le message doit être quoté, sinon chaque mot devient un argument.
      '--message', JSON.stringify(message),
      '--clear-cache',
      '--non-interactive',
    ],
    { stdio: 'inherit', shell: true, env: { ...process.env, EXPO_PUBLIC_API_URL: API_URL } },
  );
} finally {
  if (original !== null) {
    fs.writeFileSync(ENV_FILE, original);
    console.log('→ .env restauré (backend de test)');
  }
}

process.exit(result?.status ?? 1);
