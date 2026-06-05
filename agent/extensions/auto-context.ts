import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const contextFiles: string[] = [];

    // Scan from current directory up to find *-cntxt.md files
    let dir = ctx.cwd;
    const scanned = new Set<string>();

    while (dir !== path.dirname(dir)) {
      // Stop at filesystem root
      if (scanned.has(dir)) break;
      scanned.add(dir);

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith("-cntxt.md")) {
            const filePath = path.join(dir, entry.name);
            // Avoid duplicates
            if (!contextFiles.some(f => path.resolve(f) === path.resolve(filePath))) {
              contextFiles.push(filePath);
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }

      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    if (contextFiles.length === 0) return;

    // Read and combine all context files
    const contents: string[] = [];
    for (const filePath of contextFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const relativePath = path.relative(ctx.cwd, filePath);
        contents.push(`\n--- ${relativePath} ---\n${content.trim()}\n`);
      } catch {
        // Skip files we can't read
      }
    }

    if (contents.length === 0) return;

    const combined = contents.join("\n");
    const displayFiles = contextFiles.map(f => path.relative(ctx.cwd, f)).join(", ");

    return {
      message: {
        customType: "context-files",
        content: combined,
        display: false, // Don't show as a visible message
        details: { files: displayFiles },
      },
    };
  });
}