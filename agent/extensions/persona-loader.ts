import type {
  BeforeAgentStartEvent,
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  SessionStartEvent,
} from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Module-level state - persists for the lifetime of the session
let pendingPersonaPrompt = "";

interface PersonaLoadResult {
  content: string;
  created: boolean;
}

function loadPersonaContent(personaName: string): PersonaLoadResult {
  let extraPrompt = "";
  let projectCreated = false;

  try {
    // 1. Load common guidelines
    const commonPath = path.join(os.homedir(), ".pi", "agent", "personas", "common.md");
    if (fs.existsSync(commonPath)) {
      const commonContent = fs.readFileSync(commonPath, "utf-8");
      extraPrompt += `\n\n# Shared Persona Guidelines (common.md)\n`;
      extraPrompt += `${commonContent.trim()}\n`;
    }

    // 2. Load persona profile
    const personaPath = path.join(os.homedir(), ".pi", "agent", "personas", personaName, "persona.md");
    if (fs.existsSync(personaPath)) {
      const personaContent = fs.readFileSync(personaPath, "utf-8");
      extraPrompt += `\n\n# Persona Profile (${personaName})\n`;
      extraPrompt += `${personaContent.trim()}\n`;
    } else {
      console.warn(`[persona-loader] persona.md not found for "${personaName}"`);
      return { content: "", created: false };
    }

    // 3. Load persona memory (cross-project working notes)
    const memoryPath = path.join(os.homedir(), ".pi", "agent", "personas", personaName, "memory.md");
    if (fs.existsSync(memoryPath)) {
      const memoryContent = fs.readFileSync(memoryPath, "utf-8");
      extraPrompt += `\n\n# Persona Memory (memory.md)\n`;
      extraPrompt += `${memoryContent.trim()}\n`;
    }

    // 4. Per-project persona memory tier: <cwd>/.personas/<name>/. Auto-creates
    //    the directory and an empty project.md on first adopt in this cwd,
    //    then reads every .md file in the directory (sorted alphabetically).
    const projectMemory = loadProjectPersonaMemory(personaName);
    extraPrompt += projectMemory.content;
    projectCreated = projectMemory.created;

    // 5. Memory Guidelines footer — points the agent at each memory tier
    //    and the shared project spec, with one rule per tier.
    const resolvedPersonaDir = path.join(os.homedir(), ".pi", "agent", "personas", personaName);
    const resolvedProjectMd = path.join(process.cwd(), ".personas", personaName, "project.md");
    extraPrompt += `\n\n# Memory Guidelines\n`;
    extraPrompt += `- Your cross-project persona memory: ${path.join(resolvedPersonaDir, "memory.md")}\n`;
    extraPrompt += `- Your per-project persona memory: ${resolvedProjectMd}\n`;
    extraPrompt += `- The shared project spec (read by all personas in this project): <cwd>/AGENT.md\n`;
    extraPrompt += `- **CRITICAL**: If the user explicitly asks you to remember something, corrects you, or you learn something new, you MUST proactively update your memory file using your file editing tools. Durable cross-project learnings go in memory.md; per-project working notes go in project.md; shared project spec changes go in AGENT.md. Do not maintain an achievement log in any persona file — git history is the canonical record of project history.\n`;

  } catch (err) {
    console.error("[persona-loader] failed to load persona files:", err);
    return { content: "", created: false };
  }

  return { content: extraPrompt, created: projectCreated };
}

// Per-project persona memory: <cwd>/.personas/<name>/. Lazily creates the
// directory and an empty project.md on first adopt in a given cwd, then
// reads every .md file in the directory (sorted) for inclusion in the
// persona prompt. Returns an empty { content: "" } if anything fails so
// the persona still loads even when the per-project tier is unreachable.
function loadProjectPersonaMemory(personaName: string): PersonaLoadResult {
  const projectDir = path.join(process.cwd(), ".personas", personaName);
  const projectMdPath = path.join(projectDir, "project.md");
  let created = false;
  let content = "";

  try {
    const dirExistedBefore = fs.existsSync(projectDir);
    const mdExistedBefore = fs.existsSync(projectMdPath);
    fs.mkdirSync(projectDir, { recursive: true });
    if (!mdExistedBefore) {
      fs.writeFileSync(projectMdPath, "", "utf-8");
    }
    created = !dirExistedBefore || !mdExistedBefore;
  } catch (err) {
    console.error(`[persona-loader] failed to initialise project memory for "${personaName}":`, err);
    return { content: "", created: false };
  }

  try {
    const entries = fs.readdirSync(projectDir, { withFileTypes: true });
    const mdFiles = entries
      .filter((e: fs.Dirent) => e.isFile() && e.name.endsWith(".md"))
      .map((e: fs.Dirent) => e.name)
      .sort();
    for (const name of mdFiles) {
      const filePath = path.join(projectDir, name);
      const fileContent = fs.readFileSync(filePath, "utf-8").trim();
      content += `\n\n# Project Memory (${name})\n`;
      if (fileContent.length > 0) {
        content += `${fileContent}\n`;
      }
    }
  } catch (err) {
    console.error(`[persona-loader] failed to read project memory for "${personaName}":`, err);
  }

  return { content, created };
}

// Reads the `## Title:` line from `<name>/persona.md`. Returns the trimmed
// title text, or "" if the line is missing or the file is unreadable. Used
// to label the TUI footer status row; the value is metadata for the footer,
// not prompt content, so it lives in its own helper rather than as another
// field on PersonaLoadResult.
function loadPersonaTitle(personaName: string): string {
  const personaPath = path.join(os.homedir(), ".pi", "agent", "personas", personaName, "persona.md");
  try {
    if (!fs.existsSync(personaPath)) {
      return "";
    }
    const content = fs.readFileSync(personaPath, "utf-8");
    const match = content.match(/^## Title:\s*(.+?)\s*$/m);
    return match ? match[1] : "";
  } catch (err) {
    console.error(`[persona-loader] failed to read title for "${personaName}":`, err);
    return "";
  }
}

// Builds autocomplete items for the persona picker. Each item carries:
// - `value` and `label`: the directory name (the loader's runtime identifier;
//   matches the `## Name:` field per `common.md`).
// - `description`: the persona's `## Title:` line, rendered as a secondary
//   column in the dropdown. Empty when the line is missing or unreadable, in
//   which case the dropdown falls back to a name-only display for that row.
//
// Used by both `getArgumentCompletions` (the natural-trigger path that fires
// when the user types a letter) and the custom autocomplete provider
// registered in `session_start` (the Tab path that fires immediately on
// `/become-persona ` or on Tab-with-arg). Both paths render the same shape
// so the dropdown looks identical regardless of how it was triggered.
function listPersonaCompletions(prefix: string): Array<{ value: string; label: string; description?: string }> {
  const personas = listPersonas();
  const filtered = personas.filter(p => p.toLowerCase().startsWith(prefix.toLowerCase()));
  return filtered.map(p => {
    const title = loadPersonaTitle(p);
    return title
      ? { value: p, label: p, description: title }
      : { value: p, label: p };
  });
}

function listPersonas(): string[] {
  const personasDir = path.join(os.homedir(), ".pi", "agent", "personas");
  try {
    const entries = fs.readdirSync(personasDir, { withFileTypes: true });
    return entries
      .filter((e: fs.Dirent) => e.isDirectory())
      .map((e: fs.Dirent) => e.name);
  } catch {
    return [];
  }
}

export default function (pi: ExtensionAPI) {

  // Register /become-persona command
  pi.registerCommand("become-persona", {
    description: "Switch to a persona profile",
    getArgumentCompletions: (prefix: string) => {
      const items = listPersonaCompletions(prefix);
      return items.length > 0 ? items : null;
    },
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const personaName = args.trim();

      if (!personaName) {
        const personas = listPersonas();
        if (personas.length === 0) {
          ctx.ui.notify("No personas found", "warning");
          return;
        }
        ctx.ui.notify(`Available personas: ${personas.join(", ")}`, "info");
        return;
      }

      // Remove quotes if present
      const cleanName = personaName.replace(/['"`]/g, "");

      // Load persona content (auto-creates per-project memory on first adopt).
      const result = loadPersonaContent(cleanName);
      if (!result.content) {
        ctx.ui.notify(`Persona "${cleanName}" not found`, "error");
        return;
      }

      // Store for before_agent_start to pick up.
      pendingPersonaPrompt = result.content;

      // Show active persona in the TUI footer (same lifetime as the staged prompt).
      // Format: `👤 <name> — <title>` when the persona's `## Title:` line is
      // present (see loadPersonaTitle), `👤 <name>` when it is missing or
      // unreadable.
      if (ctx.hasUI) {
        const title = loadPersonaTitle(cleanName);
        const statusText = title ? `👤 ${cleanName} — ${title}` : `👤 ${cleanName}`;
        ctx.ui.setStatus("persona", statusText);
      }

      ctx.ui.notify(`Switched to persona: ${cleanName}`, "info");
      if (result.created) {
        ctx.ui.notify(`Initialised project memory at .personas/${cleanName}/`, "info");
      }
    },
  });

  // Register a custom autocomplete provider so Tab on `/become-persona` (with
  // or without an argument) shows the persona dropdown immediately, rather
  // than routing to file completion. Pi's built-in `CombinedAutocompleteProvider`
  // routes Tab on slash-command-with-arg to file completion by design
  // (see `handleTabCompletion` in @earendil-works/pi-tui), which meant the
  // existing `getArgumentCompletions` only fired on natural triggers (typing a
  // letter). The wrapper below intercepts `/become-persona` patterns before the
  // built-in sees them, returns `listPersonaCompletions(argPrefix)` items, and
  // otherwise delegates so non-persona slash commands and file paths are
  // unaffected.
  pi.on("session_start", (_event: SessionStartEvent, ctx: ExtensionContext) => {
    ctx.ui.addAutocompleteProvider((current) => ({
      async getSuggestions(lines, cursorLine, cursorCol, options) {
        const line = lines[cursorLine] ?? "";
        const beforeCursor = line.slice(0, cursorCol);
        // Match `/become-persona` followed by whitespace and an optional
        // non-whitespace prefix. The trailing `$` ensures we only match when
        // the cursor sits inside the argument (no extra trailing text);
        // anything else falls through to the built-in provider.
        const match = beforeCursor.match(/^\/become-persona[ \t]+(\S*)$/);
        if (!match) {
          return current.getSuggestions(lines, cursorLine, cursorCol, options);
        }
        const argPrefix = match[1];
        const items = listPersonaCompletions(argPrefix);
        if (items.length === 0) {
          return null;
        }
        return { prefix: argPrefix, items };
      },
      applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
        return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
      },
      // Override the built-in's shouldTriggerFileCompletion for the
      // `/become-persona<ws>` pattern. The built-in (`CombinedAutocompleteProvider`
      // in @earendil-works/pi-tui) checks `textBeforeCursor.trim().includes(" ")`
      // — the `.trim()` strips the trailing space after a slash command, so
      // `/become-persona ` looks like `/become-persona` (no space) and the
      // built-in returns `false`. The editor's `requestAutocomplete` then
      // returns early without firing the autocomplete request, and Tab on
      // `/become-persona ` shows nothing. We match the un-trimmed text here
      // and return `true` so the request fires; `getSuggestions` above then
      // produces the persona dropdown. Scoped to our command so we don't
      // change behaviour for other slash commands.
      shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
        const currentLine = lines[cursorLine] ?? "";
        const beforeCursor = currentLine.slice(0, cursorCol);
        if (/^\/become-persona[ \t]/.test(beforeCursor)) {
          return true;
        }
        return current.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
      },
    }));
  });

  // Apply persona prompt before every agent start. The prompt is staged in
  // module-level state by the command handler and intentionally NOT cleared
  // after the turn, so the persona remains active for the rest of the session.
  pi.on("before_agent_start", async (event: BeforeAgentStartEvent, _ctx: ExtensionContext) => {
    if (!pendingPersonaPrompt) {
      return;
    }

    return {
      systemPrompt: event.systemPrompt + pendingPersonaPrompt,
    };
  });
}
