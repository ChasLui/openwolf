<p align="center">
  <img src="demo.gif" alt="OpenWolf demo" width="640" />
</p>

<h1 align="center">OpenWolf</h1>

<p align="center">
  <strong>The second brain for Claude Code. Now for every AI coding assistant.</strong><br />
  Improved context management, optimized architecture scaffolding, and smarter token utilization.<br />
  Delivered through 7 invisible lifecycle hooks. Zero workflow changes.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/openwolf"><img src="https://img.shields.io/npm/v/openwolf.svg" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-20%2B-green.svg" alt="Node.js" /></a>
</p>

---

## Why OpenWolf Exists

Coding agents are powerful but they work blind. An agent does not know what a
file contains until it opens it. It cannot tell a 50-token config from a
2,000-token module. It rereads the same file in one session without noticing,
forgets your corrections between sessions, and loses everything when its
context window compacts.

OpenWolf gives your agent a second brain that fixes all of that:

- **Context management.** A budget-capped digest of your project's most
  valuable state (current goals, known mistakes, fixed bugs, the project map)
  is injected at every session start. A PreCompact hook plus a
  compaction-aware restart mean context compaction no longer erases what the
  session already did.
- **Architecture scaffolding.** A durable, self-healing project index maps
  every file with a description, a token estimate, and (for large files) its
  functions and classes with exact line ranges. Agents navigate your codebase
  instead of rediscovering it.
- **Token utilization.** Repeated reads are caught, whole-file reads become
  targeted slice reads, and real usage is measured from harness transcripts
  so you can verify the savings instead of trusting an estimate.

## Quick Start

```bash
npm install -g openwolf
cd your-project
openwolf init
```

That is it. `init` auto-detects the coding agents installed on your machine
and wires each of them to the same `.wolf/` brain. Use your agents normally;
OpenWolf works underneath.

## Supported Agents

One `.wolf/` brain, many agents:

| Agent | Integration | Depth |
|-------|-------------|-------|
| **Claude Code** | 7 lifecycle hooks + `CLAUDE.md` | Full (hooks + context) |
| **Codex CLI** | `.codex/hooks.json` lifecycle hooks + `AGENTS.md` | Full (hooks + context) |
| **OpenCode** | Native plugin + `AGENTS.md` | Full (hooks + context) |
| **Gemini CLI** | `GEMINI.md` protocol block | Context |
| **Cursor** | `.cursor/rules/openwolf.mdc` (always applied) | Context |

```bash
openwolf init                          # auto-detect installed agents (recommended)
openwolf init --agent codex opencode   # wire exactly these
openwolf init --agent all              # wire everything
openwolf init --agent claude           # Claude Code only
```

Protocol blocks are marker-fenced: your own content in `AGENTS.md` or
`GEMINI.md` is never touched, and re-running init never duplicates anything.

## What It Creates

`openwolf init` creates a `.wolf/` directory in your project:

| File | Purpose |
|------|---------|
| `anatomy-index.json` | Durable project index: descriptions, token estimates, content hashes, symbols |
| `anatomy.md` | Human-readable render of the index, kept in sync automatically |
| `cerebrum.md` | Learned preferences, corrections, Do-Not-Repeat list |
| `memory.md` | Chronological action log with token estimates |
| `STATUS.md` | Session handoff: resume any session in one small read |
| `buglog.json` | Bug fix memory, searchable, prevents rediscovery |
| `token-ledger.json` | Estimated and measured token usage, per session and per agent |
| `hooks/` | 7 lifecycle hooks (pure Node.js, zero dependencies) |
| `config.json` | Configuration, including per-agent context budgets |
| `OPENWOLF.md` | The operating protocol your agents follow |

## How It Works

```
Session starts
    |
OpenWolf injects a token-budgeted digest: current goals, known mistakes,
recent bug fixes, project map pointer
    |
Agent decides to read a big file
    |
OpenWolf: "auth.ts (~2,900 tok). Symbols: validateToken L82-140 ~450 tok.
Read with offset/limit to fetch just the part you need."
    |
Agent edits files
    |
OpenWolf updates the index under a cross-process lock, logs the action,
estimates the cost
    |
Context compacts mid-session
    |
OpenWolf snapshots state before compaction and re-injects a digest of the
files already modified, so the agent does not redo finished work
    |
Session ends
    |
OpenWolf reads the real token usage from the transcript into the ledger
```

## Context Management

- **Session digest.** The highest-value state is pushed into the model's
  context at session start, capped to a configurable token budget per agent.
  The model gets what it needs without reading six files.
- **Compaction survival.** The PreCompact hook snapshots in-flight session
  state; after compaction the digest lists the files already modified with a
  pointer to the action log. Resume and compaction no longer reset tracking.
- **Staleness detection.** Scans pin the git HEAD. If the HEAD moves or the
  scan ages out, the agent is told to rescan before trusting the map. A wrong
  index is never silently trusted.
- **STATUS.md handoff.** End-of-phase state lives in one small document, so a
  fresh session reaches productive context in a single read.

## Project Anatomy

The index is a durable store (`anatomy-index.json`) with a rendered,
human-readable view (`anatomy.md`). Writers coordinate through a
cross-process lock, so concurrent hook fires cannot lose entries. Edits made
to the markdown by hand or by older hook versions are detected by content
hash and absorbed additively.

Files above 500 estimated tokens also index their top-level symbols:

```
- `shared.ts` (~3,200 tok)
  - fn `parseAnatomy` L82-104 (~180 tok)
  - fn `serializeAnatomy` L106-129 (~200 tok)
```

Before the agent reads a large file, the hint lists the biggest symbols with
line ranges so it can fetch one function with offset/limit instead of the
whole file. Hints are suppressed automatically if the file changed since
indexing; a stale range is never allowed to misdirect a read.
Languages with symbol support today: TypeScript, JavaScript, Python, Go, Rust.

## Token Intelligence

Estimates are useful; measurements are trustworthy. At session end OpenWolf
reads the real usage from the harness transcript: input tokens, output
tokens, cache reads, cache writes, and API calls, attributed to the agent
that ran the session.

```bash
openwolf report
```

```
  Estimated (char-ratio heuristic)
    Total tokens:           1,549,658
    Est. savings vs bare:   1,772,690

  Measured (from harness transcripts)
    API calls:              29
    Input tokens:           57,489
    Cache reads:            309,141
```

Field results from 1.x deployments (20 projects, 132+ sessions) averaged a
65.8% estimated token reduction, with 71% of repeated file reads caught and
blocked. Those figures are heuristic estimates; 2.0 exists so your own
numbers are measured, not modeled.

## Security

- Dashboard binds to 127.0.0.1 and requires a per-project token
  (timing-safe comparison) for all API and WebSocket access.
- Every dynamic process invocation uses argument arrays; no shell
  interpolation anywhere.
- Path traversal guards on all cron file access, realpath-based and symlink-safe.
- Secret-bearing files (keys, keystores, credential files, `.npmrc`, `.env`
  and friends) never enter the index or the memory log.
- A security regression suite runs with `pnpm test`.

## Bundled Skills

`openwolf init` installs two slash commands into every configured agent
(Claude Code, Codex, OpenCode):

- **`/security-audit [scope]`**: layered audit covering dependencies,
  secrets, injection surfaces, and authorization, ending in a
  severity-ranked report wired into `.wolf/buglog.json`.
- **`/reframe [migrate | audit | fix]`**: the design brain. Pick or migrate a
  UI framework using a curated knowledge base of 13 frameworks (shadcn/ui,
  Aceternity, Magic UI, DaisyUI, HeroUI, Chakra, Flowbite, Preline, Park UI,
  Origin UI, Headless UI, Cult UI, Astryx), or audit and fix existing UI
  against an anti-generic design mandate: distinctiveness is an acceptance
  criterion, and the recognizable AI-generated look is a failure state.

## Dashboard

```bash
openwolf daemon start
openwolf dashboard
```

A local, token-authenticated dashboard rendered in a dot-matrix design
system: measured vs estimated tokens, cache economics, per-agent usage,
context health (scan freshness, pinned git HEAD, digest budget), session
handoff, live activity, cron control, and the full anatomy browser with
per-file symbols. Panels are deep-linkable (`/#tokens`).

## Commands

```
openwolf init              Initialize .wolf/ and wire detected agents
openwolf status            Health, stats, file integrity
openwolf scan              Rebuild the project index
openwolf scan --check      Verify the index matches the filesystem (CI-friendly)
openwolf report            Token report: estimated vs measured
openwolf dashboard         Open the web dashboard
openwolf daemon start      Start the background daemon
openwolf daemon stop       Stop the daemon
openwolf cron list         Scheduled tasks
openwolf cron run <id>     Trigger a task
openwolf bug search <term> Search the bug memory
openwolf update            Update every registered project (with backup)
openwolf restore [backup]  Roll back .wolf/ from a timestamped backup
```

There is also a standalone inspector that needs nothing installed:

```bash
node scripts/openwolf-check.mjs [projectDir]   # read-only usage report
```

## Requirements

- Node.js 20+
- At least one supported coding agent
- Windows, macOS, or Linux
- Optional: PM2 for a persistent background daemon

## Limitations

- Estimated figures use a character-ratio heuristic (accurate to roughly
  15%); measured figures come from harness transcripts and are exact.
- Hook coverage varies by agent: Claude Code and Codex have full lifecycle
  hooks, OpenCode uses its plugin events, Gemini CLI and Cursor are
  context-only integrations.
- Protocol compliance (updating cerebrum, logging bugs) depends on the model
  following instructions; the hooks enforce what can be enforced and remind
  about the rest.
- Found something broken? [File an issue](https://github.com/cytostack/openwolf/issues).

## Origin Story

We were building products with Claude Code at Cytostack when we noticed
sessions eating tokens faster than they should. The cause: the agent
re-reading files, scanning directories to find one function, and starting
every session from zero. So we built the tooling we wished existed: a file
index so the agent reads less, a learning memory so it gets smarter, and a
ledger that tracks every token. That became OpenWolf. 2.0 extends the same
brain to every major coding agent and replaces trust-me estimates with
measured numbers.

## Contributors

OpenWolf is better because people fixed it. Every merged contribution is credited here, in the same batch that ships it.

| | | | | |
|:-:|:-:|:-:|:-:|:-:|
| [<img src="https://github.com/fsener.png" width="60"/>](https://github.com/fsener)<br/>**fsener** | [<img src="https://github.com/albertomenache.png" width="60"/>](https://github.com/albertomenache)<br/>**albertomenache** | [<img src="https://github.com/whydoyouwork.png" width="60"/>](https://github.com/whydoyouwork)<br/>**whydoyouwork** | [<img src="https://github.com/mann1x.png" width="60"/>](https://github.com/mann1x)<br/>**mann1x** | [<img src="https://github.com/GordongWang.png" width="60"/>](https://github.com/GordongWang)<br/>**GordongWang** |
| [<img src="https://github.com/WeathermanTony.png" width="60"/>](https://github.com/WeathermanTony)<br/>**WeathermanTony** | [<img src="https://github.com/goashem.png" width="60"/>](https://github.com/goashem)<br/>**goashem** | [<img src="https://github.com/bryandent.png" width="60"/>](https://github.com/bryandent)<br/>**bryandent** | [<img src="https://github.com/levnikmyskin.png" width="60"/>](https://github.com/levnikmyskin)<br/>**levnikmyskin** | [<img src="https://github.com/svanack404.png" width="60"/>](https://github.com/svanack404)<br/>**svanack404** |
| [<img src="https://github.com/riverwolf67.png" width="60"/>](https://github.com/riverwolf67)<br/>**riverwolf67** | [<img src="https://github.com/nottyjay.png" width="60"/>](https://github.com/nottyjay)<br/>**nottyjay** | [<img src="https://github.com/alfasin.png" width="60"/>](https://github.com/alfasin)<br/>**alfasin** | [<img src="https://github.com/ChasLui.png" width="60"/>](https://github.com/ChasLui)<br/>**ChasLui** | [<img src="https://github.com/JarrodAI.png" width="60"/>](https://github.com/JarrodAI)<br/>**JarrodAI** |
| [<img src="https://github.com/meketreve.png" width="60"/>](https://github.com/meketreve)<br/>**meketreve** | | | | |

## License

[AGPL-3.0](LICENSE)

## Author

Built by Farhan Palathinkal, [Cytostack](https://github.com/cytostack)
