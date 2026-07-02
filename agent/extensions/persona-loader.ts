import type {
  BeforeAgentStartEvent,
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Module-level state - persists for the lifetime of the session
let pendingPersonaPrompt = "";

function loadPersonaContent(personaName: string): string {
  let extraPrompt = "";
  
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
      return "";
    }

    // 3. Load persona memory
    const memoryPath = path.join(os.homedir(), ".pi", "agent", "personas", personaName, "memory.md");
    if (fs.existsSync(memoryPath)) {
      const memoryContent = fs.readFileSync(memoryPath, "utf-8");
      extraPrompt += `\n\n# Persona Memory (memory.md)\n`;
      extraPrompt += `${memoryContent.trim()}\n`;
    }

    // Explicitly guide the agent about memory file location and guidelines
    const resolvedPersonaDir = path.join(os.homedir(), ".pi", "agent", "personas", personaName);
    extraPrompt += `\n\n# Memory Guidelines\n`;
    extraPrompt += `- Your active persona path is: ${resolvedPersonaDir}\n`;
    extraPrompt += `- Your memory file is located at: ${path.join(resolvedPersonaDir, "memory.md")}\n`;
    extraPrompt += `- **CRITICAL**: If the user explicitly asks you to remember something, corrects you, or you learn something new, you MUST proactively update your memory file using your file editing tools.\n`;

  } catch (err) {
    console.error("[persona-loader] failed to load persona files:", err);
    return "";
  }
  
  return extraPrompt;
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
      const personas = listPersonas();
      const filtered = personas.filter(p => p.toLowerCase().startsWith(prefix.toLowerCase()));
      return filtered.length > 0 
        ? filtered.map(p => ({ value: p, label: p }))
        : null;
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
      
      // Load persona content
      const extraPrompt = loadPersonaContent(cleanName);
      if (!extraPrompt) {
        ctx.ui.notify(`Persona "${cleanName}" not found`, "error");
        return;
      }
      
      // Store for before_agent_start to pick up
      pendingPersonaPrompt = extraPrompt;
      
      ctx.ui.notify(`Switched to persona: ${cleanName}`, "info");
    },
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
