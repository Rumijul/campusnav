---
name: auto-commit-after-phase
enabled: true
event: stop
pattern: .*
action: warn
---

## Phase Completion Commit Check

Before stopping, check if a GSD phase was just executed (`/gsd:execute-phase` or `gsd:execute-phase` skill).

**If a phase was completed in this session**, run the following immediately before stopping:

```bash
git add -A
git commit -m "feat(phase-XX): complete phase execution\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Replace `XX` with the actual phase number. Use a descriptive message based on what the phase implemented.

**If no phase was executed**, you may stop normally.
