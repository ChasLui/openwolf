// GeminiAdapter — DEGRADED: Gemini CLI hooks only support BeforeTool with
// matcher "run_shell_command". No Read/Write file-op matchers (verified
// 2026-05-09 against ~/.gemini/settings.json and rtk + pandafilter impls).
//
// Capabilities:
//   ✗ SessionStart       — no equivalent
//   ✗ pre-read           — no Read matcher
//   ✗ pre-write          — no Write/Edit matcher
//   ✓ pre-shell          — BeforeTool matcher "run_shell_command"
//   ?  post-shell         — Gemini AfterTool exists; needs verification
//   ✗ Stop               — no equivalent
//
// Strategy: same as CodexAdapter — install pre-shell only, fall back to soft
// instructions in ~/.gemini/GEMINI.md.
//
// Config file: ~/.gemini/settings.json (hook section: hooks.BeforeTool[])
// Hook script: shell binary (e.g. ~/.gemini/openwolf-hook.sh that execs
//   "openwolf hook gemini" delegating to a Node shim).
// Project dir env: GEMINI doesn't expose one — fall back to process.cwd().

import type {
  AgentAdapter,
  HookDecision,
  InstallOpts,
  NormalizedHookInput,
} from "./types.js";

export class GeminiAdapter implements AgentAdapter {
  readonly name = "gemini" as const;
  readonly projectDirEnvVar = "";

  detect(): boolean {
    // ~/.gemini/ exists
    throw new Error("not yet implemented");
  }

  async installGlobal(_opts: InstallOpts): Promise<void> {
    // 1. Write ~/.gemini/openwolf-hook.sh
    // 2. Patch ~/.gemini/settings.json hooks.BeforeTool[] matcher: "run_shell_command"
    // 3. Append to ~/.gemini/GEMINI.md a @OPENWOLF.md reference
    throw new Error("not yet implemented");
  }

  async uninstallGlobal(): Promise<void> {
    throw new Error("not yet implemented");
  }

  parseHookInput(stdin: string): NormalizedHookInput {
    // Gemini CLI hook input shape — to be confirmed against actual stdin
    // during Phase 1b live-test. Placeholder mirrors panda assumption.
    const raw = JSON.parse(stdin) as { tool_input?: { command?: string } };
    return { tool: "shell", command: raw.tool_input?.command, raw };
  }

  emitHookOutput(decision: HookDecision): string {
    // Gemini hook output shape — TODO confirm. Placeholder: same as Codex.
    const out: Record<string, unknown> = {
      decision: decision.allow ? "allow" : "deny",
    };
    if (decision.allow && decision.updatedCommand) {
      out.hookSpecificOutput = {
        tool_input: { command: decision.updatedCommand },
      };
    }
    return JSON.stringify(out);
  }
}
