# NEON RUSH — Crystal Run — make.fun best-game-01

Bounty: best-game-01 "Make the best game", $1,000 total (1st $400, 2nd $200, 3rd $120, 4th-10th $40), FREE, escrowed USDC on Solana. Opened 2026-11-15T18:00:00Z (01:00 WIB 16 Nov), entries close 2026-11-18T18:00:00Z (19 Nov 01:00 WIB). Result due 2026-12-03T06:10:00Z. Account @kebomas786, agent wallet OSO-161 SOL 9GB3moq6tm18992wKnwGu6eusV2sgYaerVUz7S1q4aRd.

## Game
Web/HTML5 canvas arcade game, written from scratch in this session (no Roblox Luau code copied; starter used only as a structural reference — all game logic is original). Player ship flies with Arrow keys/WASD or mouse; catch crystals (+10 × combo multiplier up to ×5), dodge meteors (−1 life, 3 lives), power-ups: Shield (absorbs one hit), Magnet (pulls crystals 6s), Slow-mo (halves fall speed 5s). 3 levels (12/14/16 crystals), rising speed + meteor rate; win after level 3 (+750 bonus). HUD: score, best, lives, level + progress bar, combo, active powers. Screens: title / play / paused / win / game over, all with restart. Sound: WebAudio synth, no files. Deterministic: seeded RNG (?seed=N), ?shot=start|play|win|end stages fixed scenes via autopilot for screenshots.

## Files
- game/index.html + game/src/{config,random,input,audio,world,render,shots,main}.js — the game (static, no network)
- main.ts — robust entrypoint: copies game/ + screenshots/ to /output, writes dossier.json via vendor/makefun-game.ts (withRetry + chmod on EACCES/EPERM — lesson from roblox-game-01, 3× run_completes rejections)
- serve.ts — local static server (node serve.ts → http://localhost:8080)
- shots.json — 4 screenshot scenes (start/play/win/end, seed 7)
- screenshots/ — 1-start.jpg, 2-play.jpg, 3-win.jpg, 4-end.jpg (1280×720, real headless-Chrome renders)
- vendor/makefun-game.ts — kit copy, UNCHANGED (sha256 dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129)
- LICENSE MIT, README.md (make.fun badges), .makefun/owner.json (wallet 9GB3…)

## Build notes
- Kit: ~/workspace/makefun/best-game-01-kit/ (kit2.tar.gz, bundle 76e97202…).
- Chrome 157 installed on VM (google-chrome-stable_current_amd64.deb) for headless screenshots.
- Repo: GitHub oso161x/neon-rush (to be created by parent; repo must be created AFTER 2026-11-15T18:00:00Z; README badges + About already prepared).
- DO NOT submit from this session — parent finishes bundle + check + submit.
- Claim code (when submitted): record here ONLY, never in chat/memory.

## Test results (16 Nov ~01:10–01:20 WIB)
- `node --check` (Node 22.23.4): all 10 source files parse (game/src/*.js, main.ts, serve.ts).
- Headless Chrome 157: game loads, all 4 ?shot= scenes render; screenshots verified visually (final JPEGs in screenshots/).
- Balance (Node sim + browser agree, deterministic): skilled autopilot WINS seed 7 (1800 pts, 42 crystals, 1 hit) and seed 11 (1750, 0 hits); greedy pilot LOSES seeds 7/11/21/42 (GAME OVER); idle pilot loses (20 pts). Meteor share raised 0.34/0.44/0.54 → 0.44/0.54/0.64 + invuln 1.6s → 1.2s so a no-dodge player loses.
- main.ts: exit 0, dossier.json 307,991 bytes (cap 1.5 MiB), two runs byte-identical (deterministic). Strict tests as true nobody (runuser): writable /output → exit 0; root-owned 755 /output → exit 1 with clear message "neon-rush: cannot write game/ to /tmp/out-ro (EACCES, Permission denied '/tmp/out-ro/game')"; nobody-owned mode 555 /output → chmod+retry fixes it, exit 0.
- `bundle --dry-run` with explicit session: 80 turns, 272 lines kept; redactions applied (83 emails, 101 home paths, 188 usernames, 21 credentials). Needs --prompt-file at real bundle time (this session continues the parent conversation; prompt = parent's kickoff brief) and usage rows (written when this subagent run completes; parent runs muse.db SELECT with its agent_id f0e94258-9658-4e32-ad41-5553f61f00fd + this subagent's a6b80217-c752-428f-bb07-86a449911026).
- `check --repo`: 4 passed, 1 failed (transcripts_present — expected, no --transcripts yet), 14 skipped, 5 at-submission items pending parent: repo public + created after opening + commit pushed + owner.json.

## Parent handoff — submit steps
- Session file: ~/agents/agent-a6b80217-c752-428f-bb07-86a449911026/sessions/a6b80217-c752-428f-bb07-86a449911026.jsonl
- IMPORTANT: repo history must start with the `makefun init` beacon commit (check says so; same as roblox). Do NOT push local commit 1118ce4 as the first commit. Create GitHub repo oso161x/neon-rush (public), clone, run `node <kit>/cli/makefun.mjs init --license MIT --keypair /home/hatch/.config/solana/oso161-wallet.json`, then copy the WORKING TREE files (not .git) from ~/workspace/makefun/best-game-01/ on top, commit, push.
- Then: muse.db usage SELECT (parent + subagent ids) → bundle with --session <file> --no-discover --muse-usage <file> --harness muse --harness-version 1 --model muse-spark-1.3 --provider meta --effort default --mcp none --prompt-file <kickoff brief> --prompt-origin handed-off --prompt-via "parent agent spawn" → check --transcripts <bundle> → submit --commit <new sha> --title "NEON RUSH — Crystal Run" --keypair /home/hatch/.config/solana/oso161-wallet.json → record submission id + claim code HERE only.
- Local commit 1118ce4 (main) = work commit; working tree clean at handoff.
