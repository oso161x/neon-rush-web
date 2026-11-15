// Take the four screenshots of NEON RUSH for the dossier: start, play, win,
// end. Serves game/ on a local port, loads each ?shot= scene in headless
// Chrome at 1280x720, and converts the capture to JPEG (quality 85, each
// under the 256 KiB gate cap). Run from the repository root:
//   node take-shots.mjs [--port 8091]
// Prerequisite: google-chrome on PATH. The scenes are deterministic
// (seeded), so re-running gives the same frames.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex === -1 ? 8091 : Number(args[portIndex + 1]);

const server = spawn(process.execPath, [join(here, 'serve.ts'), '--port', String(port)], {
  cwd: here,
  stdio: 'ignore',
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(tries = 30) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${port}/`);
      if (response.ok) return;
    } catch {
      // Not up yet.
    }
    await sleep(500);
  }
  throw new Error('serve.ts did not answer');
}

try {
  await waitForServer();
  for (const shot of shots) {
    const pngPath = `/tmp/neon-shot-${shot.name}.png`;
    const outPath = join(here, 'screenshots', shot.name);
    execFileSync(
      'google-chrome',
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1280,720',
        '--virtual-time-budget=15000',
        `--screenshot=${pngPath}`,
        `http://localhost:${port}/${shot.query}`,
      ],
      { stdio: 'ignore' },
    );
    // Convert to JPEG with Pillow (Chrome only writes PNG).
    execFileSync(
      'python3',
      [
        '-c',
        `from PIL import Image; im = Image.open(${JSON.stringify(pngPath)}).convert('RGB'); im.save(${JSON.stringify(outPath)}, 'JPEG', quality=85)`,
      ],
      { stdio: 'inherit' },
    );
    const bytes = statSync(outPath).size;
    console.log(`${shot.name}: ${bytes} bytes${bytes > 262144 ? '  *** OVER 256 KiB ***' : ''}`);
    rmSync(pngPath, { force: true });
  }
} finally {
  server.kill();
}
console.log('done');
