# Phase 14: Documentation Cleanup - Research

**Researched:** 2026-02-27
**Domain:** Documentation correction / project record maintenance
**Confidence:** HIGH

## Summary

Phase 14 is a pure documentation correction phase with no code changes. There are two distinct problems to fix: (1) stale progress tracking in ROADMAP.md, and (2) a misleading `handleSheetBack` behavior description in the Phase 05.1 Plan 02 SUMMARY.

The ROADMAP.md has two categories of staleness. The overview list at the top (lines 15-29) has five phases marked `[ ]` (unchecked) that are actually complete: Phases 1, 3, 6, 7, and 8. Similarly, every individual plan item under those phases (and under completed phases 2, 4, 5, 5.1, 9, 10, 11, 12, 13) is still listed as `[ ]`. The progress table at the bottom of ROADMAP.md (lines 280-296) is largely accurate but Phase 7 shows `3/4` plans — the actual file system has a `07-04-SUMMARY.md` confirming Plan 04 ran, so the count should be `4/4`. Phase 14 itself shows `0/1 / Not started`.

The `handleSheetBack` mismatch is well-documented in STATE.md: the 05.1-02-SUMMARY.md documents that `handleSheetBack` calls `routeSelection.clearAll()` (back = exit route mode), but this was superseded in Phase 06-06. The actual code in `FloorPlanCanvas.tsx` line 228-230 calls `setSheetOpen(false)` (back = hide sheet, keep route). The SUMMARY's `decisions` block is the inaccurate source — the behavior was changed and the old SUMMARY was never corrected.

**Primary recommendation:** Make precise targeted edits to ROADMAP.md (checkbox states, plan counts) and the decisions block in 05.1-02-SUMMARY.md to match the actual built state documented in STATE.md and confirmed in source code.

## Standard Stack

No external libraries. This phase involves only Markdown file editing.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| Text editor / Write tool | Markdown file edits | Only tool needed for doc correction |
| git diff | Verify changes before commit | Catch unintended edits |

## Architecture Patterns

### Pattern 1: Targeted Surgical Edits
**What:** Change only the specific stale fields — checkbox states, plan counts, completion dates, and the decisions block text. Do not restructure or rewrite sections.
**When to use:** Always for doc corrections — minimize diff surface to reduce review burden.

### Pattern 2: Source-of-Truth Ordering
**What:** When correcting a stale doc, derive the correct values from the most authoritative source available.
- For completion dates: SUMMARY frontmatter `completed:` fields are authoritative
- For plan counts: actual file counts in `.planning/phases/XX-*/` are authoritative
- For `handleSheetBack` behavior: source code (`FloorPlanCanvas.tsx` line 228-230) + STATE.md `[Phase 06-06]` decision are authoritative

### Anti-Patterns to Avoid
- **Rewriting the whole SUMMARY:** The 05.1-02-SUMMARY decisions block needs one entry corrected, not a full rewrite. The rest of the SUMMARY is accurate.
- **Changing the ROADMAP Phase Details narrative:** Only checkboxes and the progress table need updating — the phase descriptions, success criteria, and goals are fine as-is.
- **Silently upgrading Phase 14 in ROADMAP.md mid-plan:** Phase 14 completion row should only be updated after the plan is actually done (it is the last act).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Verifying current handleSheetBack behavior | Re-reading all Phase 06 plans | `grep handleSheetBack FloorPlanCanvas.tsx` — single source of truth |
| Knowing which phases are complete | Reading all SUMMARYs | Progress table in STATE.md + file presence of SUMMARY.md files |

## Common Pitfalls

### Pitfall 1: Wrong Plan Count for Phase 6
**What goes wrong:** Phase 6 ROADMAP.md currently says "5 plans" but 7 plan files exist (06-01 through 06-07). Both the overview section plan count and the Plans list items need correction.
**Why it happens:** Plans 06-06 and 06-07 were added as unplanned insertions during Phase 5.1/Phase 6 execution.
**How to avoid:** Count actual files: `ls .planning/phases/06-route-visualization-directions/*PLAN.md` = 7 plans.

### Pitfall 2: Phase 7 Plan Count Discrepancy
**What goes wrong:** ROADMAP.md progress table shows Phase 7 as `3/4`. The ROADMAP.md phase detail says "4 plans." The STATE.md shows Phase 7 complete. File system has `07-04-SUMMARY.md` confirming Plan 04 ran.
**Why it happens:** v1.0 audit noted "Plan 07-04 never executed" but a SUMMARY file exists for it — the audit may have been wrong, or Plan 04 ran retroactively during Phase 12. Either way, the SUMMARY exists so the count is 4/4.
**How to avoid:** Check `ls .planning/phases/07-api-data-persistence/*SUMMARY.md` — four files exist.

### Pitfall 3: SUMMARY decisions block vs. SUMMARY narrative
**What goes wrong:** The 05.1-02-SUMMARY has the stale `handleSheetBack` statement in TWO places: (a) the frontmatter `decisions:` block (line 22: `"handleSheetBack calls routeSelection.clearAll() not setSheetOpen(false) — back = exit route mode, not hide sheet"`), and (b) the "Fix 1 — Back button exits route mode" section body with actual code shown.
**Why it happens:** The Phase 05.1-02 behavior was real at the time of writing — it was genuinely the first implemented behavior. Phase 06-06 then changed it. The SUMMARY was never updated.
**How to avoid:** The correction should add a superseded note or update the decisions block text. The narrative section should also get a brief "Note: superseded in Phase 06-06" annotation. Do not delete the historical record — annotate it.

### Pitfall 4: Phase 14 self-referential update
**What goes wrong:** After Phase 14 plan executes, Phase 14's own row in the progress table and overview checklist still say incomplete.
**Why it happens:** The plan executor must update Phase 14 itself as the final step.
**How to avoid:** Make the Phase 14 row update the last edit in the plan.

## Code Examples

### Confirmed current FloorPlanCanvas.tsx behavior (line 228-230)
```typescript
// Source: src/client/components/FloorPlanCanvas.tsx (confirmed 2026-02-27)
/** Back arrow in directions sheet — close sheet only, keep route line visible */
const handleSheetBack = useCallback(() => {
  setSheetOpen(false)
}, [])
```
This is the correct behavior. The SUMMARY must be corrected to match this, not the other way around.

### STATE.md authoritative decision log (confirms the supersession)
```
[Phase 05.1-02]: handleSheetBack calls routeSelection.clearAll() — back = exit route mode entirely
                 (SUPERSEDED by 06-06: back now only closes sheet)
[Phase 06-06]: handleSheetBack calls setSheetOpen(false) not clearAll() — back = hide sheet, X = exit route mode
```

## Specific Changes Required

### Change Set 1: ROADMAP.md Overview List (lines 15-29)

Fix checkbox states for completed phases:

| Line | Current | Correct |
|------|---------|---------|
| Phase 1 | `- [ ] **Phase 1: ...` | `- [x] **Phase 1: ...** (completed 2026-02-18)` |
| Phase 3 | `- [ ] **Phase 3: ...` | `- [x] **Phase 3: ...** (completed 2026-02-19)` |
| Phase 6 | `- [ ] **Phase 6: ...` | `- [x] **Phase 6: ...** (completed 2026-02-20)` |
| Phase 7 | `- [ ] **Phase 7: ...` | `- [x] **Phase 7: ...** (completed 2026-02-22)` |
| Phase 8 | `- [ ] **Phase 8: ...` | `- [x] **Phase 8: ...** (completed 2026-02-21)` |
| Phase 14 | `- [ ] **Phase 14: ...` | `- [x] **Phase 14: ...** (completed 2026-02-27)` |

### Change Set 2: ROADMAP.md Individual Plan Checkboxes

All plan list items (`- [ ] NN-NN-PLAN.md ...`) under completed phases need to become `- [x]`. Affected phases and their plan counts:

| Phase | Plans in files | Plans to check off |
|-------|---------------|-------------------|
| 01 | 2 (01-01, 01-02) | 2 |
| 02 | 2 (02-01, 02-02) | 2 |
| 03 | 2 (03-01, 03-02) | 2 |
| 04 | 4 (04-01 through 04-04) | 4 |
| 05 | 3 (05-01 through 05-03) | 3 |
| 05.1 | 2 (05.1-01, 05.1-02) | 2 (already `[x]` — confirm) |
| 06 | 7 (06-01 through 06-07) | ROADMAP currently lists only 5; must add 06-06 and 06-07 |
| 07 | 4 (07-01 through 07-04) | 4 |
| 08 | 3 (08-01 through 08-03) | 3 |
| 09 | 4 (09-01 through 09-04) | 4 |
| 10 | 3 (10-01 through 10-03) | 3 |
| 11 | 2 (11-01, 11-02) | 2 |
| 12 | 3 (12-01 through 12-03) | 3 |
| 13 | 3 (13-01 through 13-03) | 3 |

Phase 6 is the most complex: the ROADMAP.md currently lists only 5 plans (06-01 through 06-05) but 7 plans exist. Plans 06-06 and 06-07 need to be added to the plan list.

### Change Set 3: ROADMAP.md Progress Table

| Row | Current | Correct |
|-----|---------|---------|
| Phase 1 | 2/2 / Complete / 2026-02-18 | Already correct |
| Phase 3 | 2/2 / Complete / 2026-02-18 | Date should be 2026-02-19 (confirmed from SUMMARY) |
| Phase 6 | 5/5 / Complete / 2026-02-20 | Should be 7/7 / Complete / 2026-02-20 |
| Phase 7 | 3/4 / Complete / 2026-02-20 | Should be 4/4 / Complete / 2026-02-22 |
| Phase 8 | 3/3 / Complete / 2026-02-21 | Already correct |
| Phase 14 | 0/1 / Not started / - | Should be 1/1 / Complete / 2026-02-27 |

Note: Phase 3 SUMMARY frontmatter shows `completed: 2026-02-19` for both plans — the progress table currently shows `2026-02-18`. The correct date is `2026-02-19`.

### Change Set 4: 05.1-02-SUMMARY.md Decisions Block

File: `.planning/phases/05.1-issues-needed-to-be-fixed/05.1-02-SUMMARY.md`

The frontmatter decisions array (line 22) currently reads:
```yaml
  - "handleSheetBack calls routeSelection.clearAll() not setSheetOpen(false) — back = exit route mode, not hide sheet"
```

Correct to:
```yaml
  - "handleSheetBack calls routeSelection.clearAll() — back = exit route mode (implemented here; superseded in Phase 06-06 by setSheetOpen(false) — back = hide sheet only)"
```

Additionally, the "Fix 1 — Back button exits route mode" section body in the narrative (lines 52-63) documents the clearAll() implementation as the final behavior. A superseded note should be added after the code block:

```
> **Note (superseded):** This behavior was changed in Phase 06-06. `handleSheetBack` now calls `setSheetOpen(false)` — back closes the sheet while the route line stays visible. `clearAll()` was moved to the X (clear) button in the compact strip.
```

## Open Questions

1. **Phase 6 plan count — add 06-06 and 06-07 to ROADMAP.md plan list?**
   - What we know: ROADMAP.md Phase 6 Plans section lists 5 plans (06-01 through 06-05). Files 06-06 and 06-07 exist and have SUMMARYs.
   - What's unclear: The Phase 14 success criteria says "progress table shows all completed phases as Complete with correct dates" — it doesn't explicitly mention individual plan list items.
   - Recommendation: Add 06-06 and 06-07 to the plan list and mark all 7 as `[x]`. This makes the document fully accurate and is a small addition.

2. **Should Phase 05.1 narrative body be changed or just annotated?**
   - What we know: The SUMMARY describes what was built at the time; changing it loses historical context.
   - Recommendation: Annotate with a superseded note rather than rewrite. The frontmatter decisions block correction + inline note is sufficient.

## Validation Architecture

Config has `workflow.nyquist_validation` not set (no such key in config.json) — skip formal validation section. All verification for this phase is a manual human review of the corrected documents.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/05.1-issues-needed-to-be-fixed/05.1-02-SUMMARY.md` — confirmed stale `handleSheetBack` decisions block
- `src/client/components/FloorPlanCanvas.tsx` line 228-230 — confirmed actual `setSheetOpen(false)` implementation
- `.planning/STATE.md` lines 139, 143 — authoritative decision log showing supersession chain
- `.planning/ROADMAP.md` lines 15-296 — confirmed stale checkboxes and progress table
- `.planning/phases/*/SUMMARY.md` frontmatter `completed:` fields — authoritative completion dates
- File system listing of `*.PLAN.md` and `*.SUMMARY.md` files — authoritative plan counts

### Secondary (MEDIUM confidence)
- `.planning/v1.0-MILESTONE-AUDIT.md` tech_debt section — identified the two specific gaps this phase closes

## Metadata

**Confidence breakdown:**
- What needs fixing: HIGH — confirmed by cross-referencing source code, STATE.md, SUMMARY frontmatter, and ROADMAP.md
- Exact correct values: HIGH — completion dates from SUMMARY frontmatter, behavior from source code
- Scope boundary: HIGH — success criteria are explicit: progress table + handleSheetBack SUMMARY only

**Research date:** 2026-02-27
**Valid until:** Indefinite — this is a point-in-time doc correction, not a moving target
