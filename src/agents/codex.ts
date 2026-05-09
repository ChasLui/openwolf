// CodexAdapter — DEGRADED: Codex hooks only support `matcher: "shell"`.
// No Read/Write/Edit matcher exists in Codex hook protocol (verified 2026-05-09
// against ~/.codex/hooks.json and pandafilter v1.3.5 codex impl).
//
// Capabilities:
//   ✗ SessionStart  — no Codex equivalent (hook only fires on tool use)
//   ✗ pre-read      — no Read matcher
//   ✗ pre-write     — no Write/Edit matcher
//   ✓ pre-shell     — PreToolUse matcher "shell" (rewrites/inspects commands)
//   ✓ post-shell    — PostToolUse matcher "shell"
//   ✗ Stop          — no Codex equivalent
//
// Strategy: install ONLY pre-shell + post-shell hooks. The remaining 4 OpenWolf
// hooks (file-op centric) are unsupported. Compensate via soft-instructions in
// ~/.codex/AGENTS.md (`@OPENWOLF.md` reference) so the agent voluntarily reads
// .wolf/anatomy.md / cerebrum.md / OPENWOLF.md.
//
// Hook input shape:  {tool_input: {command: string}}
// Hook output shape: {decision: "allow", hookSpecificOutput: {tool_input: {command: string}}}
// CRITICAL: must always exit 0. Non-zero exit terminates the Codex session.
// Config file: ~/.codex/hooks.json
// Project dir env: NONE (Codex doesn't expose a project-root env var) → fall
// back to process.cwd().

import type {
  AgentAdapter,
  HookDecision,
  InstallOpts,
  NormalizedHookInput,
} from "./types.js";

export class CodexAdapter implements AgentAdapter {
  readonly name = "codex" as const;
  readonly projectDirEnvVar = ""; // none

  detect(): boolean {
    // ~/.codex/ exists
    throw new Error("not yet implemented");
  }

  async installGlobal(_opts: InstallOpts): Promise<void> {
    // 1. Write ~/.codex/openwolf-rewrite.sh (shell-rewrite hook)
    // 2. Patch ~/.codex/hooks.json adding PreToolUse + PostToolUse matcher: "shell"
    // 3. Append to ~/.codex/AGENTS.md a @OPENWOLF.md reference (soft instruction)
    throw new Error("not yet implemented");
  }

  async uninstallGlobal(): Promise<void> {
    throw new Error("not yet implemented");
  }

  parseHookInput(stdin: string): NormalizedHookInput {
    const raw = JSON.parse(stdin) as { tool_input?: { command?: string } };
    const command = raw.tool_input?.command;
    return { tool: "shell", command, raw };
  }

  emitHookOutput(decision: HookDecision): string {
    // Codex requires {decision: "allow"} or it kills session.
    const out: Record<string, unknown> = {
      decision: decision.allow ? "allow" : "deny",
    };
    if (decision.allow && decision.updatedCommand) {
      out.hookSpecificOutput = {
        tool_input: { command: decision.updatedCommand },
      };
    }
    if (decision.reason) {
      (out as { reason?: string }).reason = decision.reason;
    }
    return JSON.stringify(out);
  }
}
