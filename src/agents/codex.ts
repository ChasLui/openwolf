// CodexAdapter — soft-instruction installer for Codex CLI.
//
// Codex's hook protocol only supports matcher "shell" (no Read/Write/Edit
// matcher). Rather than register a shell-only hook that competes with
// pandafilter / rtk for the same slot, OpenWolf on Codex is delivered as a
// pure soft-instruction: append a marker-delimited section to
// ~/.codex/AGENTS.md that tells Codex to follow the OpenWolf protocol when
// the cwd contains a `.wolf/` directory.
//
// Idempotent: repeated `openwolf init --agent codex` only updates the
// content between `<!-- openwolf:start -->` and `<!-- openwolf:end -->`.
//
// See ADR-001 "Findings during Phase 1a" for hook-protocol rationale.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  AgentAdapter,
  HookDecision,
  InstallOpts,
  NormalizedHookInput,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKER_START = "<!-- openwolf:start -->";
const MARKER_END = "<!-- openwolf:end -->";

function configDir(): string {
  return path.join(os.homedir(), ".codex");
}

function agentsMdPath(): string {
  return path.join(configDir(), "AGENTS.md");
}

function readSnippet(): string {
  // Resolve src/agents/snippets/openwolf-cross-agent.md relative to this file
  const candidates = [
    path.resolve(__dirname, "snippets", "openwolf-cross-agent.md"),
    path.resolve(
      __dirname,
      "..",
      "..",
      "src",
      "agents",
      "snippets",
      "openwolf-cross-agent.md",
    ),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
  }
  // Embedded fallback for installs without source files
  return `${MARKER_START}\n## OpenWolf Protocol (active when project has \`.wolf/\`)\n\nRead \`.wolf/OPENWOLF.md\` at session start and follow it. Check \`.wolf/anatomy.md\` before reading project files. Check \`.wolf/cerebrum.md\` before generating code. Update \`.wolf/memory.md\` after file changes.\n${MARKER_END}\n`;
}

function stripMarkerBlock(content: string): string {
  // Remove any existing OpenWolf marker block (re-install / uninstall)
  const re = new RegExp(
    `\\n*${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}\\n*`,
    "g",
  );
  return content.replace(re, "\n");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class CodexAdapter implements AgentAdapter {
  readonly name = "codex" as const;
  readonly projectDirEnvVar = "";

  detect(): boolean {
    return fs.existsSync(configDir());
  }

  async installGlobal(_opts: InstallOpts): Promise<void> {
    if (!this.detect()) {
      throw new Error(
        `Codex not detected (~/.codex does not exist). Install Codex CLI first.`,
      );
    }
    const target = agentsMdPath();
    const snippet = readSnippet();
    let existing = "";
    if (fs.existsSync(target)) {
      existing = fs.readFileSync(target, "utf-8");
    }
    const stripped = stripMarkerBlock(existing).trimEnd();
    const next = stripped
      ? `${stripped}\n\n${snippet.trim()}\n`
      : `${snippet.trim()}\n`;
    fs.writeFileSync(target, next, "utf-8");
  }

  async uninstallGlobal(): Promise<void> {
    const target = agentsMdPath();
    if (!fs.existsSync(target)) return;
    const existing = fs.readFileSync(target, "utf-8");
    const stripped = stripMarkerBlock(existing);
    fs.writeFileSync(target, stripped, "utf-8");
  }

  parseHookInput(stdin: string): NormalizedHookInput {
    const raw = JSON.parse(stdin) as { tool_input?: { command?: string } };
    return { tool: "shell", command: raw.tool_input?.command, raw };
  }

  emitHookOutput(decision: HookDecision): string {
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
