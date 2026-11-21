// Leonida Trophy Guide — an offline GTA VI trophy guide and tracker for gta6-trophy-guide-01.
// main.ts copies app/ and screenshots/ to the output and writes dossier.json with the vendored library.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const { trophies } = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const citedSteps = trophies.reduce((count, trophy) => count + trophy.steps.filter(step => step.includes('[')).length, 0);
const sourceKeys = new Set(trophies.flatMap(trophy => trophy.sources.map(source => source.split(' — ')[0])));
const fiveStep = trophies.filter(trophy => trophy.steps.length === 5).length;
const nineStep = trophies.filter(trophy => trophy.steps.length === 9).length;
const sixStep = trophies.filter(trophy => trophy.steps.length === 6).length;
const totalMin = trophies.reduce((sum, trophy) => sum + (trophy.timeMin || 0), 0);
const totalSteps = trophies.reduce((sum, trophy) => sum + trophy.steps.length, 0);
console.log(`Leonida Trophy Guide: handing in ${trophies.length} trophies (${['platinum', 'gold', 'silver', 'bronze'].map(grade => `${trophies.filter(trophy => trophy.grade === grade).length} ${grade}`).join(', ')}), ${citedSteps} cited steps, ${totalSteps} cited steps in all, ${trophies.filter(trophy => trophy.steps.length === 4).length} trophies at 4 steps, ${fiveStep} trophies at 5 steps, ${nineStep} trophies at 9 steps, ${sixStep} trophies at 6 steps, ${(totalSteps / trophies.length).toFixed(1)} steps per trophy, ${sourceKeys.size} sources, about ${(totalMin / 60).toFixed(1)} h to the platinum, ${trophies.filter(trophy => trophy.time && trophy.difficulty).length} trophies with time & difficulty.`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
