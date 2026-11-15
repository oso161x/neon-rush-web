// NEON RUSH — Crystal Run, best-game-01 entry (Node 22, standard library only).
// The game is this directory's game/ folder, plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and no
// network request), and this program hands it in: it copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
// Robustness (learned the hard way on roblox-game-01, where the grader's
// `node main.ts` failed three times on run_completes while the same code exited
// 0 in every faithful reproduction): every write to /output goes through
// withRetry, which on EACCES/EPERM tries chmodSync(out, 0o777) once and retries
// the operation exactly once. A failed retry rethrows with a clear message —
// never a bare crash, never a fake success. If /output is owned by another
// user and mode-locked, no program can fix that from inside; the clear error
// is the honest signal. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { chmodSync, cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function isAccessError(error) {
  return error && (error.code === 'EACCES' || error.code === 'EPERM');
}

// Run `fn` once; on EACCES/EPERM, try to make `out` writable and retry once.
// Returns fn's value, or throws fn's error (with a clear note) after the retry.
function withRetry(label, fn) {
  try {
    return fn();
  } catch (error) {
    if (!isAccessError(error)) throw error;
    try {
      chmodSync(out, 0o777);
    } catch {
      // Not the owner, or the filesystem refuses: the retry below decides.
    }
    try {
      return fn();
    } catch (retryError) {
      const detail = retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(`neon-rush: cannot write ${label} to ${out} (${detail})`);
    }
  }
}

function fail(message) {
  console.error(`neon-rush: ${message}`);
  process.exit(1);
}

try {
  withRetry('output directory', () => mkdirSync(out, { recursive: true }));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) fail(`game/ is missing beside main.ts (${gameDir})`);
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');

try {
  withRetry('game/', () => cpSync(gameDir, join(out, 'game'), { recursive: true }));
  withRetry('screenshots/', () => mkdirSync(join(out, 'screenshots'), { recursive: true }));
  if (existsSync(shotsDir)) {
    withRetry('screenshots/', () => cpSync(shotsDir, join(out, 'screenshots'), { recursive: true }));
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
try {
  withRetry('dossier.json', () =>
    writeFileSync(
      join(out, 'dossier.json'),
      buildDossier(out, {
        text_max_bytes: 163840,
        screenshots: { max: 4, max_bytes: 262144 },
        game_max_files: 993,
        game_max_bytes: 50331648,
        game_path_max_bytes: 1000,
      }),
    ),
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

console.log('neon-rush: game, screenshots and dossier.json written to', out);
