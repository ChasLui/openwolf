// GeminiAdapter — soft-instruction installer for Gemini CLI.
//
// Same rationale as CodexAdapter: Gemini's hook protocol only supports
// BeforeTool matcher "run_shell_command", no file-op matchers. OpenWolf on
// Gemini is delivered via a marker-delimited section in ~/.gemini/GEMINI.md.
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
  return path.join(os.homedir(), ".gemini");
}

function geminiMdPath(): string {
  return path.join(configDir(), "GEMINI.md");
}

function readSnippet(): string {
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
  return `${MARKER_START}\n## OpenWolf Protocol\n\nIf cwd has \`.wolf/\`, read \`.wolf/OPENWOLF.md\` and follow it.\n${MARKER_END}\n`;
}

function stripMarkerBlock(content: string): string {
  const re = new RegExp(
    `\\n*${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}\\n*`,
    "g",
  );
  return content.replace(re, "\n");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class GeminiAdapter implements AgentAdapter {
  readonly name = "gemini" as const;
  readonly projectDirEnvVar = "";

  detect(): boolean {
    return fs.existsSync(configDir());
  }

  async installGlobal(_opts: InstallOpts): Promise<void> {
    if (!this.detect()) {
      throw new Error(`Gemini CLI not detected (~/.gemini does not exist).`);
    }
    const target = geminiMdPath();
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
    const target = geminiMdPath();
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
    return JSON.stringify(out);
  }
}
