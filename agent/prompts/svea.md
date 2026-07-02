---
description: Download Svea Bank account statement(s) for a given month
argument-hint: "<YYYY-MM> [transaktionskonto|sparkonto]"
---
Run `~/.pi/agent/skills/svea-bank-statement/scripts/download.sh $1 ${2:-}` to download Svea Bank account statement(s) for the period `$1` and any account label passed as `$2` (omit the second arg to download both accounts). Use the `bash` tool with a long timeout (this involves a BankID approval on the phone and a couple of CDP-driven downloads, so allow at least 120s). Before running, briefly tell me which accounts will be downloaded and remind me to approve the BankID prompt on my phone when it appears. If the second argument is empty, do not quote an empty string — invoke the script with only `$1`.
