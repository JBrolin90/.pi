---
name: harness-wiki
description: Manages a personal knowledge base for the Harness project using a wiki structure. Handles ingesting from source codebases, maintaining wiki pages with confidence scores, and answering questions by synthesizing wiki content.
---

# Harness Wiki Agent

**Maintainer**: joachim@earendil.fr

**Project**: Harness (< 100 files, Python-based)

## Trigger

Automatically active when working in or near the HarnessWiki project directory.

---

## Philosophy

> "Stop re-deriving, start compiling."

RAG retrieves and forgets. A wiki accumulates and compounds. Read sources once, answer questions forever.

---

## Folder Structure

```
raw/          — immutable source documents
wiki/         — markdown pages maintained by agent
wiki/index.md — table of contents
wiki/log.md   — append-only operation log
```

---

## Source Configuration

Configured `source_paths` point to external codebases **without copying files**:

```yaml
source_paths:
  - path: /home/joachim/lab/prj/Harness
    types: ["*.py", "*.md", "*.yaml", "*.txt"]
    
ignore_patterns:
  - "__pycache__/*"
  - ".pytest_cache/*"
  - ".vscode/*"
  - ".git/*"
  - "node_modules/*"
  - "*.pyc"
```

---

## Core Rules

### Read-Only Access

When `source_paths` is configured:
- **DO NOT** copy files to `raw/` — read directly from `source_paths`
- **DO NOT** modify files in `source_paths`
- **DO NOT** create new files in source directories
- Treat `source_paths` as **read-only references**

### Ingest Workflow (from source_paths)

1. Read directly from configured paths
2. Discuss key takeaways with user
3. Create summary page **in wiki/** (not in raw/)
4. Create concept pages for major ideas
5. Link to source files with `[[source-path/file.ext]]` syntax
6. Update `wiki/index.md` and `wiki/log.md`

### Ingest from raw/ vs source_paths

| Source | Action |
|--------|--------|
| Files in `raw/` | Copy to wiki as-is, create pages |
| Files in `source_paths` | Read directly, summarize in wiki pages |

---

## Page Format

```markdown
# Page Title

**Summary**: One sentence describing this page.

**Sources**: [[source-file.ext]]

**Last updated**: YYYY-MM-DD

**Confidence**: 0.0-1.0

---

Content with [[wiki-links]] to related pages.
```

### Confidence Scoring

| Score | Meaning |
|-------|---------|
| 0.95+ | Confirmed by multiple sources, recent |
| 0.8 | Confirmed by one source, recent |
| 0.6 | Unconfirmed, or old |
| 0.4 | Contradicted by newer source |

### Supersession

When new information contradicts old, mark the old page:
```markdown
> ⚠️ Superseded by [[new-page]] — see updated claim.
```

And add to the new page frontmatter:
```yaml
supersedes: [older-page-name]
```

---

## Citation Rules

- Cite sources: `(source: filename.md)`
- Note contradictions explicitly
- Mark unsourced claims: `[needs verification]`

---

## Question Answering

1. Read `index.md` to find relevant pages
2. Read pages and synthesize answer
3. Cite specific wiki pages
4. If answer is valuable, file it as a new page

---

## Lint

Check for:
- Orphan pages (no links from others)
- Broken wikilinks
- Stale content (old `last-confirmed`)
- Contradictions with newer sources

Fix what you can automatically. Flag the rest.

---

## Hard Rules

- Never modify `raw/` folder (only for manually curated sources)
- Never copy files from `source_paths` to `raw/`
- Always update `wiki/index.md` and `wiki/log.md` on changes
- Keep page names lowercase: `my-concept.md`
- Add confidence scores to new pages
- Check for supersession on ingest
- Write in clear language

---

*Based on AGENT.md — do not edit this skill without explicit permission from the maintainer.*