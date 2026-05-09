# Multi-Agent Runtime PR

## Summary

This PR adds a `--agent <name>` flag to `openwolf init`, supporting 5 new
AI coding agents in addition to Claude Code:

- **codex** — `~/.codex/AGENTS.md` marker block
- **gemini** — `~/.gemini/GEMINI.md` marker block
- **opencode** — `~/.config/opencode/openwolf-instructions.md` + patches
  `opencode.json` `instructions[]` array
- **openclaw** — `~/.openclaw/workspace/AGENTS.md` marker block
- **hermes** — Python plugin (entry-point `hermes_agent.plugins.openwolf`),
  installed into Hermes' venv via `uv pip install -e`, plus
  `~/.hermes/config.yaml` `plugins.enabled` patch

Default behavior (no `--agent` flag) is **bit-for-bit identical to v1.0.4**:
the original `initCommand()` flow runs unchanged. Existing users see no
difference.

Closes #2 (Codex Support), #5/#6 (OpenCode support), #22 (Gemini CLI Support).

## Architecture

A new `src/agents/` directory introduces an `AgentAdapter` interface:

```typescript
interface AgentAdapter {
  name: AgentName;
  detect(): boolean;
  installGlobal(opts: InstallOpts): Promise<void>;
  uninstallGlobal(): Promise<void>;
  parseHookInput(stdin: string): NormalizedHookInput;
  emitHookOutput(decision: HookDecision): string;
  projectDirEnvVar: string;
}
```

Each adapter encapsulates one agent's quirks: where to write the integration
file, what hook protocol the agent speaks (if any), how to parse/emit hook
JSON. Core OpenWolf logic (anatomy / cerebrum / token-ledger) stays
agent-agnostic.

See `docs/adr/ADR-001-multi-agent-runtime.md` for the full design rationale,
including the rejected alternatives (plugin-only, soft-instructions-only,
hard-coded fork without abstraction).

## Honest Limitations

OpenWolf's full power (auto-injecting anatomy descriptions before reads,
catching repeated reads, post-write anatomy refresh) requires hooks at the
agent's `Read` / `Write` / `Edit` tool boundaries. Of the 5 new agents:

- **codex / gemini / opencode / openclaw**: hook protocols only support
  shell-command interception (no file-op matchers). These agents get
  **soft instructions** — the agent voluntarily reads `.wolf/anatomy.md`,
  `.wolf/cerebrum.md` per the protocol injected into their AGENTS.md /
  GEMINI.md / instructions[]. No hook-level enforcement.
- **hermes**: Python plugin can hook `pre_tool_call` and write to `.wolf/`
  state files (memory.md, token-ledger.json), but Hermes API has no
  system-prompt injection point. Plugin does passive bookkeeping +
  registers a `/openwolf` slash command (status / scan).

Only **claude** still gets the full hook-driven experience. The other 5
agents get the "agent reads .wolf/ voluntarily" experience, which is
strictly better than no integration but weaker than Claude's.

This is documented per-adapter in `src/agents/*.ts` headers and in
ADR-001 "Findings during Phase 1a".

## Testing

End-to-end tested locally (macOS arm64, all 5 new agents installed and live):

| Agent | Install | Idempotent (reinstall ×2) | Uninstall | Reinstall |
|-------|---------|--------------------------|-----------|-----------|
| codex | ✅ marker block in ~/.codex/AGENTS.md | ✅ count=1 | ✅ block stripped | ✅ |
| gemini | ✅ marker block in ~/.gemini/GEMINI.md | ✅ count=1 | ✅ block stripped | ✅ |
| opencode | ✅ instructions.md + opencode.json patched | ✅ no dup path | ✅ both removed | ✅ |
| openclaw | ✅ marker block in ~/.openclaw/workspace/AGENTS.md | ✅ count=1 | ✅ block stripped | ✅ |
| hermes | ✅ openwolf-hermes 0.1.0 in venv + config.yaml plugins.enabled | ✅ entry count=1 | ✅ pkg uninstalled, config rolled back | ✅ |

`tsc --noEmit` reports 0 type errors on all new code. Pre-existing errors
in `src/cli/`, `src/hooks/`, `bin/` are upstream and untouched (need
`@types/node` install).

## Phased landing

If a single 7-commit PR is too much, this can land in 4 separate PRs:

1. **ADR-only** (commit `bddf690` + `be6c54e`): documentation + AgentAdapter
   skeleton. Zero behavior change.
2. **Codex + Gemini** (commits `13e3d66` + `963fbc8`): two soft-instruction
   adapters + `--agent` flag. Default unchanged.
3. **OpenClaw + OpenCode** (commit `981084f`): two more soft-instruction
   adapters.
4. **Hermes** (commits `c08bb69` + `a40b0dd`): Python plugin + adapter.

Happy to split if preferred.

## Out of scope (future PRs)

- ClaudeAdapter refactor: `src/cli/init.ts` `HOOK_SETTINGS` + Claude-specific
  `.claude/settings.json` write logic still lives in `init.ts`. Phase 1d in
  ADR-001 plans to refactor it into `ClaudeAdapter.installGlobal()` so
  Claude becomes "just another adapter". Behavior identical, code organization
  cleaner. Holding back to keep this PR review-able.
- PyPI publish of `openwolf-hermes`: currently dev-installed from
  `src/agents/hermes/python/`. Once API stabilizes, will publish to PyPI
  so users don't need a local fork checkout.
- AGPL-3.0 derivative concerns for OpenCode TS plugin / Hermes Python
  plugin: should they be AGPL too? Currently the Hermes plugin pyproject
  declares `license = "AGPL-3.0-only"`. Would value upstream's perspective.
- Test infrastructure: no integration tests for adapters yet. Manual
  testing only. Would add `vitest` + per-adapter tests if direction is
  acceptable.

## Author note

I'm a heavy OpenWolf user across all 6 agents and was about to write 5
separate plugins as workarounds. The adapter pattern in this PR pushes the
common code (anatomy / cerebrum / ledger maintenance) back into OpenWolf
core where it belongs, with thin per-agent wrappers. Happy to discuss
direction, scope, or split the PR however maintainers prefer.

— Chao Liu (@ChasLui)
