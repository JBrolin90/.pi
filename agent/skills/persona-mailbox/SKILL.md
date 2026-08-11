---
name: persona-mailbox
description: Send, read, and delete asynchronous messages between personas. Each persona has an inbox at ~/.pi/agent/personas/<name>/inbox.md. Send appends a message (From, Date, Subject, body, unread mark) to the receiver's inbox. Read returns the first unread message and marks it read. Delete removes a message block once it has been read and acted on.
---

# Persona Mailbox

Asynchronous messaging between personas. Every persona owns an inbox
file at `~/.pi/agent/personas/<name>/inbox.md`. Messages live there
until read and acted on; this is not a transcript and not a log
(see `common.md` § *Persona Messaging*).

The receiver's inbox is **not** auto-loaded by the persona-loader;
you reach it only by running the operations below. That is by design.

## Paths & names

- **Inbox:** `~/.pi/agent/personas/<recipient>/inbox.md`
  - Create the file (empty, or with an H1 header `# <Recipient> — Inbox`)
    on first send if it does not exist.
- **Recipient validation:** before sending, confirm the recipient is a
  real persona — check that its directory exists, or cross-check
  `~/.pi/agent/personas/inventory.md`. A misspelled name must surface
  now, not after delivery.
- **Your name (sender / receiver):** the directory name of the active
  persona, i.e. the `## Name:` field in your `persona.md`. Use exactly
  that string.
- **Timestamp:** UTC. `date -u +%Y%m%d-%H%M%SZ` gives the id component;
  `date -u +%FT%TZ` gives the ISO 8601 `Date:` value.

## Message format

Every message is one delimited block. The `#<id>` appears in **three**
places — opening delimiter, `Status:` line, closing delimiter — so a
mark-as-read or delete edit can target exactly one block even when many
share the same `Status` text.

```
<!-- MSG #<id> -->
From: <sender name>
Date: <ISO 8601 UTC, e.g. 2026-07-22T14:03Z>
Subject: <one short line>
Status: unread #<id>

<body — free text, as long as needed>

<!-- /MSG #<id> -->
```

- `<id>` = `<your-name>-<YYYYMMDD-HHMMSSZ>` (UTC). Unique per sender per
  second; good enough for our volume.
- Blocks are appended in send order, so the **first unread block from
  the top** is the oldest unread message.
- Keep one blank line between consecutive blocks.

## Operations

### Send

1. Confirm recipient directory exists (see *Paths & names*).
2. Mint the id and date (bash, UTC):
   ```bash
   id="<your-name>-$(date -u +%Y%m%d-%H%M%SZ)"
   dateIso="$(date -u +%FT%TZ)"
   ```
3. **Append** the block to the recipient's inbox. Append via bash with
   a single-quoted heredoc so the body is taken literally and the write
   is atomic at the file end (multiple personas may send concurrently
   across terminals — do not read-then-rewrite with the `write` tool,
   which can lose a concurrent append):
   ```bash
   cat >> ~/.pi/agent/personas/<recipient>/inbox.md <<'PI_MAILBOX_EOF'

<!-- MSG #<id> -->
From: <your-name>
Date: <dateIso>
Subject: <subject>
Status: unread #<id>

<body>

<!-- /MSG #<id> -->
PI_MAILBOX_EOF
   ```
   - If you need a body that itself contains a line equal to
     `PI_MAILBOX_EOF`, pick a different single-quoted delimiter.
4. Report to the user: "sent to <recipient>: <subject> (<id>)."

### Read first unread

You reading your **own** inbox (`~/.pi/agent/personas/<your-name>/inbox.md`).

1. `read` the inbox file. If it is missing or has no `Status: unread`
   block, report "inbox empty / no unread messages." and stop.
2. Find the **first** block (top to bottom) with `Status: unread #<id>`.
3. Show the user: sender, date, subject, and body.
4. Mark it read by editing that block's status line. The `#<id>` makes
   the oldText unique across the whole file:
   - oldText: `Status: unread #<id>`
   - newText: `Status: read #<id>`
5. Tell the user one line: "marked read: <id>. Act on it, then delete
   it (see *Delete*) — do not leave read messages in the inbox."

Once you have acted on a read message (answered it, handed it off,
recorded the outcome in the relevant memory file), delete it.

### Delete

Delete a message block by `<id>`, after it has been read and acted on.

1. `read` the inbox to capture the exact block text — from the
   `<!-- MSG #<id> -->` line through the `<!-- /MSG #<id> -->` line,
   plus **one** of the blank lines around it (prefer the leading blank
   line) so the file does not accumulate double blanks.
2. `edit` with oldText = that exact block (including the chosen blank
   line), newText = `""` (empty).
3. Report: "deleted: <id>."
4. If a message is read but you have not yet acted on it, **leave it**
   in the inbox with `Status: read` — do not delete unread or un-actioned
   messages. Re-reading the inbox will surface it again only if you
   flip it back to `unread`; otherwise treat it as a held item and act
   on it (or deliberately delete it) before the turn ends.

## Concurrency note

You run multiple pi terminals, possibly as different personas. The send
path uses a single-quoted bash heredoc append (`cat >> … <<'EOF'`), so
near-simultaneous sends from two terminals do not clobber each other.
Mark-as-read and delete use the `edit`/`write` tools on a message
identified by its unique `#<id>`, so they will not touch another block.
If you ever rewrite the whole inbox with the `write` tool, you risk
losing a message appended by another terminal in the same moment —
avoid that; prefer targeted edits.

## House rules (see common.md § Persona Messaging)

- Check your own inbox at the **start of a new session**, and whenever
  the user asks.
- Read messages that have been acted on are **deleted physically** —
  inbox.md is a living document, no drift, no dead read messages.
- A read-but-unactioned message is a *held* item: per `common.md`
  § *Memory Continuity*, "held" is a real state — keep it `Status: read`
  in the inbox and act on it before the turn ends.
- Do not copy message bodies into memory.md; act on them and record
  only the outcome. Reference, don't duplicate.