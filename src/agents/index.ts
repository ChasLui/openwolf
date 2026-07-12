import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentAdapter } from "./types.js";
import { codexAdapter } from "./codex.js";
import { opencodeAdapter } from "./opencode.js";
import { geminiAdapter } from "./gemini.js";
import { cursorAdapter } from "./cursor.js";

export type { AgentAdapter, AgentInstallContext, AgentInstallResult } from "./types.js";

// "claude" is not in this registry: the Claude Code integration is OpenWolf's
// native install path in cli/init.ts. This registry holds the additional
// agents wired up via `openwolf init --agent <name>`.
const ADAPTERS: Record<string, AgentAdapter> = {
  [codexAdapter.name]: codexAdapter,
  [opencodeAdapter.name]: opencodeAdapter,
  [geminiAdapter.name]: geminiAdapter,
  [cursorAdapter.name]: cursorAdapter,
};

export function availableAgents(): string[] {
  return Object.keys(ADAPTERS);
}

export function resolveAgents(names: string[]): AgentAdapter[] {
  const seen = new Set<string>();
  const result: AgentAdapter[] = [];
  for (const raw of names) {
    const name = raw.toLowerCase().trim();
    if (name === "claude" || seen.has(name)) continue; // claude is always installed
    const adapter = name === "all" ? null : ADAPTERS[name];
    if (name === "all") {
      for (const a of Object.values(ADAPTERS)) {
        if (!seen.has(a.name)) { seen.add(a.name); result.push(a); }
      }
      continue;
    }
    if (!adapter) {
      throw new Error(`Unknown agent "${raw}". Valid agents: claude, ${availableAgents().join(", ")}, all`);
    }
    seen.add(name);
    result.push(adapter);
  }
  return result;
}

/** Shared OpenWolf context snippet injected into AGENTS.md / GEMINI.md / rules. */
export function readSnippet(templatesDir: string): string {
  const p = path.join(templatesDir, "agents-md-snippet.md");
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return `# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.`;
  }
}
