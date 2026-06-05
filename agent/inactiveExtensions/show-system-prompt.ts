import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    SYSTEM PROMPT                            ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");
    console.log(event.systemPrompt);
    console.log("\n══════════════════════════════════════════════════════════════\n");

    // Also show systemPromptOptions for reference
    console.log("\n─── SYSTEM PROMPT OPTIONS ───\n");
    console.log("customPrompt:", event.systemPromptOptions?.customPrompt || "(none)");
    console.log("cwd:", event.systemPromptOptions?.cwd);
    console.log("selectedTools:", event.systemPromptOptions?.selectedTools || "(none)");
    console.log("skills:", event.systemPromptOptions?.skills?.map(s => s.name) || "(none)");
    console.log("contextFiles:", event.systemPromptOptions?.contextFiles || "(none)");
    console.log();
  });
}