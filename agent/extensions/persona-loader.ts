import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

function getMessageText(message: any): string {
  if (!message) return "";
  if (typeof message.content === "string") {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .map((block: any) => (block.type === "text" ? block.text : ""))
      .join("\n");
  }
  return "";
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    let activePersona: string | null = null;
    try {
      const entries = ctx.sessionManager.getEntries();
      // Look from the end of the session entries backwards to find the last become-persona command
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry.type === "message" && entry.message && entry.message.role === "user") {
          const text = getMessageText(entry.message);
          if (text.includes("become-persona")) {
            // Check for skill-wrapped command: </skill>\n\nPersonaName
            const skillEnd = text.indexOf("</skill>");
            if (skillEnd !== -1) {
              const afterSkill = text.slice(skillEnd + "</skill>".length).trim();
              const lines = afterSkill.split("\n");
              if (lines.length > 0) {
                activePersona = lines[0].trim().replace(/['"`]/g, ""); // strip quotes
              }
            } else {
              // Check for plain slash command: /become-persona PersonaName
              const match = text.match(/(?:^|\s)\/?become-persona\s+(\w+)/i);
              if (match) {
                activePersona = match[1].trim();
              }
            }
            if (activePersona) {
              break;
            }
          }
        }
      }
    } catch (err) {
      // Fallback: don't crash the agent start if we fail to read session entries
    }

    if (!activePersona) return;

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
      const personaPath = path.join(os.homedir(), ".pi", "agent", "personas", activePersona, "persona.md");
      if (fs.existsSync(personaPath)) {
        const personaContent = fs.readFileSync(personaPath, "utf-8");
        extraPrompt += `\n\n# Persona Profile (${activePersona})\n`;
        extraPrompt += `${personaContent.trim()}\n`;
      }

      // 3. Load persona memory
      const memoryPath = path.join(os.homedir(), ".pi", "agent", "personas", activePersona, "memory.md");
      if (fs.existsSync(memoryPath)) {
        const memoryContent = fs.readFileSync(memoryPath, "utf-8");
        extraPrompt += `\n\n# Persona Memory (memory.md)\n`;
        extraPrompt += `${memoryContent.trim()}\n`;
      }

      // Explicitly guide the agent about memory file location and guidelines
      const resolvedPersonaDir = path.join(os.homedir(), ".pi", "agent", "personas", activePersona);
      extraPrompt += `\n\n# Memory Guidelines\n`;
      extraPrompt += `- Your active persona path is: ${resolvedPersonaDir}\n`;
      extraPrompt += `- Your memory file is located at: ${path.join(resolvedPersonaDir, "memory.md")}\n`;
      extraPrompt += `- **CRITICAL**: If the user explicitly asks you to remember something, corrects you, or you learn something new, you MUST proactively update your memory file using your file editing tools.\n`;

    } catch (err) {
      // Fallback: don't crash
    }

    if (extraPrompt) {
      return {
        systemPrompt: event.systemPrompt + extraPrompt,
      };
    }
  });
}
