import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // List of dangerous command patterns with descriptions
  const dangerousCommands = [
    { pattern: /^\s*rm\s+-rf\b/, name: "rm -rf (recursive delete)" },
    { pattern: /^\s*rm\s+-[rRf]\s+\//, name: "rm -rf / (root delete)" },
    { pattern: /^\s*rm\s+-[rRf]\s+\./, name: "rm -rf current directory" },
    { pattern: /^\s*rm\s+-[rRf]\s+\.\.\//, name: "rm -rf parent directory" },
    { pattern: /^\s*sudo\s+/, name: "sudo (superuser)" },
    { pattern: /^\s*:\s*\!/, name: "vim/bash history overwrite" },
    { pattern: /^\s*dd\s+/, name: "dd (direct disk write)" },
    { pattern: /\bmkfs\b/, name: "mkfs (filesystem creation)" },
    { pattern: /\bformat\b/, name: "format command" },
    { pattern: />\s*\/dev\/sd[a-z]/, name: "direct device write" },
    { pattern: /(?:^|\s)>{1,2}?\s*\/dev\/null(?:\s|$|2>&1|&>|>)/, name: "redirect to /dev/null" },
    { pattern: /^\s*chmod\s+-R?\s+777\b/, name: "chmod 777" },
    { pattern: /^\s*chmod\s+-R\s+777\b/, name: "chmod -R 777" },
    { pattern: /^\s*chown\s+.*-R\b/, name: "chown recursive" },
    { pattern: /^\s*shutdown\b/, name: "shutdown" },
    { pattern: /^\s*reboot\b/, name: "reboot" },
    { pattern: /^\s*init\s+\d/, name: "init runlevel" },
    { pattern: /^\s*killall\b/, name: "killall" },
    { pattern: /^\s*pkill\b/, name: "pkill" },
    { pattern: /curl\s+.*\|\s*sh/, name: "curl | sh" },
    { pattern: /wget\s+.*\|\s*sh/, name: "wget | sh" },
    { pattern: /\bshutdown\b/, name: "shutdown command" },
    { pattern: /halt\b/, name: "halt command" },
    { pattern: /poweroff\b/, name: "poweroff command" },
    { pattern: /^\s*cat\s+\/etc\/shadow/, name: "read shadow file" },
    { pattern: /^\s*passwd\s+root/, name: "change root password" },
    { pattern: /^\s*crontab\s+-r\b/, name: "crontab delete all" },
    { pattern: /^\s*iptables\s+/, name: "iptables firewall" },
    { pattern: /^\s*ufw\s+disable/, name: "disable firewall" },
    { pattern: /^\s*mount\s+--bind/, name: "mount bind" },
    { pattern: /^\s*umount\s+-f/, name: "force unmount" },
  ];

  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;

    const command = event.input.command || "";

    for (const { pattern, name } of dangerousCommands) {
      if (pattern.test(command)) {
        const confirmed = await ctx.ui.confirm(
          "⚠️ Dangerous Command",
          `You are about to run:\n\n${name}\n\n\`${command}\`\n\nDo you want to continue?`
        );

        if (!confirmed) {
          ctx.ui.notify(`Blocked: ${name}`, "warning");
          return { block: true, reason: "User declined dangerous command" };
        }
        ctx.ui.notify(`Allowed: ${name}`, "info");
        break;
      }
    }
  });
}